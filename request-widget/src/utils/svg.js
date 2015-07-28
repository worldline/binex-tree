import d3 from 'd3';

/**
 * Return the computed css styles of an SVG element.
 * For values that are pixel values (like padding, margin...), return a numerical value after having
 * applied the screen ratio. If the node is inside a zoomed element, zoom must be given.
 *
 * @param {d3.selection|SVGElement} node - from which css styles are retrieved
 * @param {String[]} styles - styles name you whish to consult
 * @return {Object} an object which properties are the retrieved styles
 */
export function getStyles(node, ...styles) {
  node = node instanceof d3.selection ? node.node() : node;
  let ctm = node.getScreenCTM();
  let results = {};
  let values = window.getComputedStyle(node);
  styles.forEach(style => {
    let value = values[style];
    if (value) {
      results[style] = /px$/.test(value) ? parseInt(value) / ctm.a : value;
    }
  });
  return results;
}
