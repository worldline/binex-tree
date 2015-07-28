import RequestTree from '../src/request_tree';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

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

  it('should not build without anchor', () => {
    /* eslint no-new: 0 */
    expect(() => new RequestTree()).to.throw('no node found for');
  });

  it('should not build with an invalid request', () => {
    /* eslint no-new: 0 */
    expect(() => new RequestTree('#main', 'invalid')).to.throw('SyntaxError');
  });

  it('should build empty tree', () => {
    let tree = new RequestTree('#main');
    expect(tree).to.have.property('data').that.is.empty;
    expect(tree).to.have.property('svg').that.exists;
  });

  it('should build tree from a given request', () => {
    let tree = new RequestTree('#main', 'mkt_sgm [value = "gold"]');
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

  it('should represent multiple hierarchichal levels', () => {
    let tree = new RequestTree('#main', 'gender [value = "male"] && (age [value < 7] || age [value > 77])');
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
    let tree = new RequestTree('#main', 'f1 [value = "something long"] && (age [value < 7] || age [value > 77])');
    expect(tree).to.have.property('data');

    // get largest node width in second column
    let largest = extractNodes(tree.data, 1).map(n => n.width).reduce((max, n) => max > n ? max : n);
    // get all position (remember, x and y are inverted) in second and third column
    let posColumn2 = extractNodes(tree.data, 1).map(n => n.y);
    let posColumn3 = extractNodes(tree.data, 2).map(n => n.y);

    // all nodes are aligned in a column
    expect(posColumn2.every((n, i, a) => n === a[0]), 'second column is not aligned').to.be.true;
    expect(posColumn3.every((n, i, a) => n === a[0]), 'third column is not aligned').to.be.true;

    // nodes of the third column are after the largest node in second column
    let pos = posColumn2[0];
    expect(posColumn3.every(n => n > pos + largest), 'third column is too close to second').to.be.true;
  });
});
