import {parse} from '../src/grammar_parser';
import chai from 'chai';

// For understandable object diff reporting
chai.config.truncateThreshold = 0;

let expect = chai.expect;

describe('Grammar parser', () => {

  // working cases
  [{
    test: 'should parse single feature',
    query: 'mkt_sgm [value = "gold"]',
    result: {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should parse feature with value and time',
    query: 'mkt_sgm [value = "gold" time = 123456]',
    result: {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}, time: {operand: 123456, operator: '='}}
  }, {
    test: 'should parse logical and',
    query: 'mktSgm[value = "gold"] && bought-solar[loc = false]',
    result: {$and: [
      {name: 'mktSgm', value: {operand: 'gold', operator: '='}},
      {name: 'bought-solar', loc: {operand: false, operator: '='}}
    ]}
  }, {
    test: 'should parse logical or',
    query: 'mkt_sgm[value = "gold"] || bought_solar[value = false]',
    result: {$or: [
      {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}},
      {name: 'bought_solar', value: {operand: false, operator: '='}}
    ]}
  }, {
    test: 'should invert condition on feature',
    query: 'mkt_sgm![value = "gold"]',
    result: {name: 'mkt_sgm', inverted: true, value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should accept spaces around inverter',
    query: 'f1   !  [value="gold"]',
    result: {name: 'f1', inverted: true, value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should accept space after opening square brackets',
    query: 'f1[  value="gold"]',
    result: {name: 'f1', value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should accept space before opening square brackets',
    query: 'f1   [value="gold"]',
    result: {name: 'f1', value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should accept space before closing square brackets',
    query: 'f1[value=123   ]',
    result: {name: 'f1', value: {operand: 123, operator: '='}}
  }, {
    test: 'should accept space after logical and',
    query: 'f1[value="gold"]&&   f2[time>123]',
    result: {$and: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space before logical and',
    query: 'f1[value="gold"]   &&f2[time>123]',
    result: {$and: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space after logical or',
    query: 'f1[value="gold"]||   f2[time>123]',
    result: {$or: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space before logical or',
    query: 'f1[value="gold"]   ||f2[time>123]',
    result: {$or: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space before parenthesis',
    query: 'f1[value="gold"]||   (f2[time>123])',
    result: {$or: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space after parenthesis',
    query: 'f1[value="gold"]||(f2[time>123]    )',
    result: {$or: [
      {name: 'f1', value: {operand: 'gold', operator: '='}},
      {name: 'f2', time: {operand: 123, operator: '>'}}
    ]}
  }, {
    test: 'should accept space around operators',
    query: 'f1[value  >=   123]',
    result: {name: 'f1', value: {operand: 123, operator: '>='}}
  }, {
    test: 'should accept multiple spaces between subcriterias',
    query: 'f1[value=123    time=321    loc=14]',
    result: {name: 'f1', value: {operand: 123, operator: '='}, time: {operand: 321, operator: '='}, loc: {operand: 14, operator: '='}}
  }, {
    test: 'should accept = operator',
    query: 'f1[value=false]',
    result: {name: 'f1', value: {operand: false, operator: '='}}
  }, {
    test: 'should accept > operator',
    query: 'f1[value>10]',
    result: {name: 'f1', value: {operand: 10, operator: '>'}}
  }, {
    test: 'should accept < operator',
    query: 'f1[value<"4"]',
    result: {name: 'f1', value: {operand: '4', operator: '<'}}
  }, {
    test: 'should accept >= operator',
    query: 'f1[value>=10.4]',
    result: {name: 'f1', value: {operand: 10.4, operator: '>='}}
  }, {
    test: 'should accept <= operator',
    query: 'f1[value<=false]',
    result: {name: 'f1', value: {operand: false, operator: '<='}}
  }, {
    test: 'should accept float values',
    query: 'f1[value<=10.423]',
    result: {name: 'f1', value: {operand: 10.423, operator: '<='}}
  }, {
    test: 'should accept negative integer values',
    query: 'f1[value=-4]',
    result: {name: 'f1', value: {operand: -4, operator: '='}}
  }, {
    test: 'should accept negative float values',
    query: 'f1[value=-0.45]',
    result: {name: 'f1', value: {operand: -.45, operator: '='}}
  }, {
    test: 'should accept true boolean values',
    query: 'f1[value=true]',
    result: {name: 'f1', value: {operand: true, operator: '='}}
  }, {
    test: 'should accept false boolean values',
    query: 'f1[value=false]',
    result: {name: 'f1', value: {operand: false, operator: '='}}
  }, {
    test: 'should accept string values within simple quotes containing double quotes',
    query: 'f1[value=\'\"hey\']',
    result: {name: 'f1', value: {operand: '"hey', operator: '='}}
  }, {
    test: 'should accept string values within double quotes containing simple quotes',
    query: 'f1[value="hoy\'"]',
    result: {name: 'f1', value: {operand: 'hoy\'', operator: '='}}
  }, {
    test: 'should accept accentuated, non-alphanumerical and blanck characters in values',
    query: 'f1[value="é *"]',
    result: {name: 'f1', value: {operand: 'é *', operator: '='}}
  }, {
    test: 'should accept multiples logical and',
    query: 'f1[value=1]&&f2[value=2]&&f3[value=3]&&f4[value=4]',
    result: {$and: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {name: 'f2', value: {operand: 2, operator: '='}},
      {name: 'f3', value: {operand: 3, operator: '='}},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should accept multiples logical or',
    query: 'f1[value=1]||f2[value=2]||f3[value=3]||f4[value=4]',
    result: {$or: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {name: 'f2', value: {operand: 2, operator: '='}},
      {name: 'f3', value: {operand: 3, operator: '='}},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should logical and have precedence above or',
    query: 'f1[value=1]||f2[value=2]&&f3[value=3]||f4[value=4]',
    result: {$or: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {$and: [
        {name: 'f2', value: {operand: 2, operator: '='}},
        {name: 'f3', value: {operand: 3, operator: '='}}
      ]},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should use parenthese to force logical operator precedence',
    query: '(f1[value=1]||f2[value=2])&&(f3[value=3]||f4[value=4])',
    result: {$and: [
      {$or: [
        {name: 'f1', value: {operand: 1, operator: '='}},
        {name: 'f2', value: {operand: 2, operator: '='}}
      ]},
      {$or: [
        {name: 'f3', value: {operand: 3, operator: '='}},
        {name: 'f4', value: {operand: 4, operator: '='}}
      ]}
    ]}
  }, {
    test: 'should keep last duplicated value',
    query: 'f1[value=10 value=11 value=12]',
    result: {name: 'f1', value: {operand: 12, operator: '='}}
  }, {
    test: 'should accept locations',
    query: 'f1[value=10,42.4,-3.5]',
    result: {name: 'f1', value: {operand: {lat: 42.4, lng: 10, rad: -3.5}, operator: '='}}
  }].forEach(({test: testName, query, result}) => {

    it(testName || `should parse "${query}"`, () => {
      let actual = null;
      expect(() => actual = parse(query)).not.to.throw();
      expect(actual).to.deep.equals(result);
    });
  });

  // failing cases
  [{
    test: 'should reject empty query',
    query: '',
    error: 'end of input found'
  }, {
    test: 'should reject mismatched delimiter strings (double)',
    query: 'f1[value="gold\']',
    error: 'Expected "\\""'
  }, {
    test: 'should reject mismatched delimiter strings (single)',
    query: 'f1[value=\'gold"]',
    error: 'Expected "\'"'
  }, {
    test: 'should reject empty single quote string value',
    query: 'f1[value=\'\']',
    error: 'Expected [^\']'
  }, {
    test: 'should reject empty double quote string value',
    query: 'f1[value=""]',
    error: 'Expected [^"]'
  }, {
    test: 'should reject unfinished location',
    query: 'f1[value=10,10]',
    error: 'but "]" found.'
  }, {
    test: 'should reject location with invalid latitude',
    query: 'f1[value=10,"true",15]',
    error: 'but "\\"" found.'
  }, {
    test: 'should reject location with invalid radius',
    query: 'f1[value=10,-5.4,false]',
    error: 'but "f" found.'
  }, {
    test: 'should reject location without radius',
    query: 'f1[value=10,10,]',
    error: 'but "]" found.'
  }, {
    test: 'should reject location without latitude',
    query: 'f1[value=10,]',
    error: 'but "]" found.'
  }, {
    test: 'should reject numbers with trailing dot',
    query: 'f1[value=10.]',
    error: 'Expected [0-9]'
  }, {
    test: 'should reject floats without natural part',
    query: 'f1[value=.5]',
    error: 'but "." found'
  }, {
    test: 'should reject accentuated character in feature names',
    query: 'éf1[value=.5]',
    error: 'but "\\xE9" found'
  }, {
    test: 'should reject blanck character in feature names',
    query: 'f 1[value=.5]',
    error: 'but "1" found'
  }, {
    test: 'should reject non-alphanumerical character in feature names',
    query: 'f+1[value=.5]',
    error: 'but "+" found'
  }, {
    test: 'should reject unknown subcriteria',
    query: 'f1[unknown=true]',
    error: '"loc", "time" or "value" but "u" found'
  }, {
    test: 'should reject unknown operator',
    query: 'f1[value*true]',
    error: '"=", ">" or ">=" but "*" found'
  }, {
    test: 'should reject unclosed opening parenthesis',
    query: '(f1[value=true]',
    error: 'Expected " ", "&&", ")"'
  }, {
    test: 'should reject unclosed closing parenthese',
    query: 'f1[value=true])',
    error: 'end of input but ")" found'
  }, {
    test: 'should reject unfinished logical and',
    query: 'f1[value=true]&&',
    error: 'but end of input found'
  }, {
    test: 'should reject unfinished logical or',
    query: 'f1[value=true]||',
    error: 'but end of input found'
  }, {
    test: 'should reject blank query',
    query: 'f1[value=true]&&f2)',
    error: Error
  }].forEach(({test: testName, query, error}) => {

    it(testName || `should reject "${query}"`, () => {
      expect(() => parse(query)).to.throw(error);
    });
  });

  // PEG specific options
  it('should start parsing from a specific rule', () => {
    let result = parse('f1[value=1]', {startRule: 'request'});
    expect(result).to.deep.equals({
      name: 'f1',
      value: {operand: 1, operator: '='}
    });
  });

  it('should failed on unknown start rule', () => {
    expect(() =>
      parse('f1[value=1]', {startRule: 'unknown'})
    ).to.throw('Can\'t start parsing from rule "unknown"');
  });

});
