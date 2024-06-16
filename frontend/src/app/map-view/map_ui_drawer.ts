import * as d3 from 'd3';
import { D3Selection, MainMap } from './main_map';

export class MapUIDrawer {
  private _year_range: number[];

  constructor(
    private _map: MainMap,
    private _ui_graph: D3Selection,
    private _color_scale: d3.ScaleSequential<string, never>,
    _year_range: number[],
  ) {
    this._year_range = d3.range(_year_range[0], _year_range[1] + 1);
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------'

  draw() {
    const year_height = this.year_height;

    // Draw rect
    this._ui_graph
      .selectAll('rect')
      .data(this._year_range)
      .enter()
      .append('rect')
      .attr('x', `${this._map.width - 30}px`)
      .attr('y', (_, i) => `${(i + 1) * year_height}px`)
      .attr('width', `15px`)
      .attr('height', `${year_height}px`)
      .style('fill', (d) => this._color_scale(d));

    // Add color legend labels
    this._ui_graph
      .selectAll('text')
      .data(this._year_range)
      .enter()
      .append('text')
      .attr('x', `${this._map.width - 65}px`)
      .attr('y', (_, i) => `${(i + 1.75) * year_height}px`)
      .text((d) => d);
  }

  on_resize() {
    const year_height = this.year_height;

    this._ui_graph
      .selectAll('rect')
      .attr('x', `${this._map.width - 30}px`)
      .attr('y', (_, i) => `${(i + 1) * year_height}px`)
      .attr('height', `${year_height}px`);

    this._ui_graph
      .selectAll('text')
      .attr('x', `${this._map.width - 65}px`)
      .attr('y', (_, i) => `${(i + 1.75) * year_height}px`);
  }

  // --------------------------------------------------------------------------'
  private get year_height() {
    return Math.min((0.85 * this._map.height) / this._year_range.length, 20);
  }
}
