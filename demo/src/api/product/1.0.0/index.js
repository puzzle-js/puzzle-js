const products = [
  {
    name: 'Book 1',
    price: '2.41 $',
    detail: 'A great book'
  },
  {
    name: 'Book 2',
    price: '1.41 $',
    detail: 'A great book 2'
  },
  {
    name: 'Book 3',
    price: '3.46 $',
    detail: 'A great book 3'
  },
  {
    name: 'Book 4',
    price: '4.21 $',
    detail: 'A great book 4'
  },
  {
    name: 'Book 5',
    price: '0.40 $',
    detail: 'A great book 5'
  },
];

module.exports = {
  products,
  getProduct(req, res) {
    res.json(products[req.params.id]);
  },
  newProduct(req, res) {
    products.push({
      name: req.body.name,
      price: req.body.price,
      detail: req.body.detail
    });
    res.status(200).end('New book added, return back');
  }
};
