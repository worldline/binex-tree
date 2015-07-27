
/**
 * This function translate a parsed request (grammar parser's output) into a D3 compliant tree structure.
 * @param {Object} request - the wellformated parsed request
 * @return {Object} a D3 tree structure
 */
export function translateRequestToTree(request) {
  var keys = Object.keys(request);
  if (['$or', '$and'].indexOf(keys[0]) !== -1) {
    return {
      name: keys[0],
      children: request[keys[0]].map(translateRequestToTree)
    };
  }
  return request;
}
