import d3 from 'd3';
import {translateRequestToTree, assign, translateTreeToRequest} from '../../src/utils/tools';
import {parse} from 'targeting-engine-common';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

describe('translateRequestToTree', () => {

  it('should not modifiy a single node request', () => {
    expect(translateRequestToTree(parse('f1[value > "gold" time = 10]'))).to.deep.equals({
      name: 'f1',
      value: {
        operator: '>',
        operand: 'gold'
      },
      time: {
        operator: '=',
        operand: 10
      }
    });
  });

  it('should handle logical or', () => {
    expect(translateRequestToTree(parse('f1[value < 10] || f2[value > 20]'))).to.deep.equals({
      name: '$or',
      children: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }, {
        name: 'f2',
        value: {
          operator: '>',
          operand: 20
        }
      }]
    });
  });

  it('should handle logical and', () => {
    expect(translateRequestToTree(parse('f1[value < 10] || f2[loc > 20,10,4] && f3[time = 10]'))).to.deep.equals({
      name: '$or',
      children: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }, {
        name: '$and',
        children: [{
          name: 'f2',
          loc: {
           operator: '>',
           operand: {lng: 20, lat: 10, rad: 4}
          }
        }, {
          name: 'f3',
          time: {
           operator: '=',
           operand: 10
          }
        }]
      }]
    });
  });
});

describe('translateTreeToRequest', () => {

  it('should purge all d3 layout additionnal properties', () => {
    let data = {
      name: '$or',
      children: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }, {
        name: '$and',
        children: [{
          name: 'f2',
          loc: {
           operator: '>',
           operand: {lng: 20, lat: 10, rad: 4}
          }
        }, {
          name: 'f3',
          time: {
           operator: '=',
           operand: 10
          }
        }]
      }]
    };
    d3.layout.tree().nodes(data);
    expect(data).to.include.keys(['depth', 'x', 'y', 'children']);
    expect(translateTreeToRequest(data)).to.deep.equals({
      $or: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }, {
        $and: [{
          name: 'f2',
          loc: {
           operator: '>',
           operand: {lng: 20, lat: 10, rad: 4}
          }
        }, {
          name: 'f3',
          time: {
           operator: '=',
           operand: 10
          }
        }]
      }]
    });
  });

  it('should ignore empty nodes', () => {
    let data = {
      name: '$or',
      children: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }, {
        name: '$and',
        children: []
      }]
    };
    d3.layout.tree().nodes(data);
    expect(translateTreeToRequest(data)).to.deep.equals({
      $or: [{
        name: 'f1',
        value: {
          operator: '<',
          operand: 10
        }
      }]
    });
  });
});

describe('assign', () => {

  it('should copy attributes from one object into another', () => {
    let o1 = {k1: true, k2: 2, k3: 'ok'};
    let o2 = {k4: [1, 2], k5: 'ko'};
    let result = assign(o1, o2);
    expect(result).to.equal(o1);
    expect(o2).to.have.keys(['k4', 'k5']);
    expect(o1).to.deep.keys({k1: true, k2: 2, k3: 'ok', k4: [1, 2], k5: 'ko'});
  });

  it('should copy attributes from multiple objects into another', () => {
    let o1 = {k1: true, k2: 2, k3: 'ok'};
    let o2 = {k4: [1, 2], k5: 'ko'};
    let o3 = {k6: {status: 'ok'}};
    let o4 = {k7: -5};
    let result = assign(o1, o2, o3, o3, o4);
    expect(result).to.equal(o1);
    expect(o2).to.have.keys(['k4', 'k5']);
    expect(o3).to.have.keys(['k6']);
    expect(o4).to.have.keys(['k7']);
    expect(o1).to.deep.keys({k1: true, k2: 2, k3: 'ok', k4: [1, 2], k5: 'ko', k6: {status: 'ok'}, k7: -5});
  });

  it('should attributes in rightmost objects takes precedence over left-most objects', () => {
    let o1 = {};
    let o2 = {k1: true, k2: 10, k3: 'ok'};
    let o3 = {k2: -5, k3: '-'};
    let o4 = {k3: 'ko'};
    let result = assign(o1, o2, o3, o4);
    expect(result).to.equal(o1);
    expect(o2).to.deep.equal({k1: true, k2: 10, k3: 'ok'});
    expect(o3).to.deep.equal({k2: -5, k3: '-'});
    expect(o4).to.deep.equal({k3: 'ko'});
    expect(o1).to.deep.keys({k1: true, k2: -5, k3: 'ko'});
  });

  it('should not enumerable properties not be copied', () => {
    let o1 = {};
    let o2 = {k1: true};
    Object.defineProperty(o2, 'k2', {
      enumerable: false,
      value: 10
    });
    let result = assign(o1, o2);
    expect(result).to.equal(o1);
    expect(o2.k2).to.equal(10);
    expect(o1).to.deep.keys({k1: true});
  });
});
