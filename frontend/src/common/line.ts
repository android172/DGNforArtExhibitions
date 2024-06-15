import { Vec2 } from './vec2';

export class Line {
  p: Vec2;
  d: Vec2;

  constructor(p: Vec2, d: Vec2);
  constructor(k: number, n: number);
  constructor(a: Vec2 | number, b: Vec2 | number) {
    if (a instanceof Vec2) {
      this.p = a;
      this.d = (b as Vec2).normalized();
    } else {
      const k = a as number;
      const n = b as number;
      if (Number.isFinite(k)) {
        const alpha = Math.atan(k);
        this.p = new Vec2(0, n);
        this.d = new Vec2(Math.cos(alpha), Math.sin(alpha)).normalized();
      } else {
        this.p = new Vec2(n, 0);
        this.d = new Vec2(0, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Properties
  // --------------------------------------------------------------------------
  get k(): number {
    if (Math.abs(this.d.x) < Number.EPSILON) {
      return Number.POSITIVE_INFINITY;
    } else {
      return this.d.y / this.d.x;
    }
  }
  get n(): number {
    if (Math.abs(this.d.x) < Number.EPSILON) {
      return this.p.x;
    } else {
      return this.p.y - this.k * this.p.x;
    }
  }

  // --------------------------------------------------------------------------
  // Public functions
  // --------------------------------------------------------------------------
  point(t: number): Vec2 {
    return this.p.add(this.d.times(t));
  }

  intersect_line(line: Line): Vec2 | undefined {
    const t = this.intersect_line_t(line);
    return t ? this.point(t) : undefined;
  }
  intersect_line_t(line: Line): number | undefined {
    return 1.0 - Math.abs(this.d.dot(line.d)) > Number.EPSILON
      ? line.d.cross(this.p.sub(line.p)) / this.d.cross(line.d)
      : undefined;
  }

  intersect_circle(
    center: Vec2,
    sq_radius: number,
  ): [Vec2, Vec2] | Vec2 | undefined {
    const t = this.intersect_circle_t(center, sq_radius);

    // No intersection
    if (t === undefined) return t;

    // One intersection
    const p1 = this.point(t[0]);
    if (t.length === 1) return p1;

    // Two intersections
    const p2 = this.point(t[1]);
    return [p1, p2];
  }

  intersect_circle_t(
    center: Vec2,
    sq_radius: number,
  ): [number, number] | [number] | undefined {
    // a = 1;
    const b = this.p.sub(center).times(this.d).times(2).arg_sum();
    const c = this.p.sub(center).sq_mag() - sq_radius;
    const d = b * b - 4 * c;

    // No intersection points
    if (d < 0) return undefined;

    // One intersection points
    if (d < Number.EPSILON) {
      const t = -b / 2;
      return [t];
    }

    // Two intersection points
    const t1 = (-b + Math.sqrt(d)) / 2;
    const t2 = (-b - Math.sqrt(d)) / 2;

    return [t1, t2];
  }
}
