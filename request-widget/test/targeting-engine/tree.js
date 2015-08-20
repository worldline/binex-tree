import d3 from 'd3';
import TargetingEngineTree from '../../src/targeting-engine/tree';
import {extractNodes, addIds} from '../utils/test_utilities';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

describe('Targeting engine Tree', () => {

  beforeEach(() => {
    // clean main after each test.
    d3.select('#main').html('');
  });

  it('should not build without anchor', () => {
    /* eslint no-new: 0 */
    expect(() => new TargetingEngineTree()).to.throw('no node found for');
  });

  it('should build empty tree', () => {
    let tree = new TargetingEngineTree('#main');
    expect(tree).to.have.property('data').that.is.empty;
    expect(tree).to.have.property('svg').that.exists;
  });

  it('should apply default options', () => {
    let tree = new TargetingEngineTree('#main');
    expect(tree).to.have.deep.property('targetingEngine.host').that.equals('localhost');
    expect(tree).to.have.deep.property('targetingEngine.port').that.equals(8000);
    expect(tree).to.have.deep.property('targetingEngine.base').that.equals('test');
  });

  it('should not overload partial targeting-engine options', () => {
    let tree = new TargetingEngineTree('#main', null, {targetingEngine: {host: '127.0.0.1'}});
    expect(tree).to.have.deep.property('targetingEngine.host').that.equals('127.0.0.1');
    expect(tree).to.have.deep.property('targetingEngine.port').that.equals(8000);
    expect(tree).to.have.deep.property('targetingEngine.base').that.equals('test');
  });

  it('should build tree from a string request', () => {
    let tree = new TargetingEngineTree('#main', 'f1[value=1]')
    expect(tree).to.have.property('data');
    expect(tree.data).to.have.property('name').that.equals('f1');
    expect(tree.data).to.have.property('value').that.deep.equals({
      operand: 1,
      operator: '='
    });
    expect(tree.data).to.have.property('depth').that.equals(0);
    expect(tree.data).to.include.keys('x', 'y', 'width', 'height');
    expect(tree).to.have.property('svg').that.exists;
  });

  it('should asynchronously issue change event with string request', done => {
    let request = 'mkt_sgm [value = "gold"]';
    let sync = true;
    let tree = new TargetingEngineTree('#main', JSON.parse(JSON.stringify(request))).on('change', data => {
      expect(sync, 'change event was triggered synchronously !').to.be.false;
      expect(data).to.deep.equals(request);
      done();
    });
    sync = false;
  });
});
