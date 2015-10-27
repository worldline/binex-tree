import d3 from 'd3';
import {translateToTree, assign, translateFromTree, formatNumber} from '../../src/utils/tools';
import {parse} from './test-utilities';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

describe('formatNumber', () => {

  it('should not fail when given a string', () => {
    let str = 'coucou';
    expect(formatNumber(str)).to.equals(str);
  });

  it('should not fail when given null', () => {
    expect(formatNumber(null)).to.be.null;
  });

  it('should not fail when given undefined', () => {
    expect(formatNumber()).to.be.undefined;
  });

  it('should change nothing it number is bellow 1000', () => {
    expect(formatNumber(999)).to.equals('999');
  });

  it('should add separator on every thousand', () => {
    expect(formatNumber(1234567890)).to.equals('1 234 567 890');
  });

  it('should set a specific thousand parameter', () => {
    expect(formatNumber(987654321, ',')).to.equals('987,654,321');
  });

  it('should handle negative values', () => {
    expect(formatNumber(-10001)).to.equals('-10 001');
  });

  it('should truncate decimals', () => {
    expect(formatNumber(1234.56)).to.equals('1 234');
  });
});

describe('translateToTree', () => {

  it('should not modifiy a single node request', () => {
    expect(translateToTree(parse('f1[value > "gold" time = 10]'))).to.deep.equals({
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
    expect(translateToTree(parse('f1[value < 10] || f2[value > 20]'))).to.deep.equals({
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
    expect(translateToTree(parse('f1[value < 10] || f2[value > 20] && f3[value = 10]'))).to.deep.equals({
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
          value: {
           operator: '>',
           operand: 20
          }
        }, {
          name: 'f3',
          value: {
           operator: '=',
           operand: 10
          }
        }]
      }]
    });
  });
});

describe('translateFromTree', () => {

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
    expect(translateFromTree(data)).to.deep.equals({
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
    expect(translateFromTree(data)).to.deep.equals({
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
    expect(o2).to.have.all.keys(['k4', 'k5']);
    expect(o1).to.deep.equals({k1: true, k2: 2, k3: 'ok', k4: [1, 2], k5: 'ko'});
  });

  it('should copy attributes from multiple objects into another', () => {
    let o1 = {k1: true, k2: 2, k3: 'ok'};
    let o2 = {k4: [1, 2], k5: 'ko'};
    let o3 = {k6: {status: 'ok'}};
    let o4 = {k7: -5};
    let result = assign(o1, o2, o3, o3, o4);
    expect(result).to.equal(o1);
    expect(o2).to.have.all.keys(['k4', 'k5']);
    expect(o3).to.have.all.keys('k6');
    expect(o4).to.have.all.keys('k7');
    expect(o1).to.deep.equals({k1: true, k2: 2, k3: 'ok', k4: [1, 2], k5: 'ko', k6: {status: 'ok'}, k7: -5});
  });

  it('should attributes in rightmost objects takes precedence over left-most objects', () => {
    let o1 = {};
    let o2 = {k1: true, k2: 10, k3: 'ok'};
    let o3 = {k2: -5, k3: '-'};
    let o4 = {k3: 'ko'};
    let result = assign(o1, o2, o3, o4);
    expect(result).to.equals(o1);
    expect(o2).to.deep.equals({k1: true, k2: 10, k3: 'ok'});
    expect(o3).to.deep.equals({k2: -5, k3: '-'});
    expect(o4).to.deep.equals({k3: 'ko'});
    expect(o1).to.deep.equals({k1: true, k2: -5, k3: 'ko'});
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

  it('should deep attributes be copied', () => {
    let o1 = {deep: {status: 'ok'}};
    let o2 = {deep: {finished: true}};
    let o3 = {other: 10};
    let result = assign(o1, o2, o3);
    expect(result).to.equals(o1);
    expect(o2).to.deep.equals({deep: {finished: true}});
    expect(o3).to.deep.equals({other: 10});
    expect(o1).to.deep.equals({
      deep: {
        status: 'ok',
        finished: true
      },
      other: 10
    });
  });

  it('should create deep attributes', () => {
    let o1 = {something: 'coucou'};
    let o2 = {deep: {finished: true}};
    let o3 = {other: 10};
    let result = assign(o1, o2, o3);
    expect(result).to.equals(o1);
    expect(o2).to.deep.equals({deep: {finished: true}});
    expect(o3).to.deep.equals({other: 10});
    expect(o1).to.deep.equals({
      something: 'coucou',
      deep: {
        finished: true
      },
      other: 10
    });
  });

  it('should deep attributes in rightmost objects takes precedence over left-most objects', () => {
    let o1 = {something: 'coucou'};
    let o2 = {deep: {one: 1, finished: true}};
    let o3 = {deep: {two: 2, finished: false}};
    let result = assign(o1, o2, o3);
    expect(result).to.equals(o1);
    expect(o2).to.deep.equals({deep: {one: 1, finished: true}});
    expect(o3).to.deep.equals({deep: {two: 2, finished: false}});
    expect(o1).to.deep.equals({
      something: 'coucou',
      deep: {
        one: 1,
        two: 2,
        finished: false
      }
    });
  });
});
