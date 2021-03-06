import {getStyles} from '../../src/utils/svg';
import d3 from 'd3';
const expect = chai.expect;

describe('getStyles', () => {

  let svg;
  let styleDefaults;

  before(() => {
    // given an existing SVG node
    svg = d3.select('#main').append('svg');
    svg.append('g').
      append('rect').
        attr('class', 'label');

    // given some styles directly set or inherited on that node
    styleDefaults = d3.select('head').append('style').text(`

      svg {
        font-family: Arial;
        font-size: 16px;
      }

      .label {
        fill: red;
        stroke: blue;
        strokeWidth: 2px;
        padding: 0.5em 10px 5%;
      }
    `);
  });

  it('should return multiple styles directly set on a SVG node', () => {
    let styles = getStyles(svg.select('rect'), {}, 'fill', 'stroke');
    expect(styles).to.have.property('fill');
    expect(['rgb(255, 0, 0)', 'red', '#ff0000', '#f00'].indexOf(styles.fill), 'fill is not red').not.to.equals(-1);
    expect(['rgb(0, 0, 255)', 'blue', '#0000ff', '#00f'].indexOf(styles.stroke), 'stroke is not blue').not.to.equals(-1);
  });

  it('should not return unkown style', () => {
    let styles = getStyles(svg.select('rect'), {}, 'unknown');
    expect(styles).to.exist.and.to.be.empty;
  });

  it('should return inherited style', () => {
    let styles = getStyles(svg.select('rect'), {}, 'font-family');
    expect(styles).to.have.property('font-family').that.equals('Arial');
  });

  it('should accept DOM node', () => {
    let styles = getStyles(svg.select('rect').node(), {}, 'fill');
    expect(['rgb(255, 0, 0)', 'red', '#ff0000', '#f00'].indexOf(styles.fill), 'fill is not red').not.to.equals(-1);
  });

  it('should automatically parse pixel values', () => {
    let styles = getStyles(svg.select('rect'), {}, 'padding-top', 'padding-left', 'padding-bottom');
    expect(styles).to.have.property('padding-top').that.equals(8);
    expect(styles).to.have.property('padding-left').that.equals(10);
    expect(styles).to.have.property('padding-bottom').that.equals('5%');
  });

  it('should take defaults value when provided', () => {
    let styles = getStyles(svg.select('rect'), {
      '.label': {
        'margin-top': 3
      }
    }, 'margin-top', 'margin-bottom');
    expect(styles).to.have.property('margin-top').that.equals(3);
    expect(styles).not.to.have.property('margin-bottom');

  });

  it('should not fail on missing default value', () => {
    let styles = getStyles(svg.select('rect'), {}, 'margin-bottom', 'padding-top');
    expect(styles).to.have.property('padding-top').that.equals(8);
    expect(styles).not.to.have.property('margin-bottom');
  });

  it('should not fail withou default values', () => {
    let styles = getStyles(svg.select('rect'), null, 'margin-bottom', 'padding-top');
    expect(styles).to.have.property('padding-top').that.equals(8);
    expect(styles).not.to.have.property('margin-bottom');
  });

  after(() => {
    styleDefaults && styleDefaults.remove();
    svg && svg.remove();
  });
});
