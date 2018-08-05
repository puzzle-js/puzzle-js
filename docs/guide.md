# Guide

* [Puzzle Architecture](#architecture)
    * [Storefront](#storefront-application)
    * [Gateway](#gateway-application)
    * [Fragments](#fragments)
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



## Installing PuzzleJs

To install PuzzleJs with Yarn or Npm, simply:

```bash
yarn add puzzle-microfrontends
```

```bash
npm install --save puzzle-microfrontends
```

Then you can start using it

```js
const PuzzleJs = require('puzzle-microfrontends');
```

## Storefront
An example of starting storefront with simple configuration.

### Creating Storefront
```js
const Storefront = require('puzzle-microfrontends');
const storefront = new Storefront({
  port: 4444,
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
| port | number | True | Port to listen |
| gateways | gateway | True | Gateway Configuration |
| pages | page | True | Page Configuration |
| spdy | spdy | False | http2 and spdy configuration |
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

Page configuration defines how PuzzleJs will respond to mathing routes.

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

## Configurator

