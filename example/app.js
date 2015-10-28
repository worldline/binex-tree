require('./app.scss');
import d3 from 'd3';
import BinexTree from '../src/binex-tree';

let request = {
  $or: [{
    name: 'f1',
    value: {
      operand: 125,
      operator: '>='
    }
  }, {
    $and: [{
      name: 'f2',
      value: {
        operand: true,
        operator: '='
      }
    }, {
      name: 'f3',
      value: {
        operand: [15, 20],
        operator: 'in'
      }
    }]
  }]
};
let widget = new BinexTree('#main', request);
let error = d3.select('#error');
let input = d3.select('#request');
let timeout = null;

input.property('value', JSON.stringify(request))
  .on('keyup', function() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      error.classed('active', false);
      try {
        widget.setData(JSON.parse(input.property('value')));
      } catch (err) {
        error.classed('active', true).html(`<span>${err}</span>`);
      }
    }, 200);
  });

widget.on('change', (data) => {
  console.log(data);
  input.property('value', JSON.stringify(data));
}).on('editNode', (data) => {
  console.log('Node to edit', data);
}).on('addToNode', (data) => {
  console.log('Node to enrich', data);
});
