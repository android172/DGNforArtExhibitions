import { Exhibition } from '../../objects/exhibition';
import { Host } from '../../objects/host';
import { Place } from '../../objects/place';

/**
 * Helper connection class. Used by main_map
 */
export class PlaceConnection {
  constructor() {}

  static get_connections(
    in_exhibitions: Exhibition[],
  ): [Connection[], NonDirectionalConnection[]] {
    // Sort exhibitions by year (Necessary preprocessing)
    const exhibitions = in_exhibitions.map((e: Exhibition) => e);
    exhibitions.sort((a: Exhibition, b: Exhibition) => {
      if (!a.start_year || !b.start_year) return 0;
      return a.start_year - b.start_year;
    });

    // Declare these lists
    const connection_l: Connection[] = [];
    const se_connection_l: NonDirectionalConnection[] = [];

    // Connection trackers
    const conn_tracker: Map<[number, number], Connection> = new Map();
    const se_conn_tracker: Map<[number, number], NonDirectionalConnection> =
      new Map(); // "same exhibition" connections

    // Helper functions
    const add_connection = (conn: Connection) => {
      connection_l.push(conn);
      conn_tracker.set([conn.f.id, conn.t.id], conn);
    };
    const add_se_connection = (conn: NonDirectionalConnection) => {
      se_connection_l.push(conn);
      se_conn_tracker.set(this.sym_conn_key(conn.p1.id, conn.p2.id), conn);
    };

    // Get first exhibitions connections
    const first_host_l: Host[] = exhibitions[0].took_place_in_hosts;
    const first_place_l: Place[] = Place.from_hosts(first_host_l);
    this.sort_places(first_place_l);
    let prev_place_l = first_place_l;

    if (first_place_l.length > 1) {
      // Add "same exhibition" connections
      for (let i = 1; i < first_place_l.length; i++) {
        const p1: Place = first_place_l[i - 1];
        const p2: Place = first_place_l[i];
        // Add places
        add_se_connection({
          p1: p1,
          p2: p2,
          ly: exhibitions[0].start_year!,
        });
      }
    }

    // Get other exhibitions connections
    for (let i = 1; i < exhibitions.length; i++) {
      // Get exhibitions
      const prev_exhibition = exhibitions[i - 1];
      const exhibition = exhibitions[i];

      // Get place list for current exhibition
      const host_l: Host[] = exhibition.took_place_in_hosts;
      const place_l: Place[] = Place.from_hosts(host_l);
      this.sort_places(place_l);

      // Potentially add "same exhibition" connections
      // Note: this code will only run if place_l.length > 1
      for (let i = 1; i < place_l.length; i++) {
        const p1: Place = place_l[i - 1];
        const p2: Place = place_l[i];
        const id: [number, number] = this.sym_conn_key(p1.id, p2.id);
        const conn = se_conn_tracker.get(id);
        // First time we see this? Add connection
        // First time we see this for this year? Add connection
        if (!conn || conn.ly < exhibition.start_year!) {
          add_se_connection({
            p1: p1,
            p2: p2,
            ly: exhibition.start_year!,
          });
        }
        // Otherwise, skip
      }

      // Get optimal connection points
      const [pf, pt] = this.get_optimal_places_for_conn(prev_place_l, place_l);
      const id: [number, number] = [pf.id, pt.id];
      const conn = conn_tracker.get(id);

      // First time we see this? Add connection
      if (!conn) {
        add_connection({
          f: pf,
          t: pt,
          lfy: prev_exhibition.start_year!,
          lty: exhibition.start_year!,
        });
      }
      // First time we see this for this year combination? Add connection
      else if (
        conn.lfy !== prev_exhibition.start_year! ||
        conn.lty !== exhibition.start_year!
      ) {
        add_connection({
          f: pf,
          t: pt,
          lfy: prev_exhibition.start_year!,
          lty: exhibition.start_year!,
        });
      }
      // Otherwise, skip

      // Prepare for next exhibition
      prev_place_l = place_l;
    }

    return [connection_l, se_connection_l];
  }

  // Computes symmetric connection key
  private static sym_conn_key(id1: number, id2: number): [number, number] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  }

  // Sorts places in-place :D
  // TODO: Smart sorting based on optimal connection order instead of just id
  private static sort_places(places: Place[]): void {
    places.sort((a: Place, b: Place) => a.id! - b.id!);
  }

  // Get optimal location for adding connection between two exhibitions
  // TODO: Smarter algorithm, for now just pick smallest distance
  private static get_optimal_places_for_conn(
    places_from: Place[],
    places_to: Place[],
  ): [Place, Place] {
    if (places_from.length === 0 || places_to.length === 0)
      throw new Error('Cannot get optimal place for empty set of places.');

    // Check if to same place connection suffices
    // This is handled separately since we will choose this connection no
    // matter how "optimal" is defined
    for (let pt of places_to) {
      const pf = places_from.find((p: Place) => p.id === pt.id);
      if (pf) return [pf, pt];
    }

    // Compute distance
    const place_dist = (p1: Place, p2: Place): number =>
      Math.sqrt(
        (p1.location[0] - p2.location[0]) ** 2 +
          (p1.location[1] - p2.location[1]) ** 2,
      );

    // Find two places with smallest distance
    let min_dist = Number.MAX_SAFE_INTEGER;
    let pf: Place | undefined;
    let pt: Place | undefined;

    places_from.forEach((p: Place) => {
      places_to.forEach((q: Place) => {
        const dist = place_dist(p, q);
        if (dist < min_dist) {
          min_dist = dist;
          pf = p;
          pt = q;
        }
      });
    });

    // This should never fail
    if (!pf || !pt)
      throw new Error('Could not find two places with smallest distance.');
    return [pf!, pt!];
  }
}

interface Connection {
  f: Place; // from place id
  t: Place; // to place id
  lfy: number; // last from year
  lty: number; // last to year
}

interface NonDirectionalConnection {
  p1: Place; // from place id
  p2: Place; // to place id
  ly: number; // last year
}

export { Connection as DPConn, NonDirectionalConnection as NDPConn };
