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

  public compute_path_pdp(
    s_loc: Vec2,
    e_loc: Vec2,
    s_dir: Vec2,
    e_dir: Vec2,
  ): PDP[] {
    // Compute start and end point
    const s_point = s_loc.add(s_dir);
    const e_point = e_loc.add(e_dir);

    // Get these points
    const s_pdp: PDP = { pos: s_point, dir: s_dir };
    const e_pdp: PDP = { pos: e_point, dir: e_dir };

    // Resolve collisions
    const pdp_list = this.resolve_intersections([s_pdp, e_pdp]);

    pdp_list[0].dir = pdp_list[0].dir.negate();
    return pdp_list;
  }

  public add_connection(
    s_loc: Vec2,
    e_loc: Vec2,
    s_dir: Vec2,
    e_dir: Vec2,
  ): string {
    const s_pdp: PDP = { pos: s_loc.add(s_dir), dir: s_dir };
    const e_pdp: PDP = { pos: e_loc.add(e_dir), dir: e_dir };

    // Extrude starting positions to make more space for inwards arrows
    s_dir = s_dir.add(s_dir.normalized().times(3));
    e_dir = e_dir.add(e_dir.normalized().times(3));

    // Compute point list
    const pdp_list = [s_pdp];
    pdp_list.push(...this.compute_path_pdp(s_loc, e_loc, s_dir, e_dir));
    pdp_list.push(e_pdp);

    return this.compute_path(pdp_list);
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------
  private resolve_intersections(pdp_array: PDP[]): PDP[] {
    const res_pdp_array: PDP[] = [pdp_array[0]];

    // Add all segments as unchecked
    const unchecked_segments: [PDP, PDP][] = [];
    for (let i = pdp_array.length - 1; i > 0; i--)
      unchecked_segments.push([pdp_array[i - 1], pdp_array[i]]);

    // Until all segments are intersection free
    while (unchecked_segments.length > 0) {
      // Get next segment to check
      const [pdp_1, pdp_2] = unchecked_segments.pop()!;

      // Check for intersection
      const pdp_m = this.intersects_scene([pdp_1, pdp_2]);

      // If there is a collision bypass it
      if (pdp_m !== undefined) {
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
      const [t1, t2] = t;

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
    const line = new Line(pdp.pos, dir);
    const collision_resolver = (): boolean => {
      // Check all points
      for (const point of this._points) {
        // Are we inside?
        const dist = Vec2.dist(pdp.pos, point.loc);
        if (dist < point.rad) {
          // Check how far inside
          const [_, t] = line.intersect_circle_t(
            point.loc,
            point.rad * 1.1,
          )! as [number, number];

          // Get out
          pdp.pos = pdp.pos.add(dir.times(t));

          // Collision found; Mark algorithm for repetition
          return true;
        }
      }

      // No collision is found
      return false;
    };

    // Repeat collision resolution until it fails to find collisions
    while (collision_resolver());

    return pdp;
  }

  private compute_path(
    pdp_array: PDP[],
    use_straight_lines: boolean = false,
  ): string {
    if (use_straight_lines) {
      // Map points to string
      const cps_s: string[] = pdp_array.map((cp) => `${cp.pos.x},${cp.pos.y}`);

      // Concat all into a command
      let command: string = `M${cps_s[0]}`;
      for (let i = 1; i < cps_s.length; i++) command += `L${cps_s[i]}`;

      // Return
      return command;
    }

    // Get control points
    let p1 = pdp_array[0].pos;
    let cps: Vec2[] = [p1];

    for (let i = 2; i < pdp_array.length; i++) {
      const pC = pdp_array[i - 1].pos;
      const p2 = pdp_array[i].pos;

      const curve_radius = 10;

      if (Vec2.dist(p1, pC) > curve_radius) {
        const pCp1 = p1.sub(pC).normalized().times(curve_radius);
        cps.push(pC.add(pCp1));
      } else cps.push(p1);
      cps.push(pC);

      p1 =
        Vec2.dist(p2, pC) > curve_radius
          ? pC.add(
              // pC to p2 (size `curve_radius`)
              p2.sub(pC).normalized().times(curve_radius),
            )
          : Vec2.average(pC, p2);

      cps.push(p1);
    }

    cps.push(pdp_array[pdp_array.length - 1].pos);

    // Map points to string
    const cps_s: string[] = cps.map((cp) => `${cp.x},${cp.y}`);

    // Concat all into a command
    let command: string = `M${cps_s[0]} L${cps_s[1]}`;
    for (let i = 4; i < cps_s.length; i += 3) {
      command += ` C${cps_s[i - 2]} ${cps_s[i - 2]} ${cps_s[i - 1]}`;
      command += ` L${cps_s[i]}`;
      // break;
    }

    // Return
    return command;
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
