import {Page} from "./page";
import express from "express";
import {IStorefrontConfig} from "./types";
import cheerio from "cheerio";
import {CHEERIO_CONFIGURATION} from "./config";
import {TemplateCompiler} from "./templateCompiler";
import {DEFAULT_MAIN_PARTIAL} from "./enums";
import ResourceInjector from "./resource-injector";
import {LIB_CONTENT} from "./util";

const pathToRegexp = require('path-to-regexp');


class ApplicationShell {
  private shellConfig: any;

  constructor() {
    this.handle = this.handle.bind(this);
  }

  async setup(pages: Map<string, Page>, config: IStorefrontConfig) {

    this.shellConfig = await Promise.all(config.pages.map(async page => {
      const compiledPage = pages.get(page.name);
      if (compiledPage) {
        return {
          name: page.name,
          matcher: typeof page.url === "string" ? pathToRegexp(page.url).toString() : page.url,
          fragments: compiledPage.template.fragments,
          html: await this.createRequestHandler(compiledPage)
        };
      }
    }));
  }


  async createRequestHandler(page: Page): Promise<string> {
    const resourceInjector = new ResourceInjector(page.template.fragments, page.name, {});
    const html = page.template.rawHtml;

    const dom = cheerio.load(html, CHEERIO_CONFIGURATION);

    const pageFragmentElements = dom('fragment').toArray();

    const injectionQueue = resourceInjector.createInlineInjectionQueue();

    injectionQueue.reverse().forEach(asset => {
      dom('head').prepend(`<script src="${asset}" type="text/javascript" defer="true"> </script>`);
    });

    await Promise.all(pageFragmentElements.map(async (element) => {
      const fragmentName = element.attribs.name;
      if (page.template.fragments[fragmentName].config!.render.placeholder && (element.attribs.partial === "main" || !element.attribs.partial)) {
        const placeholder = await page.template.fragments[fragmentName].getPlaceholder();
        dom(element).replaceWith(`<div id="${element.attribs.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" fragment-partial="${element.attribs.partial || DEFAULT_MAIN_PARTIAL}">${placeholder}</div>`);
      } else {
        dom(element).replaceWith(`<div id="${element.attribs.name}" puzzle-fragment="${element.attribs.name}" puzzle-gateway="${element.attribs.from}" fragment-partial="${element.attribs.partial || DEFAULT_MAIN_PARTIAL}"> </div>`);
      }
    }));

    // resourceInjector.injectLibraryConfig(dom);
    await resourceInjector.injectStyleSheets(dom, false);

    const template = dom('template').html()!.replace(/puzzle-script/g, 'script');


    return TemplateCompiler.compile(template as string, true) as string;
  }

  handle(req: express.Request, res: express.Response) {
    res.send(this.shellConfig);
  }
}

export {
  ApplicationShell
};
