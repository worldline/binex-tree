import d3 from 'd3';
<<<<<<< HEAD
import RequestTree from './request_tree';
import {parse} from '../../common/src/grammar_parser';
import {generate} from '../../common/src/grammar_generator';
=======
import TargetingEngineTree from './targeting-engine/tree';
>>>>>>> f7b2f99... Working implementation of node result fetch on targeting-engine API

//let request = '(mkt_sgm[value = "gold + long"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && (bought_solar[value = false] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"]))  || (bought_solar[value = false] && gender[value = "male"])';
let request = 'mkt_sgm [value = "gold + long"] && mkt_sgm [value = "gold"] && (bought_solar [value = true] || f1 [value = 1] || f2 [value = 2]) || bought_solar [value = false] && gender [value = "female"]';
let widget = new TargetingEngineTree('#main', request, {targetingEngine: {base: 'client1'}});
let error = d3.select('#error');
let input = d3.select('#request');

function onRequestChange() {
  error.classed('active', false);
  try {
    widget.setData(input.property('value'));
  } catch (err) {
    error.classed('active', true).html(`<span>${err}</span>`);
  }
}

input.property('value', request)
  .on('keyup', onRequestChange);

widget.on('change', (data) => {
  input.property('value', data);
}).on('editNode', (data) => {
  console.log('Node to edit', data);
}).on('addToNode', (data) => {
  console.log('Node to enrich', data);
});
