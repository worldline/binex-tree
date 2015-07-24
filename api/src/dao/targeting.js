import {GenericDao} from './generic';
import {parse} from '../../../common/src/grammar_parser';
import {translateToMongo} from './utils';

export class TargetingDao extends GenericDao {

  constructor(db) {
    super(db, 'profiles');
  }

  /**
    * Find profiles matching a query
    *
    * return only profile information, not features
    *
    * @param {Object} query - the parameters of the query
    * @param {string} query.q - The query that profiles must match.
    * @param {Number} query.from - positive integer, for pagination
    * @param {Number} query.size - positive integer, for pagination
    * @param {string} query.sort - the profile field thtat the profiles will be sorted on
    * @param {string} query.order - order of the sort, asc or desc
    * @return {Promise} A promise, with matching profiles as resolve argument.
    */
  target(query) {
    let mongoQuery = translateToMongo(parse(query.q));
    // set features:0 to tell mongo to not fetch the features of the profile
    return this.find(mongoQuery, query.from, query.size, query.sort, query.direction, {features: 0});
  }

  /**
    * Count profiles matching a query
    *
    * named targetCount because the generic dao already has a count function htat we will use
    *
    * @param {string} query - The query that profiles must match.
    * @return {Promise} A promise, with the number of matching profiles as resolve argument.
    */
  targetCount(query) {
    return this.count(translateToMongo(parse(query)));
  }

  /**
    * Check whether a profiles given by its id match the given query
    *
    * @param {string} id - The id of a profile
    * @param {string} query - The query that profiles must match.
    * @return {Promise} A promise, with 1 as the resolve argument if the given profile matches the query, 0 otherwise
    */
  match(id, query) {
    return this.find({'$and': [
      {'_id': this._getId(id)},
      translateToMongo(parse(query))
    ]});
  }
}
