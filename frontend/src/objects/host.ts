import { Parse } from './common'

export class Host {
    id: number | undefined;
    name: string | undefined;
    country: string | undefined;
    place: string | undefined;
    place_tgn: number | undefined;
    town: string | undefined;
    longitude: number | undefined;
    latitude: number | undefined;
    type: string | undefined;

    constructor(data: HostRaw) {
        this.id = Parse.int(data.id);
        this.name = Parse.string(data.name);
        this.country = Parse.string(data.country);
        this.place = Parse.string(data.place);
        this.place_tgn = Parse.int(data.place_tgn);
        this.town = Parse.string(data.town);
        this.longitude = Parse.float(data.longitude);
        this.latitude = Parse.float(data.latitude);
        this.type = Parse.string(data.type);
    }

    project(projection: any): [number, number] {
        // Check if valid
        if (this.longitude === undefined ||
            this.latitude === undefined ||
            isNaN(this.longitude) ||
            isNaN(this.latitude) ||
            (this.longitude === 0 && this.latitude === 0)
        )
            // If not load offscreen
            return [-10, -10];
        return projection([this.longitude, this.latitude]);
    }

    public static from_query(query: unknown): Host[] {
        const data = query as { hosts: HostRaw[] };
        const hosts = data.hosts;
        return hosts.map((data: HostRaw) => new Host(data));
    }
}


interface HostRaw {
    id: string
    name: string
    country: string
    place: string
    place_tgn: string
    town: string
    longitude: string
    latitude: string
    type: string
}