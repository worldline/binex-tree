import d3 from 'd3';
import {parse} from '../../common/src/grammar_parser';
import {translateRequestToTree} from './utils/tools';
import * as utils from './utils/svg';
import _ from 'lodash';

/**
 * Add a zoomable g layer inside the tree's svg node.
 * Store into tree's 'zoom' attribute the zoom behavior
 *
 * @param {RequestTree} tree - modified tree instance
 * @param {Number} tree.width - svg node width
 * @param {Number} tree.initialScale - initiale scale used for zooming (inside scaleExtent)
 * @param {[Number, Number]} tree.scaleExtent - minimum and maximal bound used for zoom.
 * @param {Behavior} tree.zoom - attribute used to store d3's zoom behavior
 * @return {SVGElement} g group created
 */
function makeZoomableGrid(tree) {
  let grid;
  tree.zoom = d3.behavior.zoom()
    .translate([tree.width * .25, 0])
    .scale(tree.initialScale)
    .scaleExtent(tree.scaleExtent)
    .on('zoom', () => {
      // Eventually, animate the move
      grid.transition().attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
    });
  grid = tree.svg.call(tree.zoom)
    .append('g')
      .attr('transform', `translate(${tree.zoom.translate()}) scale(${tree.zoom.scale()})`);
  return grid;
}

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
function getDimensions(node, hSpacing) {
  let biggest = {width: 0, height: 0};
  let columns = [];

  // Do not use fat arrow to have this aiming at current SVGElement
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
}

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
function makeElbow(columns, hSpacing) {
  return ({source, target}) => {
    let start = source.y + (source.width || 0);
    // Elbow will takes place in horizontal spacing between levels
    let space = columns[source.depth];
    let corner = target.y - (space - space / hSpacing) / 2;
    return `M${start},${source.x}H${corner}V${target.x}H${target.y}`;
  };
}

export default class RequestTree {

  constructor(anchor, request = null, options = {}) {
    _.assign(this, {
      ratio: 16 / 9,
      width: 500,
      initialScale: 0.3,
      scaleExtent: [0.04, 0.8],
      hSpacing: 1.4,
      vSpacing: 1.1,
      animDuration: 1000
    }, options);

    // Use fixed width for position computation
    this.height = this.width / this.ratio;

    // Get anchor node and check its existance
    this.svg = d3.select(anchor).append('svg')
      .attr('class', 'tree')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    if (this.svg.empty()) {
      throw new Error(`Failed to init Request Tree: no node found for ${anchor}`);
    }
    // Initialize request
    this.data = {};
    if (request) {
      this.setRequest(request);
    }
  }

  /**
   * Method used to render a given request element
   * Draws the element text inside a rectangle
   *
   * @param {d3.selection} node - currently represented d3 selection
   */
  renderNode(node) {
    node.append('text')
      .attr('class', 'text')
      .text(d => d.name + (d.value ? ` ${d.value.operator} ${d.value.operand}` : ''));

    node.insert('rect', '.text')
      .attr('class', 'decoration')
      // Do not use fat arrow to have this aiming at current SVGElement
      .each(function() {
        let {width} = utils.getStyles(this, 'width');
        if (width > 0) {
          d3.select(this).attr('width', width);
        }
      });

    node.insert('rect', '.decoration')
      .attr('class', 'content')
      .each(function(d) {
        let styles = utils.getStyles(this, 'padding-top', 'padding-bottom', 'padding-left', 'padding-right');

        // Get text dimension
        let text = d3.select(this.parentNode).select('.text');
        let {width, height} = text.node().getBBox();

        // Resize the rect to wrap text, including padding
        d.width = width + styles['padding-left'] + styles['padding-right'];
        d.height = height + styles['padding-top'] + styles['padding-bottom'];

        d3.select(this)
          .attr('width', d.width)
          .attr('height', d.height)
          .attr('y', -d.height / 2);

        // Moves the text to reflext padding
        text.attr('x', styles['padding-left'])
          .attr('y', d.height / 2 - styles['padding-top']);

        d3.select(this.parentNode).select('.decoration')
          .attr('height', d.height)
          .attr('y', -d.height / 2);
      });
  }

  /**
   * Change the displayed request.
   * Calling this method will totally update the displayed content, removing previous display
   *
   * @param {String} request - request to be displayed
   * @throw {Error} if the new request is invalid
   */
  setRequest(request) {
    // Parse displayed request. Will throw error if invalid
    this.data = translateRequestToTree(parse(request));

    // Creates a grid that will be pannable and zoomable
    let grid = makeZoomableGrid(this);

    // We need a first layout to organize data, and display it.
    // This layout will allow to compute node's dimensions
    let tree = d3.layout.tree().nodes(this.data).reverse();

    // Associate data to SVG nodes, and assign unic ids
    let nextId = 0;
    let join = grid.selectAll('g.node')
      .data(tree, d => d.id || (d.id = ++nextId));

    // Creates node representation
    let node = join.enter()
      .append('g')
      //.call(dragListener)
      .attr('class', 'node')
      .call(this.renderNode);

    // Search for biggest node, and individual column width
    let {biggest, columns} = getDimensions(node, this.hSpacing);

    // Then we layout again taking the node size into acocunt.
    let layout = d3.layout.tree().nodeSize([biggest.height * this.vSpacing, biggest.width]);
    layout.nodes(this.data);

    // once each column was processed, comput new node's y (with is the inverted x)
    node.each(d => d.y = columns.reduce((sum, width, i) => sum + (i < d.depth ? width : 0), 0))
      .transition()
        .duration(this.animDuration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Creates link representation (remember, x is y and y is x)
    let links = layout.links(tree);

    let elbow = makeElbow(columns, this.hSpacing);
    let link = grid.selectAll('path.link')
      .data(links, (d) => d.target.id);
    link.enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', ({source: {x0: x = 0, y0: y = 0}}) => elbow({source: {x, y, depth: 0}, target: {x, y, depth: 0}}));
    link.transition()
      .duration(this.animDuration)
      .attr('d', elbow);
  }
}
