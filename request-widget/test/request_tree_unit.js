import RequestTree from '../src/request_tree';
const expect = chai.expect;
chai.config.truncateThreshold = 0;
import {parse} from '../../common/src/grammar_parser';

describe('Request Tree unit tests', () => {

  /**
   * Used to get all nodes in a tree at a given depth
   *
   * @param {Object} node - node processed (must contains depth, and may contains children attribute)
   * @param {Number} depth - expected depth
   * @return {Object[]} node of the given depth
   */
  let extractNodes = (node, depth) => {
    let selected = node.depth === depth ? [node] : [];
    if (node.children) {
      node.children.forEach(c => {
        selected = selected.concat(extractNodes(c, depth));
      });
    }
    return selected;
  };

  /**
   * Function to be called inside an Array.reduce to get hightest number
   */
  let getMax = (max, n) => max > n ? max : n;

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
});
