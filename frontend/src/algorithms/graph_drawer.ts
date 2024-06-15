import { Line } from '../common/line';
import { Vec2 } from '../common/vec2';

export class GraphDrawer {
  private _points_og: { loc: Vec2; rad: number }[] = [];
  private _points: { loc: Vec2; rad: number }[] = [];

  constructor() {}

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  public update(projection: any, scale: any) {
    // Apply update to all points
    this._points = [];
    for (const point of this._points_og) {
      this._points.push({
        loc: point.loc.apply(projection),
        rad: scale(point.rad),
      });
    }

    // Readjust
    for (let i = 0; i < this._points.length; i++) {
      let location = this._points[i].loc;
      let radius = this._points[i].rad;

      // Move point away from other points to reduce clutter
      for (const point of this._points) {
        const p_loc = point.loc;
        const p_rad = point.rad;

        // Smaller points are easier to move
        if (radius < p_rad) {
          // Detect collision based on distance
          const dist = Vec2.dist(location, p_loc);
          const min_dist = 2 * p_rad + radius;

          if (dist < min_dist) {
            // There is a collision, resolve it by moving backwards
            const dir = location.sub(p_loc).normalized().times(min_dist);
            location = p_loc.add(dir);
          }
        }
      }

      // Add point
      this._points[i].loc = location;
    }
  }

  public clear() {
    this._points_og = [];
  }

  public add_point(location: Vec2, radius: number) {
    this._points_og.push({ loc: location, rad: radius });
  }

  public point_location(index: number): Vec2 {
    return this._points[index].loc;
  }

  public add_connection(
    s_loc: Vec2,
    e_loc: Vec2,
    s_dir: Vec2,
    e_dir: Vec2,
  ): string {
    const in_s_pdp = { pos: s_loc, dir: s_dir };
    const in_e_pdp = { pos: e_loc, dir: e_dir };

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

    // By default we return default return
    const default_return = () =>
      this.compute_path(this.resolve_intersections([s_pdp, e_pdp]));

    // If they are looking at each other simple connection will suffice
    if (s_sees_e && e_sees_s) return default_return();

    // If at least one is obscured we need to add additional points
    if (s_sees_e) {
      // We will need to cast a ray from start to end
      const se_line = new Line(s_point, se_dir);

      // Intersect end circle
      const intersection = se_line.intersect_circle(e_loc, e_dir.sq_mag());

      // If there is no intersection (Shouldn't really happen)
      if (intersection === undefined || intersection instanceof Vec2)
        return default_return();

      // Get intersection midpoint
      let m_pdp = this.compute_mid(intersection, in_e_pdp);
      // Midpoint direction will point towards the end, fix this
      m_pdp.dir = m_pdp.dir.negate();

      // Resolve intersections from start to midpoint
      const pdp_array = this.resolve_intersections([s_pdp, m_pdp]);
      pdp_array.push(e_pdp);

      // Compute control points
      return this.compute_path(pdp_array);
    }

    // We will need to cast a ray from end to start
    const es_line = new Line(e_point, es_dir);

    // Intersect end circle
    let intersection = es_line.intersect_circle(s_loc, s_dir.sq_mag());

    // If there is no intersection (Shouldn't really happen)
    if (intersection === undefined || intersection instanceof Vec2)
      return default_return();

    // Get intersection midpoint
    // Midpoint direction will point towards the start
    const m_pdp = this.compute_mid(intersection, in_s_pdp);

    // If they don't see each other at all
    // Check if that changes with new point `m`
    const em_dir = m_pdp.pos.sub(e_point).normalized();
    const e_sees_m = e_dir.dot(em_dir) > 0;

    // Check if they don't see each other
    if (!e_sees_s && !e_sees_m) {
      // No? Guess we will have to add one final point.
      // Cast a ray from end to `m`
      const em_line = new Line(e_point, em_dir);

      // Intersect end circle
      intersection = em_line.intersect_circle(e_loc, e_dir.sq_mag());

      // If there is no intersection (Shouldn't really happen)
      if (intersection instanceof Array) {
        // Get intersection midpoint
        const n_pdp = this.compute_mid(intersection, in_e_pdp);
        // Midpoint direction will point towards the end, fix that
        n_pdp.dir = n_pdp.dir.negate();

        // Resolve circle intersection between m & n
        const pdp_array = [s_pdp];
        pdp_array.push(...this.resolve_intersections([m_pdp, n_pdp]));
        pdp_array.push(e_pdp);

        // Compute most complicated path
        return this.compute_path(pdp_array);
      }
    }

    // If end sees start or mid we are done with this
    const pdp_array = [s_pdp];
    pdp_array.push(...this.resolve_intersections([m_pdp, e_pdp]));
    return this.compute_path(pdp_array);
  }

  // Turn control point array into commands
  public compute_cmd(cps: Vec2[]): string {
    // Map points to string
    const cps_s: string[] = cps.map((cp) => `${cp.x},${cp.y}`);

    // Concat all into a command
    let command: string = `M ${cps_s[0]}`;
    for (let i = 1; i < cps.length; i += 3)
      command += ` C ${cps_s[i]} ${cps_s[i + 1]} ${cps_s[i + 2]}`;

    // Return
    return command;
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------
  private resolve_intersections(pdp_array: PDP[]): PDP[] {
    const res_pdp_array: PDP[] = [pdp_array[0]];

    // Add all segments as unchecked
    const unchecked_segments: [PDP, PDP][] = [];
    for (let i = 1; i < pdp_array.length; i++)
      unchecked_segments.push([pdp_array[i - 1], pdp_array[i]]);

    // Until all segments are intersection free
    while (unchecked_segments.length > 0) {
      // Get next segment to check
      const [pdp_1, pdp_2] = unchecked_segments.pop()!;

      // Check for intersection
      const pdp_m = this.intersects_scene([pdp_1, pdp_2]);

      // if there is a collision bypass it
      if (pdp_m) {
        // New segments will also need checking
        unchecked_segments.push([pdp_m, pdp_2]);
        unchecked_segments.push([pdp_1, pdp_m]);
      }
      // Otherwise we can add this segment to final line
      else {
        res_pdp_array.push(pdp_2);
      }
    }

    return res_pdp_array;
  }

  private intersects_scene(pdp2: [PDP, PDP]): PDP | undefined {
    const s_pos = pdp2[0].pos;
    const e_pos = pdp2[1].pos;

    // Get max distance we will check for intersections
    const s_to_e = e_pos.sub(s_pos);
    const t_max = s_to_e.mag();

    // Define path line
    const line = new Line(s_pos, s_to_e);

    // Closest info
    let min_dist = 100000;
    let mid_dir = new Vec2(0, 0);
    let bypass: PDP | undefined = undefined;

    // Check all points
    for (const point of this._points) {
      // Intersect
      const t = line.intersect_circle_t(point.loc, point.rad * 1.1);

      // No intersection => no midpoint
      if (t === undefined || t.length === 1) continue;
      const [t1, t2] = t[1] > t[0] ? t : [t[1], t[0]];

      // Don't bother with circles that are behind us
      // We also have predefined assumption that we are not inside any circles.
      if (t1 < 0) continue;

      // Check if this intersection is behind our goal
      // We also assume that goal is not contained within any circle
      if (t2 > t_max) continue;

      // Check if this is the closest intersection
      if (t1 < min_dist) {
        min_dist = t1;

        // Compute bypass point
        const mid = Vec2.average(line.point(t1), line.point(t2));
        const to_mid = mid.sub(point.loc);
        mid_dir =
          to_mid.sq_mag() < Number.EPSILON
            ? line.d.orthogonal()
            : to_mid.normalized();
        const b_pos = point.loc.add(
          mid_dir.times(point.rad * 1.25 + to_mid.mag()),
        );
        const b_dir = line.d.negate();

        bypass = { pos: b_pos, dir: b_dir };
      }
    }

    // If no intersection is found we are done
    if (bypass === undefined) return undefined;

    // Closest intersection mid point is declared as optimal bypass
    // Now lets make sure no points contain it
    this.force_outside_points(bypass, mid_dir);

    return bypass;
  }

  private force_outside_points(pdp: PDP, dir: Vec2): PDP {
    let conflict_found;
    do {
      conflict_found = false;
      for (const point of this._points) {
        const dist = Vec2.dist(pdp.pos, point.loc);
        if (dist < point.rad) {
          pdp.pos = pdp.pos.add(dir.times(point.rad + dist));
          conflict_found = true;
          break;
        }
      }
    } while (conflict_found);
    return pdp;
  }

  private compute_path(pdp_array: PDP[]): string {
    // Add first
    const [cp1, cp2] = this.compute_cps(pdp_array[0], pdp_array[1]);
    const cps: Vec2[] = [pdp_array[0].pos, cp1, cp2, pdp_array[1].pos];

    // Add additional
    for (let i = 1; i < pdp_array.length - 1; i++) {
      let pdp1 = pdp_array[i];
      let pdp2 = pdp_array[i + 1];

      // Reverse last direction
      pdp1.dir = pdp1.dir.negate();

      // Add next point
      const [cpi, cpj] = this.compute_cps(pdp1, pdp2);
      cps.push(cpi);
      cps.push(cpj);
      cps.push(pdp2.pos);
    }

    // Transform into path command
    return this.compute_cmd(cps);
  }

  // Compute bezier control points between subsequent points
  private compute_cps(pdp1: PDP, pdp2: PDP): [Vec2, Vec2] {
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

  // Get intersection mid point
  private compute_mid(ints: [Vec2, Vec2], pdp: PDP): PDP {
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
    const m_point = pos.add(mid_dir.times(dir.mag() * 1.25 + to_mid.mag()));

    // Compute path midpoint center
    let m_dir = mid_dir.orthogonal().normalized();
    if (m_dir.dot(dir) < 0) m_dir = m_dir.negate();

    // Make sure this point is outside all circles
    const m_pdp = this.force_outside_points(
      { pos: m_point, dir: m_dir },
      mid_dir,
    );

    return m_pdp;
  }
}

// ----------------------------------------------------------------------------
// Private utility type
// ----------------------------------------------------------------------------
// Position direction pack
interface PDP {
  pos: Vec2;
  dir: Vec2;
}
