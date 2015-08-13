
/**
 * This function translate a parsed request (grammar parser's output) into a D3 compliant tree structure.
 * @param {Object} request - the wellformated parsed request
 * @return {Object} a D3 tree structure
 */
export function translateRequestToTree(request) {
  let keys = Object.keys(request);
  let isAnd = keys.indexOf('$and') >= 0;
  let isOr = keys.indexOf('$or') >= 0;
  if (isAnd || isOr) {
    let key = isAnd ? '$and' : '$or';
    let result = assign({
      name: key,
      children: request[key].map(translateRequestToTree)
    }, request);
    delete result[key];
    return result;
  }
  return request;
}

/**
 * This function translate a tree data (that may have be modified by d3's layout)
 * into a grammar generator's compliant data structure.
 * @param {Object} tree - D3 tree structure
 * @return {Object} corresponding wellformated parsed request
 */
export function translateTreeToRequest(tree) {
  let request = {};
  switch (tree.name) {
    case '$and':
    case '$or':
      if (tree.children) {
        request[tree.name] = tree.children.map(translateTreeToRequest).filter(n => Object.keys(n).length > 0);
      }
      break;
    default:
      request.name = tree.name;
      for (let prop in tree) {
        // copy everything that was not added by d3 layout.
        if (['parent', 'x', 'y', 'depth', 'name', 'width', 'height', '__id'].indexOf(prop) === -1) {
          request[prop] = tree[prop];
        }
      }
  }
  return request;
}

/**
 * Surface copy of objects into another. Only first-level properties are copied.
 * When the samge property in in multiple sources, right most parameter takes precedence over left-most ons.
 * This function is a naïve implementation of lodash's assign to avoid insluding the whole library and keep
 * dependencies to d3
 *
 * @param {Object} target - object in which properties will be copied. Will be modified.
 * @param {Object[]} sources - any object you whish to copy into the result oject
 * @return {Object} the resulting object.
 */
export function assign(target, ...sources) {
  sources.forEach(source => {
    for (let property in source) {
      target[property] = source[property];
    }
  });
  return target;
}

/**
 * Format a given natural integer by adding thousand serparators.
 * Decimals and negative numbers are not supported.
 * @param {Number} number - formatted number
 * @param {String = ' '} separator - thousand separator used
 * @return {String} the formatted number
 */
export function formatNumber(number, separator = ' ') {
  if (isNaN(parseInt(number))) {
    return number;
  }
  return Math.floor(+number).toString().split('').reverse().reduce((res, digit, i) => digit + (i > 0 && i % 3 === 0 ? separator : '' ) + res);
}
