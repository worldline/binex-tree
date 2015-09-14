import d3 from 'd3';
import RequestTree from '../src/request_tree';
import {extractNodes, dragNode} from './utils/test_utilities';
import {parse} from 'targeting-engine-common';
const expect = chai.expect;
chai.config.truncateThreshold = 0;

describe('Request Tree drag\'n drop', function () {
  this.timeout(5000);

  // Default values for widget construction
  let animDuration = 10;
  let options = {
    animDuration,
    fetch: (d, done) => done(null, 0)
  };

  beforeEach(() => {
    d3.select('#main').html('');
  });

  it('should revert aborted drag', done => {
    let tree = new RequestTree('#main', parse('f1 [value = "something long"] && (age [value < 7] || age [value > 77])'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data)[1];
      let origin = {x: dragged.x, y: dragged.y};
      let parentId = dragged.parent.__id;
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, {x: 500}, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.equals(origin.x);
          expect(dragged).to.have.property('y').that.equals(origin.y);
          expect(dragged).to.have.deep.property('parent.__id').that.equals(parentId);
          expect(changeTriggered, 'change event fired').to.be.false;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should move a leaf into root node', done => {
    let tree = new RequestTree('#main', parse('(f1[value=1] || f2[value=2]) && (f3[value=3] || f4[value=4])'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === 'f1');
      let parent = dragged.parent;
      let dest = extractNodes(tree.data, 0).find(d => d.name && d.name === '$and');
      let origin = {x: dragged.x, y: dragged.y};
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, dest, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.is.not.equal(origin.x);
          expect(dragged).to.have.property('y').that.is.not.equal(origin.y);
          expect(dragged).to.have.property('parent').that.is.not.equal(parent);
          expect(dragged).to.have.property('parent').that.equals(dest);
          expect(changeTriggered, 'change event not fired').to.be.true;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should move a leaf into another node', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] || (f3[value=3] && f4[value=4])'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === 'f1');
      let parent = dragged.parent;
      let dest = extractNodes(tree.data, 1).find(d => d.name && d.name === '$and');
      let origin = {x: dragged.x, y: dragged.y};
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, dest, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.is.not.equal(origin.x);
          expect(dragged).to.have.property('y').that.is.not.equal(origin.y);
          expect(dragged).to.have.property('parent').that.is.not.equal(parent);
          expect(dragged).to.have.property('parent').that.equals(dest);
          expect(changeTriggered, 'change event not fired').to.be.true;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should not move a root node', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] || f2[value=2]'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === '$or');
      let origin = {x: dragged.x, y: dragged.y};
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, {y: 500}, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.equals(origin.x);
          expect(dragged).to.have.property('y').that.equals(origin.y);
          expect(changeTriggered, 'change event fired').to.be.false;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should not move leaf into another leaf', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] || f2[value=2]'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === 'f1');
      let origin = {x: dragged.x, y: dragged.y};
      let parentId = dragged.parent.__id;
      let dest = extractNodes(tree.data).find(d => d.name && d.name === 'f2');
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, dest, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.equals(origin.x);
          expect(dragged).to.have.property('y').that.equals(origin.y);
          expect(dragged).to.have.deep.property('parent.__id').that.equals(parentId);
          expect(changeTriggered, 'change event fired').to.be.false;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should not consider small movement as drag operations', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] || f2[value=2]'), options);
    expect(tree).not.to.have.property('discardedDrag');
    let changeTriggered = false;
    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === 'f1');
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, {x: dragged.x + 5, y: dragged.y + 5}, function() {
        expect(changeTriggered, 'change event fired').to.be.false;
        expect(tree).to.have.property('discardedDrag').that.is.not.null;
        done();
      }, 50);
    }, animDuration * 1.2);
  });

  it('should keep ordering when aborting the operation', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] && f2[value=2] && f3[value=3]'), options);
    let changeTriggered = false;
    expect(tree).to.have.property('data');

    // Wait for layout animation
    setTimeout(() => {
      let dragged = extractNodes(tree.data).find(d => d.name && d.name === 'f2');
      let origin = {x: dragged.x, y: dragged.y};
      let parentId = dragged.parent.__id;
      let position = dragged.parent.children.indexOf(dragged);
      tree.on('change', () => changeTriggered = true);

      dragNode(tree, dragged, {y: 100}, function() {
        // Wait for abort animation
        setTimeout(() => {
          expect(dragged).to.have.property('x').that.equals(origin.x);
          expect(dragged).to.have.property('y').that.equals(origin.y);
          expect(dragged).to.have.deep.property('parent.__id').that.equals(parentId);
          expect(dragged.parent.children.indexOf(dragged), 'position was not kept').to.equals(position);
          expect(changeTriggered, 'change event fired').to.be.false;
          done();
        }, animDuration * 1.2);
      });
    }, animDuration * 1.2);
  });

  it('should ignore drag event without drag start', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] && f2[value=2] && f3[value=3]'), options);
    // Wait for layout animation
    setTimeout(() => {
      expect(() => tree.onDrag({}, tree.data)).not.to.throw(Error);
      done();
    }, animDuration * 1.2);
  });

  it('should ignore drop event without drag start', done => {
    let tree = new RequestTree('#main', parse('f1[value=1] && f2[value=2] && f3[value=3]'), options);
    // Wait for layout animation
    setTimeout(() => {
      expect(() => tree.onDrop({}, tree.data)).not.to.throw(Error);
      done();
    }, animDuration * 1.2);
  });
});
