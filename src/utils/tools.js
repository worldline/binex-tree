import d3 from 'd3';

/**
 * Check if a variable has a given type.
 * Freely inspired from http://bonsaiden.github.io/JavaScript-Garden/fr/#types
 *
 * @param {Any} obj - checked variable
 * @param {String} type - type name
 * @return {Boolean} true if variable has the expected type, false otherwise
 */
export const is = (obj, type) => {
  let clazz = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
  return obj !== undefined && obj !== null && clazz === type.toLowerCase().trim();
};

/**
 * Add a zoomable g layer inside the tree's svg node.
 * Store into tree's 'zoom' attribute the zoom behavior and into tree's 'grid' attribute the created node
 *
 * @param {RequestTree} tree - modified tree instance
 * @param {Number} tree.width - svg node width
 * @param {Number} tree.initialScale - initiale scale used for zooming (inside scaleExtent)
 * @param {[Number, Number]} tree.scaleExtent - minimum and maximal bound used for zoom.
 * @param {Behavior} tree.zoom - attribute used to store d3's zoom behavior
 * @return {SVGElement} g group created
 */
export const makeZoomableGrid = tree => {
  tree.zoom = d3.behavior.zoom().
    translate([0, tree.height * 0.5]).
    scale(tree.initialScale).
    scaleExtent(tree.scaleExtent).
    on('zoom', () => {
      // Eventually, animate the move
      tree.grid.transition().attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
    });

  tree.svg.on('click', tree.hideMenu.bind(tree));

  tree.grid = tree.svg.call(tree.zoom).
    append('g').
      attr('transform', `translate(${tree.zoom.translate()}) scale(${tree.zoom.scale()})`);
  return tree.grid;
};

/**
 * Get biggest node representation, and compute columns widths.
 *
 * @param {d3.selection} node - d3 nodes that will be analyzed
 * @param {Number} hSpacing - spacing factor (higher than 1) between two columns, where elbow will be located.
 * @return {Object} containing biggest node representation and columns width, with hSpacing factor
 * @return {Number} return.biggest.width - width of the biggest node
 * @return {Number} return.biggest.height - height of the biggest node
 * @return {Number[]} return.columns - array of column widths
 */
export const getDimensions = (node, hSpacing) => {
  let biggest = {width: 0, height: 0};
  let columns = [];

  // Do not use fat arrow to have this aiming at current SVGElement
  /* eslint no-invalid-this: 0 */
  node.each(function(d) {
    let {width, height} = this.getBBox();
    let depth = d.depth;
    width *= hSpacing;
    if (biggest.width < width) {
      biggest.width = width;
    }
    if (biggest.height < height) {
      biggest.height = height;
    }
    if (!columns[depth]) {
      columns[depth] = 0;
    }
    if (columns[depth] < width) {
      columns[depth] = width;
    }
  });
  return {biggest, columns};
};

/**
 * This function translate a parsed data (grammar parser's output) into a D3 compliant tree structure.
 * @param {Object} data - the wellformated parsed data
 * @return {Object} a D3 tree structure
 */
export const translateToTree = data => {
  let keys = Object.keys(data);
  let isAnd = keys.indexOf('$and') >= 0;
  let isOr = keys.indexOf('$or') >= 0;
  if (isAnd || isOr) {
    let key = isAnd ? '$and' : '$or';
    let result = assign({
      name: key,
      children: data[key].map(translateToTree)
    }, data);
    delete result[key];
    return result;
  }
  return data;
};

/**
 * This function translate a tree data (that may have be modified by d3's layout)
 * into a grammar generator's compliant data structure.
 * @param {Object} tree - D3 tree structure
 * @return {Object} corresponding wellformated parsed data
 */
export const translateFromTree = tree => {
  let data = {};
  switch (tree.name) {
  case '$and':
  case '$or':
    if (tree.children) {
      data[tree.name] = tree.children.map(translateFromTree).filter(n => Object.keys(n).length > 0);
    }
    break;
  default:
    data.name = tree.name;
    for (let prop in tree) {
      // copy everything that was not added by d3 layout and our own code (__id and __value).
      if (['parent', 'x', 'y', 'depth', 'name', 'width', 'height', '__id', '__value'].indexOf(prop) === -1) {
        data[prop] = tree[prop];
      }
    }
  }
  return data;
};

/**
 * Function factory that will return a SVGPath generator between two positions
 * Generated path are square links between the two node, where vertical elbow is located in the space
 * between two columns.
 *
 * @param {Number[]} columns - array containing columns width.
 * @param {Number} hSpacing - spacing factor (higher than 1) between two columns, where elbow will be located.
 * @return {Function} SVGPath generator, that takes an object with 'source' and 'target' points (x, y, width)
 * and that return a valid SVG path (usable for path 'd' attribute)
 */
export const makeElbow = (columns, hSpacing) => {
  return ({source, target}) => {
    let start = source.y + (source.width || 0);
    // Elbow will takes place in horizontal spacing between levels
    let space = columns[source.depth];
    let corner = target.y - (space - space / hSpacing) / 2;
    return `M${start},${source.x}H${corner}V${target.x}H${target.y}`;
  };
};

/**
 * Deep copy of objects into another.
 * When the samge property in in multiple sources, right most parameter takes precedence over left-most ons.
 * This function is a naïve implementation of lodash's assign to avoid insluding the whole library and keep
 * dependencies to d3
 *
 * @param {Object} target - object in which properties will be copied. Will be modified.
 * @param {Object[]} sources - any object you whish to copy into the result oject
 * @return {Object} the resulting object.
 */
export const assign = (target, ...sources) => {
  sources.forEach(source => {
    for (let property in source) {
      if (is(source[property], 'object')) {
        if (!is(target[property], 'object')) {
          target[property] = {};
        }
        assign(target[property], source[property]);
      } else {
        target[property] = source[property];
      }
    }
  });
  return target;
};

/**
 * Format a given natural integer by adding thousand serparators.
 * Decimals and negative numbers are not supported.
 * @param {Number} number - formatted number
 * @param {String} separator = ' '- thousand separator used
 * @return {String} the formatted number
 */
export const formatNumber = (number, separator = ' ') => {
  if (isNaN(parseInt(number))) {
    return number;
  }
  return Math.floor(+number).toString().split('').reverse().reduce((res, digit, i) => digit + (i > 0 && i % 3 === 0 ? separator : '') + res);
};
