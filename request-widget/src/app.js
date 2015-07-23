import * as utils from './utils/tools';

let node = document.getElementById('main');
if (node) {
  node.innerHTML = `<h1>app is loaded : ${utils.add(1, 2, 3, 4, 5)}</h1>`;
}
