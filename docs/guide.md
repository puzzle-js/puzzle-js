# Guide

* [Puzzle Architecture](#architecture)
    * [Storefront](#storefront-application)
    * [Gateway](#gateway-application)
* [Installing PuzzleJs](#installing-puzzlejs)
* [Storefront](#storefront)

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
