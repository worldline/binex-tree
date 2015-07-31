import d3 from 'd3';
import RequestTree from './request_tree';
import {parse} from '../../common/src/grammar_parser';
import {generate} from '../../common/src/grammar_generator';

let request = '(mkt_sgm[value = "gold + long"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && mkt_sgm[value = "gold"] && (bought_solar[value = false] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"] || gender[value = "male"]))  || (bought_solar[value = false] && gender[value = "male"])';
let widget = new RequestTree('#main', parse(request));
let error = d3.select('#error');
let input = d3.select('#request');

function onRequestChange() {
  error.classed('active', false);
  try {
    widget.setRequest(parse(input.property('value')));
  } catch (err) {
    error.classed('active', true).html(`<span>${err}</span>`);
  }
}

input.property('value', request)
  .on('keyup', onRequestChange);

widget.on('change', (data) => {
  input.property('value', generate(data));
}).on('editNode', (data) => {
  console.log('Node to edit', data);
}).on('addToNode', (data) => {
  console.log('Node to enrich', data);
});
