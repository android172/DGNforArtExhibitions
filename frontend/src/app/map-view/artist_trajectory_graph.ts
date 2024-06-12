import { intersection } from 'd3';
import { Artist } from '../../objects/artist';
import { Exhibition } from '../../objects/exhibition';
import { Host } from '../../objects/host';
import { Place } from '../../objects/place';

/**
 * Helper connection class. Used by main_map
 */
export class ArtistTrajectoryGraph {
  constructor(artists: Artist[]) {
    const trajectories = artists.map((artist: Artist) =>
      this.add_artist_trajectory(artist),
    );
    this.compute_connections(trajectories);
  }

  // Public methods
  get places(): PlacePoint[] {
    return this._places;
  }
  get connection_points(): ConnectionPoint[] {
    return this._connection_points;
  }
  get connections(): Connection[] {
    return this._connections;
  }
  get self_connections(): Connection[] {
    return this._self_connections;
  }

  // Private methods
  private add_artist_trajectory(artist: Artist): ArtistTrajectory {
    // Get his exhibitions
    let exhibitions: Exhibition[] = artist.exhibited_exhibitions;

    // Sort exhibitions by year (Necessary preprocessing)
    exhibitions.sort((a: Exhibition, b: Exhibition) => {
      if (!a.start_year || !b.start_year) return 0;
      return a.start_year - b.start_year;
    });

    // Compute all places and connection points
    let cp_list: number[][] = [];
    exhibitions.forEach((exhibition: Exhibition) => {
      // Get places
      const hosts: Host[] = exhibition.took_place_in_hosts;
      const places: Place[] = Place.from_hosts(hosts);

      // Its possible that this exhibition was overseas
      // We ignore those
      if (places.length === 0) return;

      // Add place indices and connection points
      const place_indices: number[] = this.add_places(places);
      const cp_indices: number[] = this.add_connection_points(
        place_indices,
        exhibition,
      );

      cp_list.push(cp_indices);
    });

    return { artist_id: artist.id!, cp_list: cp_list };
  }

  private compute_connections(trajectories: ArtistTrajectory[]) {
    // Preprocessing
    this.compute_place_years();

    // For each trajectory
    trajectories.forEach((trajectory: ArtistTrajectory) => {
      let cp_list: number[][] = trajectory.cp_list;

      // Pick representatives
      let representatives: number[] = cp_list.map((cp_indices: number[]) =>
        cp_indices.reduce((prev: number, curr: number) => {
          const p1_i: number = this._connection_points[prev].pl_index;
          const p2_i: number = this._connection_points[curr].pl_index;
          const p1_size: number = this._places[p1_i].years.length;
          const p2_size: number = this._places[p2_i].years.length;

          // Return the bigger one
          if (p2_size > p1_size) return curr;
          return prev;
        }),
      );

      // Sort trajectory
      const sorted_points: { main: number; side: number[] }[] =
        this.sort_trajectory_points(representatives, cp_list);

      // Add all side connections
      sorted_points.forEach((sp) => {
        const cp_main: number = sp.main;
        sp.side.forEach((cp_side: number) => {
          // Get key
          const key = { n1: cp_main, n2: cp_side };

          // Add connection (if needed)
          let conn_i = this._unique_s_cons.get(key);
          if (conn_i === undefined) {
            conn_i = this._self_connections.length;
            this._unique_s_cons.set(key, conn_i);
            this._self_connections.push({
              p1: cp_main,
              p2: cp_side,
              weight: 1,
            });
          }

          // Increase weight TODO: better weight
          // this._self_connections[conn_i].weight++;
        });
      });

      // Add transition connections
      for (let i = 1; i < sorted_points.length; i++) {
        // Get key
        const sp_1: number = sorted_points[i - 1].main;
        const sp_2: number = sorted_points[i].main;
        const key = { n1: sp_1, n2: sp_2 };

        // Add connection (if needed)
        let conn_i = this._unique_cons.get(key);
        if (conn_i === undefined) {
          conn_i = this._connections.length;
          this._unique_cons.set(key, conn_i);
          this._connections.push({
            p1: sp_1,
            p2: sp_2,
            weight: 0,
          });
        }

        // Increase weight
        this._connections[conn_i].weight++;
      }
    });
  }

  private add_places(places: Place[]): number[] {
    let indices: number[] = [];

    // Turn place array into indices
    places.forEach((place) => {
      if (place.place === undefined) return;
      let index = this._unique_places.get(place.place);
      if (index === undefined) {
        // Add if needed
        index = this._places.length;
        this._unique_places.set(place.place, index);
        this._places.push({ place: place, years: [] });
      }
      indices.push(index);
    });

    return indices;
  }

  private add_connection_points(
    place_indices: number[],
    exhibition: Exhibition,
  ): number[] {
    // Convert place indices & exhibition into connection points
    const local_cp: ConnectionPoint[] = place_indices.map((index: number) => {
      return { pl_index: index, year: exhibition.start_year! };
    });

    // Prepare return index list
    let index_list: number[] = [];

    // Add all
    local_cp.forEach((cp: ConnectionPoint) => {
      const key = {
        n1: cp.pl_index,
        n2: cp.year,
      };

      // Check if already exists
      let cp_index: number | undefined = this._unique_cps.get(key);
      if (cp_index === undefined) {
        // Add to list
        cp_index = this._connection_points.length;
        this._connection_points.push(cp);
        this._unique_cps.set(key, cp_index);
      }
      index_list.push(cp_index);
    });

    return index_list;
  }

  private compute_place_years() {
    // Compute all relevant years for places
    this._connection_points.forEach((cp) => {
      this._places[cp.pl_index].years.push(cp.year);
    });

    // Sort years
    this._places.forEach((p) => p.years.sort());
  }

  private sort_trajectory_points(
    reps: number[],
    cp_list: number[][],
  ): { main: number; side: number[] }[] {
    // Local interface for point subsets
    interface PointSubset {
      first_i: number;
      last_i: number;
      unique: Set<number>;
    }

    // Iteration tracking index
    let running_index: number = 0;

    // Helper methods
    const compute_subset = (year: number): PointSubset => {
      let point_subset: PointSubset = {
        first_i: running_index,
        last_i: 0,
        unique: new Set(),
      };

      // Get year count
      while (
        running_index < reps.length &&
        this._connection_points[reps[running_index++]].year == year
      );
      point_subset.last_i = running_index;

      // Compute unique
      for (let i = point_subset.first_i; i < point_subset.last_i; i++)
        point_subset.unique.add(reps[i]);

      return point_subset;
    };
    const resolve_stack = (
      stack: { ps: PointSubset; int: Set<number> }[],
    ): { main: number; side: number[] }[] => {
      // Code for adding to resolved
      let resolved: { main: number; side: number[] }[] = [];
      let add_to_resolved = (f: number, t: number, index: number) => {
        for (let i = f; i < t; i++) {
          if (reps[i] == index)
            resolved.push({
              main: index,
              side: cp_list[i].filter((cp_index) => cp_index != index),
            });
        }
      };

      // Code for resolving stack
      let locked: number | undefined = undefined;
      while (stack.length != 0) {
        let top = stack.pop()!;
        let ps: PointSubset = top.ps;
        let int: Set<number> = top.int;

        // Add locked if needed
        if (locked !== undefined)
          add_to_resolved(ps.first_i, ps.last_i, locked);

        // Check if this is last one left
        if (int.size === 0) {
          // There is no common, resolve everything thats not locked
          ps.unique.forEach((index: number) => {
            if (index !== locked) add_to_resolved(ps.first_i, ps.last_i, index);
          });
          break;
        }

        // Find common
        let int_it = int.values();
        let common: number = int_it.next().value;
        if (common === locked) int_it.next().value;

        // Add all non-common
        ps.unique.forEach((index: number) => {
          if (index !== locked && index !== common)
            add_to_resolved(ps.first_i, ps.last_i, index);
        });

        // Add common to resolve
        add_to_resolved(ps.first_i, ps.last_i, common);

        // Lock common for next iter
        locked = common;
      }

      return resolved.reverse();
    };

    // Initialize sort dependencies
    const first_year: number = this._connection_points[reps[0]].year;
    let last_pss: PointSubset = compute_subset(first_year);
    let unsorted_stack: { ps: PointSubset; int: Set<number> }[] = [
      { ps: last_pss, int: new Set() },
    ];

    // Sort
    let sorted_points: { main: number; side: number[] }[] = [];
    while (running_index < reps.length) {
      let year: number = this._connection_points[reps[running_index]].year;

      // Get this years point subset
      const this_pss = compute_subset(year);

      // Compute diff count between this and last point subset
      const common_uniques: Set<number> = intersection(
        this_pss.unique,
        last_pss.unique,
      );

      // We resolve the sort at this step differently based on common uni count
      // We cannot resolve if more then 1 point is in common
      if (common_uniques.size == 0) {
        // This one cannot be resolved, but all previous ones can!
        resolve_stack(unsorted_stack).forEach((point) =>
          sorted_points.push(point),
        );
      } else if (common_uniques.size == 1) {
        // Resolve this, go back 1 in stack
        // Resolve all
        unsorted_stack.push({ ps: this_pss, int: common_uniques });
        resolve_stack(unsorted_stack).forEach((point) =>
          sorted_points.push(point),
        );

        // Need to remove the one common point chosen from uniques
        const common_point: number = common_uniques.values().next().value;
        this_pss.unique.delete(common_point);

        // Add common to sorted
        for (let i = this_pss.first_i; i < this_pss.last_i; i++) {
          if (reps[i] == common_point)
            sorted_points.push({
              main: common_point,
              side: cp_list[i].filter((cp_index) => cp_index != common_point),
            });
        }
      }

      // Save for next iteration
      unsorted_stack.push({ ps: this_pss, int: common_uniques });
      last_pss = this_pss;
    }

    return sorted_points;
  }

  private _places: PlacePoint[] = [];
  private _connection_points: ConnectionPoint[] = [];
  private _connections: Connection[] = [];
  private _self_connections: Connection[] = [];

  private _unique_places: Map<string, number> = new Map(); // pl_name         -> pl_index
  private _unique_cps: NPNMap = new NPNMap(); //              pl_index & year -> cps_index
  private _unique_cons: NPNMap = new NPNMap(); //             2 x cps_index   -> cons_index
  private _unique_s_cons: NPNMap = new NPNMap(); //           2 x cps_index   -> s_cons_index
}

// Helper class
interface NumberPair {
  n1: number;
  n2: number;
}
class NPNMap extends Map<NumberPair, number> {
  override get size() {
    return this._map.size;
  }

  override get(np: NumberPair): number | undefined {
    return this._map.get(this.key(np));
  }
  override set(np: NumberPair, value: number): this {
    this._map.set(this.key(np), value);
    return this;
  }
  override has(np: NumberPair): boolean {
    return this._map.has(this.key(np));
  }
  override delete(np: NumberPair): boolean {
    return this._map.delete(this.key(np));
  }
  override values(): IterableIterator<number> {
    return this._map.values();
  }
  override clear(): void {
    this._map.clear();
  }

  override forEach(
    callbackfn: (
      value: number,
      key: NumberPair,
      map: Map<NumberPair, number>,
    ) => void,
    thisArg?: any,
  ): void {
    this._map.forEach((v, k, _) => {
      callbackfn(v, this.unkey(k), this);
    }, thisArg);
  }

  private _map: Map<string, number> = new Map();

  private key(np: NumberPair): string {
    return `${np.n1},${np.n2}`;
  }
  private unkey(key: string): NumberPair {
    const n: string[] = key.split(',');
    return {
      n1: Number.parseInt(n[0]),
      n2: Number.parseInt(n[1]),
    };
  }
}

interface ArtistTrajectory {
  artist_id: number;
  cp_list: number[][];
}

interface PlacePoint {
  place: Place;
  years: number[];
}

interface ConnectionPoint {
  pl_index: number;
  year: number;
}

interface Connection {
  p1: number;
  p2: number;
  weight: number;
}

export {
  PlacePoint as PPoint,
  Connection as PConn,
  ConnectionPoint as PConnPoint,
};
