import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {
  CHEERIO_CONFIGURATION,
  CONTENT_NOT_FOUND_ERROR, GUN_PATH,
  NON_SELF_CLOSING_TAGS, PUZZLE_DEBUGGER_LINK, PUZZLE_LIB_LINK,
  TEMPLATE_FRAGMENT_TAG_NAME
} from "./config";
import {
  FragmentModel,
  IChunkedReplacementSet,
  ICookieMap,
  IFragmentContentResponse,
  IFragmentEndpointHandler,
  IPageDependentGateways,
  IReplaceAsset,
  IReplaceItem,
  IReplaceSet,
  IWaitedResponseFirstFlush
} from "./types";
import {FragmentSentryConfig, HTTP_STATUS_CODE, REPLACE_ITEM_TYPE, RESOURCE_LOCATION} from "./enums";
import ResourceInjector from "./resource-injector";
import {isDebug} from "./util";
import {TemplateClass} from "./templateClass";
import {ERROR_CODES, PuzzleError} from "./errors";
import {benchmark} from "./decorators";
import {Logger} from "./logger";
import {container, TYPES} from "./base";
import {EVENT} from "@puzzle-js/client-lib/dist/enums";
import express from "express";

const logger = container.get(TYPES.Logger) as Logger;

interface CompressionStreamResponse extends express.Response {
  flush: () => void;
}

export class Template {
  dom: any;
  fragments: FragmentStorefront[];
  pageClass: TemplateClass = new TemplateClass();
  private resourceInjector: ResourceInjector;
  private fragmentSentryConfiguration?: Record<string, FragmentSentryConfig>;
  private intersectionObserverOptions?: IntersectionObserverInit;
  private onVariableEventScripts: any = {};

  constructor(public rawHtml: string, private name?: string, fragmentSentryConfiguration?: Record<string, FragmentSentryConfig>, intersectionObserverOptions?: IntersectionObserverInit ) {
    this.fragmentSentryConfiguration = fragmentSentryConfiguration;
    this.intersectionObserverOptions = intersectionObserverOptions;
    this.load();
    this.bindPageClass();
    this.pageClass._onCreate();
  }

  /**
   * Loads html template into Cheerio instance
   */
  load(): void {
    const templateMatch = TemplateCompiler.TEMPLATE_CONTENT_REGEX.exec(this.rawHtml);
    if (templateMatch) {
      this.dom = cheerio.load(Template.replaceCustomScripts(templateMatch[1], true), CHEERIO_CONFIGURATION);
    } else {
      throw new PuzzleError(ERROR_CODES.TEMPLATE_NOT_FOUND);
    }
  }

  /**
   * Returns fragment dependencies
   * @returns {IPageDependentGateways}
   */
  @benchmark(isDebug(), logger.info)
  getDependencies() {
    const gateways: { [name: string]: { fragments: { [name: string]: FragmentStorefront } } } = {};
    let primaryName: string | null;

    const dependencies = this.dom(TEMPLATE_FRAGMENT_TAG_NAME).toArray().reduce((dependencyList: IPageDependentGateways, fragment: CheerioElement) => {
      const { from, name: fragmentName } = fragment.attribs;
      if (!dependencyList.gateways[from]) {
        gateways[from] = { fragments: {} };
        dependencyList.gateways[from] = {
          gateway: null,
          ready: false,
          fragments: {}
        };
      }

      if (!dependencyList.gateways[from].fragments[fragmentName]) {
        gateways[from].fragments[fragmentName] = new FragmentStorefront(fragmentName, from, { ...fragment.attribs });
        dependencyList.gateways[from].fragments[fragmentName] = {
          gateway: from,
          instance: gateways[from].fragments[fragmentName]
        };
      }

      if (this.fragmentSentryConfiguration && typeof this.fragmentSentryConfiguration[fragmentName] !== "undefined") {
        const fragmentType = this.fragmentSentryConfiguration[fragmentName];

        if (fragmentType === FragmentSentryConfig.CLIENT_ASYNC) {
          gateways[from].fragments[fragmentName].attributes = Object.assign(gateways[from].fragments[fragmentName].attributes, fragment.attribs);
          gateways[from].fragments[fragmentName].primary = false;
          gateways[from].fragments[fragmentName].shouldWait = true;
          gateways[from].fragments[fragmentName].clientAsync = true;
        } else if (fragmentType === FragmentSentryConfig.WAITED || (fragment.parent && fragment.parent.name === 'head')) {
          gateways[from].fragments[fragmentName].shouldWait = true;
        } else if (fragmentType === FragmentSentryConfig.PRIMARY && primaryName === null) {
          primaryName = fragment.attribs.name;
          gateways[from].fragments[fragmentName].primary = true;
          gateways[from].fragments[fragmentName].shouldWait = true;
        } else if (fragmentType === FragmentSentryConfig.STATIC) {
          gateways[from].fragments[fragmentName].static = true;
        }
      } else {
        gateways[from].fragments[fragmentName].shouldWait = true;

        if (!gateways[from].fragments[fragmentName].primary) {
          if (typeof fragment.attribs.primary !== 'undefined') {
            if (primaryName != null && primaryName !== fragment.attribs.name) throw new PuzzleError(ERROR_CODES.MULTIPLE_PRIMARY_FRAGMENTS);
            primaryName = fragment.attribs.name;
            gateways[from].fragments[fragmentName].primary = true;
          }
        }

        if (gateways[from].fragments[fragmentName].clientAsync || (typeof fragment.attribs['client-async'] !== "undefined" || typeof fragment.attribs['async-c2'] !== "undefined")) {
          gateways[from].fragments[fragmentName].attributes = Object.assign(gateways[from].fragments[fragmentName].attributes, fragment.attribs);
          gateways[from].fragments[fragmentName].primary = false;
          gateways[from].fragments[fragmentName].clientAsync = true;
          gateways[from].fragments[fragmentName].clientAsyncForce = gateways[from].fragments[fragmentName].clientAsyncForce || typeof fragment.attribs['client-async-force'] !== "undefined";
          gateways[from].fragments[fragmentName].criticalCss = gateways[from].fragments[fragmentName].criticalCss || typeof fragment.attribs['critical-css'] !== "undefined";
          gateways[from].fragments[fragmentName].onDemand = gateways[from].fragments[fragmentName].onDemand || typeof fragment.attribs['on-demand'] !== "undefined";
          gateways[from].fragments[fragmentName].asyncDecentralized = gateways[from].fragments[fragmentName].asyncDecentralized || typeof fragment.attribs['async-c2'] !== "undefined";
        }
      }

      return dependencyList;
    }, {
      gateways: {}
    });

    this.fragments = Object.values(gateways)
        .map(gw => Object.values(gw.fragments))
        .reduce((acc, val) => [ ...acc, ...val ], []);

    return dependencies;
  }

  //todo fragmentConfigleri versiyon bilgileriyle inmis olmali ki assetleri versionlara gore compile edebilelim. ayni not gatewayde de var.
  /**
   * Compiles template and returns a function that can handle the request.
   * @param {ICookieMap} testCookies
   * @param {boolean} isDebug
   * @param precompile
   * @returns {Promise<IFragmentEndpointHandler>}
   */
  async compile(testCookies: ICookieMap, isDebug = false, precompile = false): Promise<IFragmentEndpointHandler> {
    logger.info(`[Compiling Page ${this.name}]`, 'Creating virtual dom');
    this.load();

    if (!this.fragments || this.fragments.length === 0) {
      logger.info(`[Compiling Page ${this.name}]`, 'No fragments detected, implementing single flush handler');
      this.replaceEmptyTags();
      const singleFlushHandlerWithoutFragments = TemplateCompiler.compile(Template.clearHtmlContent(this.dom.html()));
      return this.buildHandler(singleFlushHandlerWithoutFragments, [], [], [], isDebug);
    }

    if (this.intersectionObserverOptions) {
      this.resourceInjector = new ResourceInjector(this.fragments, this.name, testCookies, this.intersectionObserverOptions);
    } else {
      this.resourceInjector = new ResourceInjector(this.fragments, this.name, testCookies);
    }

    logger.info('resource injector instance created');

    this.fragments.forEach(fragment => {
      if (fragment.config) {
        fragment.static = fragment.config.render.static = fragment.config.render.static || fragment.static;
      }
    });

    const chunkedFragmentsWithShouldWait = this.fragments.filter(fragment => fragment.config && fragment.shouldWait && !fragment.config.render.static);
    const chunkedFragmentsWithoutWait = this.fragments.filter(fragment => fragment.config && !fragment.shouldWait && !fragment.config.render.static);
    const staticFragments = this.fragments.filter(fragment => fragment.config && fragment.config.render.static);

    logger.info(`[Compiling Page ${this.name}]`, 'Injecting Puzzle Lib to head');
    this.resourceInjector.injectAssets(this.dom);
    this.resourceInjector.injectDependencies(this.dom);
    this.resourceInjector.injectLibraryConfig(this.dom, isDebug);

    const pageDecentrealized = this.fragments.some(fragment => fragment.asyncDecentralized);

    if(pageDecentrealized){
      this.dom('head').prepend(`<script src="${GUN_PATH}"> </script>`);
    }

    this.wrapConditionalFragmentContainers(this.fragments);

    // replace meta async
    for(let i = 0,len = chunkedFragmentsWithShouldWait.length;i < len;i++){
          const fragment = chunkedFragmentsWithShouldWait[i];
          if (fragment.clientAsync){
              this.dom(`head fragment[name="${fragment.name}"]`).each((i, el) => {
                  this.dom(el).replaceWith(`<meta puzzle-fragment="${fragment.name}" fragment-partial="${el.attribs.partial}">`);
              });
          }
      }

    // todo kaldir lib bagla
    const replaceScripts: any[] = [];

    logger.info(`[Compiling Page ${this.name}]`, 'Adding containers for waited fragments');
    const waitedFragmentReplacements: IReplaceSet[] = await this.replaceWaitedFragmentContainers(chunkedFragmentsWithShouldWait, replaceScripts, isDebug);

    logger.info(`[Compiling Page ${this.name}]`, 'Adding containers for chunked fragments');
    const chunkReplacements: IReplaceSet[] = this.replaceChunkedFragmentContainers(chunkedFragmentsWithoutWait);

    this.replaceUnfetchedFragments(this.fragments.filter(fragment => !fragment.config));

    // todo kaldir lib bag
    //await this.addDependencies();

    logger.info(`[Compiling Page ${this.name}]`, 'Replacing static contents with their real contents');
    await this.replaceStaticFragments(staticFragments, replaceScripts.filter(replaceSet => replaceSet.fragment.config && replaceSet.fragment.config.render.static));

    logger.info(`[Compiling Page ${this.name}]`, 'Adding placeholders for chunked fragments');
    await this.appendPlaceholders(chunkReplacements);


    logger.info(`[Compiling Page ${this.name}]`, 'Combining and minifying page styles');
    /**
     * @deprecated Combine this with only on render start assets.
     */
    await this.resourceInjector.injectStyleSheets(this.dom, precompile);
    await this.resourceInjector.injectCriticalStyleSheets(this.dom, precompile);

    this.replaceEmptyTags();

    const clearLibOutput = Template.replaceCustomScripts(this.dom.html(), false);

    logger.info(`[Compiling Page ${this.name}]`, 'Sending virtual dom to compiler');

    return this.buildHandler(TemplateCompiler.compile(Template.clearHtmlContent(clearLibOutput)), chunkReplacements, waitedFragmentReplacements, replaceScripts, isDebug);
  }


  /**
   * Bind user class to page
   */
  private bindPageClass(): void {
    const scriptMatch = TemplateCompiler.PAGE_CLASS_CONTENT_REGEX.exec(this.rawHtml);
    if (scriptMatch) {
      const pageClass = eval(scriptMatch[1]);
      pageClass.__proto__ = new TemplateClass();
      this.pageClass = pageClass;
    }
  }

  /**
   * Appends placeholders to reserved locations
   * @param {IChunkedReplacementSet[]} chunkedReplacements
   * @returns {Promise<void>}
   */
  private async appendPlaceholders(chunkedReplacements: IChunkedReplacementSet[]) {
    for (const replacement of chunkedReplacements) {
      const placeholders = replacement.replaceItems.filter(item => item.type === REPLACE_ITEM_TYPE.PLACEHOLDER);
      for (const placeholderReplacement of placeholders) {
        const placeholderContent = await replacement.fragment.getPlaceholder();
        this.dom(`[puzzle-placeholder="${placeholderReplacement.key}"]`).append(placeholderContent);
      }
    }
  }

  /**
   * Replaces static fragments with their content on vDOM
   * @param {FragmentStorefront[]} fragments
   * @param {IReplaceAsset[]} replaceAssets
   * @returns {Promise<void>}
   */
  private async replaceStaticFragments(fragments: FragmentStorefront[], replaceAssets: IReplaceAsset[]): Promise<void> {
    for (const fragment of fragments) {
      const partialElements: any = [];
      let mainElement: any = null;
      this.dom(`fragment[name="${fragment.name}"][from="${fragment.from}"]`).each((i, element) => {
        if (this.dom(element).attr('partial') && this.dom(element).attr('partial') !== "main") {
          partialElements.push(element);
        } else {
          mainElement = element;
        }
      });

      const assets = replaceAssets.find(set => set.fragment.name === fragment.name);
      const fragmentScripts = assets ? assets.replaceItems.reduce((script, replaceItem) => {
        script += ResourceInjector.wrapJsAsset(replaceItem);
        return script;
      }, '') : '';

      const processedAttributes = TemplateCompiler.processExpression(mainElement.attribs, this.pageClass);
      const fragmentContent: IFragmentContentResponse = await fragment.getContent(processedAttributes);

      this.dom(mainElement).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}" fragment-partial="${'main'}">${fragmentContent.html['main'] || CONTENT_NOT_FOUND_ERROR}</div>${fragmentScripts}`);

      partialElements.forEach((i: number, element: any) => {
        this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}" fragment-partial="${element.attribs.partial}">${fragmentContent.html[element.attribs.partial] || CONTENT_NOT_FOUND_ERROR}</div>${fragmentScripts}`);
      });

    }
  }

  private replaceEmptyTags(): any {
    this.dom('*').each((i, element) => {
      if (NON_SELF_CLOSING_TAGS.indexOf(this.dom(element)[0].name) !== -1 && this.dom(element).text().length === 0 && !this.dom(element).html()) {
        this.dom(element).text(' ');
      }
    });
  }

  /**
   * Replaces waited fragments with their content on first flush string.
   * @param {IReplaceSet[]} waitedFragments
   * @param {string} template
   * @param req
   * @param isDebug
   * @returns {Promise<IWaitedResponseFirstFlush>}
   */
  private async replaceWaitedFragments(waitedFragments: IReplaceSet[], template: string, req: any, isDebug: boolean): Promise<IWaitedResponseFirstFlush> {
    let statusCode = HTTP_STATUS_CODE.OK;
    let headers = {};
    let cookies = {};

    await Promise.all(waitedFragments.map(async waitedFragmentReplacement => {
      const attributes = TemplateCompiler.processExpression(waitedFragmentReplacement.fragmentAttributes, this.pageClass, req);
      if (waitedFragmentReplacement.fragment.clientAsync) return;

      let fragmentContent;
      if ((typeof attributes.if === "boolean" && !attributes.if) || attributes.if === "false") {
        fragmentContent = "";
      } else {
        fragmentContent = await waitedFragmentReplacement.fragment.getContent(attributes, req);
      }

      if (waitedFragmentReplacement.fragment.primary) {
        if(fragmentContent.status === HTTP_STATUS_CODE.MOVED_PERMANENTLY || fragmentContent.status === HTTP_STATUS_CODE.MOVED_TEMPORARILY){
          statusCode = fragmentContent.status;
          headers = fragmentContent.headers;
        } else {
          if((statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY || statusCode === HTTP_STATUS_CODE.MOVED_TEMPORARILY)){
            delete fragmentContent.headers['location'];
          }else{
            statusCode = fragmentContent.status;
          }

          headers = {
            ...headers,
            ...fragmentContent.headers
          };
        }
        cookies = fragmentContent.cookies;
      } else if (waitedFragmentReplacement.fragmentAttributes && waitedFragmentReplacement.fragmentAttributes.enableRedirect) {
        if ((fragmentContent.status === HTTP_STATUS_CODE.MOVED_PERMANENTLY || fragmentContent.status === HTTP_STATUS_CODE.MOVED_TEMPORARILY) && (statusCode === 200 || statusCode === 404)) {
          statusCode = fragmentContent.status;
          headers["location"] = fragmentContent.headers["location"] || "";
        }
      }

      waitedFragmentReplacement.replaceItems
        .forEach(replaceItem => {
          if (replaceItem.type === REPLACE_ITEM_TYPE.CONTENT) {
            if((typeof attributes.if === "boolean" && !attributes.if) || attributes.if === "false" ){
              template = template.replace(replaceItem.key, () => fragmentContent);
              return;
            }
            const fragmentInject = fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR;
            this.onVariableEventScripts[waitedFragmentReplacement.fragment.name] = Template.fragmentModelScript(waitedFragmentReplacement.fragment, fragmentContent.model, isDebug)
            template = template.replace(replaceItem.key, () => fragmentInject);
          }
        });
    }));

    return {template, statusCode, headers, cookies};
  }

  /**
   * Maps fragment response variable model into PuzzleLib
   * @param {{name: string}} fragment
   * @param {FragmentModel} fragmentPageModel
   * @param {boolean} isDebug
   * @returns {string}
   */
  static fragmentModelScript(fragment: { name: string }, fragmentPageModel: FragmentModel, isDebug = false) {
    return fragmentPageModel && Object.keys(fragmentPageModel).length ? `<script>${Object.keys(fragmentPageModel).reduce((modelVariable, key) => {
      modelVariable += `PuzzleJs.emit("${EVENT.ON_VARIABLES}", "${fragment.name}", "${key}", ${JSON.stringify(fragmentPageModel[key])});`;
      return modelVariable;
    }, '')}</script>` : '';
  }

  /**
   * Handles non chunked page renders
   * @param firstFlushHandler
   * @param waitedFragments
   * @param isDebug
   * @param req
   * @param res
   */
  async nonChunkedHandler(firstFlushHandler: Function, waitedFragments: IReplaceSet[], isDebug: boolean, req: express.Request, res: CompressionStreamResponse) {
    this.pageClass._onRequest(req);
    const fragmentedHtml = firstFlushHandler.call(this.pageClass, req);

    const waitedReplacement = await this.replaceWaitedFragments(waitedFragments, fragmentedHtml, req, isDebug);

    for (const prop in waitedReplacement.headers) {
      res.set(prop, waitedReplacement.headers[prop]);
    }
    for (const prop in waitedReplacement.cookies) {
      if (waitedReplacement.cookies[prop].options && waitedReplacement.cookies[prop].options.expires) {
        waitedReplacement.cookies[prop].options.expires = new Date(String(waitedReplacement.cookies[prop].options.expires));
      }
      res.cookie(prop, waitedReplacement.cookies[prop].value, waitedReplacement.cookies[prop].options);
    }

    res.status(req.statusCode || waitedReplacement.statusCode);
    this.pageClass._onResponse(res);
    if (req.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY || waitedReplacement.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY) {
      res.end();
      this.pageClass._onResponseEnd();
    } else {
      res.send(waitedReplacement.template.replace('</body>', () => `${Object.values(this.onVariableEventScripts).join("")}<script>PuzzleJs.emit('${EVENT.ON_PAGE_LOAD}');</script></body>`));
      this.pageClass._onResponseEnd();
    }
  }

  /**
   * Handles chunked page renders
   * @param firstFlushHandler
   * @param waitedFragments
   * @param chunkedFragmentReplacements
   * @param jsReplacements
   * @param isDebug
   * @param req
   * @param res
   */
  async chunkedHandler(
    firstFlushHandler: Function,
    waitedFragments: IReplaceSet[],
    chunkedFragmentReplacements: IReplaceSet[],
    jsReplacements: IReplaceAsset[],
    isDebug: boolean,
    req: express.Request,
    res: CompressionStreamResponse
  ) {
    this.pageClass._onRequest(req);
    const fragmentedHtml = firstFlushHandler.call(this.pageClass, req).replace('</body>', '').replace('</html>', '');
    res.set('transfer-encoding', 'chunked');
    res.set('content-type', 'text/html; charset=UTF-8');
    const waitedPromises: any = [];

    //Fire requests in parallel
    const waitedReplacementPromise = this.replaceWaitedFragments(waitedFragments, fragmentedHtml, req, isDebug);

    for (let i = 0, len = chunkedFragmentReplacements.length; i < len; i++) {
      const attributes = TemplateCompiler.processExpression(chunkedFragmentReplacements[i].fragmentAttributes, this.pageClass, req);
      if((typeof attributes.if === "boolean" && !attributes.if) || attributes.if === "false" ) continue;
      waitedPromises.push({i, data: chunkedFragmentReplacements[i].fragment.getContent(attributes, req)});
    }

    //Wait for first flush
    const waitedReplacement = await waitedReplacementPromise;

    res.set(waitedReplacement.headers);

    for (const prop in waitedReplacement.cookies) {
      res.cookie(prop, waitedReplacement.cookies[prop].value, waitedReplacement.cookies[prop].options);
    }

    res.status(req.statusCode || waitedReplacement.statusCode);
    this.pageClass._onResponse(res);
    if (req.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY || waitedReplacement.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY) {
      res.end();
      this.pageClass._onResponseEnd();
    } else {
      res.write(waitedReplacement.template);
      res.flush();

      //Bind flush method to resolved or being resolved promises of chunked replacements
      waitedPromises.forEach(waitedPromise => {
        waitedPromise.data.then(this.flush(chunkedFragmentReplacements[waitedPromise.i], jsReplacements, res, isDebug));
      });
      //Close stream after all chunked fragments done
      await Promise.all(waitedPromises.map(waitedPromise => waitedPromise.data));
      res.end(`${Object.values(this.onVariableEventScripts).join("")}<script>PuzzleJs.emit('${EVENT.ON_PAGE_LOAD}');</script></body></html>`);
      this.pageClass._onResponseEnd();
    }
  }


  /**
   * Creates a request handler from the compilation output. Express requests uses the return of this method
   * @param {Function} firstFlushHandler
   * @param {IReplaceSet[]} chunkedFragmentReplacements
   * @param {IReplaceSet[]} waitedFragments
   * @param {IReplaceAsset[]} jsReplacements
   * @param isDebug
   * @returns {(req: any, res: any) => void}
   */
  private buildHandler(firstFlushHandler: Function, chunkedFragmentReplacements: IReplaceSet[], waitedFragments: IReplaceSet[] = [], jsReplacements: IReplaceAsset[] = [], isDebug: boolean) {
    if (chunkedFragmentReplacements.length === 0) {
      return this.nonChunkedHandler.bind(this, firstFlushHandler, waitedFragments, isDebug);
    } else {
      // @ts-ignore https://stackoverflow.com/questions/57072381/typescript-bind-gives-type-error-when-using-more-than-4-parameters/57072988
      return this.chunkedHandler.bind(this, firstFlushHandler, waitedFragments, chunkedFragmentReplacements, jsReplacements, isDebug);
    }
  }


  /**
   * Flushes incoming fragment response
   * @param {IReplaceSet} chunkedReplacement
   * @param {IReplaceAsset[]} jsReplacements
   * @param res
   * @param isDebug
   * @returns {(fragmentContent: IFragmentContentResponse) => void}
   */
  private flush(chunkedReplacement: IReplaceSet, jsReplacements: IReplaceAsset[], res: CompressionStreamResponse, isDebug: boolean) {
    return (fragmentContent: IFragmentContentResponse) => {

      const fragmentJsReplacements = jsReplacements.find(jsReplacement => jsReplacement.fragment.name === chunkedReplacement.fragment.name);
      const selfReplacing = chunkedReplacement.fragment.config && chunkedReplacement.fragment.config.render.selfReplace;

      let output = '';

      this.onVariableEventScripts[chunkedReplacement.fragment.name] = Template.fragmentModelScript(chunkedReplacement.fragment, fragmentContent.model, isDebug);

      fragmentJsReplacements && fragmentJsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
        output += ResourceInjector.wrapJsAsset(replaceItem);
      });

      fragmentJsReplacements && fragmentJsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
        output += ResourceInjector.wrapJsAsset(replaceItem);
      });

      this.pageClass._onChunk(output);
      res.write(output);
      res.flush();
    };
  }

  /**
   * Clears html content from empty spaces
   * @param {string} str
   * @returns {string}
   */
  private static clearHtmlContent(str: string) {
    return str.replace(/>\s+</g, "><").trim();
  }

  /**
   * Replaces unfetched fragments with empty div error
   * @param {FragmentStorefront[]} fragments
   */
  @benchmark(isDebug(), logger.info)
  private replaceUnfetchedFragments(fragments: FragmentStorefront[]) {
    fragments.forEach(fragment => {
      this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).replaceWith(`<div puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}">${CONTENT_NOT_FOUND_ERROR}</div>`);
    });
  }

  /**
   * Find fragments with if attributes and wraps them with expression.
   * @param {FragmentStorefront[]} fragments
   * @returns {void}
   */
  @benchmark(isDebug(), logger.info)
  private wrapConditionalFragmentContainers(fragments: FragmentStorefront[]) {
    fragments.forEach(fragment => {
      this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`)
        .each((i, element) => {
          const ifAttr = fragment.attributes.if;
          const condition = ifAttr && (TemplateCompiler.isExpression(ifAttr) ? (ifAttr.match(TemplateCompiler.EXPRESSION_REGEX) || [])[1] : ifAttr);
          if (condition) {
            this.dom(element).replaceWith(`\${if(${condition}){}${this.dom(element)}\${}}`);
          }
        });
    });
  }


  /**
   * Creates chunked fragment containers
   * @param {FragmentStorefront[]} chunkedFragments
   * @returns {IReplaceSet[]}
   */
  @benchmark(isDebug(), logger.info)
  private replaceChunkedFragmentContainers(chunkedFragments: FragmentStorefront[]) {
    const chunkReplacements: IReplaceSet[] = [];

    chunkedFragments.forEach(fragment => {
      const replaceItems: IReplaceItem[] = [];
      let fragmentAttributes = {};
      this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`)
        .each((i, element) => {
          const partial = element.attribs.partial || 'main';
          const contentKey = fragment.name + '_' + partial;
          const replaceItem = {
            type: REPLACE_ITEM_TYPE.CHUNKED_CONTENT,
            partial,
            key: contentKey,
          };
          if (partial === 'main') {
            fragmentAttributes = element.attribs;
          }
          replaceItems.push(replaceItem);
          if (fragment.config && fragment.config.render.placeholder && replaceItem.partial === 'main') {
            const placeholderContentKey = contentKey + '_placeholder';
            replaceItems.push({
              type: REPLACE_ITEM_TYPE.PLACEHOLDER,
              partial,
              key: placeholderContentKey
            });
            this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''} puzzle-chunk="${contentKey}" puzzle-placeholder="${placeholderContentKey}"></div>`);
          } else {
            this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''} puzzle-chunk="${contentKey}"> </div>`);
          }
        });

      chunkReplacements.push({
        fragment,
        replaceItems,
        fragmentAttributes
      });
    });

    return chunkReplacements;
  }

  /**
   * Creates containers for fragments should be waited
   * @param {FragmentStorefront[]} fragmentsShouldBeWaited
   * @param {IReplaceAsset[]} replaceJsAssets
   * @param isDebug
   * @returns {IReplaceSet[]}
   */
  @benchmark(isDebug(), logger.info)
  private async replaceWaitedFragmentContainers(fragmentsShouldBeWaited: FragmentStorefront[], replaceJsAssets: IReplaceAsset[], isDebug: boolean) {
    const waitedFragmentReplacements: IReplaceSet[] = [];

    for (const fragment of fragmentsShouldBeWaited) {
      const replaceItems: IReplaceItem[] = [];
      let fragmentAttributes = {};

      const jsReplacements = replaceJsAssets.find(jsReplacement => jsReplacement.fragment.name === fragment.name);
      let contentStart = '';
      let contentEnd = ``;

      if (jsReplacements) {
        jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
          contentStart += ResourceInjector.wrapJsAsset(replaceItem);
        });

        jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
          contentEnd += ResourceInjector.wrapJsAsset(replaceItem);
        });
      }

      this.dom(contentStart).insertBefore(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).first());
      this.dom(contentEnd).insertAfter(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).last());

      const asyncPlaceholder = fragment.config && fragment.config.render.placeholder ? await fragment.getPlaceholder() : '';

      this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`)
        .each((i, element) => {
          const replaceKey = `{fragment|${element.attribs.name}_${element.attribs.from}_${element.attribs.partial || 'main'}}`;
          const partial = element.attribs.partial || 'main';
          replaceItems.push({
            type: REPLACE_ITEM_TYPE.CONTENT,
            key: replaceKey,
            partial,
          });
          if (partial === 'main') {
            fragmentAttributes = element.attribs;
          }

          if (element.parentNode.name !== 'head') {
            if (fragment.clientAsync) {
              const placeholder = typeof asyncPlaceholder === 'object' ? asyncPlaceholder[partial] || "" : asyncPlaceholder;
              this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}>${placeholder}</div>`);
            } else {
              this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}>${replaceKey}</div>`);
            }
          } else {
            if (!fragment.clientAsync) {
              this.dom(element).replaceWith(replaceKey);
            }
          }
        });


      waitedFragmentReplacements.push({
        fragment,
        replaceItems,
        fragmentAttributes
      });
    }

    return waitedFragmentReplacements;
  }


  private static replaceCustomScripts(template: string, encode: boolean) {
    return encode ?
      template.replace(/<puzzle-script>/g, '<!--custom-script').replace(/<\/puzzle-script>/g, '/custom-script-->') :
      template.replace(/<!--custom-script/g, '<script>').replace(/\/custom-script-->/g, '</script>');
  }
}
