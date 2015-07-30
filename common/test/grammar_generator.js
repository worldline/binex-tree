import {generate} from '../src/grammar_generator';
import chai from 'chai';

// For understandable object diff reporting
chai.config.truncateThreshold = 0;

let expect = chai.expect;

describe('Grammar generator', () => {
 // working cases
  [{
    test: 'should parse single feature',
    query: 'mkt_sgm [value = "gold"]',
    data: {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should parse feature with value and time',
    query: 'mkt_sgm [value = "gold" time = 123456]',
    data: {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}, time: {operand: 123456, operator: '='}}
  }, {
    test: 'should parse logical and',
    query: 'mktSgm [value = "gold"] && bought-solar [loc = false]',
    data: {$and: [
      {name: 'mktSgm', value: {operand: 'gold', operator: '='}},
      {name: 'bought-solar', loc: {operand: false, operator: '='}}
    ]}
  }, {
    test: 'should parse logical or',
    query: 'mkt_sgm [value = "gold"] || bought_solar [value = false]',
    data: {$or: [
      {name: 'mkt_sgm', value: {operand: 'gold', operator: '='}},
      {name: 'bought_solar', value: {operand: false, operator: '='}}
    ]}
  }, {
    test: 'should invert condition on feature',
    query: 'mkt_sgm ![value = "gold"]',
    data: {name: 'mkt_sgm', inverted: true, value: {operand: 'gold', operator: '='}}
  }, {
    test: 'should accept = operator',
    query: 'f1 [value = false]',
    data: {name: 'f1', value: {operand: false, operator: '='}}
  }, {
    test: 'should accept > operator',
    query: 'f1 [value > 10]',
    data: {name: 'f1', value: {operand: 10, operator: '>'}}
  }, {
    test: 'should accept < operator',
    query: 'f1 [value < "4"]',
    data: {name: 'f1', value: {operand: '4', operator: '<'}}
  }, {
    test: 'should accept >= operator',
    query: 'f1 [value >= 10.4]',
    data: {name: 'f1', value: {operand: 10.4, operator: '>='}}
  }, {
    test: 'should accept <= operator',
    query: 'f1 [value <= false]',
    data: {name: 'f1', value: {operand: false, operator: '<='}}
  }, {
    test: 'should accept float values',
    query: 'f1 [value <= 10.423]',
    data: {name: 'f1', value: {operand: 10.423, operator: '<='}}
  }, {
    test: 'should accept negative integer values',
    query: 'f1 [value = -4]',
    data: {name: 'f1', value: {operand: -4, operator: '='}}
  }, {
    test: 'should accept negative float values',
    query: 'f1 [value = -0.45]',
    data: {name: 'f1', value: {operand: -.45, operator: '='}}
  }, {
    test: 'should accept true boolean values',
    query: 'f1 [value = true]',
    data: {name: 'f1', value: {operand: true, operator: '='}}
  }, {
    test: 'should accept false boolean values',
    query: 'f1 [value = false]',
    data: {name: 'f1', value: {operand: false, operator: '='}}
  }, {
    test: 'should accept string values within simple quotes containing double quotes',
    query: 'f1 [value = "\\"hey"]',
    data: {name: 'f1', value: {operand: '"hey', operator: '='}}
  }, {
    test: 'should accept string values within double quotes containing simple quotes',
    query: 'f1 [value = "hoy\'"]',
    data: {name: 'f1', value: {operand: 'hoy\'', operator: '='}}
  }, {
    test: 'should accept accentuated, non-alphanumerical and blanck characters in values',
    query: 'f1 [value = "é *"]',
    data: {name: 'f1', value: {operand: 'é *', operator: '='}}
  }, {
    test: 'should accept multiples logical and',
    query: 'f1 [value = 1] && f2 [value = 2] && f3 [value = 3] && f4 [value = 4]',
    data: {$and: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {name: 'f2', value: {operand: 2, operator: '='}},
      {name: 'f3', value: {operand: 3, operator: '='}},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should accept multiples logical or',
    query: 'f1 [value = 1] || f2 [value = 2] || f3 [value = 3] || f4 [value = 4]',
    data: {$or: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {name: 'f2', value: {operand: 2, operator: '='}},
      {name: 'f3', value: {operand: 3, operator: '='}},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should logical and have precedence above or',
    query: 'f1 [value = 1] || f2 [value = 2] && f3 [value = 3] || f4 [value = 4]',
    data: {$or: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {$and: [
        {name: 'f2', value: {operand: 2, operator: '='}},
        {name: 'f3', value: {operand: 3, operator: '='}}
      ]},
      {name: 'f4', value: {operand: 4, operator: '='}}
    ]}
  }, {
    test: 'should use parenthese to force logical operator precedence',
    query: '(f1 [value = 1] || f2 [value = 2]) && (f3 [value = 3] || f4 [value = 4])',
    data: {$and: [
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
    test: 'should accept locations',
    query: 'f1 [loc = 10,42.4,-3.5]',
    data: {name: 'f1', loc: {operand: {lat: 42.4, lng: 10, rad: -3.5}, operator: '='}}
  }, {
    test: 'should simplify logical and with single element',
    query: 'f1 [value = 1]',
    data: {$and: [
      {name: 'f1', value: {operand: 1, operator: '='}}
    ]}
  }, {
    test: 'should simplify logical and which is not an array',
    query: 'f1 [value = 1] && f2 [value = 2]',
    data: {$and: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {$and: {name: 'f2', value: {operand: 2, operator: '='}}}
    ]}
  }, {
    test: 'should simplify logical or wich is not an array',
    query: 'f1 [value = 1]',
    data: {$or: {name: 'f1', value: {operand: 1, operator: '='}}}
  }, {
    test: 'should simplify logical or with single element',
    query: 'f1 [value = 1] || f2 [value = 2]',
    data: {$or: [
      {name: 'f1', value: {operand: 1, operator: '='}},
      {$or: [
        {name: 'f2', value: {operand: 2, operator: '='}}
      ]}
    ]}
  }, {
    test: 'should ignore additionnal properties in feature',
    query: 'f1 [value = 1 loc > 10,20,3 time > 18]',
    data: {
      name: 'f1',
      additionnal: 'something',
      value: {operand: 1, operator: '='},
      time: {operand: 18, operator: '>'},
      loc: {operand: {lat: 20, lng: 10, rad: 3}, operator: '>'}
    }
  }, {
    test: 'should ignore additionnal properties in feature tests',
    query: 'f1 [value = 1]',
    data: {name: 'f1', value: {operand: 1, operator: '=', unknown: true}}
  }].forEach(({test: testName, query, data}) => {

    it(testName || `should generate "${query}"`, () => {
      let actual = null;
      expect(() => actual = generate(data)).not.to.throw();
      expect(actual).to.equals(query);
    });
  });

  // failing cases
  [{
    test: 'should reject feature that is not an object',
    data: 'something',
    error: '""something"" is not a valid feature'
  }, {
    test: 'should reject feature test that is not an object',
    data: {name: 'f1', value: 18},
    error: '"18" is not a valid feature part'
  }, {
    test: 'should reject feature in logical and that is not an object',
    data: {$and: [
      true,
      {name: 'f1', value: { operand: 18, operator: '='}}
    ]},
    error: '"true" is not a valid feature'
  }, {
    test: 'should reject feature in logical and that is not an object',
    data: {$or: [
      {name: 'f1', value: { operand: 18, operator: '='}},
      false
    ]},
    error: '"false" is not a valid feature'
  }, {
    test: 'should reject object that is nor a feature nor a logical operator',
    data: {},
    error: '"{}" is nor a logical operator, nor a feature'
  }, {
    test: 'should reject feature that does not include value, time or loc',
    data: {name: 'f1', other: true},
    error: 'does not include value, location or time'
  }, {
    test: 'should reject feature test missing operator',
    data: {name: 'f1', time: {operand: 1}},
    error: 'is missing operator or operand'
  }, {
    test: 'should reject feature test missing operand',
    data: {name: 'f1', time: {operator: '='}},
    error: 'is missing operator or operand'
  }, {
    test: 'should reject location without latitude',
    data: {name: 'f1', loc: {operand: {lng: 10, rad: 5}, operator: '='}},
    error: 'Location part "undefined" is not a valid lat'
  }, {
    test: 'should reject location with string longitude',
    data: {name: 'f1', loc: {operand: {lat: 10, rad: 5, lng: 'toto'}, operator: '='}},
    error: 'Location part ""toto"" is not a valid lng'
  }, {
    test: 'should reject location with invalid radius',
    data: {name: 'f1', loc: {operand: {lat: 10, rad: true, lng: 4}, operator: '='}},
    error: 'Location part "true" is not a valid rad'
  }].forEach(({test: testName, data, error}) => {

    it(testName || `should reject "${JSON.stringify(data)}"`, () => {
      expect(() => generate(data)).to.throw(error);
    });
  });

});
