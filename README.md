<p align="center">
# PuzzleJs Framework
![Puzzle Logo](https://image.ibb.co/jM29on/puzzlelogo.png)
Frontend microservices framework for scalable and blazing fast websites.]
[![npm version](https://badge.fury.io/js/ty-puzzlejs.svg)](https://www.npmjs.com/package/ty-puzzlejs) [![MIT Licence](https://img.shields.io/npm/l/slate.svg?maxAge=300)](https://opensource.org/licenses/mit-license.php)
</p>


PuzzleJs makes it easy to create gateways and storefront projects that talk each other. It is inspired by Facebook's [BigPipe](https://www.facebook.com/notes/facebook-engineering/bigpipe-pipelining-web-pages-for-high-performance/389414033919/), developed with lots of great features and passion.

### Why?
Traditional models are not enough because of lacking independence, performance and limitations.
* Multiple teams working on same code makes everything harder to manage.
* Slowest service defines the page speed always.
* When backend is collecting data user browser is wasting time waiting for it.
* Features can't be online as soon as it is fully developed and tested because of other teams futures are not ready yet.
* You can't use different technologies expect from the existing one.
* You can't scale specific process because you are dependent to whole system.

### Features
* **First Time To Byte** PuzzleJs compiles html template into javascript function when it is starting for the first time. This operation is fully independent from the request so PuzzleJs can send the first chunk using this function.
* **Seo Friendly** PuzzleJs is fully seo friendly as everything is being prepared and rendered on serverside.
* **Extensibility** It is easy to extend PuzzleJs and your custom features to the framework.
* **Easy** PuzzleJs makes it simple to build a gateway and storefront project.
* **Independent** You can use any technology on your gateways, PuzzleJs is fully indepented from your technologies.
* **Scalable** You can scale specific gateway when you need.
* **Fail-Safe** You can still show your page to your users if any fragments fails to load.

### Getting Started
Please check the [guide](./docs/guide.md) for full documentation.

1. **Install Puzzlejs**
`yarn add ty-puzzlejs`


### How PuzzleJs works?

*Before request*
1. Gateways start and exposes their fragments and gateway information from desired routes.
2. Storefront fetches registered gateways information.
3. Storefront downloads and caches required fragments, dependencies and assets.
4. Storefront compiles html into in memory javascript function for fastest template rendering.

*On Request*
1. Storefront sends a chunked response with the compiled function but not closes the connection. Users are now able to see your website with static contents and placeholders. It also sends backend requests to gateways ti recieve rendered fragments.
2. When any fragment recieved from gateway it sends it to browser as a chunk and replaces previously sended placeholder with the content.
3. When all fragments are sent, PuzzleJs closes connection.

### Documentation
Read the [guide](./docs/guide.md) to familiarize yourself with how PuzzleJs works.

* [Installing PuzzleJs](./docs/guide.md#installing-puzzlejs)
* [Creating Gateways](./docs/guide.md#creating-gateways)
    * [Fragments](./docs/guide.md#fragments)
    * [Api](./docs/guide.md#api)
    * [Render Modes](./docs/guide.md#render-modes)
* [Creating Storefront](./docs/guide.md#creating-storefront)
    * [Template Engine](./docs/guide.md#template-engine)
    * [Fragment Tag](./docs/guide.md#fragment-tag)
* [Logging](./docs/guide.md#template)
* [Server](./docs/guide.md#server)
    * [Custom Middlewares](./docs/guide.md#middlewares)
    * [Custom Routes](./docs/guide.md#custom-routes)

### [Changelog](./CHANGELOG.md)

### Contributions
Feel free to contribute to PuzzleJs, please read [Contributions](./docs/contributions.md) for detailed information.
