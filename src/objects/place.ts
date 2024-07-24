import { Host } from './host';

export class Place {
  private static readonly black_list: string[] = ['JP', 'US', 'AR'];

  constructor(
    public id: number,
    public place: string | undefined,
    public town: string | undefined,
    public country: string | undefined,
    public location: [number, number],
    public hosts: Host[] = [],
  ) {}

  public static from_hosts(hosts: Host[]): Place[] {
    // Construct place map
    const place_map: Map<string, any> = new Map();

    let id: number = 0;
    hosts.forEach((host: Host) => {
      // Compute place name
      if (!host.place && !host.town) return;
      const place_key: any = host.place ? host.place : host.town;

      // Drop two country-less places
      if (host.country === undefined) {
        // Unless its this one in Norway
        if (host.place === 'Christiania') host.country = 'NO';
        else return;
      }

      // Fix Berlin location
      if (host.place === 'Berlin') {
        host.longitude = 13.4;
        host.latitude = 52.516667;
      }

      // Exclude blacklisted countries
      if (Place.black_list.includes(host.country)) return;

      // Fix hague error
      if (host.place === 'Hague, The') host.place = 'Hague';

      // Check if this was added before
      if (place_map.has(place_key)) {
        // If true just add a host
        place_map.get(place_key).hosts.push(host);
      } else {
        // Otherwise register another place
        place_map.set(place_key, {
          id: id++,
          place: host.place,
          town: host.town,
          country: host.country,
          location: [host.longitude, host.latitude],
          hosts: [host],
        });
      }
    });

    // Transform this map into an array based on id
    const places: Place[] = Array.from(place_map.entries()).map(
      (data: [string, any]) =>
        new Place(
          data[1].id,
          data[1].place,
          data[1].town,
          data[1].country,
          data[1].location,
          data[1].hosts,
        ),
    );

    return places;
  }

  project(projection: any): [number, number] {
    return projection(this.location);
  }
}
