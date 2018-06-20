const PuzzleJs = require('../dist');
const path = require('path');
const fs = require('fs');

const gateway = new PuzzleJs.Gateway({
  name: "Gateway 1",
  fragments: [
    {
      name: "my-product",
      testCookie: "my-product-ab",
      version: "1.0.0",
      versions: {
        "1.0.0": {
          assets: [
            {
              name: 'Product Module',
              fileName: 'product.js',
              type: PuzzleJs.ENUMS.RESOURCE_TYPE.JS,
              location: PuzzleJs.ENUMS.RESOURCE_LOCATION.HEAD,
              injectType: PuzzleJs.ENUMS.RESOURCE_INJECT_TYPE.EXTERNAL
            }
          ],
          dependencies: []
        }
      },
      render: {
        url: "/",
        placeholder: true
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
              path: "/:id",
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
