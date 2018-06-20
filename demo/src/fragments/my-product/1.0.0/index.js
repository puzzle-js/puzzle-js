const api = require('./../../../api/product/1.0.0');

module.exports = {
  placeholder() {
    return 'Loading products...';
  },
  data(req) {
    //Api calls must be resolved here.
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({data: api.products});
      }, 2000);
    });
  },
  content(req, data) {
    return {
      main: data.map((product, i) => `<div class="product" onclick="showDetail(${i})"><div>${product.name}</div><small>${product.price}</small></div>`).join('')
    }
  }
};
