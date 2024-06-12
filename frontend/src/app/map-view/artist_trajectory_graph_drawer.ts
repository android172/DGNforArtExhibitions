import * as d3 from 'd3';
import { GraphParts, MainMap } from './main_map';
import {
  ArtistTrajectoryGraph,
  PConnPoint,
  PConn,
  PPoint,
} from './artist_trajectory_graph';
import { Vec2 } from '../../common/vec2';
import { Line } from '../../common/line';

let debug_points: Vec2[] = [];

export class ArtistTrajectoryGraphDrawer {
  // Constructor
  constructor(
    private _graphs: GraphParts,
    private _map: MainMap,
  ) {}

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  public draw(atg: ArtistTrajectoryGraph) {
    this._p_points = atg.places;
    this._conn_points = atg.connection_points;
    this._conns = atg.connections;
    this._s_conns = atg.self_connections;

    this.draw_places();
    this.draw_self_connections();
    this.draw_connections();
    // this.draw_debug_points();
  }

  public on_rescale() {
    // Update circles
    this._graphs.places
      .selectAll('.place-pie path')
      .attr('d', this._pie_arc_circles);
    this._graphs.conn
      .selectAll('.link')
      .attr('d', this._connection_curve)
      .attr('stroke-width', this._scale_rule_conn);
    this._graphs.s_conn
      .selectAll('.link')
      .attr('d', this._self_connection_curve)
      .attr('stroke-width', this._scale_rule_conn);
  }

  public on_resize() {
    // Update places
    this._graphs.places
      .selectAll('.place-pie')
      .attr(
        'transform',
        (d: any) =>
          `translate(${d.place.project(this._map.projection)[0]}, ` +
          `${d.place.project(this._map.projection)[1]})`,
      );
    // Update gradient
    this._graphs.conn
      .selectAll('linearGradient')
      .attr('x1', (d: any) => {
        const [p, o] = this.compute_connection_location(d.p1, this._s_offset);
        return p.x + o.x;
      })
      .attr('y1', (d: any) => {
        const [p, o] = this.compute_connection_location(d.p1, this._s_offset);
        return p.y + o.y;
      })
      .attr('x2', (d: any) => {
        const [p, o] = this.compute_connection_location(d.p2, this._e_offset);
        return p.x + o.x;
      })
      .attr('y2', (d: any) => {
        const [p, o] = this.compute_connection_location(d.p2, this._e_offset);
        return p.y + o.y;
      });
    // Update connections
    this._graphs.conn.selectAll('.link').attr('d', this._connection_curve);
    // Update self connections
    this._graphs.s_conn
      .selectAll('.link')
      .attr('d', this._self_connection_curve);
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
      .data(this._p_points)
      .join(
        (enter) =>
          enter
            .append('g')
            .attr('class', 'place-pie')
            .attr(
              'transform',
              (d) =>
                `translate(${d.place.project(this._map.projection)[0]}, ` +
                `${d.place.project(this._map.projection)[1]})`,
            ),
        (update) =>
          update.attr(
            'transform',
            (d) =>
              `translate(${d.place.project(this._map.projection)[0]}, ` +
              `${d.place.project(this._map.projection)[1]})`,
          ),
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
            .attr('stroke-width', 0)
            .attr('d', this._pie_arc_circles)
            .attr('fill', (d) => this._color_scale(d.data)),
        (update) =>
          update
            .attr('d', this._pie_arc_circles)
            .attr('fill', (d) => this._color_scale(d.data)),
        (exit) => exit.remove(),
      );
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
      .attr('x1', (d) => {
        const [p, o] = this.compute_connection_location(d.p1, this._s_offset);
        return p.x + o.x;
      })
      .attr('y1', (d) => {
        const [p, o] = this.compute_connection_location(d.p1, this._s_offset);
        return p.y + o.y;
      })
      .attr('x2', (d) => {
        const [p, o] = this.compute_connection_location(d.p2, this._e_offset);
        return p.x + o.x;
      })
      .attr('y2', (d) => {
        const [p, o] = this.compute_connection_location(d.p2, this._e_offset);
        return p.y + o.y;
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
            .attr('stroke-opacity', 0.7)
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
      );
  }

  private draw_self_connections() {
    // Draw self connections
    this._graphs.s_conn
      .selectAll('.link')
      .data(this._s_conns)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', this._scale_rule_conn)
            .attr('d', this._self_connection_curve),
        (update) =>
          update
            .attr('stroke-width', this._scale_rule_conn)
            .attr('d', this._self_connection_curve),
        (exit) => exit.remove(),
      );
  }

  private compute_connection_location(
    cp_index: number,
    offset: number = 0.5,
  ): [Vec2, Vec2] {
    const cp = this._conn_points[cp_index];
    const pp = this._p_points[cp.pl_index];
    const p_loc = new Vec2(pp.place.project(this._map.projection));
    const year_l = pp.years.length;
    const year_i = pp.years.indexOf(cp.year);
    const angle = Math.PI / 2.0 - ((year_i + offset) / year_l) * 2.0 * Math.PI;
    const radius = this._scale_rule_circles(year_l);

    return [
      p_loc,
      new Vec2(Math.cos(angle) * radius, -Math.sin(angle) * radius),
    ];
  }

  private draw_debug_points() {
    this._graphs.base_map
      .append('g')
      .attr('id', 'debug-points')
      .selectAll('circle')
      .data(debug_points)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 0.5)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.8);
  }

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------
  private _p_points: PPoint[] = [];
  private _conn_points: PConnPoint[] = [];
  private _conns: PConn[] = [];
  private _s_conns: PConn[] = [];

  // Configurations
  private _small_circle_max = 4;
  private _year_range: [number, number] = [1902, 1916];
  private _s_offset: number = 0.65;
  private _e_offset: number = 0.35;

  // Drawing aids
  private _color_scale = d3
    .scaleSequential()
    .domain(this._year_range)
    .interpolator(d3.interpolateCubehelixDefault);
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
    (1 * d.weight) / this._map.current_scale;

  private _self_connection_curve = (d: any) => {
    if (d.p1 == d.p2) return ``;
    const [s_loc, s_dir] = this.compute_connection_location(d.p1);
    const [e_loc, e_dir] = this.compute_connection_location(d.p2);
    return compute_connection(
      { pos: s_loc, dir: s_dir },
      { pos: e_loc, dir: e_dir },
    );
  };
  private _connection_curve = (d: any) => {
    if (d.p1 == d.p2) return ``;

    // Get connection locations and direction
    const [s_loc, s_dir] = this.compute_connection_location(
      d.p1,
      this._s_offset,
    );
    const [e_loc, e_dir] = this.compute_connection_location(
      d.p2,
      this._e_offset,
    );

    // Check if this connects to the same place, on a multi-tired node
    const cp1 = this._conn_points[d.p1];
    const cp2 = this._conn_points[d.p2];
    const year_l = this._p_points[cp1.pl_index].years.length;
    if (cp1.pl_index === cp2.pl_index && year_l > this._small_circle_max) {
      // Yeah, we need to create inner connection instead
      const inner_scale = this._scale_rule_circles(year_l - 2);

      const is_dir = s_dir.normalized().times(inner_scale);
      const ie_dir = e_dir.normalized().times(inner_scale);

      const s_pos = s_loc.add(is_dir);
      const e_pos = s_loc.add(ie_dir);

      const sc_pos = s_loc.add(is_dir.times(0.25));
      const ec_pos = e_loc.add(ie_dir.times(0.25));

      return compute_cmd([s_pos, sc_pos, ec_pos, e_pos]);
    }

    // No? Default behavior
    return compute_connection(
      { pos: s_loc, dir: s_dir },
      { pos: e_loc, dir: e_dir },
    );
  };
}

// ----------------------------------------------------------------------------
// Private utility type
// ----------------------------------------------------------------------------
// Position direction pack
interface PDP {
  pos: Vec2;
  dir: Vec2;
}

// ----------------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------------

function compute_connection(in_s_pdp: PDP, in_e_pdp: PDP): string {
  // Parse input
  const s_loc = in_s_pdp.pos;
  const e_loc = in_e_pdp.pos;
  const s_dir = in_s_pdp.dir;
  const e_dir = in_e_pdp.dir;

  // Compute start and end point
  const s_point = s_loc.add(s_dir);
  const e_point = e_loc.add(e_dir);

  // Get these points
  const s_pdp: PDP = { pos: s_point, dir: s_dir };
  const e_pdp: PDP = { pos: e_point, dir: e_dir };

  // Connect these points differently depending on their relative relation.
  // CCheck if these points see each other
  const se_dir = e_point.sub(s_point).normalized();
  const es_dir = s_point.sub(e_point).normalized();
  const s_sees_e = s_dir.dot(se_dir) > 0;
  const e_sees_s = e_dir.dot(es_dir) > 0;

  // If they are looking at each other simple connection will suffice
  if (s_sees_e && e_sees_s) return compute_path([s_pdp, e_pdp]);

  // If at least one is obscured we need to add additional points
  if (s_sees_e) {
    // We will need to cast a ray from start to end
    const se_line = new Line(s_point, se_dir);

    // Intersect end circle
    const intersection = se_line.intersect_circle(e_loc, e_dir.sq_mag());

    // If there is no intersection (Shouldn't really happen)
    if (intersection === undefined || intersection instanceof Vec2)
      return compute_path([s_pdp, e_pdp]);

    // Get intersection midpoint
    let m_pdp = compute_mid(intersection, in_e_pdp);
    // Midpoint direction will point towards the end, fix this
    m_pdp.dir = m_pdp.dir.negate();

    // Compute control points
    return compute_path([s_pdp, m_pdp, e_pdp]);
  }

  // We will need to cast a ray from end to start
  const es_line = new Line(e_point, es_dir);

  // Intersect end circle
  let intersection = es_line.intersect_circle(s_loc, s_dir.sq_mag());

  // If there is no intersection (Shouldn't really happen)
  if (intersection === undefined || intersection instanceof Vec2)
    return compute_path([s_pdp, e_pdp]);

  // Get intersection midpoint
  // Midpoint direction will point towards the start
  const m_pdp = compute_mid(intersection, in_s_pdp);

  if (e_sees_s)
    // If end sees start we are done with this
    return compute_path([s_pdp, m_pdp, e_pdp]);

  // They didn't see each other at all
  // Check if that changes with new point `m`
  const em_dir = m_pdp.pos.sub(e_point).normalized();
  const e_sees_m = e_dir.dot(em_dir) > 0;

  if (e_sees_m)
    // We can connect them after all
    return compute_path([s_pdp, m_pdp, e_pdp]);

  // No? Guess we will have to add one final point.
  // Cast a ray from end to `m`
  const em_line = new Line(e_point, em_dir);

  // Intersect end circle
  intersection = em_line.intersect_circle(e_loc, e_dir.sq_mag());

  // If there is no intersection (Shouldn't really happen)
  if (intersection === undefined || intersection instanceof Vec2)
    // We can connect them after all
    return compute_path([s_pdp, m_pdp, e_pdp]);

  // Get intersection midpoint
  const n_pdp = compute_mid(intersection, in_e_pdp);
  // Midpoint direction will point towards the end, fix that
  n_pdp.dir = n_pdp.dir.negate();

  // Compute most complicated path
  return compute_path([s_pdp, m_pdp, n_pdp, e_pdp]);
}

function compute_path(pdp_array: PDP[]): string {
  // Add first
  const [cp1, cp2] = compute_cps(pdp_array[0], pdp_array[1]);
  const cps: Vec2[] = [pdp_array[0].pos, cp1, cp2, pdp_array[1].pos];

  // Add additional
  for (let i = 1; i < pdp_array.length - 1; i++) {
    let pdp1 = pdp_array[i];
    let pdp2 = pdp_array[i + 1];

    // Reverse last direction
    pdp1.dir = pdp1.dir.negate();

    // Add next point
    const [cpi, cpj] = compute_cps(pdp1, pdp2);
    cps.push(cpi);
    cps.push(cpj);
    cps.push(pdp2.pos);
  }

  cps.forEach((cp) => {
    debug_points.push(cp);
  });

  // Transform into path command
  return compute_cmd(cps);
}

// Compute bezier control points between subsequent points
function compute_cps(pdp1: PDP, pdp2: PDP): [Vec2, Vec2] {
  const [p1, d1, p2, d2] = [pdp1.pos, pdp1.dir, pdp2.pos, pdp2.dir];

  // Check if intersection might be too far away in positive dor
  if (d1.dot(d2) < 0) {
    // Compute intersection
    const l1 = new Line(p1, d1);
    const l2 = new Line(p2, d2);
    const int = l1.intersect_line(l2);

    // Check if they intersect at -infinity
    if (
      int !== undefined &&
      // Intersection exists, check if its its behind one of the points
      // [x := p.x + d.x * t] => [t := (int.x - p.x) / d.x]
      (int.x - p1.x) / d1.x > 0 &&
      (int.x - p2.x) / d2.x > 0
    ) {
      // When none of the above is true arc between two points
      const f1 = Math.max(Vec2.dist(int, p1), d1.mag());
      const f2 = Math.max(Vec2.dist(int, p2), d2.mag());
      return [
        p1.add(d1.normalized().times(f1)),
        p2.add(d2.normalized().times(f2)),
      ];
    }
  }

  // If not invoke default solution
  // We are trying to find factor `f`, such that all straight line segments of
  // [p1, f*d1, f*d2 p2] have the same length
  // Step1: Define requirements
  const d1_n = d1.normalized();
  const d2_n = d2.normalized();
  const p12 = p2.sub(p1);
  const d12 = d2_n.sub(d1_n);

  // Step2: Solve quadratic equation for f
  const a = 1.0 - 2.0 * d1_n.dot(d2_n);
  const b = 2.0 * p12.dot(d12);
  const c = p12.sq_mag();

  const d = b * b - 4 * a * c;

  // If no solution is found, use default `f = 1`
  if (d < 0) return [p1.add(d1), p2.add(d2)];

  // Step 3: Choose smallest f > 1
  const f1 = (-b + Math.sqrt(d)) / (2 * a);
  const f2 = (-b - Math.sqrt(d)) / (2 * a);
  let f = f1 < 0 || f2 < 0 ? Math.max(f1, f2) : Math.min(f1, f2);

  f = Math.max(f, 0);

  return [p1.add(d1_n.times(f)), p2.add(d2_n.times(f))];
}

// Turn control point array into commands
function compute_cmd(cps: Vec2[]): string {
  // Map points to string
  const cps_s: string[] = cps.map((cp) => `${cp.x},${cp.y}`);

  // Concat all into a command
  let command: string = `M ${cps_s[0]}`;
  for (let i = 1; i < cps.length; i += 3)
    command += ` C ${cps_s[i]} ${cps_s[i + 1]} ${cps_s[i + 2]}`;

  // Return
  return command;
}

// Get intersection mid point
function compute_mid(ints: [Vec2, Vec2], pdp: PDP): PDP {
  const [pos, dir] = [pdp.pos, pdp.dir];

  // Get intersection midpoint
  const int_mid = Vec2.average(ints[0], ints[1]);
  const to_mid = int_mid.sub(pos);

  // Compute midpoint direction
  const mid_dir =
    to_mid.sq_mag() < Number.EPSILON
      ? dir.orthogonal().normalized()
      : to_mid.normalized();

  // Compute path midpoint
  const m_point = pos.add(mid_dir.times(dir.mag() * 1.75));

  // Compute path midpoint center
  let m_dir = mid_dir.orthogonal().normalized();
  if (m_dir.dot(dir) < 0) m_dir = m_dir.negate();

  return { pos: m_point, dir: m_dir };
}
