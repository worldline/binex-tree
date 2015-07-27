import {translateRequestToTree} from '../../src/utils/tools';
import {parse} from '../../../common/src/grammar_parser';
const expect = chai.expect;

describe('translateRequestToTree', () => {

  it('should not modifiy a single node request', () => {
    expect(translateRequestToTree(parse('f1[value > "gold"]'))).to.deep.equals({
      name: 'f1',
      value: {
        operator: '>',
        operand: 'gold'
      }
    });
  });

  it('should not explode $or', () => {
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

});
