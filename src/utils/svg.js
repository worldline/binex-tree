import d3 from 'd3';

/**
 * Return the computed css styles of an SVG element.
 * For values that are pixel values (like padding, margin...), return a numerical value after having
 * applied the screen ratio. If the node is inside a zoomed element, zoom must be given.
 *
 * @param {d3.selection|SVGElement} node - from which css styles are retrieved
 * @param {Object} defaults - hash containing default values that will be returned if expected style is unset.
 * @param {String[]} styles - styles name you whish to consult
 * @return {Object} an object which properties are the retrieved styles
 */
export const getStyles = (node, defaults, ...styles) => {
  node = node instanceof d3.selection ? node.node() : node;
  const results = {};
  const values = window.getComputedStyle(node);
  const selector = `.${node.getAttribute('class').replace(/ /g, '.')}`;
  styles.forEach(style => {
    const value = values[style];
    if (value && value !== '0' && value !== '0px') {
      results[style] = /px$/.test(value) ? parseInt(value) : value;
    } else if (defaults && defaults[selector] && defaults[selector][style]) {
      results[style] = defaults[selector][style];
    }
  });
  return results;
};
