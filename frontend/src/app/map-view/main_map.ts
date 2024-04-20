import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Place } from '../../objects/place';
import { Artist } from '../../objects/artist';
import { Exhibition } from '../../objects/exhibition';
import { Host } from '../../objects/host';
import { DPConn, NDPConn, PlaceConnection } from './place_connection';

type D3Selection = d3.Selection<any, unknown, null, undefined>;
export class MainMap {
  private graphs: GraphParts;

  private map_svg: D3Selection;
  private width: number;
  private height: number;

  // Various settings
  private fill_color: string = '#fec';
  private selected_color: string = 'red';
  private zoom_threshold: [number, number] = [1.0, 4.0];
  private default_conn_width: number = 3;

  // Scale
  private scale_rule_circles: any = (d: any) =>
    (Math.log(d.hosts.length + 1) * 3) / this.current_scale;
  private scale_rule_path: any = (d: any) => 0.5 / this.current_scale;

  private _current_scale: number = 1.0;
  private get current_scale() {
    return this._current_scale;
  }
  private set current_scale(value: number) {
    this._current_scale = value;
    // Update path width
    this.graphs.base_map
      .selectAll('path')
      .attr('stroke-width', this.scale_rule_path);
    // Update circles
    this.graphs.places.selectAll('circle').attr('r', this.scale_rule_circles);
    // Update lines
    this.graphs.dir_conn
      .selectAll('line')
      .attr('stroke-width', this.default_conn_width / this.current_scale);
    this.graphs.n_dir_conn
      .selectAll('line')
      .attr('stroke-width', this.default_conn_width / this.current_scale);
  }

  // Zoom
  private get zoom() {
    return d3
      .zoom()
      .scaleExtent(this.zoom_threshold)
      .translateExtent([
        [0, 0],
        [this.width, this.height],
      ])
      .on('zoom', (e: any) => {
        // Update transforms / scale
        this.graphs.canvas.attr('transform', e.transform);
        this.current_scale = e.transform.k;
      });
  }

  // Projection
  private get projection() {
    return d3
      .geoEqualEarth()
      .translate([0.15 * this.width, 1.84 * this.width])
      .scale(1.6 * this.width);
  }

  // --------------------------------------------------------------------------

  constructor(map_element: Element) {
    this.map_svg = d3.select(map_element);

    // Get dimensions
    const rect = this.map_svg.node().getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Create graph with parts
    const canvas = this.map_svg
      .call(this.zoom)
      .append('g')
      .attr('id', 'canvas');
    this.graphs = {
      canvas: canvas,
      base_map: canvas.append('g').attr('id', 'main_map'),
      places: canvas.append('g').attr('id', 'places'),
      dir_conn: canvas.append('g').attr('id', 'dri_connections'),
      n_dir_conn: canvas.append('g').attr('id', 'n_dir_connections'),
    };
  }

  on_resize() {
    // Get dimensions
    const rect = this.map_svg.node().getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Update zoom
    this.map_svg.call(this.zoom);

    // Update projection
    const path: any = d3.geoPath().projection(this.projection);
    // Update paths
    this.graphs.base_map.selectAll('path').attr('d', path);
    // Update circles
    this.map_svg
      .selectAll('circle')
      .attr('cx', (d: any) => d.project(this.projection)[0])
      .attr('cy', (d: any) => d.project(this.projection)[1]);
  }

  // --------------------------------------------------------------------------

  draw_base_map(map_data: any): any {
    // generates the path coordinates from topojson
    const path: any = d3.geoPath().projection(this.projection);

    // map geometry
    const map_fe: GeoJSON.FeatureCollection | GeoJSON.Feature =
      topojson.feature(map_data, map_data.objects.europe);
    const map_geo =
      map_fe.type === 'Feature' ? [map_fe] : (map_fe as any).features;

    // generates and styles the SVG path
    const graph = this.graphs.base_map;
    graph
      .selectAll('path')
      .data(map_geo)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('stroke', 'black')
      .attr('stroke-width', this.scale_rule_path)
      .attr('fill', this.fill_color)
      .attr('data-id', (d: any) => d.id)
      .on('mouseover', (_: any, item: any) => {
        graph
          .select(`[data-id="${item.id}"]`)
          .transition()
          .duration(200)
          .attr('fill', this.selected_color);
      })
      .on('mouseout', (_: any, item: any) => {
        graph
          .select(`[data-id="${item.id}"]`)
          .transition()
          .duration(200)
          .attr('fill', this.fill_color);
      });
    // .on('click', (event, item) => {
    //   // country_color_selected(i.properties.id)
    // })
  }

  draw_places(places: Place[]): void {
    // Color will depend on host count
    const color: any = d3
      .scaleLog<string, number>()
      .domain([1, 60])
      .range(['black', 'blue']);

    // Add circles
    const graph = this.graphs.places;
    graph
      .selectAll('circle')
      .data(places)
      .enter()
      .append('circle')
      .attr('cx', (d: Place) => d.project(this.projection)[0])
      .attr('cy', (d: Place) => d.project(this.projection)[1])
      .attr('r', this.scale_rule_circles)
      .attr('fill', (d: Place) => color(d.hosts.length))
      .attr('data-id', (d: Place) => d.id!)
      .on('mouseover', (_: any, d: Place) => {
        graph
          .select(`[data-id="${d.id}"]`)
          .transition()
          .duration(200)
          .attr('fill', this.selected_color);
      })
      .on('mouseout', (_: any, d: Place) => {
        graph
          .select(`[data-id="${d.id}"]`)
          .transition()
          .duration(200)
          .attr('fill', color(d.hosts.length));
      });
  }

  draw_artists_life_trajectory(artist: Artist): void {
    // Get his exhibitions
    const exhibitions = artist.exhibited_exhibitions;

    // Get place connections
    const [place_conn, se_place_conn] =
      PlaceConnection.get_connections(exhibitions);

    console.log(place_conn);
    console.log(se_place_conn);

    // Get unique hosts
    const hosts: Host[] = [];
    exhibitions.forEach((e: Exhibition) => {
      e.took_place_in_hosts.forEach((h: Host) => {
        if (!hosts.some((hh: Host) => hh.id === h.id)) hosts.push(h);
      });
    });
    // Get places visited
    const places = Place.from_hosts(hosts);

    // Compute color scale for years (1902-1916)
    const color_scale = d3
      .scaleSequential()
      .domain([1902, 1916])
      .interpolator(d3.interpolateCubehelixDefault);

    // Graph directional connections for these places
    this.graphs.dir_conn
      .selectAll('line')
      .data(place_conn)
      .enter()
      .append('line')
      .attr('x1', (d: DPConn) => d.f.project(this.projection)[0])
      .attr('y1', (d: DPConn) => d.f.project(this.projection)[1])
      .attr('x2', (d: DPConn) => d.t.project(this.projection)[0])
      .attr('y2', (d: DPConn) => d.t.project(this.projection)[1])
      .attr('stroke', (d: DPConn) => color_scale(d.lfy))
      .attr('stroke-width', this.default_conn_width / this.current_scale);

    // Graph non-directional connections for these places
    this.graphs.n_dir_conn
      .selectAll('line')
      .data(se_place_conn)
      .enter()
      .append('line')
      .attr('x1', (d: NDPConn) => d.p1.project(this.projection)[0])
      .attr('y1', (d: NDPConn) => d.p1.project(this.projection)[1])
      .attr('x2', (d: NDPConn) => d.p2.project(this.projection)[0])
      .attr('y2', (d: NDPConn) => d.p2.project(this.projection)[1])
      .attr('stroke', 'black')
      .attr('stroke-width', this.default_conn_width / this.current_scale);

    // Graph places
    this.graphs.places
      .selectAll('circle')
      .data(places)
      .enter()
      .append('circle')
      .attr('cx', (d: Place) => d.project(this.projection)[0])
      .attr('cy', (d: Place) => d.project(this.projection)[1])
      .attr('r', this.scale_rule_circles);
  }
}

interface GraphParts {
  canvas: D3Selection;
  base_map: D3Selection;
  places: D3Selection;
  dir_conn: D3Selection;
  n_dir_conn: D3Selection;
}
