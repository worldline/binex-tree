/**
 * Check if an object is an instance of type.
 * Undefined and Null types can't be checked with this function.
 * Undefined and null object always return false.
 * Freely inspired from [JavaScript Garden](http://bonsaiden.github.io/JavaScript-Garden/fr/#types.typeof)
 *
 * @param {Any} obj - the checked object
 * @param {String} type - the expected type name
 * @return {Boolean} true if the object is instance of this type, false otherwise.
 */
function is(obj, type) {
  let clazz = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
  return obj !== undefined && obj !== null && clazz === type.toLowerCase();
}

/**
 * Translate a given feature.
 * The feature must include at least one test on value, loc(action) or time.
 * Each test must include operand and operator properties
 *
 * @param {Object} data - translated feature data.
 * @return {String[]} array of string elements representing this feature test
 * @throws {Error} when the feature does not include expected test
 * @throws {Error} when a given test does not include operand or operator properties
 */
function translateFeature(data) {
  let result = [];
  // Check that we have at least one mandatory test
  if (!('value' in data) && !('loc' in data) && !('time' in data)) {
    throw new Error(`${JSON.stringify(data)} does not include value, location or time`);
  }

  ['value', 'loc', 'time'].forEach(prop => {
    let part = data[prop];
    // If the feature contains a given test
    if (part) {
      if (!is(part, 'object')) {
        throw new Error(`"${JSON.stringify(part)}" is not a valid feature part`);
      }
      if (!('operand' in part) || !('operator' in part)) {
        throw new Error(`"${JSON.stringify(part)}"" is missing operator or operand`);
      }
      let operand = part.operand;
      if (is(operand, 'string')) {
        // Use stringify to automatically escape included quotes.
        operand = JSON.stringify(operand);
      } else if (is(operand, 'object')) {
        // Translate locations (order is significant)
        operand = ['lng', 'lat', 'rad'].map(prop => {
          if (!is(operand[prop], 'number')) {
            throw new Error(`Location part "${JSON.stringify(operand[prop])}" is not a valid ${prop}`);
          }
          return operand[prop];
        }).join(',');
      }
      result.push(prop, part.operator, operand);
    }
  });
  return result;
}

/**
 * Generate a string request from a given data structure.
 * Incoming data must be an object either :
 *
 *    {name: 'X', value: {operand: 'Y', operator: '='}} > a feature X with value equal to Y
 *    {$and: [X, Y]} > a logical and between X and Y
 *    {$or: [X, Y]} > a logical or between X and Y
 *
 * Feature can have test on 'value', 'loc' and 'time' (other properties will be ignored).
 * They must contain at least one of these.
 * Feature tests must contain 'operand' and 'operator' properties, and optinonaly 'inverted' boolean property
 * Operand and operators can be anything (must be stringifiable values like strings, booleans and numbers)
 * Location's operand must be an object containing 'lat', 'lng' and 'rad' numbers.
 *
 * @param {Object} data - the parsed data
 * @return {String} the corresponding request
 * @throws {Error} if one of the previous condition is not met
 */
export function generate(data) {
  let query = [];
  if (!is(data, 'object')) {
    throw new Error(`"${JSON.stringify(data)}" is not a valid feature`);
  }

  if ('name' in data) {
    query.push(data.name, data.inverted ? '![' : '[', ...translateFeature(data), ']');
  } else if ('$or' in data) {
    // If logical or is not an array or contain only one element, simplify by ignoring the operator
    query.push(!Array.isArray(data.$or) ? generate(data.$or) : data.$or.length === 1 ? generate(data.$or[0]) : data.$or.map(generate).join(' || '));
  } else if ('$and' in data) {
    // If logical and is not an array or contain only one element, simplify by ignoring the operator
    query.push(!Array.isArray(data.$and) ? generate(data.$and) : data.$and.length === 1 ? generate(data.$and[0]) : data.$and.map(part => {
      if (!is(part, 'object')) {
        throw new Error(`"${JSON.stringify(part)}" is not a valid feature`);
      }
      // Logical or found within a logical and: use parenthesis to break operator precedence
      if ('$or' in part) {
        return `(${generate(part)})`;
      }
      return generate(part);
    }).join(' && '));
  } else {
    throw new Error(`"${JSON.stringify(data)}" is nor a logical operator, nor a feature`);
  }
  // Always use a space to separate element, unless the element is a bracket or a parenthesis
  return query.map((n, i) => ['[', '![', '('].indexOf(n) >= 0 ? n : [']', ')'].indexOf(query[i + 1]) >= 0 ? n : `${n} `).join('').trim();
}
