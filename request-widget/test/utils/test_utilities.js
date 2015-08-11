import d3 from 'd3';

/**
 * Used to get all nodes in a tree at a given depth
 *
 * @param {Object} node - node processed (must contains depth, and may contains children attribute)
 * @param {Number = -1} depth - expected depth (-A to select all)
 * @return {Object[]} node of the given depth
 */
export function extractNodes (node, depth = -1) {
  let selected = node.depth === depth || depth === -1 ? [node] : [];
  if (node.children) {
    node.children.forEach(c => {
      selected = selected.concat(extractNodes(c, depth));
    });
  }
  return selected;
}

/**
 * Programmatically triggers an event on a given node.
 * @param {Object|} node - data represented by the dragged node (selection is done from __id property)
 */
export function triggerEvent (node, kind) {
  kind = kind.toLowerCase().trim();
  let evt = null;
  if (['mouseup', 'mousedown', 'mousemove', 'click'].indexOf(kind) !== -1) {
    evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(kind, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  }
  d3.select(`[data-id='${node.__id}']`).node().dispatchEvent(evt);
}

/**
 * Drag a given node a moves it per x/y pixels
 * This operation takes some time to be performed (1px per milliseconds), and the callback is called when the move is finished
 * @param {RequestTree} tree - tree instance on witch the drag operation is simulated
 * @param {Object} dragged - data represented by the dragged node (selection is done from __id property)
 * @param {Object} target - destination point where node is dropped, with x and y coordinates
 * @param {Function} done - callback invoked when the operation is finished
 */
export function dragNode (tree, dragged, target, done, duration = 250) {
  // Do not use dragged.x or dragged.y in the loop, because it will be updated
  // Don't forget that x and y are inverted in the tree structure
  let {x: y, y:x } = dragged;
  let mx = target.y === undefined ? 0 : target.y - x;
  let my = target.x === undefined ? 0 : target.x - y;

  let node = d3.select(`[data-id='${dragged.__id}']`);
  let points = [];
  if (mx === 0) {
    // Vertical movement
    let incr = my >= 0 ? 5 : -5;
    for (let i = 0; Math.abs(my - i) >= 5; i += incr) {
      points.push({x: x, y: y + i});
    }
  } else {
    // Other cases
    let a = my / mx;
    let b = y - a * x;
    let incr = mx >= 0 ? 5 : -5;
    for (let i = 0; Math.abs(mx - i) >= 5; i += incr) {
      points.push({x: x + i, y: (x + i) * a + b});
    }
  }
  points.push({x: target.x === undefined ? x : target.x, y: target.y === undefined ? y : target.y});

  // Start drag
  let evt = document.createEvent('MouseEvents');
  evt.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  tree.onDragStart({sourceEvent: evt}, dragged, node);

  // Trigger move every 5 ms
  let step = duration / points.length;
  let triggerNext = function () {
    if (points.length) {
      let point = points.shift();
      // Call the drag handler with move since previous call
      tree.onDrag({
        dx: point.x - x,
        dy: point.y - y
      }, dragged);
      x = point.x;
      y = point.y;
      // Updates droppable state
      tree.svg.selectAll('.droppable').classed('selected', ({x, y, width, height}) =>
        x <= point.x && point.x <= x + height && y <= point.y && point.y <= y + width
      );
      return setTimeout(triggerNext, step);
    }
    // Stop operation
    tree.onDrop({}, dragged);
    done();
  };
  triggerNext();
}
