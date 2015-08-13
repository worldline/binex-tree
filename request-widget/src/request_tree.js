import d3 from 'd3';
import * as utils from './utils/tools';
import {getStyles} from './utils/svg';

export const timesSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/></svg>';
export const plusSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1600 736v192q0 40-28 68t-68 28h-416v416q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68v-416h-416q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h416v-416q0-40 28-68t68-28h192q40 0 68 28t28 68v416h416q40 0 68 28t28 68z"/></svg>';
export const pencilSVG = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M491 1536l91-91-235-235-91 91v107h128v128h107zm523-928q0-22-22-22-10 0-17 7l-542 542q-7 7-7 17 0 22 22 22 10 0 17-7l542-542q7-7 7-17zm-54-192l416 416-832 832h-416v-416zm683 96q0 53-37 90l-166 166-416-416 166-165q36-38 90-38 53 0 91 38l235 234q37 39 37 91z"/></svg>';

/**
 * Each RequestTree instance is a D3 widget that displays and edit a request data structure.
 * Represented data must have the following structure:

 */
export default class RequestTree {

  /**
   * Builds a request tree widget and attachs it to DOM.
   * All attributes are customizable through the option parameter, especially:
   * - format: function used to get a textual representation of a given node
   * - fetch: function used to get a numerical result for a given node
   * - styles: object containing css selectors and rules to customize some rendering.
   *
   * @param {DOM|String} anchor - DOM node or CSS selector of node that will include the widget
   * @param {Object = null} data - represented data, null to display an empty widget.
   * @param {Object = {}} options - customized attribute for this instance
   */
  constructor(anchor, data = null, options = {}) {

    // Copy options, defaults, and override them with parameters.
    // Also makes the instance an event dispatcher.
    utils.assign(this, {
      ratio: 16 / 9,
      width: 500,
      initialScale: 0.2,
      scaleExtent: [0.04, 0.5],
      hSpacing: 1.4,
      vSpacing: 1.2,
      animDuration: 1000,
<<<<<<< HEAD
      dragSensibility: 200,
      dragged: null,
      thousandSeparator: ',',
      /**
       * Function used to format node and get a textual value
       * @param {Object} data - the node data to be displayed
       * @return {String} a textual representation used for this node
       */
      format: data => data.name + (data.value ? ` ${data.value.operator} ${data.value.operand}` : ''),

      /**
       * Function used to retrieve a given node's numerical value, corresponding to the
       * request results.
       * @param {Object} data - data for which request result are fetched
       * @param {Function} done - completion callback to invoke when data are available, with parameters:
       * @param {Error} done.err - an error object if fetching failed, null otherwise
       * @param {Number} done.result - the numerical result for this node
       */
      fetch: function (data, done) {
        setTimeout(() => {
          done(null, Math.floor(Math.random() * 80000000) + 2000000);
        }, Math.floor(Math.random() * 1000));
      },

      /**
       * Because some browsers (namely IE) does not support some SVG styles, these hardcoded values are used
       * as fallback.
       * CSS class names (no separator, alphabetically ordered) are used to set styles
       * CSS properties must be exploded, no shortcut are available.
       */
      styles: {
        '.value': {
          'padding-top': 4,
          'padding-bottom': 4,
          'padding-left': 8
        },
        '.decoration': {
          width: 8
        }
      }
    }, d3.dispatch('change', 'editNode', 'addToNode'), options);
=======
      dragged: null
    }, d3.dispatch('change'), options);
>>>>>>> 4fea375... Add test for drag'n drop operations

    this.fetching = 0;

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
    utils.makeZoomableGrid(this);

    // Because we need D3's this in onDrag function, and access to real this also.
    let that = this;

    // Drag'n drop listener used to move nodes
    this.dragListener = d3.behavior.drag()
      .on('dragstart', function(d) {
        that.onDragStart(d3.event, d, d3.select(this));
      })
      .on('drag', d => this.onDrag(d3.event, d))
      .on('dragend', d => this.onDrop(d3.event, d));

    // Initialize data
    this.data = {};
    if (data) {
      this.setData(data);
    }
  }

  /**
   * Change the displayed data.
   * Calling this method will totally update the displayed content, removing previous display
   *
   * @param {Object} data - data to be displayed
   * @throw {Error} if the new data is invalid
   */
  setData(data) {
    // Parse displayed request. Will throw error if invalid
    this.data = utils.translateToTree(data);
    this.update();
    this.dispatchChange();
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
<<<<<<< HEAD
    nodes.call(this.renderNode)
<<<<<<< HEAD
      .attr('data-id', d => d.id)
=======
      .attr('data-id', d => d.__id)
>>>>>>> 4fea375... Add test for drag'n drop operations
=======
    nodes.call(this.renderNode.bind(this))
      .attr('data-id', d => d.id || d.__id)
>>>>>>> 4d47159... Implement and test node's result fetching
      .classed('leaf', ({name}) => name !== '$and' && name !== '$or');

    // Remove unecessary nodes
    nodes.exit().remove();

    this.layout();
  }

  /**
   * Simply layout existing nodes to align them and use available space.
   * Redraw all links
   */
  layout() {
    let nodes = this.grid.selectAll('g.node');

    // Search for biggest node, and individual column width
    let {biggest, columns} = utils.getDimensions(nodes, this.hSpacing);

    // Then we layout again taking the node size into acocunt.
    let layout = d3.layout.tree().nodeSize([biggest.height * this.vSpacing, biggest.width]);
    let tree = layout.nodes(this.data);

    // once each column was processed, for all nodes, compute y (wich is the inverted x) and positionnate with animation
    nodes.each(d => d.y = columns.reduce((sum, width, i) => sum + (i < d.depth ? width : 0), 0))
      .transition()
        .duration(this.animDuration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Creates link representation (remember, x is y and y is x)
    let links = layout.links(tree);
    let elbow = utils.makeElbow(columns, this.hSpacing);

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
   * Method used to render a given element
   * Draws the element text inside a rectangle
   *
   * @param {d3.selection} node - currently represented d3 selection
   */
  renderNode(node) {
    // We need both access to tree instance and current node
    let that = this;

    // Remove previous content
    node.text('');

    node.append('text')
      .attr('class', 'text')
      .text(this.format);

    node.insert('rect', '.text')
      .attr('class', 'decoration')
      // Do not use fat arrow to have this aiming at current SVGElement
      .each(function() {
        let {width} = getStyles(this, that.styles, 'width');
        if (width > 0) {
          d3.select(this).attr('width', width);
        }
      });


    node.insert('rect', '.decoration')
      .attr('class', 'content')
      // Do not use fat arrow to have this aiming at current SVGElement
      .each(function(d) {
        let styles = getStyles(this, that.styles, 'padding-top', 'padding-bottom', 'padding-left', 'padding-right');

        let parent = d3.select(this.parentNode);

        // Get text dimension
        let text = parent.select('.text');
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

        parent.select('.decoration')
          .attr('height', d.height)
          .attr('y', -d.height / 2);

        // Ask for value to be rendered
        that.fetchNodeValue(parent);
      });

    // Render an empty node value to make space reservation
    node.each(function() {
      that.renderNodeValue(d3.select(this));
    });
  }

  renderNodeValue(node, value = null) {
    let d = node.datum();

    node.select('.value').remove();
    node.select('.value-decoration').remove();


    let text = node.append('text')
      .attr('class', 'value')
      .text(utils.formatNumber(value || d.__value || 0, this.thousandSeparator));

    let styles = getStyles(text, this.styles, 'padding-top', 'padding-bottom', 'padding-left');

    text.attr('y', d.height / 2 + styles['padding-top'])
      .attr('x', styles['padding-left']);

    node.append('path')
      .attr('class', 'value-decoration')
      .attr('d', `M0,${d.height / 2}v${text.node().getBBox().height + styles['padding-top'] + styles['padding-bottom']}`);
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
<<<<<<< HEAD
        // Get background dimensions
        let {width, height, 'margin-right': margin} = utils.getStyles(this, 'width', 'height', 'margin-right');
=======
        // Get background dimensions. Unfortunately browser do not have the same behaviour regarding width/height
        let {width, height, 'margin-right': margin} = getStyles(this, this.styles, 'width', 'height', 'margin-right');
        // If dimensions can't be inferred from CSS, use the classical bounding box
        if (isNaN(width) || isNaN(height)) {
          let box = this.getBBox();
          width = box.width;
          height = box.height;
        }
>>>>>>> 4d47159... Implement and test node's result fetching
        let text = d3.select(this.parentNode).select('.text');
        let testStyle = getStyles(text.node(), this.styles, 'padding-top', 'padding-right', 'padding-bottom', 'padding-left');

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
   * For a given node, gets the corresponding request's result, and display them.
   * Updates the node layout
   *
   * @param {d3.selection} node - node for which results are fetched
   * @param {Function} done - completion callback, invoked when results are displayed, with parameters:
   * @param {Error} done.err - optionnal error object if results can't be retrieved.
   */
  fetchNodeValue(node) {
    // delay until animation is finished
    let data = node.datum();
    this.fetching++;
    this.fetch(data, (err, value) => {
      this.fetching--;
      if (err) {
        return console.error(`failed to fetch node value for ${data.name} (${data.id || data.__id})`, err);
      }
      // Keep value for further refresh
      data.__value = value;
      // Render value and if no more fetch is pending, re-layout the whole
      this.renderNodeValue(node, value);
      if (this.fetching === 0) {
        this.layout();
      }
    });
  }


  /**
   * Asynchronously dispatch an event on a given tree instance
   *
   * @param {String} event - triggered event name
   * @param {Any[]} args - any argument passed to event.
   */
  dispatch(event, ...args) {
    // Asynchronously dispatch change on data
    setTimeout(() => {
      this[event](...args);
    }, 0);
  }

  /**
   * Asynchronously dispatch a change event (with data as parameter) on a given tree instance
   */
  dispatchChange() {
    // TODO check effective change
    this.dispatch('change', utils.translateFromTree(this.data));
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
      handler: () => this.dispatch('editNode', d)
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
          this.dispatchChange();
        }
      });
    }
    if (d.name === '$and' || d.name === '$or') {
      // Only non-leave can have more children
      items.unshift({
        kind: 'add',
        handler: () => this.dispatch('addToNode', d)
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
      this.dragged = node.classed('dragged', true);

      // Replace dragged node only and removes link to parent
      this.grid.classed('drag-in-progress', true)
        .node().appendChild(node.node());

<<<<<<< HEAD
<<<<<<< HEAD
      // Because we need D3's this in onDrag function, and access to real this also.
      let that = this;
=======
>>>>>>> 4fea375... Add test for drag'n drop operations
=======
      this.grid.selectAll('path.link')
        .filter(l => l.target.__id === d.__id).remove();

>>>>>>> 4d47159... Implement and test node's result fetching
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
    this.dragged.attr('transform', `translate(${d.y},${d.x})`);
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
    this.dragged.classed('dragged', false);
    this.grid.classed('drag-in-progress', false);

    if (!drop.empty()) {
      // If element was dropped on possible drop zone, add it to children
      drop.classed('selected', false);

      // Removes sub tree from data
      d.parent.children.splice(d.parent.children.indexOf(d), 1);

      let parent = drop.datum();
      if (!Array.isArray(parent.children)) {
        // Case of drop node is empty
        parent.children = [];
      }
      parent.children.push(d);
      this.dispatchChange();
    }
    this.dragged = null;
    this.update();
  }
}
