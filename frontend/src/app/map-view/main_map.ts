import * as d3 from 'd3';
import { Artist } from '../../objects/artist';

import { ArtistTrajectoryGraph } from './artist_trajectory_graph';
import { ArtistTrajectoryGraphDrawer } from './artist_trajectory_graph_drawer';
import { MainMapBaseDrawer } from './main_map_base_drawer';
import { MapUIDrawer } from './map_ui_drawer';
import { Parse } from '../../objects/common';

export type D3Selection = d3.Selection<any, unknown, null, undefined>;

export class MainMap {
  constructor(map_element: Element) {
    this._map_svg = d3.select(map_element);

    // Get dimensions
    const rect = this._map_svg.node().getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

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
      ui: this._map_svg.append('g').attr('id', 'map_ui'),
    };

    // Create graph drawers
    this._drawer = new DrawerComponents(
      new MainMapBaseDrawer(this, this._graphs.base_map),
      new ArtistTrajectoryGraphDrawer(this, this._graphs, this._color_scale),
      new MapUIDrawer(
        this,
        this._graphs.ui,
        this._color_scale,
        this._year_range,
      ),
    );
  }

  on_resize() {
    // Get dimensions
    const rect = this._map_svg.node().getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Update zoom
    this._map_svg.call(this.zoom);

    // Call drawers
    this._drawer.on_resize();
  }

  // --------------------------------------------------------------------------

  draw_base_map(map_data: any): any {
    this._drawer.mmb.draw(map_data);
    this._drawer.mui.draw();
  }

  draw_artists_life_trajectory(artists: Artist[]): void {
    const traj_graph = new ArtistTrajectoryGraph(artists);
    this._drawer.atg.draw(traj_graph);
  }

  // --------------------------------------------------------------------------

  highlight_artists(artists: number[]) {
    this._drawer.atg.highlight_connections(artists);

    d3.selectAll('.selected-artists')
      .filter(function () {
        const id: number = Parse.int(d3.select(this).attr('artist-id'))!;
        return !artists.includes(id);
      })
      .style('opacity', '0.5');
  }
  highlight_no_artist() {
    this._drawer.atg.highlight_no_connection();
    d3.selectAll('.selected-artists').style('opacity', '1');
  }

  highlight_places(places: string[], year: number) {
    this._drawer.atg.highlight_places(places, year);
  }
  highlight_no_place() {
    this._drawer.atg.highlight_no_place();
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
    this._drawer.on_rescale();
  }

  // Zoom
  private get zoom() {
    return d3
      .zoom()
      .scaleExtent(this._zoom_threshold)
      .translateExtent([
        [0, 0],
        [this.width, this.height],
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
      .translate([0.15 * this.width, 1.84 * this.width])
      .scale(1.6 * this.width);
  }

  // Width & height
  public get width() {
    return this._width;
  }
  public set width(value: number) {
    this._width = value;
  }
  public get height() {
    return this._height;
  }
  public set height(value: number) {
    this._height = value;
    // Also set main menu options style
    d3.select('.main-map-options').style('height', `${this.height}px`);
  }

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  // Components
  private _graphs: GraphParts;
  private _map_svg: D3Selection;
  private _drawer: DrawerComponents;

  // Static settings
  private _zoom_threshold: [number, number] = [1.0, 4.0];
  private _year_range: [number, number] = [1905, 1915];

  // Dynamic settings
  private _current_scale: number = 1.0;
  private _width: number = 0;
  private _height: number = 0;

  // Drawing aids
  private _current_cs = 32;
  private _color_scheme = [
    d3.interpolateBlues,
    d3.interpolateBrBG,
    d3.interpolateBuGn, // 2
    d3.interpolateBuPu, // 3
    d3.interpolateCividis,
    d3.interpolateCool,
    d3.interpolateCubehelixDefault,
    d3.interpolateGnBu,
    d3.interpolateGreens,
    d3.interpolateGreys,
    d3.interpolateInferno,
    d3.interpolateMagma,
    d3.interpolateOrRd,
    d3.interpolateOranges,
    d3.interpolatePRGn,
    d3.interpolatePiYG,
    d3.interpolatePlasma,
    d3.interpolatePuBu,
    d3.interpolatePuBuGn,
    d3.interpolatePuOr,
    d3.interpolatePuRd, // 20
    d3.interpolatePurples,
    d3.interpolateRainbow, // 22
    d3.interpolateRdBu,
    d3.interpolateRdGy,
    d3.interpolateRdPu,
    d3.interpolateRdYlBu,
    d3.interpolateRdYlGn,
    d3.interpolateReds,
    d3.interpolateSinebow,
    d3.interpolateSpectral,
    d3.interpolateTurbo,
    d3.interpolateViridis, // 32
    d3.interpolateWarm, // 33
    d3.interpolateYlGn,
    d3.interpolateYlGnBu,
    d3.interpolateYlOrBr,
    d3.interpolateYlOrRd,
  ];

  private _color_scale: d3.ScaleSequential<string, never> = d3
    .scaleSequential()
    .domain(this._year_range)
    .interpolator(this._color_scheme[this._current_cs]);
}

class DrawerComponents {
  constructor(
    public mmb: MainMapBaseDrawer,
    public atg: ArtistTrajectoryGraphDrawer,
    public mui: MapUIDrawer,
  ) {}

  on_resize() {
    this.mmb.on_resize();
    this.atg.on_resize();
    this.mui.on_resize();
  }

  on_rescale() {
    this.mmb.on_rescale();
    this.atg.on_rescale();
  }
}

export interface GraphParts {
  canvas: D3Selection;
  base_map: D3Selection;
  places: D3Selection;
  s_conn: D3Selection;
  conn: D3Selection;
  ui: D3Selection;
}
