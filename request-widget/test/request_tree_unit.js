import d3 from 'd3';
import RequestTree from '../src/request_tree';
import {extractNodes} from './utils/test_utilities';
import {parse} from 'targeting-engine-common';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

<<<<<<< HEAD
describe('Request Tree unit tests', () => {

  /**
   * Used to get all nodes in a tree at a given depth
   *
   * @param {Object} node - node processed (must contains depth, and may contains children attribute)
   * @param {Number} depth - expected depth
   * @return {Object[]} node of the given depth
   */
  function extractNodes(node, depth) {
    let selected = node.depth === depth ? [node] : [];
    if (node.children) {
      node.children.forEach(c => {
        selected = selected.concat(extractNodes(c, depth));
      });
    }
    return selected;
  }

  /**
   * Enrich incoming node with an id.
   * If node is a feature, use the feature name, otherwise, use generated id
   * Logical alternatives are recursively enriched.
   *
   * @param {Object} data - enriched data structure
   * @param {Number = 1} nextId - next id used for non-feature nodes.
   * @return {Object} modified data
   */
  function addIds(data, nextId = 1) {
    let id = data.name ? data.name : `${nextId++}`;
    data.id = id;
    if (data.$and) {
      data.$and.forEach(d => addIds(d, nextId));
    } else if (data.$or) {
      data.$or.forEach(d => addIds(d, nextId));
    }
    return data;
  }
=======
describe('Request Tree', () => {
>>>>>>> 4fea375... Add test for drag'n drop operations

  /**
   * Function to be called inside an Array.reduce to get hightest number
   */
  let getMax = (max, n) => max > n ? max : n;

  beforeEach(() => {
    // clean main after each test.
    d3.select('#main').html('');
  });

  it('should not build without anchor', () => {
    /* eslint no-new: 0 */
    expect(() => new RequestTree()).to.throw('no node found for');
  });

  it('should build empty tree', () => {
    let tree = new RequestTree('#main');
    expect(tree).to.have.property('data').that.is.empty;
    expect(tree).to.have.property('svg').that.exists;
  });

  it('should build tree from a given request', (done) => {
    let request = parse('mkt_sgm [value = "gold"]');
    let sync = true;
    let tree = new RequestTree('#main', JSON.parse(JSON.stringify(request))).on('change', data => {
      expect(sync, 'change event was triggered synchronously !').to.be.false;
      expect(data).to.deep.equals(request);
      done();
    });
    sync = false;
    expect(tree).to.have.property('data');
    expect(tree.data).to.have.property('name').that.equals('mkt_sgm');
    expect(tree.data).to.have.property('value').that.deep.equals({
      operand: 'gold',
      operator: '='
    });
    expect(tree.data).to.have.property('depth').that.equals(0);
    expect(tree.data).to.include.keys('x', 'y', 'width', 'height');
    expect(tree).to.have.property('svg').that.exists;
  });

  it('should customize default options in constructor', () => {
    let tree = new RequestTree('#main', {$and: []}, {initialScale: 1, vSpacing: 1.5, other: 'unknown'});
    expect(tree).to.have.property('initialScale').that.equals(1);
    expect(tree).to.have.property('vSpacing').that.equals(1.5);
    expect(tree).to.have.property('other').that.equals('unknown');
    expect(tree).to.have.property('hSpacing').that.equals(1.4);
    expect(tree).to.have.property('ratio').that.equals(16 / 9);
    expect(tree).to.have.property('width').that.equals(500);
    expect(tree).to.have.property('scaleExtent').that.deep.equals([0.04, 0.5]);
    expect(tree).to.have.property('animDuration').that.equals(1000);
  });

  it('should represent multiple hierarchichal levels', () => {
    let tree = new RequestTree('#main', parse('gender [value = "male"] && (age [value < 7] || age [value > 77])'));
    expect(tree).to.have.property('data');

    // root is logical and
    expect(tree.data).to.have.property('name').that.equals('$and');
    expect(tree.data).to.have.property('depth').that.equals(0);
    expect(tree.data).to.have.property('children').that.has.lengthOf(2);
    // gender [value = "male"]
    expect(tree.data.children[0]).to.have.property('name').that.equals('gender');
    expect(tree.data.children[0]).to.have.property('value').that.deep.equals({
      operand: 'male',
      operator: '='
    });
    expect(tree.data.children[0]).to.have.property('depth').that.equals(1);
    // logical or
    expect(tree.data.children[1]).to.have.property('name').that.equals('$or');
    expect(tree.data.children[1]).to.have.property('depth').that.equals(1);
    expect(tree.data.children[1]).to.have.property('children').that.has.lengthOf(2);
    // age [value < 7]
    expect(tree.data.children[1].children[0]).to.have.property('name').that.equals('age');
    expect(tree.data.children[1].children[0]).to.have.property('value').that.deep.equals({
      operand: 7,
      operator: '<'
    });
    expect(tree.data.children[1].children[0]).to.have.property('depth').that.equals(2);
    // age [value > 77]
    expect(tree.data.children[1].children[1]).to.have.property('name').that.equals('age');
    expect(tree.data.children[1].children[1]).to.have.property('value').that.deep.equals({
      operand: 77,
      operator: '>'
    });
    expect(tree.data.children[1].children[1]).to.have.property('depth').that.equals(2);
  });

  it('should use largest node inside a column', () => {
    let tree = new RequestTree('#main', parse('f1 [value = "something long"] && (age [value < 7] || age [value > 77])'));
    expect(tree).to.have.property('data');
    let column2 = extractNodes(tree.data, 1);

    // get largest node width in second column
    let largest = column2.map(n => n.width).reduce(getMax);
    // get all position (remember, x and y are inverted) in second and third column
    let posColumn2 = column2.map(n => n.y);
    let posColumn3 = extractNodes(tree.data, 2).map(n => n.y);

    // all nodes are aligned in a column
    expect(posColumn2.every((n, i, a) => n === a[0]), 'second column is not aligned').to.be.true;
    expect(posColumn3.every((n, i, a) => n === a[0]), 'third column is not aligned').to.be.true;

    // nodes of the third column are after the largest node in second column
    let pos = posColumn2[0];
    expect(posColumn3.every(n => n > pos + largest), 'third column is too close to second').to.be.true;
  });

  it('should collapse column to fit largest node', () => {
    let tree = new RequestTree('#main', parse('f1 [value = "something long"] && (age [value < 7] || age [value > 77])'));
    expect(tree).to.have.property('data');

    let column1 = extractNodes(tree.data, 0);
    let column2 = extractNodes(tree.data, 1);
    let column3 = extractNodes(tree.data, 2);
    let largestColum1 = column1.map(n => n.width).reduce(getMax);
    let largestColum2 = column2.map(n => n.width).reduce(getMax);
    let largestColum3 = column3.map(n => n.width).reduce(getMax);

    expect(largestColum1).to.be.below(largestColum2).and.below(largestColum3);
    expect(largestColum2).to.be.above(largestColum3);

    expect(column2[0].y).to.closeTo(column1[0].y + largestColum1 * 1.4, 1);
    expect(column3[0].y).to.closeTo(column2[0].y + largestColum2 * 1.4, 1);
  });

  it('should menu not include removal for root', () => {
    /* eslint no-new: 0 */
    new RequestTree('#main', addIds(parse('f1 [value = "something long"]')));

    d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
    let menu = d3.select('.menu');
    expect(menu.empty(), 'no menu found').to.be.false;
    expect(menu.selectAll('.action').size()).to.equals(1);
    expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
    expect(menu.select('.remove').empty(), 'remove action found').to.be.true;
  });

  it('should menu not include removal on logical operator root', () => {
    /* eslint no-new: 0 */
    new RequestTree('#main', addIds(parse('f1[value=1] || f2[value=2]')));

    d3.select('.node[data-id="1"]').node().dispatchEvent(new MouseEvent('click'));
    let menu = d3.select('.menu');
    expect(menu.empty(), 'no menu found').to.be.false;
    expect(menu.selectAll('.action').size()).to.equals(2);
    expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
    expect(menu.select('.add').empty(), 'no add action found').to.be.false;
    expect(menu.select('.remove').empty(), 'remove action found').to.be.true;
  });

  it('should menu not include addition on leaves', () => {
    /* eslint no-new: 0 */
    new RequestTree('#main', addIds(parse('f1[value=1] || f2[value=2]')));

    d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
    let menu = d3.select('.menu');
    expect(menu.empty(), 'no menu found').to.be.false;
    expect(menu.selectAll('.action').size()).to.equals(2);
    expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
    expect(menu.select('.add').empty(), 'add action found').to.be.true;
    expect(menu.select('.remove').empty(), 'no remove action found').to.be.false;
  });

  it('should menu include all actions on non-root nodes', () => {
    /* eslint no-new: 0 */
    new RequestTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')));

    d3.select('.node[data-id="2"]').node().dispatchEvent(new MouseEvent('click'));
    let menu = d3.select('.menu');
    expect(menu.empty(), 'no menu found').to.be.false;
    expect(menu.selectAll('.action').size()).to.equals(3);
    expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
    expect(menu.select('.add').empty(), 'no add action found').to.be.false;
    expect(menu.select('.remove').empty(), 'no remove action found').to.be.false;
  });

  it('should menu be cleared when clicking elsewhere', () => {
    let tree = new RequestTree('#main', addIds(parse('f1[value=1]')));

    d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
    expect(d3.select('.menu').empty(), 'no menu found').to.be.false;
    tree.svg.node().dispatchEvent(new MouseEvent('click'));
    expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
  });
});
