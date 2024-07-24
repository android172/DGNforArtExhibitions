export class Vec2 {
  values: number[];

  constructor(x: number, y: number);
  constructor(values: number[]);
  constructor(values: [number, number]);
  constructor(k: number);
  constructor(a: number | number[] | [number, number], b?: number) {
    if (a instanceof Array) {
      this.values = a;
    } else if (b === undefined) {
      this.values = [a, a];
    } else {
      this.values = [a, b];
    }
  }

  // --------------------------------------------------------------------------
  // Properties
  // --------------------------------------------------------------------------
  get x(): number {
    return this.values[0];
  }
  get y(): number {
    return this.values[1];
  }

  set x(val: number) {
    this.values[0] = val;
  }
  set y(val: number) {
    this.values[1] = val;
  }

  // Special static vectors
  static get left(): Vec2 {
    return new Vec2(-1, 0);
  }
  static get right(): Vec2 {
    return new Vec2(+1, 0);
  }
  static get up(): Vec2 {
    return new Vec2(0, +1);
  }
  static get down(): Vec2 {
    return new Vec2(0, -1);
  }

  static get zero(): Vec2 {
    return new Vec2(0, 0);
  }
  static get one(): Vec2 {
    return new Vec2(1, 1);
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  /** Adds the scalar value to each component. */
  add(scalar: number): Vec2;
  /** Returns the vector addition (this + vector). */
  add(vector: Vec2): Vec2;
  add(that: Vec2 | number): Vec2 {
    if (that instanceof Vec2) {
      return new Vec2(
        this.values[0] + that.values[0],
        this.values[1] + that.values[1],
      );
    } else {
      return new Vec2(this.values[0] + that, this.values[1] + that);
    }
  }

  /** Subtracts the scalar value from each component. */
  sub(scalar: number): Vec2;
  /** Returns the vector subtraction (this - that). */
  sub(vector: Vec2): Vec2;
  sub(that: number | Vec2): Vec2 {
    if (that instanceof Vec2) {
      return new Vec2(
        this.values[0] - that.values[0],
        this.values[1] - that.values[1],
      );
    } else {
      return new Vec2(this.values[0] - that, this.values[1] - that);
    }
  }

  /** Returns the dot product (this * that). */
  dot(that: Vec2): number {
    return this.values[0] * that.values[0] + this.values[1] * that.values[1];
  }

  /**
   * Returns 2D cross product (this x that).
   *
   * Equivalent to embedding this and that in the XY plane and returning the Z value of the product vector
   * (such a vector would be of the form (0, 0, z)).
   */
  cross(that: Vec2): number {
    return this.values[0] * that.values[1] - this.values[1] * that.values[0];
  }

  /** Returns the scalar product (scalar * this). */
  times(scalar: number): Vec2;
  /** Returns the component-wise product (this * vector). */
  times(vector: Vec2): Vec2;
  times(that: number | Vec2): Vec2 {
    if (that instanceof Vec2) {
      return new Vec2(
        this.values[0] * that.values[0],
        this.values[1] * that.values[1],
      );
    } else {
      return new Vec2(this.values[0] * that, this.values[1] * that);
    }
  }

  /** Returns the scalar division (this / scalar). */
  div(scalar: number): Vec2;
  /** Returns the component-wise division (this / vector). */
  div(vector: Vec2): Vec2;
  div(that: number | Vec2): Vec2 {
    if (that instanceof Vec2) {
      return new Vec2(
        this.values[0] / that.values[0],
        this.values[1] / that.values[1],
      );
    } else {
      return new Vec2(this.values[0] / that, this.values[1] / that);
    }
  }

  /** Returns -this. */
  negate(): Vec2 {
    return this.times(-1);
  }

  /** Returns the squared magnitude of this vector. */
  sq_mag(): number {
    return this.values[0] * this.values[0] + this.values[1] * this.values[1];
  }

  /** Returns the magnitude of this vector. */
  mag(): number {
    return Math.sqrt(this.sq_mag());
  }

  /** Returns a normalized copy of this vector. */
  normalized(): Vec2 {
    return this.div(this.mag());
  }

  /**
   * Returns the angle between this vector and the x-axis.
   *
   * Returns the angle between this vector and (1, 0), in radians, in the range (-Pi, +Pi].
   */
  argument(): number {
    return Math.atan2(this.values[1], this.values[0]);
  }

  /** Returns a copy of this vector. */
  clone(): Vec2 {
    return new Vec2(this.values[0], this.values[1]);
  }

  /** Returns a copy of this vector, scaled if needed so its magnitude is at most 'length'. */
  cap(length: number): Vec2 {
    if (length <= Number.EPSILON) {
      return new Vec2(0, 0);
    }
    const mag = this.mag();
    if (length < mag) {
      return this.times(length / mag);
    }
    return this.clone();
  }

  /** Returns a copy of this vector, swapping x and y. */
  transpose(): Vec2 {
    return new Vec2(this.values[1], this.values[0]);
  }

  /** Returns the orthogonal vector v such that (this, v) is a right-handed basis, and |v| = |this|. */
  orthogonal(): Vec2 {
    return new Vec2(-this.values[1], this.values[0]);
  }

  /** Returns a copy of this vector, applying floor() to all components. */
  floor(): Vec2 {
    return new Vec2(Math.floor(this.values[0]), Math.floor(this.values[1]));
  }

  /** Returns a copy of this vector, applying ceil() to all components. */
  ceil(): Vec2 {
    return new Vec2(Math.ceil(this.values[0]), Math.ceil(this.values[1]));
  }

  /** Returns a copy of this vector, applying abs() to all components. */
  abs(): Vec2 {
    return new Vec2(Math.abs(this.values[0]), Math.abs(this.values[1]));
  }

  /** Returns a copy of this vector, applying f() to all components. */
  map(f: (x: number) => number): Vec2 {
    return new Vec2(f(this.values[0]), f(this.values[1]));
  }

  /** Returns the maximum component in this vector. */
  max(): number;
  /** Returns the component-wise maximum of this and that. */
  max(that: Vec2): Vec2;
  max(that?: Vec2): Vec2 | number {
    if (that === undefined) {
      return Math.max(this.values[0], this.values[1]);
    } else {
      return new Vec2(
        Math.max(this.values[0], that.values[0]),
        Math.max(this.values[1], that.values[1]),
      );
    }
  }

  /** Returns the minimum component in this vector. */
  min(): number;
  /** Returns the component-wise minimum of this and that. */
  min(that: Vec2): Vec2;
  min(that?: Vec2): Vec2 | number {
    if (that === undefined) {
      return Math.min(this.values[0], this.values[1]);
    } else {
      return new Vec2(
        Math.min(this.values[0], that.values[0]),
        Math.min(this.values[1], that.values[1]),
      );
    }
  }

  /** Returns sum of arguments */
  arg_sum() {
    return this.values[0] + this.values[1];
  }

  /** Apply function to both arguments */
  apply(fn: any): Vec2 {
    return new Vec2(fn(this.values));
  }

  // --------------------------------------------------------------------------
  // Public static functions
  // --------------------------------------------------------------------------
  /** Returns the Euclidean distance between u and v. */
  static dist = (u: Vec2, v: Vec2): number => u.sub(v).mag();

  /** Returns a Vec2 (Cartesian coordinates) corresponding to the polar coordinates (radius, angle). */
  static from_polar = (radius: number, angle: number): Vec2 =>
    new Vec2(radius * Math.cos(angle), radius * Math.sin(angle));

  /** Linearly interpolate between a at t=0 and b at t=1 (t is NOT clamped). */
  static interpolate = (a: Vec2, b: Vec2, t: number): Vec2 =>
    a.add(b.sub(a).times(t));

  /** Calculate the average vector. */
  static average = (...vecs: Vec2[]): Vec2 => {
    let accumulator = new Vec2(0, 0);
    if (vecs.length === 0) {
      return accumulator;
    }

    for (let vec of vecs) {
      accumulator = accumulator.add(vec);
    }

    return accumulator.div(vecs.length);
  };

  /**
   * Calculate the weighted average vector.
   *
   * * Iterates up to shortest length.
   * * Ignores negative or approximately zero weights and their associated vectors.
   */
  static weighted_average = (vecs: Vec2[], weights: number[]): Vec2 => {
    let accumulator = new Vec2(0, 0);
    let totalWeight = 0;

    const N = Math.min(vecs.length, weights.length);
    if (N === 0) {
      return accumulator;
    }

    for (let i = 0; i < N; i++) {
      const vec = vecs[i];
      const weight = weights[i];
      if (weight > Number.EPSILON) {
        totalWeight += weight;
        accumulator = accumulator.add(vec.times(weight));
      }
    }

    if (totalWeight > Number.EPSILON) {
      return accumulator.div(totalWeight);
    } else {
      return accumulator;
    }
  };

  /** Returns the projection of arbitrary vector 'v' into *unit* vector 'n', as a Vec2. */
  static project = (v: Vec2, n: Vec2): Vec2 => n.times(v.dot(n));
}
