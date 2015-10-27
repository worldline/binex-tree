import d3 from 'd3';
import BinexTree from '../src/binex-tree';
import {extractNodes, addIds, parse} from './utils/test-utilities';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

describe('Request Tree', () => {

  let animDuration = 10;

  beforeEach(() => {
    // clean main before each test.
    d3.select('#main').html('');
  });

  it('should menu not include removal for root', done => {
    /* eslint no-new: 0 */
    new BinexTree('#main', addIds(parse('f1 [value = "something long"]')), {animDuration});
    setTimeout(() => {
      d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
      let menu = d3.select('.menu');
      expect(menu.empty(), 'no menu found').to.be.false;
      expect(menu.selectAll('.action').size()).to.equals(1);
      expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
      expect(menu.select('.remove').empty(), 'remove action found').to.be.true;
      done();
    }, animDuration * 1.2);
  });

  it('should menu not include removal on logical operator root', done => {
    /* eslint no-new: 0 */
    new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2]')), {animDuration});
    setTimeout(() => {
      d3.select('.node[data-id="1"]').node().dispatchEvent(new MouseEvent('click'));
      let menu = d3.select('.menu');
      expect(menu.empty(), 'no menu found').to.be.false;
      expect(menu.selectAll('.action').size()).to.equals(2);
      expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
      expect(menu.select('.add').empty(), 'no add action found').to.be.false;
      expect(menu.select('.remove').empty(), 'remove action found').to.be.true;
      done();
    }, animDuration * 1.2);
  });

  it('should menu not include addition on leaves', done => {
    /* eslint no-new: 0 */
    new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2]')), {animDuration});
    setTimeout(() => {
      d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
      let menu = d3.select('.menu');
      expect(menu.empty(), 'no menu found').to.be.false;
      expect(menu.selectAll('.action').size()).to.equals(2);
      expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
      expect(menu.select('.add').empty(), 'add action found').to.be.true;
      expect(menu.select('.remove').empty(), 'no remove action found').to.be.false;
      done();
    }, animDuration * 1.2);
  });

  it('should menu include all actions on non-root nodes', done => {
    /* eslint no-new: 0 */
    new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')), {animDuration});
    setTimeout(() => {
      d3.select('.node[data-id="2"]').node().dispatchEvent(new MouseEvent('click'));
      let menu = d3.select('.menu');
      expect(menu.empty(), 'no menu found').to.be.false;
      expect(menu.selectAll('.action').size()).to.equals(3);
      expect(menu.select('.edit').empty(), 'no edit action found').to.be.false;
      expect(menu.select('.add').empty(), 'no add action found').to.be.false;
      expect(menu.select('.remove').empty(), 'no remove action found').to.be.false;
      done();
    }, animDuration * 1.2);
  });

  it('should menu be cleared when clicking elsewhere', done => {
    let tree = new BinexTree('#main', addIds(parse('f1[value=1]')), {animDuration});
    setTimeout(() => {
      d3.select('.node[data-id="f1"]').node().dispatchEvent(new MouseEvent('click'));
      expect(d3.select('.menu').empty(), 'no menu found').to.be.false;
      tree.svg.node().dispatchEvent(new MouseEvent('click'));
      expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
      done();
    }, animDuration * 1.2);
  });

  it('should remove leave', done => {
    let tree = new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')), {animDuration});
    let changedTriggered = false;

    setTimeout(() => {
      tree.on('change', () => changedTriggered = true);

      d3.select('.node[data-id="f2"]').node().dispatchEvent(new MouseEvent('click'));
      expect(extractNodes(tree.data)).to.have.lengthOf(5);
      d3.select('.action.remove').node().dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      }));

      expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
      expect(extractNodes(tree.data)).to.have.lengthOf(4);
      setTimeout(() => {
        expect(changedTriggered, 'change not triggered').to.be.true;
        done();
      }, 10);
    }, animDuration * 1.2);
  });

  it('should trigger node edition on leaves', done => {
    let tree = new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')), {animDuration});
    let editionTriggered = false;

    setTimeout(() => {
      tree.on('editNode', () => editionTriggered = true);

      d3.select('.node[data-id="f3"]').node().dispatchEvent(new MouseEvent('click'));
      d3.select('.action.edit').node().dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      }));

      expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
      setTimeout(() => {
        expect(editionTriggered, 'edition not triggered').to.be.true;
        done();
      }, 10);
    }, animDuration * 1.2);
  });

  it('should trigger node edition on nodes', done => {
    let tree = new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')), {animDuration});
    let editionTriggered = false;

    setTimeout(() => {
      tree.on('editNode', () => editionTriggered = true);

      d3.select('.node[data-id="2"]').node().dispatchEvent(new MouseEvent('click'));
      d3.select('.action.edit').node().dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      }));

      expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
      setTimeout(() => {
        expect(editionTriggered, 'edition not triggered').to.be.true;
        done();
      }, 10);
    }, animDuration * 1.2);
  });

  it('should trigger node addition on nodes', done => {
    let tree = new BinexTree('#main', addIds(parse('f1[value=1] || f2[value=2] && f3[value=3]')), {animDuration});
    let addToTriggered = false;

    setTimeout(() => {
      tree.on('addToNode', () => addToTriggered = true);

      d3.select('.node[data-id="2"]').node().dispatchEvent(new MouseEvent('click'));
      d3.select('.action.add').node().dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      }));

      expect(d3.select('.menu').empty(), 'menu still visible').to.be.true;
      setTimeout(() => {
        expect(addToTriggered, 'addTo not triggered').to.be.true;
        done();
      }, 10);
    }, animDuration * 1.2);
  });
});
