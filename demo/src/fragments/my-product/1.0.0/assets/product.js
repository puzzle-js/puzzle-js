console.log('Product');

function showDetail(i) {
  var xhr = new XMLHttpRequest();
  xhr.open('get', 'http://localhost:4444/api/product/' + i);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200)
      alert('Api response: ' + JSON.parse(xhr.responseText).detail);
  };
  xhr.send();
}
