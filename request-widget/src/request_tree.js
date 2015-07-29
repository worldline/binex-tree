import d3 from 'd3';
import {parse} from '../../common/src/grammar_parser';
import {translateRequestToTree} from './utils/tools';
import * as utils from './utils/svg';
import _ from 'lodash';

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
function makeZoomableGrid(tree) {
  tree.zoom = d3.behavior.zoom()
    .translate([tree.width * .25, 0])
    .scale(tree.initialScale)
    .scaleExtent(tree.scaleExtent)
    .on('zoom', () => {
      // Eventually, animate the move
      tree.grid.transition().attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
    });

  tree.grid = tree.svg.call(tree.zoom)
    .append('g')
      .attr('transform', `translate(${tree.zoom.translate()}) scale(${tree.zoom.scale()})`);
  return tree.grid;
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
      animDuration: 1000,
      dragged: {}
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

    // Creates a grid that will be pannable and zoomable
    makeZoomableGrid(this);

    // Because we need D3's this in onDrag function, and access to real this also.
    let that = this;

    // Drag'n drop listener used to move nodes
    this.dragListener = d3.behavior.drag()
      .on('dragstart', function(d) {
        that.onDragStart(d3.select(this), d);
      })
      .on('drag', this.onDrag.bind(this))
      .on('dragend', this.onDrop.bind(this));

    // Initialize request
    this.data = {};
    if (request) {
      this.setRequest(request);
    }
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
    this.update();
  }

  /**
   * The update method refresh rendering to reflect data changes
   * 'data' object must have been set previously
   */
  update() {
    // We need a first layout to organize data, and display it.
    // This layout will allow to compute node's dimensions
    let tree = d3.layout.tree().nodes(this.data).reverse();

    // Associate data to SVG nodes, and assign unic ids
    let nextId = 0;
    let nodes = this.grid.selectAll('g.node')
      .data(tree, d => d.id || (d.id = ++nextId));

    // Creates node representation
    nodes.enter()
      .append('g')
      .call(this.dragListener)
      .attr('class', 'node')
      .call(this.renderNode)
      .classed('leaf', d => !('children' in d));

    // Remove unecessary nodes
    nodes.exit().remove();

    // Search for biggest node, and individual column width
    let {biggest, columns} = getDimensions(nodes, this.hSpacing);

    // Then we layout again taking the node size into acocunt.
    let layout = d3.layout.tree().nodeSize([biggest.height * this.vSpacing, biggest.width]);
    layout.nodes(this.data);

    // once each column was processed, for all nodes, compute y (wich is the inverted x) and positionnate with animation
    nodes.each(d => d.y = columns.reduce((sum, width, i) => sum + (i < d.depth ? width : 0), 0))
      .transition()
        .duration(this.animDuration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Creates link representation (remember, x is y and y is x)
    let links = layout.links(tree);
    let elbow = makeElbow(columns, this.hSpacing);

    let link = this.grid.selectAll('path.link')
      .data(links, d => d.target.id);
    link.enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', ({source: {x0: x = 0, y0: y = 0}}) => elbow({source: {x, y, depth: 0}, target: {x, y, depth: 0}}));
    link.transition()
      .duration(this.animDuration)
      .attr('d', elbow);
    link.exit().remove();
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
   * Invoke when starting to drag a node.
   * If the dragged node is not root, initiate inner state (`this.dragged`),
   * highlight possible drop zone (other non-leaf nodes) and bind listener on them
   *
   * @parma {d3.selection} node - dragged SVG node
   * @param {Object} d - dragged subtree data
   */
  onDragStart(node, d) {
    if (d === this.data) {
      // Do not drag the root itself
      return;
    }
    // Keep dragged element and its parent
    this.dragged = {
      node: node.classed('dragged', true),
      parent: d.parent,
      idx: d.parent.children.indexOf(d)
    };
    // Removes sub tree from data
    d.parent.children.splice(this.dragged.idx, 1);
    this.update();
    // And replace dragged node only
    this.grid.classed('drag-in-progress', true)
      .append(() => node.node());

    let that = this;
    // Highlight possible drop zone
    d3.selectAll('.node:not(.leaf):not(.dragged)')
      .classed('droppable', true)
      .on('mouseover', function() {
        that.dragged.drop = d3.select(this)
          .classed('selected', true);
      })
      .on('mouseout', () => {
        this.dragged.drop.classed('selected', false);
        this.dragged.drop = null;
      });

    // Temporary disable whole tree zoom behaviour
    d3.event.sourceEvent.stopPropagation();
  }

  /**
   * Invoke when dragging a given node.
   * Moves the dragged object, using d3.event.
   *
   * @param {Object} d - dragged subtree data
   */
  onDrag(d) {
    if (!this.dragged) {
      return false;
    }
    // Moves dragged element under mouse
    d.x += d3.event.dy;
    d.y += d3.event.dx;
    this.dragged.node.attr('transform', `translate(${d.y},${d.x})`);
  }

  /**
   * Invoke when a dragged node is dropped.
   * If drop over an acceptable drop zone (`this.dragged.drop`), move the subtree.
   * Otherwise, reverd dragged subtree to its original location (`this.dragged.parent`).
   * Update rendering to reflect results
   *
   * @param {Object} d - dragged subtree data
   */
  onDrop(d) {
    if (!this.dragged) {
      return;
    }
    // Removes temporary drag classes and drop zone listener
    d3.selectAll('.droppable')
      .classed('droppable', false)
      .on('mouseover', null)
      .on('mouseout', null);
    this.dragged.node.classed('dragged', false);
    this.grid.classed('drag-in-progress', false);

    if (this.dragged.drop) {
      // If element was dropped on possible drop zone, add it to children
      this.dragged.drop.classed('selected', false);
      this.dragged.drop.datum().children.push(d);
    } else {
      // Cancels drag by replacing element under its original parent
      this.dragged.parent.children.splice(this.dragged.idx, 0, d);
    }
    this.dragged = null;
    this.update();
  }
}
