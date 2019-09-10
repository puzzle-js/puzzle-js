# Quick Start

**You can check demo folder to copy paste full version of this quick guide**

## 1. Create a new gateway project with PuzzleJs

### 1.1 Prepare project structure

```bash
├── index.js
└── src
    ├── api
    │   └── product
    │       └── 1.0.0
    │           └── index.js
    └── fragments
        └── my-product
            └── 1.0.0
                └── index.js
```

### 1.2 Create your fragment module

*/src/fragments/my-product/1.0.0/index.js*

```js
module.exports = {
  placeholder() {
    return 'Loading products...';
  },
  data(req) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: {
            name: 'A Book',
            price: '2.41 $'
          }
        });
      }, 2000);
    });
  },
  content(req, data) {
    return `<div class="product"><div>${data.name}</div><small>${data.price}</small></div>`;
  }
};
```

### 1.3 Create your api module

*/src/api/product/1.0.0/index.js*

```js
module.exports = {
  getProduct(req, res){

  },
  newProduct(req, res){

  }
};
```

### 1.4 Create gateway configuration file.
*/index.js*
```js
const PuzzleJs = require('@puzzle-js/core');
const path = require('path');

const gateway = new PuzzleJs.Gateway({
  name: "Gateway 1",
  fragments: [
    {
      name: "my-product",
      testCookie: "my-product-ab",
      version: "1.0.0",
      versions: {
        "1.0.0": {
          assets: [],
          dependencies: []
        }
      },
      render: {
        url: "/"
      }
    },
  ],
  api: [
    {
      name: "product",
      testCookie: "my-product-ab",
      liveVersion: "1.0.0",
      versions: {
        "1.0.0": {
          endpoints: [
            {
              method: 'get',
              path: "/",
              controller: "getProduct"
            },
            {
              method: 'post',
              path: "/",
              controller: "newProduct"
            },
          ]
        }
      }
    }
  ],
  port: 4444,
  url: 'http://localhost:4444',
  fragmentsFolder: path.join(__dirname, "./src/fragments")
});

gateway.init(() => {
  console.log('Gateway is ready to respond');
});

```

Now your gateway is ready to respond requests.

Your configuration file will be exported from [http://localhost:4444/](http://localhost:4444/).

Your fragment will be available for preview at [http://localhost:4444/my-product/](http://localhost:4444/my-product/)

## 2. Create a new storefront project

### 2.1 Prepare project structure

```bash
├── index.js
└── pages
    ├── homepage.html
```

### 2.2 Create your page html

*/pages/homepage.html*

```html
<script>
    module.exports = {
      onCreate(){
        this.visitCount = 0;
      },
      onRequest(req){
        this.visitCount++;
      }
    }
</script>

<template>
    <html>
        <head>
            <title>Product</title>
        </head>
        <body>
            <div class="product-container">
                <fragment from="Browsing" name="my-product"></fragment>
            </div>
            <div>
                This page is viewed ${this.visitCount} times.
            </div>
        </body>
    </html>
</template>

```

### 2.3 Create storefront configuration file

*/index.js*

```js
const PuzzleJs = require('@puzzle-js/core');
const path = require('path');
const fs = require('fs');

const storefront = new PuzzleJs.Storefront({
  port: 4445,
  gateways: [
    {
      name: 'Browsing',
      url: 'http://localhost:4444/',
    }
  ],
  pages: [
    {
      name: 'homepage',
      url: '/',
      html: fs.readFileSync(path.join(__dirname, './pages/homepage.html'), 'utf8')
    }
  ],
  dependencies: []
});

storefront.init(() => {
  console.log('Storefront is ready to respond');
});
```

Now your website is ready. Check out [http://localhost:4445/](http://localhost:4445/)

Please check [full guide](./guide.md) for all great features PuzzleJs has.
