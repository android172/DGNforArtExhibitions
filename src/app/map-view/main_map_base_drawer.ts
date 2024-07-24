import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { D3Selection, GraphParts, MainMap } from './main_map';

export class MainMapBaseDrawer {
  constructor(
    private _map: MainMap,
    private _base_map: D3Selection,
  ) {}

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  public draw(map_data: any) {
    // Generates the path coordinates from topojson
    this._path = d3.geoPath().projection(this._map.projection);

    // Load map geometry
    const map_fe: GeoJSON.FeatureCollection | GeoJSON.Feature =
      topojson.feature(map_data, map_data.objects.europe);
    this._map_geo =
      map_fe.type === 'Feature' ? [map_fe] : (map_fe as any).features;

    // Draw map
    this.draw_map();
  }

  public on_rescale() {
    // Update path width
    this._base_map
      .selectAll('path')
      .attr('stroke-width', this._scale_rule_borders);
  }

  public on_resize() {
    // Update path projection
    const path: any = d3.geoPath().projection(this._map.projection);
    this._base_map.selectAll('path').attr('d', path);
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------
  private draw_map() {
    // generates and styles the SVG path
    const graph = this._base_map;
    graph
      .selectAll('path')
      .data(this._map_geo)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('d', this._path)
            .attr('stroke', 'darkgray')
            .attr('stroke-width', this._scale_rule_borders)
            .attr('fill', this._fill_color)
            .attr('data-id', (d: any) => d.id)
            .on('mouseover', (_: any, item: any) => {
              graph
                .select(`[data-id="${item.id}"]`)
                .transition()
                .duration(200)
                .attr('fill', this._selected_color);
            })
            .on('mouseout', (_: any, item: any) => {
              graph
                .select(`[data-id="${item.id}"]`)
                .transition()
                .duration(200)
                .attr('fill', this._fill_color);
            }),
        (update) =>
          update
            .attr('d', this._path)
            .attr('stroke', 'black')
            .attr('stroke-width', this._scale_rule_borders)
            .attr('fill', this._fill_color)
            .attr('data-id', (d: any) => d.id)
            .on('mouseover', (_: any, item: any) => {
              graph
                .select(`[data-id="${item.id}"]`)
                .transition()
                .duration(200)
                .attr('fill', this._selected_color);
            })
            .on('mouseout', (_: any, item: any) => {
              graph
                .select(`[data-id="${item.id}"]`)
                .transition()
                .duration(200)
                .attr('fill', this._fill_color);
            }),
        (exit) => exit.remove(),
      );
    // .on('click', (event, item) => {
    //   // country_color_selected(i.properties.id)
    // })
  }

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  // Components
  private _map_geo: any;
  private _path: any;

  // Static settings
  private _fill_color: string = 'lightyellow';
  private _selected_color: string = 'lightyellow';
  // private _selected_color: string = '#327';

  // Drawing
  private _scale_rule_borders: any = (d: any) => 0.5 / this._map.current_scale;
}
