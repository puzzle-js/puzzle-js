<p align="center">
<img src="https://image.ibb.co/jM29on/puzzlelogo.png" alt="PuzzleJs Logo" width="300" />
</p>

# PuzzleJs Framework
Micro frontend framework for scalable and blazing fast websites.

[![CircleCI](https://circleci.com/gh/puzzle-js/puzzle-js/tree/master.svg?style=svg)](https://circleci.com/gh/puzzle-js/puzzle-js/tree/master) 
[![npm](https://img.shields.io/npm/dt/puzzle-microfrontends.svg)](https://www.npmjs.com/package/@puzzle-js/core) 
[![npm](https://img.shields.io/npm/v/puzzle-microfrontends.svg)](https://www.npmjs.com/package/@puzzle-js/core) 
[![Known Vulnerabilities](https://snyk.io/test/github/puzzle-js/puzzle-js/badge.svg)](https://snyk.io/test/github/puzzle-js/puzzle-js)
[![codecov](https://codecov.io/gh/puzzle-js/puzzle-js/branch/master/graph/badge.svg)](https://codecov.io/gh/puzzle-js/puzzle-js) 

## *New documentation and demo is under development*

## [Live Demo](http://178.128.201.193:4444/) - [Repository](https://github.com/puzzle-js/PuzzleJs-Demo)

PuzzleJs makes it easy to create gateways and storefront projects that talk each other. It is inspired by Facebook's [BigPipe](https://www.facebook.com/notes/facebook-engineering/bigpipe-pipelining-web-pages-for-high-performance/389414033919/), developed with lots of great features and passion.

### Why?
The traditional model is very inefficient for modern websites.
* Multiple teams working on the same code make everything harder to manage.
* Time to first byte is as fast as the slowest api.
* While backend is collecting data, user browser is wasting time waiting for first byte.
* Features can't be online as soon as it is fully developed and tested, because other teams' features are not ready yet.
* You can't use different technologies except from the existing one.
* You can't scale specific process, because you are dependent to whole system.

### Features
* **First Time To Byte** PuzzleJs compiles html template into javascript function on compile time. This operation is fully independent from the request, so PuzzleJs can send the first chunk using this function.
* **Seo Friendly** PuzzleJs is fully SEO friendly, as everything is prepared and rendered on server side.
* **Extensibility** It is easy to extend PuzzleJs with your custom functions.
* **Easy** You can easily create a gateway or storefront and connect them by providing a configuration file.
* **Independent** You can use any technology on your gateways, PuzzleJs is fully independent from your technologies. ReactJs, Vue or anything else.
* **Scalable** PuzzleJs can create storefront and gateways independent from each other. So you can easily scale single project on Dockerized environments.
* **Fail-Safe** When your api required by a fragment is down, PuzzleJs guarantees other page fragments will be still working.

### Getting Started

Checkout [quick start guide](./docs/quick.md) for fastest implementation.

 1. Create one or more gateway projects.
 2. Create fragments and api on gateway projects.
 3. Create a storefront project and connect gateways with a config file.
 4. Create pages on storefront project and provide html files with desired fragments.

Please check the [guide](./docs/guide.md) for full documentation.

### How PuzzleJs works?

*Compile time*
1. Gateways start exposing their fragments, api and gateway information.
2. Storefront fetches registered gateways' information.
3. Storefront downloads and caches required fragments, dependencies and assets.
4. Storefront compiles html into in memory javascript function for fastest template rendering.

*On Request*
1. Storefront sends a chunked response with the compiled function but doesn't close the connection. Users are now able to see your website with static contents and placeholders. It also sends backend requests to gateways to recieve rendered fragments.
2. After any fragment is recieved from gateway, it sends it to browser as a chunk and replaces previously sended placeholder with the content.
3. When all fragments are sent, PuzzleJs closes connection.

### Documentation
Read the [guide](./docs/guide.md) to familiarize yourself with how PuzzleJs works.

* [Puzzle Architecture](./docs/guide.md#architecture)
* [Installing PuzzleJs](./docs/guide.md#installing-puzzlejs)
* [Storefront](./docs/guide.md#storefront)
* [Configurator](./docs/guide.md#configurator)
* [Core Configuration](./docs/guide.md#core-configuration)

### [Changelog](./CHANGELOG.md)

### Showcase

<a href="https://m.trendyol.com" title="Trendyol" target="_blank">
    <img src="https://www.trendyol.com/content/images/trendyol-online-white.png" width="80">
</a>

### Contributions
Feel free to contribute to PuzzleJs, please read [Contributions](./docs/contributions.md) for detailed information.
