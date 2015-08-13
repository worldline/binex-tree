import d3 from 'd3';
import RequestTree from '../request_tree';
import {translateFromTree, assign} from '../utils/tools';
import {parse, generate} from 'targeting-engine-common';

/**
 * Provides a default fetch implementation that issue request on the targeting engine
 *
 * @param {Object} data - data for which request result are fetched
 * @param {Function} done - completion callback to invoke when data are available, with parameters:
 * @param {Error} done.err - an error object if fetching failed, null otherwise
 * @param {Number} done.result - the numerical result for this node
 */
function fetch (data, done) {
  let request = generate(translateFromTree(data));
  let server = this.targetingEngine;
  d3.json(`http://${server.host}:${server.port}/${server.base}/profiles/count?q=${encodeURIComponent(request)}`)
    // TODO add authorization headers
    .get((err, data) => {
      if (err) {
        return done(new Error(err.statusText));
      }
      done(null, data.meta.count);
    });
}

/**
 * Targeting engine specific request tree.
 * It accepts a valid request string as data, and fetch intermediate results with the targeting engine API.
 */
export default class TargetingEngineTree extends RequestTree {

  constructor(anchor, data, options = {}) {
    super(anchor, data, assign({
      targetingEngine: {
        host: 'localhost',
        port: 8000,
        base: 'test'
      },
      fetch
    }, options));
  }

  /**
   * Extends inherited method to accept String query in parameter
   *
   * @param {String} data - string request to represent
   * @throws {Error} if the string request isn't valid
   */
  setData(data) {
    super.setData(parse(data));
  }

  /**
   * Overload inhierted method to dispatch string version of the represented request
   */
  dispatchChange() {
    this.dispatch('change', generate(translateFromTree(this.data)));
  }
}
