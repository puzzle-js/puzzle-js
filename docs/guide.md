# Guide

* [Puzzle Architecture](#architecture)
    * [Storefront](#storefront-application)
    * [Gateway](#gateway-application)
* [Installing PuzzleJs](#installing-puzzlejs)
* [Storefront](#storefront)
    * [Creating Storefront](#creating-storefront)
    * [Gateway](#gateway-definition)
        * [Best route to gateway](#best-route-to-gateway)
    * [Page](#page)

## Architecture

PuzzleJs implements micro-services architecture into front-end. The idea of micro-frontd comes from [BigPipe](https://www.facebook.com/notes/facebook-engineering/bigpipe-pipelining-web-pages-for-high-performance/389414033919/), Facebook's fundamental redesign of the dynamic web page serving system. Here is how a PuzzleJs website architecture looks like.

![Architecture](https://i.gyazo.com/647c7733aa6fb47839037d3fab2d3ee0.png)

There are two types of PuzzleJs implementation, storefront and gateway.

### Storefront Application

Storefront is the main application that handles requests coming from users browser. A basic storefront application has two important configurations.

1. Gateways it should connect
2. Pages it should render

Whenever a storefront Application started, PuzzleJs executes some steps before creating http server to handle requests.

1. Fetch configuration from gateways
2. Parse page html files to detect fragments
3. Compile html files into javascript functions based on configurations fetched from gateways.

After compiling html files into javascript functions it creates a http server. Whenever a request comes, response is sent with several steps.

1. Send initial chunk without waiting anything.
2. Request responsible gateways for their fragments
3. Stream each fragment content into browser
4. When all fragments are streamed, finish response and close connection.

### Gateway Application

Gateway is the application where you can implement your fragments and apis. It is responsible for collecting data from the other applications and render smaller html contents(fragments) with them. Gateways can be used for these features.

* Rendering fragments
* Public Apis

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

Lets assume two applications running on different port on same host.

| Name | Public | Inner |
| - | - | - |
| Storefront | https://storefront.com | https://127.0.0.1:4444 |
| Gateway | https://gateway.com | https://127.0.0.1:4445 |

When browser wants to access gateway it should use its public link. But whenever storefront wants to access gateway it can use localhost. So, for the best performance we can use this config for gateways.
```js
{
    name: 'Gateway',
    url: 'https://127.0.0.1:4445',
    assetUrl: 'https://gateway.com'
}
```




