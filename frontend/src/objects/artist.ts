import { Parse } from "./common";

export class Artist {
    id: number | undefined;
    first_name: string | undefined;
    last_name: string | undefined;
    title: string | undefined;
    sex: string | undefined;
    country: string | undefined;
    birth_date: Date | undefined;
    birth_place: string | undefined;
    death_date: Date | undefined;
    death_place: string | undefined;

    constructor() { }

    public static from_query(query: unknown): Artist[] {
        const data = query as { artists: RawArtistData[] };
        const artists = data.artists;
        return artists.map((data: RawArtistData) => {
            return {
                id: Parse.int(data.id),
                first_name: Parse.string(data.firstname),
                last_name: Parse.string(data.lastname),
                title: Parse.string(data.title),
                sex: Parse.string(data.sex),
                country: Parse.string(data.country),
                birth_date: Parse.date(data.birthdate),
                birth_place: Parse.string(data.birthplace),
                death_date: Parse.date(data.deathdate),
                death_place: Parse.string(data.deathplace)
            }
        });
    }
}

interface RawArtistData {
    id: string
    firstname: string
    lastname: string
    title: string
    sex: string
    country: string
    birthdate: string
    birthplace: string
    deathdate: string
    deathplace: string
}