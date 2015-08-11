import d3 from 'd3';
import {translateRequestToTree, assign, translateTreeToRequest} from './utils/tools';
import * as utils from './utils/svg';

export const timesSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/></svg>';
export const plusSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1600 736v192q0 40-28 68t-68 28h-416v416q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68v-416h-416q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h416v-416q0-40 28-68t68-28h192q40 0 68 28t28 68v416h416q40 0 68 28t28 68z"/></svg>';
export const pencilSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M491 1536l91-91-235-235-91 91v107h128v128h107zm523-928q0-22-22-22-10 0-17 7l-542 542q-7 7-7 17 0 22 22 22 10 0 17-7l542-542q7-7 7-17zm-54-192l416 416-832 832h-416v-416zm683 96q0 53-37 90l-166 166-416-416 166-165q36-38 90-38 53 0 91 38l235 234q37 39 37 91z"/></svg>';

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

  tree.svg.on('click', tree.hideMenu.bind(tree));

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
 * Asynchronously dispatch an event on a given tree instance
 *
 * @param {RequestTree} tree - concerned tree instance
 * @param {String} event - triggered event name
 * @param {Any[]} args - any argument passed to event.
 */
function dispatch(tree, event, ...args) {
  // Asynchronously dispatch change on data
  setTimeout(() => {
    tree[event](...args);
  }, 0);
}

/**
 * Asynchronously dispatch a change event (with data as parameter) on a given tree instance
 *
 * @param {RequestTree} tree - concerned tree instance
 */
function dispatchChange(tree) {
  // TODO check effective change
  dispatch(tree, 'change', translateTreeToRequest(tree.data));
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

    // Copy options, defaults, and override them with parameters.
    // Also makes the instance an event dispatcher.
    assign(this, {
      ratio: 16 / 9,
      width: 500,
      initialScale: 0.2,
      scaleExtent: [0.04, 0.5],
      hSpacing: 1.4,
      vSpacing: 1.2,
      animDuration: 1000,
<<<<<<< HEAD
      dragSensibility: 200,
      dragged: null
    }, d3.dispatch('change', 'editNode', 'addToNode'), options);
=======
      dragged: null
    }, d3.dispatch('change'), options);
>>>>>>> 4fea375... Add test for drag'n drop operations

    // Ensure that d3.on returns the current instance.
    let d3On = this.on;
    this.on = (...args) => {
      d3On.apply(this, args);
      return this;
    };

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
        that.onDragStart(d3.event, d, d3.select(this));
      })
      .on('drag', d => this.onDrag(d3.event, d))
      .on('dragend', d => this.onDrop(d3.event, d));

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
    this.data = translateRequestToTree(request);
    this.update();
    dispatchChange(this);
  }

  /**
   * The update method refresh rendering to reflect data changes
   * 'data' object must have been set previously
   */
  update() {
    // We need a first layout to organize data, and display it.
    // This layout will allow to compute node's dimensions
    let tree = d3.layout.tree().nodes(this.data).reverse();

    // Associate data to SVG nodes, and add a unic id for linking
    let nextId = 0;
    let nodes = this.grid.selectAll('g.node')
      .data(tree, d => d.__id || (d.__id = ++nextId));

    // Because we need D3's this in onDrag function, and access to real this also.
    let that = this;

    // Creates node representation
    nodes.enter()
      .append('g')
      .call(this.dragListener)
      .on('click', function(d) {
        that.onClick(d, d3.select(this));
      })
      .attr('class', 'node');

    // For new and existing nodes, update rendering.
    nodes.call(this.renderNode)
<<<<<<< HEAD
      .attr('data-id', d => d.id)
=======
      .attr('data-id', d => d.__id)
>>>>>>> 4fea375... Add test for drag'n drop operations
      .classed('leaf', ({name}) => name !== '$and' && name !== '$or');

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
      .data(links, d => d.target.__id);
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
    // Remove previous content
    node.html('');

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
      // Do not use fat arrow to have this aiming at current SVGElement
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
   * Render menu item and positionnate them.
   * The menu parameter is a SVG group positionnated above the concerned tree node.
   *
   * @param {d3.selection} menu - SVGGroupElement in which menu item may be positionnated.
   * @param {Object} d - data for which the menu must be displayed
   * @param {Object[]} actions - expected menu items
   * @param {String} actions.kind - menu item kind: add, edit or delete
   * @param {Function} actions.handler - function that must be invoked when the menu item is clicked
   */
  renderMenu(menu, d, actions) {
    let container = menu.append('g');
    let action = container.selectAll('.action').data(actions).enter()
      .append('g')
        .attr('class', action => `action ${action.kind}`)
        .each(function(d) {
          d3.select(this).on('click', d.handler);
        });

    let duration = this.animDuration / 2;
    // Compute final width manually because it will be animated
    let menuWidth = 0;

    action.html(({kind}) => kind === 'edit' ? pencilSVG : kind === 'add' ? plusSVG : timesSVG);
    action.select('svg').attr('class', 'text');

    action.insert('rect', '.text')
      .attr('class', 'background')
      // Do not use fat arrow to have this aiming at current SVGElement
      .each(function(d, i) {
        // Get background dimensions
        let {width, height, 'margin-right': margin} = utils.getStyles(this, 'width', 'height', 'margin-right');
        let text = d3.select(this.parentNode).select('.text');
        let testStyle = utils.getStyles(text.node(), 'padding-top', 'padding-right', 'padding-bottom', 'padding-left');

        d3.select(this)
          .attr('width', width)
          .attr('height', height);

        text.attr('width', width - testStyle['padding-right'] - testStyle['padding-left'])
          .attr('height', height - testStyle['padding-top'] - testStyle['padding-bottom'])
          .attr('x', testStyle['padding-left'])
          .attr('y', testStyle['padding-top']);

        menuWidth += width + (i === 0 ? 0 : margin);

        d3.select(this.parentNode)
          .attr('transform', 'translate(0, 0)')
          .transition()
            .duration(duration)
              .attr('transform', `translate(${i * (width + margin)}, 0)`);
      });

    // Sizes text to be right placed with a tiny margin
    let {height} = container.node().getBBox();
    container.attr('transform', `translate(${(d.width - menuWidth) / 2}, ${(d.height - height) / 2})`);
  }

  /**
   * Hide the current menu. Does nothing if no menu is displayed
   */
  hideMenu() {
    if (!this.menu) {
      return;
    }
    // TODO animation ?
    this.menu.node.remove();
    this.menu.concerned.classed('menu-origin', false);
    this.menu = null;
  }

  /**
   * Invoked when used left-clicked a given node
   *
   * @param {Object} d - clicked subtree data
   */
  onClick(d, node) {
    // Hide previous menu and display new one
    this.hideMenu();

    // Compute needed menu items
    let items = [{
      kind: 'edit',
      handler: () => dispatch(this, 'editNode', d)
    }];
    if (d !== this.data) {
      // Root element cannot be removed
      items.push({
        kind: 'remove',
        handler: () => {
          if (d === this.data) {
            return;
          }
          d.parent.children.splice(d.parent.children.indexOf(d), 1);
          this.update();
          dispatchChange(this);
        }
      });
    }
    if (d.name === '$and' || d.name === '$or') {
      // Only non-leave can have more children
      items.unshift({
        kind: 'add',
        handler: () => dispatch(this, 'addToNode', d)
      });
    }

    // Add a group in grid to contain menu items, positionnate at
    // concerned element's origin
    this.menu = {
      node: this.grid.append('g').attr('class', 'menu')
        .attr('transform', `translate(${d.y}, ${d.x - d.height / 2})`),
      concerned: node.classed('menu-origin', true)
    };
    // And fill the container with menu
    this.renderMenu(this.menu.node, d, items);
    d3.event.stopPropagation();
  }

  /**
   * Invoked when starting to drag a node.
   * If the dragged node is not root, initiate inner state (`this.dragged`),
   * highlight possible drop zone (other non-leaf nodes) and bind listener on them
   *
   * @param {d3.event} evt - current event
   * @param {Object} d - dragged subtree data
   * @param {d3.selection} node - dragged SVG node
   */
  onDragStart(evt, d, node) {
    if (d === this.data) {
      // Do not drag the root itself
      return;
    }
    // Use a timeout to discard drag'n drop operation that are faster than X ms
    this.discardedDrag = setTimeout(() => {
      this.discardedDrag = null;
      this.hideMenu();
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
        .node().appendChild(node.node());

<<<<<<< HEAD
      // Because we need D3's this in onDrag function, and access to real this also.
      let that = this;
=======
>>>>>>> 4fea375... Add test for drag'n drop operations
      // Highlight possible drop zone
      d3.selectAll('.node:not(.leaf):not(.dragged)')
        .classed('droppable', true)
        .on('mouseover', function() {
          d3.select(this).classed('selected', true);
        })
        .on('mouseout', () => {
          this.svg.selectAll('.selected').classed('selected', false);
        });
<<<<<<< HEAD
    }, this.dragSensibility);
=======
    }, 150);
>>>>>>> 4fea375... Add test for drag'n drop operations
    // Temporary disable whole tree zoom behaviour
    evt.sourceEvent.stopPropagation();
  }

  /**
   * Invoked when dragging a given node.
   * Moves the dragged object, using d3.event.
   *
   * @param {d3.event} evt - current event
   * @param {Object} d - dragged subtree data
   */
  onDrag({dx, dy}, d) {
    if (!this.dragged) {
      return false;
    }
    // Moves dragged element under mouse
    d.x += dy;
    d.y += dx;
    this.dragged.node.attr('transform', `translate(${d.y},${d.x})`);
  }

  /**
<<<<<<< HEAD
   * Invoked when a dragged node is dropped.
   * If drop over an acceptable drop zone (`this.dragged.drop`), move the subtree.
=======
   * Invoke when a dragged node is dropped.
   * If drop over an acceptable drop zone (a droppable node with selected class), move the subtree.
>>>>>>> 4fea375... Add test for drag'n drop operations
   * Otherwise, reverd dragged subtree to its original location (`this.dragged.parent`).
   * Update rendering to reflect results
   *
   * @param {d3.event} evt - current event
   * @param {Object} d - dragged subtree data
   */
  onDrop(evt, d) {
    if (this.discardedDrag) {
      clearTimeout(this.discardedDrag);
      return;
    }
    if (!this.dragged) {
      return;
    }
    let drop = this.svg.select('.droppable.selected');
    // Removes temporary drag classes and drop zone listener
    d3.selectAll('.droppable')
      .classed('droppable', false)
      .on('mouseover', null)
      .on('mouseout', null);
    this.dragged.node.classed('dragged', false);
    this.grid.classed('drag-in-progress', false);

    if (!drop.empty()) {
      // If element was dropped on possible drop zone, add it to children
      drop.classed('selected', false);
      let parent = drop.datum();
      if (!Array.isArray(parent.children)) {
        // Case of drop node is empty
        parent.children = [];
      }
      parent.children.push(d);
      dispatchChange(this);
    } else {
      // Cancels drag by replacing element under its original parent
      this.dragged.parent.children.splice(this.dragged.idx, 0, d);
    }
    this.dragged = null;
    this.update();
  }
}
