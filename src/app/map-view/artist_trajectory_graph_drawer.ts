import * as d3 from 'd3';
import { GraphParts, MainMap } from './main_map';
import {
  ArtistTrajectoryGraph,
  PConnPoint,
  PConn,
  PPoint,
} from './artist_trajectory_graph';
import { Vec2 } from '../../common/vec2';
import { GraphDrawer } from '../../algorithms/graph_drawer';

export class ArtistTrajectoryGraphDrawer {
  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  private _place_points: PPoint[] = [];
  private _conn_points: PConnPoint[] = [];
  private _conns: PConn[] = [];
  private _conns_self: PConn[] = [];
  private _graph_drawer: GraphDrawer = new GraphDrawer();

  private _tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  // Configurations
  private _small_circle_max = 4;
  private _s_offset: number = 0.65;
  private _e_offset: number = 0.35;
  private _default_opp: number = 0.85;

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------
  constructor(
    private _map: MainMap,
    private _graphs: GraphParts,
    private _color_scale: any,
  ) {
    // Create tooltip obj
    this._tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '5px')
      .style('border-radius', '3px')
      .style('pointer-events', 'none')
      .style('opacity', 0); // Initially hidden
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  public draw(atg: ArtistTrajectoryGraph) {
    this._place_points = atg.places;
    this._conn_points = atg.connection_points;
    this._conns = atg.connections;
    this._conns_self = atg.connections_self;

    // Register data to graph drawer
    this._graph_drawer.clear();
    for (const place_point of this._place_points) {
      const loc = new Vec2(place_point.place.location);
      const rad = place_point.years.length;
      this._graph_drawer.add_point(loc, rad);
    }
    this._graph_drawer.update(this._map.projection, this._scale_rule_circles);

    this.draw_places();
    this.draw_self_connections();
    this.draw_connections();
  }

  public highlight_connections(artists: number[]) {
    this._graphs.conn
      .selectAll('.link')
      .transition()
      .duration(200)
      .attr('stroke-opacity', (d: any) => {
        for (const a of d.artists) {
          if (artists.includes(a)) return 1;
        }
        return 0.2;
      });
    this._graphs.s_conn
      .selectAll('.link')
      .transition()
      .duration(200)
      .attr('stroke-opacity', (d: any) => {
        for (const a of d.artists) {
          if (artists.includes(a)) return 1;
        }
        return 0.2;
      });
  }

  public highlight_no_connection() {
    this._graph_drawer;
    this._graphs.conn
      .selectAll('.link')
      .transition()
      .duration(200)
      .attr('stroke-opacity', this._default_opp);
    this._graphs.s_conn
      .selectAll('.link')
      .transition()
      .duration(200)
      .attr('stroke-opacity', this._default_opp);
  }

  public highlight_places(places: string[], year: number) {
    this._graphs.places
      .selectAll('.place-pie path')
      .transition()
      .duration(200)
      .style('opacity', function (d: any) {
        const this_place: string = d3
          .select((this as any).parentNode)
          .attr('place');
        const this_year: number = d.data;
        return this_year === year && places.includes(this_place) ? 1 : 0.2;
      });
  }
  public highlight_no_place() {
    this._graphs.places
      .selectAll('.place-pie path')
      .transition()
      .duration(200)
      .style('opacity', this._default_opp);
  }

  public on_rescale() {
    // Update drawer
    this._graph_drawer.update(this._map.projection, this._scale_rule_circles);
    // Update circles
    this._graphs.places
      .selectAll('.place-pie')
      .attr('transform', this._place_location)
      .selectAll('path')
      .attr('d', this._pie_arc_circles);
    // Update connections
    this._graphs.conn
      .selectAll('.link')
      .attr('d', this._connection_curve)
      .attr('stroke-width', this._scale_rule_conn);
    this._graphs.s_conn
      .selectAll('.link')
      .attr('d', this._connection_self_curve)
      .attr('stroke-width', this._scale_rule_conn);
  }

  public on_resize() {
    // Update drawer
    this._graph_drawer.update(this._map.projection, this._scale_rule_circles);
    // Update circles
    this._graphs.places
      .selectAll('.place-pie')
      .attr('transform', this._place_location)
      .selectAll('path')
      .attr('d', this._pie_arc_circles);
    // Update gradient
    this._graphs.conn.selectAll('linearGradient').each((d: any, i, nodes) => {
      const [p1, p2, o1, o2] = this.compute_connection_location(d);

      d3.select(nodes[i])
        .attr('x1', p1.x + o1.x)
        .attr('y1', p1.y + o1.y)
        .attr('x2', p2.x + o2.x)
        .attr('y2', p2.y + o2.y);
    });
    // Update connections
    this._graphs.conn.selectAll('.link').attr('d', this._connection_curve);
    // Update self connections
    this._graphs.s_conn
      .selectAll('.link')
      .attr('d', this._connection_self_curve);
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------
  private draw_places() {
    // Get pie
    const pie = d3
      .pie<number>()
      .value(() => 1)
      .sort(null);

    // Bind data for places
    const groups = this._graphs.places
      .selectAll('g')
      .data(this._place_points)
      .join(
        (enter) =>
          enter
            .append('g')
            .attr('class', 'place-pie')
            .attr('place', (d) => d.place.place!)
            .attr('transform', this._place_location),
        (update) =>
          update
            .attr('place', (d) => d.place.place!)
            .attr('transform', this._place_location),
        (exit) => exit.remove(),
      );

    // Draw the pie charts
    groups
      .selectAll('path')
      .data((d) => pie(d.years))
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('opacity', this._default_opp)
            .attr('stroke-width', 0)
            .attr('d', this._pie_arc_circles)
            .attr('fill', (d) => this._color_scale(d.data)),
        (update) =>
          update
            .attr('d', this._pie_arc_circles)
            .attr('fill', (d) => this._color_scale(d.data)),
        (exit) => exit.remove(),
      )
      .on('mouseenter', (event, d) => {
        const place = d3.select(event.currentTarget.parentNode).attr('place');
        const year = d.data;

        // Update the tooltip content
        this._tooltip
          .html(`${place} [${year}]`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`)
          .style('opacity', 1); // Make it visible

        // Highlight this place
        this._map.highlight_places([place], year);
      })
      .on('mouseout', (_) => {
        // Hide the tooltip
        this._tooltip.style('opacity', 0);

        // Remove highlighting
        this._map.highlight_no_place();
      })
      .on('mousemove', (event) => {
        // Update tooltip position
        this._tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      });
  }

  private draw_connections() {
    // Create arrow markers
    this._graphs.conn
      .append('defs')
      .selectAll('marker')
      .data(this._conns)
      .enter()
      .append('marker')
      .attr('id', (_, i) => `end${i}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .attr('fill', (d) => this._color_scale(this._conn_points[d.p2].year))
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create the gradient first
    this._graphs.conn
      .append('defs')
      .selectAll('linearGradient')
      .data(this._conns)
      .join('linearGradient')
      .attr('id', (_, i) => `gradient${i}`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .each((d: any, i, nodes) => {
        const [p1, p2, o1, o2] = this.compute_connection_location(d);

        d3.select(nodes[i])
          .attr('x1', p1.x + o1.x)
          .attr('y1', p1.y + o1.y)
          .attr('x2', p2.x + o2.x)
          .attr('y2', p2.y + o2.y);
      })
      .selectAll('stop')
      .data((d) => [
        {
          offset: '0%',
          color: this._color_scale(this._conn_points[d.p1].year),
        },
        {
          offset: '100%',
          color: this._color_scale(this._conn_points[d.p2].year),
        },
      ])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    // Draw connections
    this._graphs.conn
      .selectAll('.link')
      .data(this._conns)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', (_, i) => `url(#gradient${i})`)
            .attr('stroke-opacity', this._default_opp)
            .attr('stroke-width', this._scale_rule_conn)
            .attr('marker-end', (_, i) => `url(#end${i})`)
            .attr('d', this._connection_curve),
        (update) =>
          update
            .attr('stroke', (_, i) => `url(#gradient${i})`)
            .attr('marker-end', (_, i) => `url(#end${i})`)
            .attr('stroke-width', this._scale_rule_conn)
            .attr('d', this._connection_curve),
        (exit) => exit.remove(),
      )
      .on('mouseover', (_, d) => {
        this._map.highlight_artists(d.artists);
      })
      .on('mouseout', (_) => {
        this._map.highlight_no_artist();
      });
  }

  private draw_self_connections() {
    // Draw self connections
    this._graphs.s_conn
      .selectAll('.link')
      .data(this._conns_self)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-opacity', this._default_opp)
            .attr('stroke-width', this._scale_rule_conn)
            .attr('d', this._connection_self_curve),
        (update) =>
          update
            .attr('stroke-width', this._scale_rule_conn)
            .attr('d', this._connection_self_curve),
        (exit) => exit.remove(),
      )
      .on('mouseover', (_, d) => {
        this._map.highlight_artists(d.artists);
      })
      .on('mouseout', (_) => {
        this._map.highlight_no_artist();
      });
  }

  private compute_connection_location(
    conn: PConn,
    self: boolean = false,
  ): [Vec2, Vec2, Vec2, Vec2] {
    // Compute point location callback
    const loc = (cp: PConnPoint) =>
      this._graph_drawer.point_location(cp.pl_index);

    // Compute direction callback
    const dir = (cp: PConnPoint, offset: number = 0.5) => {
      const p_ptn = this._place_points[cp.pl_index];
      const y_len = p_ptn.years.length;
      const y_ndx = p_ptn.years.indexOf(cp.year);
      const angle = Math.PI / 2.0 - ((y_ndx + offset) / y_len) * 2.0 * Math.PI;
      const c_rad = this._scale_rule_circles(y_len);
      return new Vec2(Math.cos(angle) * c_rad, -Math.sin(angle) * c_rad);
    };

    // Get connection points
    const cp1 = this._conn_points[conn.p1];
    const cp2 = this._conn_points[conn.p2];

    // For self connections just return points connected at midpoint
    if (self) return [loc(cp1), loc(cp2), dir(cp1), dir(cp2)];

    // Compute connection location and direction
    let cp1_loc = loc(cp1);
    let cp2_loc = loc(cp2);
    let cp1_dir = dir(cp1, this._s_offset);
    let cp2_dir = dir(cp2, this._e_offset);

    // Check if this connects to the same place, on a multi-tired node
    const year_l = this._place_points[cp1.pl_index].years.length;
    if (cp1.pl_index === cp2.pl_index && year_l > this._small_circle_max) {
      // Yeah, we need to create inner connection instead
      const inner_scale = this._scale_rule_circles(year_l - 2);

      // Fix locations
      cp1_loc = cp1_loc.add(cp1_dir.normalized().times(inner_scale + 1));
      cp2_loc = cp2_loc.add(cp2_dir.normalized().times(inner_scale + 1));

      // Fix directions
      cp1_dir = cp1_dir.normalized().negate();
      cp2_dir = cp2_dir.normalized().negate();
    }

    // For
    return [cp1_loc, cp2_loc, cp1_dir, cp2_dir];
  }

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  // Drawing aids
  private _pie_arc_circles = d3
    .arc<any>()
    .innerRadius((d) => {
      const rad = (2 * Math.PI) / (d.endAngle - d.startAngle);
      return rad > this._small_circle_max
        ? this._scale_rule_circles(rad - 2)
        : 0;
    })
    .outerRadius((d) => {
      const rad = (2 * Math.PI) / (d.endAngle - d.startAngle);
      return this._scale_rule_circles(rad);
    });

  // Drawing rules
  private _scale_rule_circles = (d: number) =>
    (2.5 * d) / Math.sqrt(this._map.current_scale);
  private _scale_rule_conn = (d: any) =>
    (1 * d.artists.length) / Math.log(1 + 2 * this._map.current_scale);

  private _place_location = (_: any, i: number) => {
    const location = this._graph_drawer.point_location(i);
    return `translate(${location.x}, ` + `${location.y})`;
  };
  private _connection_self_curve = (d: any) => {
    if (d.p1 === d.p2) return ``;
    const [x, y, z, w] = this.compute_connection_location(d, true);
    return this._graph_drawer.add_connection(x, y, z, w);
  };
  private _connection_curve = (d: any) => {
    if (d.p1 === d.p2) return ``;
    const [x, y, z, w] = this.compute_connection_location(d);
    return this._graph_drawer.add_connection(x, y, z, w);
  };
}
