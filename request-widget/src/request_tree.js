import d3 from 'd3';
import {parse} from '../../common/src/grammar_parser';
import {translateRequestToTree} from './utils/tools';
import * as utils from './utils/svg';

export default class RequestTree {

  constructor(anchor, request = null) {
    this.ratio = 16 / 9;
    // Use fixed width for position computation
    this.width = 500;
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
   * Change the displayed request.
   * Calling this method will totally update the displayed content, removing previous display
   *
   * @param {String} request - request to be displayed
   * @throw {Error} if the new request is invalid
   */
  setRequest(request) {
    // Parse displayed request. Will throw error if invalid
    this.data = translateRequestToTree(parse(request));

    let duration = 1000;
    let initialScale = 0.3;
    let scaleExtent = [0.04, 0.8];
    let spacing = {
      h: 1.4,
      v: 1.1
    };

    // Creates a grid that will be pannable and zoomable
    let grid = null;
    let zoom = d3.behavior.zoom()
      .translate([this.width * .25, 0])
      .scale(initialScale)
      .scaleExtent(scaleExtent)
      .on('zoom', () => {
        // Eventually, animate the move
        grid.transition().attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`);
      });
    grid = this.svg.call(zoom)
      .append('g')
        .attr('transform', `translate(${zoom.translate()}) scale(${zoom.scale()})`);

    // We need a first layout to organize data, and display it.
    // This layout will allow to compute node's dimensions
    let biggest = {width: 0, height: 0};
    let depthWidth = [];
    let tree = d3.layout.tree();
    let nodes = tree.nodes(this.data).reverse();

    // Associate data to SVG nodes, and assign unic ids
    let nextId = 0;
    let join = grid.selectAll('g.node')
      .data(nodes, d => d.id || (d.id = ++nextId));

    // Creates node representation
    let node = join.enter()
      .append('g')
      .attr('class', 'node');

    node.append('text')
      .attr('class', 'text')
      .text(d => d.name + (d.value ? ` ${d.value.operator} ${d.value.operand}` : ''));

    node.insert('rect', '.text')
      .attr('class', 'decoration')
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

        // Compute biggest dimensions and widest node in depth
        biggest.width = (biggest.width > d.width ? biggest : d).width;
        biggest.height = (biggest.height > d.height ? biggest : d).height;
        if (!depthWidth[d.depth]) {
          depthWidth[d.depth] = 0;
        }
        if (depthWidth[d.depth] < d.width) {
          depthWidth[d.depth] = d.width;
        }

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

    // Then we layout again taking the node size into acocunt.
    tree = d3.layout.tree().nodeSize([biggest.height * spacing.v, biggest.width]);
    tree.nodes(this.data);

    // Collapse the tree to only fit the needed horizontal space per depth level
    depthWidth = depthWidth.map(w => w * spacing.h);
    let collapse = child => {
      child.y = depthWidth.reduce((sum, width, i) => sum + (i < child.depth ? width : 0));
      if (child.children) {
        child.children.forEach(collapse);
      }
    };
    if (this.data.children) {
      this.data.children.forEach(collapse);
    }

    node.transition()
      .duration(duration)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Creates link representation (remember, x is y and y is x)
    let links = tree.links(nodes);

    let elbow = ({source, target}) => {
      let start = source.y + (source.width || 0);
      // Elbow will takes place in horizontal spacing between levels
      let space = depthWidth[source.depth];
      let corner = target.y - (space - space / spacing.h) / 2;
      return `M${start},${source.x}H${corner}V${target.x}H${target.y}`;
    };

    let link = grid.selectAll('path.link')
      .data(links, (d) => d.target.id);
    link.enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', ({source: {x0: x = 0, y0: y = 0}}) => elbow({source: {x, y, depth: 0}, target: {x, y, depth: 0}}));
    link.transition()
      .duration(duration)
      .attr('d', elbow);
  }
}
