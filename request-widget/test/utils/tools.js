import * as tools from '../../src/utils/tools';
const expect = chai.expect;

describe('utils', () => {

  it('should add integer', () => {
    expect(tools.add(1, 2, 3)).to.equals(6);
  });

});
