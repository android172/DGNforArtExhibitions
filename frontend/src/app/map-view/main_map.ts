import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Artist } from '../../objects/artist';

import { ArtistTrajectoryGraph } from './artist_trajectory_graph';
import { ArtistTrajectoryGraphDrawer } from './artist_trajectory_graph_drawer';
import { MainMapBaseDrawer } from './main_map_base_drawer';

type D3Selection = d3.Selection<any, unknown, null, undefined>;

export class MainMap {
  constructor(map_element: Element) {
    this._map_svg = d3.select(map_element);

    // Get dimensions
    const rect = this._map_svg.node().getBoundingClientRect();
    this._width = rect.width;
    this._height = rect.height;

    // Create graph with parts
    const canvas = this._map_svg
      .call(this.zoom)
      .append('g')
      .attr('id', 'canvas');
    this._graphs = {
      canvas: canvas,
      base_map: canvas.append('g').attr('id', 'main_map'),
      places: canvas.append('g').attr('id', 'places'),
      s_conn: canvas.append('g').attr('id', 'self_connections'),
      conn: canvas.append('g').attr('id', 'connections'),
    };

    // Create graph drawers
    this._drawer_mm = new MainMapBaseDrawer(this._graphs, this);
    this._drawer_atg = new ArtistTrajectoryGraphDrawer(this._graphs, this);
  }

  on_resize() {
    // Get dimensions
    const rect = this._map_svg.node().getBoundingClientRect();
    this._width = rect.width;
    this._height = rect.height;

    // Update zoom
    this._map_svg.call(this.zoom);

    // Call drawers
    this._drawer_mm.on_resize();
    this._drawer_atg.on_resize();
  }

  // --------------------------------------------------------------------------

  draw_base_map(map_data: any): any {
    this._drawer_mm.draw(map_data);
  }

  draw_artists_life_trajectory(artists: Artist[]): void {
    const traj_graph = new ArtistTrajectoryGraph(artists);
    this._drawer_atg.draw(traj_graph);
  }

  // --------------------------------------------------------------------------
  // Properties
  // --------------------------------------------------------------------------
  // Current scale
  public get current_scale() {
    return this._current_scale;
  }
  private set current_scale(value: number) {
    this._current_scale = value;
    this._drawer_mm.on_rescaled();
    this._drawer_atg.on_rescale();
  }

  // Zoom
  private get zoom() {
    return d3
      .zoom()
      .scaleExtent(this._zoom_threshold)
      .translateExtent([
        [0, 0],
        [this._width, this._height],
      ])
      .on('zoom', (e: any) => {
        // Update transforms / scale
        this._graphs.canvas.attr('transform', e.transform);
        this.current_scale = e.transform.k;
      });
  }

  // Projection
  public get projection() {
    return d3
      .geoEqualEarth()
      .translate([0.15 * this._width, 1.84 * this._width])
      .scale(1.6 * this._width);
  }

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  // Components
  private _graphs: GraphParts;
  private _map_svg: D3Selection;
  private _drawer_mm: MainMapBaseDrawer;
  private _drawer_atg: ArtistTrajectoryGraphDrawer;

  // Static settings
  private _zoom_threshold: [number, number] = [1.0, 4.0];

  // Dynamic settings
  private _current_scale: number = 1.0;
  private _width: number;
  private _height: number;
}

export interface GraphParts {
  canvas: D3Selection;
  base_map: D3Selection;
  places: D3Selection;
  s_conn: D3Selection;
  conn: D3Selection;
}
