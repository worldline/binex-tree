import RequestTree from '../src/request_tree';
const expect = chai.expect;

describe('Request Tree unit tests', () => {

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
    expect(tree).to.have.property('data').that.deep.equals({
      name: 'mkt_sgm',
      value: {
        operand: 'gold',
        operator: '='
      }
    });
    expect(tree).to.have.property('svg').that.exists;
  });
});
