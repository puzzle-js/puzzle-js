import {FragmentStorefront} from "./fragment";
import cheerio from "cheerio";
import {TemplateCompiler} from "./templateCompiler";
import {
  CHEERIO_CONFIGURATION,
  CONTENT_NOT_FOUND_ERROR,
  NON_SELF_CLOSING_TAGS,
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
import {HTTP_STATUS_CODE, REPLACE_ITEM_TYPE, RESOURCE_LOCATION} from "./enums";
import ResourceInjector from "./resource-injector";
import {isDebug, LIB_CONTENT, LIB_CONTENT_DEBUG} from "./util";
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
  fragments: { [name: string]: FragmentStorefront } = {};
  pageClass: TemplateClass = new TemplateClass();
  private resourceInjector: ResourceInjector;

  constructor(public rawHtml: string, private name?: string) {
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
    let primaryName: string | null;

    return this.dom(TEMPLATE_FRAGMENT_TAG_NAME).toArray().reduce((dependencyList: IPageDependentGateways, fragment: CheerioElement) => {
      if (!dependencyList.gateways[fragment.attribs.from]) {
        dependencyList.gateways[fragment.attribs.from] = {
          gateway: null,
          ready: false
        };
      }

      if (!dependencyList.fragments[fragment.attribs.name]) {
        this.fragments[fragment.attribs.name] = new FragmentStorefront(fragment.attribs.name, fragment.attribs.from, { ...fragment.attribs });
        dependencyList.fragments[fragment.attribs.name] = {
          gateway: fragment.attribs.from,
          instance: this.fragments[fragment.attribs.name]
        };
      }

      if (!this.fragments[fragment.attribs.name].primary) {
        if (typeof fragment.attribs.primary !== 'undefined') {
          if (primaryName != null && primaryName !== fragment.attribs.name) throw new PuzzleError(ERROR_CODES.MULTIPLE_PRIMARY_FRAGMENTS);
          primaryName = fragment.attribs.name;
          this.fragments[fragment.attribs.name].primary = true;
          this.fragments[fragment.attribs.name].shouldWait = true;
        }
      }

      if (!this.fragments[fragment.attribs.name].shouldWait) {
        this.fragments[fragment.attribs.name].shouldWait = typeof fragment.attribs.shouldwait !== 'undefined' || (fragment.parent && fragment.parent.name === 'head') || false;
      }

      if (this.fragments[fragment.attribs.name].clientAsync || typeof fragment.attribs['client-async'] !== "undefined") {
        this.fragments[fragment.attribs.name].attributes = Object.assign(this.fragments[fragment.attribs.name].attributes, fragment.attribs);
        this.fragments[fragment.attribs.name].primary = false;
        this.fragments[fragment.attribs.name].shouldWait = true;
        this.fragments[fragment.attribs.name].clientAsync = true;
      }

      return dependencyList;
    }, {
      gateways: {},
      fragments: {}
    });
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

    if (Object.keys(this.fragments).length === 0) {
      logger.info(`[Compiling Page ${this.name}]`, 'No fragments detected, implementing single flush handler');
      this.replaceEmptyTags();
      const singleFlushHandlerWithoutFragments = TemplateCompiler.compile(Template.clearHtmlContent(this.dom.html()));
      return this.buildHandler(singleFlushHandlerWithoutFragments, [], [], [], isDebug);
    }

    if (!this.resourceInjector) {
      this.resourceInjector = new ResourceInjector(this.fragments, this.name, testCookies);
    }
    const chunkedFragmentsWithShouldWait = Object.values(this.fragments).filter(fragment => fragment.config && fragment.shouldWait && !fragment.config.render.static);
    const chunkedFragmentsWithoutWait = Object.values(this.fragments).filter(fragment => fragment.config && !fragment.shouldWait && !fragment.config.render.static);
    const staticFragments = Object.values(this.fragments).filter(fragment => fragment.config && fragment.config.render.static);

    logger.info(`[Compiling Page ${this.name}]`, 'Injecting Puzzle Lib to head');
    this.resourceInjector.injectAssets(this.dom);
    this.resourceInjector.injectLibraryConfig(this.dom);

    // todo kaldir lib bagla
    const replaceScripts: any[] = [];

    logger.info(`[Compiling Page ${this.name}]`, 'Adding containers for waited fragments');
    const waitedFragmentReplacements: IReplaceSet[] = this.replaceWaitedFragmentContainers(chunkedFragmentsWithShouldWait, replaceScripts, isDebug);

    logger.info(`[Compiling Page ${this.name}]`, 'Adding containers for chunked fragments');
    const chunkReplacements: IReplaceSet[] = this.replaceChunkedFragmentContainers(chunkedFragmentsWithoutWait);

    this.replaceUnfetchedFragments(Object.values(this.fragments).filter(fragment => !fragment.config));

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

    this.replaceEmptyTags();

    /**
     * todo Bu kafa olmaz runtimeda debug not debug degismez, handler ici runtime guzel olur.
     */
    const puzzleLib = isDebug ? LIB_CONTENT_DEBUG : LIB_CONTENT;
    const clearLibOutput = Template.replaceCustomScripts(this.dom.html().replace('{puzzleLibContent}', puzzleLib), false);

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

      this.dom(mainElement).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}" fragment-partial="${'main'}">${fragmentContent.html['main'] || CONTENT_NOT_FOUND_ERROR}</div>${fragmentScripts}<script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','${fragment.name}');</script>`);

      partialElements.forEach((i: number, element: any) => {
        this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${fragment.name}" puzzle-gateway="${fragment.from}" fragment-partial="${element.attribs.partial}">${fragmentContent.html[element.attribs.partial] || CONTENT_NOT_FOUND_ERROR}</div>${fragmentScripts}<script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','${fragment.name}');</script>`);
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
      if((typeof attributes.if === "boolean" && !attributes.if) || attributes.if === "false"){
        fragmentContent = "";
      } else {
        fragmentContent = await waitedFragmentReplacement.fragment.getContent(attributes, req);
      }

      if (waitedFragmentReplacement.fragment.primary) {
        statusCode = fragmentContent.status;
        headers = fragmentContent.headers;
        cookies = fragmentContent.cookies;
      }

      waitedFragmentReplacement.replaceItems
        .forEach(replaceItem => {
          if (replaceItem.type === REPLACE_ITEM_TYPE.CONTENT) {
            if((typeof attributes.if === "boolean" && !attributes.if) || attributes.if === "false" ){
              template = template.replace(replaceItem.key, () => fragmentContent);
              return;
            }
            const fragmentInject = fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR;
            template = template.replace(replaceItem.key, () => fragmentInject + Template.fragmentModelScript(waitedFragmentReplacement.fragment, fragmentContent.model, isDebug));
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

    res.status(waitedReplacement.statusCode);

    if (waitedReplacement.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY) {
      res.end();
      this.pageClass._onResponseEnd();
    } else {
      res.send(waitedReplacement.template.replace('</body>', () => `<script>PuzzleJs.emit('${EVENT.ON_PAGE_LOAD}');</script></body>`));
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
  async chunkedHandler(firstFlushHandler: Function,
                       waitedFragments: IReplaceSet[],
                       chunkedFragmentReplacements: IReplaceSet[],
                       jsReplacements: IReplaceAsset[],
                       isDebug: boolean,
                       req: express.Request,
                       res: CompressionStreamResponse) {
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

    res.status(waitedReplacement.statusCode);
    if (waitedReplacement.statusCode === HTTP_STATUS_CODE.MOVED_PERMANENTLY) {
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
      res.end(`<script>PuzzleJs.emit('${EVENT.ON_PAGE_LOAD}');</script></body></html>`);
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

      output += Template.fragmentModelScript(chunkedReplacement.fragment, fragmentContent.model, isDebug);

      fragmentJsReplacements && fragmentJsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
        output += ResourceInjector.wrapJsAsset(replaceItem);
      });

      chunkedReplacement.replaceItems
        .forEach(replaceItem => {
          if (replaceItem.type === REPLACE_ITEM_TYPE.CHUNKED_CONTENT) {
            output += `<div style="display: none;" puzzle-fragment="${chunkedReplacement.fragment.name}" puzzle-chunk-key="${replaceItem.key}">${fragmentContent.html[replaceItem.partial] || CONTENT_NOT_FOUND_ERROR}</div>`;
            if (!(replaceItem.key === 'main' && selfReplacing)) {
              // todo replace here
              output += `<script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','${chunkedReplacement.fragment.name}','[puzzle-chunk="${replaceItem.key}"]','[puzzle-chunk-key="${replaceItem.key}"]');</script>`;
            }
          }
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
  private replaceWaitedFragmentContainers(fragmentsShouldBeWaited: FragmentStorefront[], replaceJsAssets: IReplaceAsset[], isDebug: boolean) {
    const waitedFragmentReplacements: IReplaceSet[] = [];

    fragmentsShouldBeWaited.forEach(fragment => {
      const replaceItems: IReplaceItem[] = [];
      let fragmentAttributes = {};

      const jsReplacements = replaceJsAssets.find(jsReplacement => jsReplacement.fragment.name === fragment.name);
      let contentStart = '';
      let contentEnd = ``;

      jsReplacements && jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_START).forEach(replaceItem => {
        contentStart += ResourceInjector.wrapJsAsset(replaceItem);
      });

      jsReplacements && jsReplacements.replaceItems.filter(item => item.location === RESOURCE_LOCATION.CONTENT_END).forEach(replaceItem => {
        contentEnd += ResourceInjector.wrapJsAsset(replaceItem);
      });

      this.dom(contentStart).insertBefore(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).first());
      this.dom(contentEnd).insertAfter(this.dom(`fragment[from="${fragment.from}"][name="${fragment.name}"]`).last());


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
            if(fragment.clientAsync){
              this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}></div>`);
            }else{
              this.dom(element).replaceWith(`<div id="${fragment.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" ${element.attribs.partial ? 'fragment-partial="' + element.attribs.partial + '"' : ''}>${replaceKey}</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','${fragment.name}');</script>`);
            }
          } else {
            if(!fragment.clientAsync){
              this.dom(element).replaceWith(replaceKey);
            }
          }
        });


      waitedFragmentReplacements.push({
        fragment,
        replaceItems,
        fragmentAttributes
      });
    });

    return waitedFragmentReplacements;
  }


  private static replaceCustomScripts(template: string, encode: boolean) {
    return encode ?
      template.replace(/<puzzle-script>/g, '<!--custom-script').replace(/<\/puzzle-script>/g, '/custom-script-->') :
      template.replace(/<!--custom-script/g, '<script>').replace(/\/custom-script-->/g, '</script>');
  }
}
