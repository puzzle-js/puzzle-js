# Guide

* [Puzzle Architecture](#architecture)
    * [Storefront](#storefront-application)
    * [Gateway](#gateway-application)
    * [Fragments](#fragments)
        * [Chunked](#chunked-fragments)
        * [ShouldWait](#shouldwait-fragments)
        * [Primary](#primary-fragments)
        * [Static](#static-fragments)
* [Installing PuzzleJs](#installing-puzzlejs)
* [Storefront](#storefront)
    * [Creating Storefront](#creating-storefront)
    * [Gateway](#gateway-definition)
        * [Best route to gateway](#best-route-to-gateway)
    * [Page](#page)
        *   [Templating](#templating)
            * [Page Scripts](#page-scripts)
            * [Template](#template)
* [Configurator](#configurator)
    * [Validation](#validation)
    * [Dependency Injection](#dependency-injection)
    * [Handlers](#handler)
* [Core Configuration](#core-configuration)


## Architecture

PuzzleJs implements micro-services architecture into front-end. The idea of micro-frontend comes from [BigPipe](https://www.facebook.com/notes/facebook-engineering/bigpipe-pipelining-web-pages-for-high-performance/389414033919/), Facebook's fundamental redesign of the dynamic web page serving system. Here is how a PuzzleJs website architecture looks like.

![Architecture](https://i.gyazo.com/647c7733aa6fb47839037d3fab2d3ee0.png)

There are two types of PuzzleJs implementation, storefront and gateway.

### Storefront Application

Storefront is the main application that handles requests coming from user's browser. A basic storefront application has two important configurations.

1. Gateways it should connect
2. Pages it should render

Whenever a storefront Application starts, PuzzleJs executes some steps before creating http server to handle requests.

1. Fetch configuration from gateways
2. Parse page html files to detect [fragments](#fragments)
3. Compile html files into javascript functions based on configurations fetched from gateways.

After compiling html files into javascript functions it creates a http server. Whenever a request comes, response is sent with several steps.

1. Send initial chunk without waiting anything
2. Request responsible gateways for their fragments
3. Stream each fragment content into browser
4. When all fragments are streamed, finish response and close connection.

### Gateway Application

Gateway is the application where you can implement your fragments and apis. It is responsible for collecting data from other applications and rendering smaller html contents(fragments) with them. Gateways can be used for these features.

* Rendering fragments
* Public Apis


### Fragments

Fragments are small html contents which can work standalone and has independent data for other html contents. Think about an e-commerce website.

![Fragment Example](https://i.gyazo.com/ea17e2485308b0319a82e00eba303161.png)

There are 5 fragments in this page. They are completely different applications independent from each other and communicating others through a shared publish-subscribe bus.

Fragments can have multiple parts. Same fragment can put content into header and footer or even a meta tag. Check [Template](#template)

#### Fragment Types

There are 4 types of fragments

| Name | Description |
| - | - |
| Chunked | Storefront will stream this fragment's contents into browser with [individual chunk](#individual-chunk) |
| ShouldWait | Storefront will send this fragments contents in [initial chunk](#initial-chunk) |
| Primary | Storefront will send this fragments contents in initial chunk and reflect gateways status code |
| Static | This fragment contents are fetched on compile time and storefront won't request to gateway again for this. It is sent on initial chunk |

##### Chunked Fragments

Chunked fragments are sent after initial chunk whenever they are ready. You can check them in tcp stream using `curl --raw http://127.0.0.1:8080`, and example below.
```html
0xf3
<html>
    <head></head>
    <body>
        <div>Initial chunk</div>
0xa2
        <div>Chunked Div</div>
    </body>
</html>
```
There two hex numbers in stream (0xf3, 0xa2). They are representing the size of the chunk. Lets assume that second chunk is sent after 600ms. Browser already parsed and rendered contents of the first chunk. Whenever second chunk is arrived browser parses it too and renders it's contents.

Chunked fragments are sent after the initial chunk. Like the example above `<div>Chunked Div</div>` is a chunked fragment

##### ShouldWait Fragments

ShouldWait fragments are the fragments that should be waited and injected into initial chunk. Let's assume a page with 2 fragments. One is shouldWait and the other is chunked.
```html
0xf3
<html>
    <head></head>
    <body>
        <div>ShouldWait fragment</div>
0xa2
        <div>Chunked Fragment</div>
    </body>
</html>
```

If a fragment or it's partial is in `<head>`, PuzzleJs makes that fragment shouldWait automatically.
ShouldWait fragments will be requested from gateways by storefront on each request. Adding meta tags is a great example for usage of shouldWait fragments.

##### Primary Fragments

These fragments has all features of [ShouldWait Fragments](#shouldwait-fragments), but in addition primary fragments are unique and the main content of the page.

A primary fragment can change status code and the headers of the response.
Assume that there is a fragment that brings product contents by product id. But requested product id doesn't exists. Gateway can decide to send reponse status code 404 with product not found content.

Or gateway can redirect storefront using 301 and `location` header.

##### Static Fragments

These fragments are fetched during compile time and directly injected into compiled function. They are sent on initial chunk.
Only gateway can decide if a fragment should be static or not.

## Installing PuzzleJs

To install PuzzleJs with Yarn or Npm, simply:

```bash
yarn add @puzzle-js/core
```

```bash
npm install @puzzle-js/core
```

Then you can start using it

```js
const PuzzleJs = require('@puzzle-js/core');
```

## Storefront
An example of starting storefront with simple configuration.

### Creating Storefront
```js
const Storefront = require('@puzzle-js/core');
const storefront = new Storefront({
  serverOptions: {
    port: 4444
  },
  gateways: [{
    name: 'Gateway',
    url: 'https://127.0.0.1:4448/',
  }],
  pages: [{
    name: 'page-name',
    url: '/mypage'
    html: '<template><!DOCTYPE html><html><head></head><body><div>PuzzeJs</div><fragment from="Gateway" name="example"></fragment></body></html></template>'
  }],
  dependencies: []
});

storefront.init(() => {
    console.log('Storefront ready to respond');
});
```
### Storefront Configuration
You can provide configuration as object or you can use [Configurator](#configurator).

| Property | Type | Required | Description |
|-|-|-|-|
| serverOptions | ServerOptions | True | server options |
| gateways | gateway | True | Gateway Configuration |
| pages | page | True | Page Configuration |
| dependencies | dependency[] | True | Shared dependencies (React, angular, etc.) or [] |

#### Gateway Definition

| Property | Type | Required | Description |
|-|-|-|-|
| name | string | True | Port to listen |
| url | string | True | Storefront will try to request this url to get configuration and fragments |
| assetUrl | string | False | This url is for browsers to connect gateways |

##### Best route to gateway
As fragment requests are between storefront and gateways at back-end, we can optimize it for best network performance. It is really useful if you are using Kubernetes etc.

Let's assume two applications running on different port on same host.

| Name | Public | Inner |
| - | - | - |
| Storefront | https://storefront.com | https://127.0.0.1:4444 |
| Gateway | https://gateway.com | https://127.0.0.1:4445 |

When browser wants to access gateway, it should use its public link. But whenever storefront wants to access gateway, it can use localhost. So, for the best performance we can use this config for gateways.
```js
{
    name: 'Gateway',
    url: 'https://127.0.0.1:4445',
    assetUrl: 'https://gateway.com'
}
```

#### Page

Page configuration defines how PuzzleJs will respond to matching routes.

| Property | Type | Required | Description |
|-|-|-|-|
| name | string | True | Port to listen |
| url | string or string[] or regex or regex[] | True | PuzzleJs uses ExpressJs for routing, check [ExpressJs documentation](https://expressjs.com/en/guide/routing.html) for advanced usage |
| html | string | True | html content of page. Please check [Templating](#templating) for detailed info |

##### Templating

PuzzleJs templates are consist of two parts. `<script>` is the controller of the page, `<template>` is controlled content.
A simple template example.
```html
<script>
  module.exports = {
    onCreate(){
        this.cacheBuster = Date.now();
    }
    onRequest(req){
        //Each page has its own scope.
        this.rand = Math.random();
        //Or you can change req, it will be exposed to <template>
    }
  }
</script>
<template>
    <!DOCTYPE html>
    <html>
        <head>
            <title>Page Version: ${this.cacheBuster}</title>
        </head>
        <body>
            <div>Random: ${this.rand}</div>
            <div>Requested Url: ${req.url}</div>
            <fragment from="GatewayName" name="header"></fragment>
            <div>
                <h1>Content</h1>
                <fragment from="AnotherGatewayName" name="content"></footer>
            </div>
        </body>
    </html>
</template>
```

###### Page Scripts

PuzzleJs creates a page instance where you can add listeners to some events and change scope variables. Page scripts are **optional**. You will still be able to access request or this with template expressions.

These are the events you can use.

| Name | params | When it is triggered |
| - | - | - |
| onCreate | () | When PuzzleJs starts compiling the page for the first time |
| onRequest | ([req](https://expressjs.com/en/api.html#req)) | on each request |
| onChunk | (string) | on each chunk sent |
| onResponseEnd | () | on all chunks sent, connection closed |

###### Template

PuzzleJs compiles this part of html into executable javascript function. Read [Compiling](#html-to-js-compiling) for more information about this process. You can use PuzzleJs expressions inside this part to access page instance or request.

**Expressions**
Expressions can be written with `${expression}`. It can be multiple line too.
```html
<template>
    <html>
        <head></head>
        <body>
            Requested Url: ${req.url}
        </body>
    </html>
</template>
```

Expressions also support conditional statements, and few loop statements. Full support list: `if, for, else, switch}`

Example if
```html
<div>
    ${if(this.rand > 5){}
        <div>It is higher than 5</div>
    ${}}
</div>
```

Example for
```html
<div>
    ${for(var x = 0; x < this.rand; x++){}
        <div>Iterator: ${x}</div>
    ${}}
</div>
```

**Fragments**

You can use `<fragment>` tag to define fragments. It has some attributes.

| name | required | example | description |
| - | - | - | - |
| name | true | name="fragment-name" | Name of the fragment (it has to be exactly the name you defined on your gateway) |
| from | true | from="gateway-name" | Name of the gateway fragment will be fetched from |
| shouldWait | false | shouldWait | PuzzleJs will wait for this fragment to send first response. Check [Fragment Types](#fragment-types) |
| primary | false | primary | PuzzleJs will wait for this fragment, and reflect its status code too. There can be only one primary fragment on each page. Check [Fragment Types](#fragment-types) |
| partial | false | partial="meta" | If a fragment wants to content into two different places you can use `partial`. Common usage: A product fragment which has product html but also has meta tags for it. Default partial is **main**

**All the other attributes will be passed to gateway in query string. So you can configure same fragment with different configuration on each page.**

Partial Example
```html
<html>
    <head></head>
    <body>
        <header>
            <fragment from="Gateway" name="Product" partial="header-content"></fragment>
        </header>
        <main>
            <fragment from="Gateway" name="Product"></fragment>
        </main>
    </body>
</html>
```

**Inline Scripts**

To inline scripts you should use `<puzzle-script>console.log('inline content')</puzzle-script>`

## Configurator

Configurator is used for creating configuration for PuzzleJs with dependency injection and validation. There are two types of configurator, storefront and gateway.

To create a storefront configurator:
```js
const { StorefrontConfigurator } = require('@puzzle-js/core');
const configurator = new StorefrontConfigurator();
```

To create a gateway configurator:
```js
const { GatewayConfigurator } = require('@puzzle-js/core');
const configurator = new GatewayConfigurator();
```

Adding config and injecting into PuzzleJs
```js
const { GatewayConfigurator, Gateway } = require('@puzzle-js/core');
const configurator = new GatewayConfigurator();

configurator.config({
  api: [],
  name: 'Gateway',
  url: 'http://gateway.com/',
  serverOptions: {
      port: 32
  },
  fragments: [
    {
      versions: {
        '1.0.0': {
          assets: [],
          dependencies: [],
        }
      },
      version: '1.0.0',
      testCookie: '',
      render: {
        url: '',
      },
      name: 'test'
    }
  ]
});

const gateway = new Gateway(configurator);
```

### Validation
Configurator will help you validate your configuration for PuzzleJs
```js
configurator.config({
...
port: 'not a valid port'
...
})
```

Configurator will throw error telling you that port should be `number` not `string`. Also whenever port is not provided it will throw error too.

### Dependency Injection
Custom objects can be injected into configuration.

Let's assume we want to inject middleware into api. We can do it without configurator like this

```js
new Gateway({
  api: [
    {
      name: 'api',
      liveVersion: '1.0.0',
      testCookie: 'test',
      versions: {
        '1.0.0': {
          endpoints: [
            {
              path: '/',
              middlewares: [(req, res, next) => {
                req.middlewareWorker = true;
                next();
              }],
              method: HTTP_METHODS.POST,
              controller: 'getItems'
            }
          ]
        }
      }
    }
  ],
  fragmentsFolder: '',
  name: 'Gateway',
  url: 'http://gateway.com',
  serverOptions: {
    port: 32
  },
  fragments: []
})
```

When you want to split config into standalone json files you can't use js in it. When you need this, you can use configurator.

```js
configurator.register("{middleware}", ENUMS.INJECTABLE.MIDDLEWARE, (req, res, next) => {
    req.middlewareWorker = true;
    next();
});
configurator.config({
  api: [
    {
      name: 'api',
      liveVersion: '1.0.0',
      testCookie: 'test',
      versions: {
        '1.0.0': {
          endpoints: [
            {
              path: '/',
              middlewares: ['{middleware}'],
              method: HTTP_METHODS.POST,
              controller: 'getItems'
            }
          ]
        }
      }
    }
  ],
  name: 'Gateway',
  url: 'http://gateway.com/',
  serverOptions: {
    port: 32
  },
  fragments: []
});

const gateway = new Gateway(configurator);
```
With this feature, you can easily manage your configuration on a separate file. There are 3 types of injectables.

| Name | Description |
| - | - |
| Middleware | Used for adding express middleware |
| Handler | Used for custom handlers, read [Handler](#handler) |
| Custom | Can be used for anything |

### Handler

Whenever a custom handler is not provided for an api or fragment, PuzzleJs tries to require its module by itself. Let's assume an api like this exists on gateway.
```js
{
  name: "api-example",
  testCookie: "api_cookie",
  liveVersion: "1.0.0",
  versions: {
    "1.0.0": {
      endpoints: [
        {
          method: ENUMS.HTTP_METHODS.GET,
          path: "/items/?",
          controller: "getItems"
        }
      ]
    }
  }
}
```
PuzzleJs tries to `handler = require('./src/api/api-example/1.0.0/index.js');` and whenever a request comes it will try to run `handler.getItems(req, res)`. If that module doesn't exist, it will throw an error. But you can also provide custom handlers using [dependency injection](#dependency-injection) feature of Configurator.
```js
const configurator = new GatewayConfigurator();
configurator.register("{customhandler}", ENUMS.INJECTABLE.HANDLER, {
    getItems(req, res){
        res.send('PuzzleJs')
    }
});
configurator.config({
...
  name: "api-example",
  testCookie: "api_cookie",
  liveVersion: "1.0.0",
  versions: {
    "1.0.0": {
      handler: '{customhandler}'
      endpoints: [
        {
          method: ENUMS.HTTP_METHODS.GET,
          path: "/items/",
          controller: "getItems"
        }
      ]
    }
  }
  ...
})
```

## Core Configuration

PuzzleJs has some inner configurations you can't change using any Storefront or Gateway configuration. They can be changed using envrionment variables

| Env Variable Name | Default | Description |
| - | - | - |
| DEFAULT_POLLING_INTERVAL | 1250 | Interval in ms storefront checks if gateway is updated |
| CONTENT_NOT_FOUND_ERROR | `<script>console.log('Fragment Part does not exists')</script>` | Whenever fragment content not found, it is injected into html |
| DEFAULT_CONTENT_TIMEOUT | 15000 | PuzzleJs waits for miliseconds for gateway fragment response. Status Code will be 500 on timeout |
| RENDER_MODE_QUERY_NAME | '__renderMode' | Storefront sends request to gateway using this query parameter to get stream type response |
| PREVIEW_PARTIAL_QUERY_NAME | '__partial' | This query parameter is used for selecting a partial to render on preview mode |
| API_ROUTE_PREFIX | 'api' | prefix for apis: gateway.com/api/api-name/endpoint |
| GATEWAY_PREPERATION_CHECK_INTERVAL | 200 | When storefront is booting up, it checks for gateways in 200 ms interval |
| CHEERIO_CONFIGURATION | `{normalizeWhitespace: true,recognizeSelfClosing: true,xmlMode: true,lowerCaseAttributeNames: true,decodeEntities: false}` | Cheerio html parsing configuration, stringify object to change config |
| TEMPLATE_FRAGMENT_TAG_NAME | 'fragment' | Tag name of fragments in templates |
| DEFAULT_GZIP_EXTENSIONS | `['.js', '.css']` | These extensions will be gzipped. You can use Json string to change |
| DEBUG_QUERY_NAME | '__debug' | It enables debug information on console |
| DEBUG_INFORMATION | false | It enables debug information globally |
| NO_COMPRESS_QUERY_NAME | '__noCompress' | It disables compression for that request |

## Configuration Models

### Server Options
** HTTP/2 Does not supported yet
| Property | Type | Required | Description |
|-|-|-|-|
| port | number | True | Port for server to listen |
| hostname | string | False | Hostname for server |
| http2 | boolean | False | HTTP2 option (Not Supported Yet)|
| https | serverHttpsOptions | False | HTTPS options |

#### Server Https Options
| Property | Type | Required | Description |
|-|-|-|-|
| cert | string | True | Certificate for HTTPS |
| key | string | True | Key for HTTPS |
