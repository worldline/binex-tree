import {getStyles} from '../../src/utils/svg';
import d3 from 'd3';
const expect = chai.expect;

describe('getStyles', () => {

  let svg;
  let styles;

  before(() => {
    // given an existing SVG node
    svg = d3.select('#main').append('svg');
    svg.append('g')
      .append('rect')
        .attr('class', 'label');

    // given some styles directly set or inherited on that node
    styles = d3.select('head').append('style').text(`

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
    let styles = getStyles(svg.select('rect'), 'fill', 'stroke');
<<<<<<< HEAD
    expect(styles).to.have.property('fill').that.equals('rgb(255, 0, 0)');
    expect(styles).to.have.property('stroke').that.equals('rgb(0, 0, 255)');
=======
    expect(styles).to.have.property('fill');
    expect(['rgb(255, 0, 0)', 'red', '#ff0000', '#f00'].indexOf(styles.fill), 'fill is not red').not.to.equals(-1);
    expect(['rgb(0, 0, 255)', 'blue', '#0000ff', '#00f'].indexOf(styles.stroke), 'stroke is not blue').not.to.equals(-1);
>>>>>>> 4fea375... Add test for drag'n drop operations
  });

  it('should not return unkown style', () => {
    let styles = getStyles(svg.select('rect'), 'unknown');
    expect(styles).to.exist.and.to.be.empty;
  });

  it('should return inherited style', () => {
    let styles = getStyles(svg.select('rect'), 'font-family');
    expect(styles).to.have.property('font-family').that.equals('Arial');
  });

  it('should accept DOM node', () => {
    let styles = getStyles(svg.select('rect').node(), 'fill');
    expect(['rgb(255, 0, 0)', 'red', '#ff0000', '#f00'].indexOf(styles.fill), 'fill is not red').not.to.equals(-1);
  });

  it('should automatically parse pixel values', () => {
    let styles = getStyles(svg.select('rect'), 'padding-top', 'padding-left', 'padding-bottom');
    expect(styles).to.have.property('padding-top').that.equals(8);
    expect(styles).to.have.property('padding-left').that.equals(10);
    expect(styles).to.have.property('padding-bottom').that.equals('5%');
  });

  after(() => {
    styles && styles.remove();
    svg && svg.remove();
  });
});
