import { Parse } from "./common";
import { Exhibition } from "./exhibition";

export class Artist {
    constructor(
        public id: number | undefined,
        public first_name: string | undefined,
        public last_name: string | undefined,
        public title: string | undefined,
        public sex: string | undefined,
        public country: string | undefined,
        public birth_date: Date | undefined,
        public birth_place: string | undefined,
        public death_date: Date | undefined,
        public death_place: string | undefined,
        public exhibited_exhibitions: Exhibition[]
    ) { }

    public static from_query(query: unknown): Artist[] {
        if (query === undefined) return [];
        const data = query as { artists: ArtistRaw[] };
        if (data.artists === undefined) return [];
        const artists = data.artists;
        return artists
            .map((data: ArtistRaw) =>
                new Artist(
                    Parse.int(data.id),
                    Parse.string(data.firstname),
                    Parse.string(data.lastname),
                    Parse.string(data.title),
                    Parse.string(data.sex),
                    Parse.string(data.country),
                    Parse.date(data.birthdate),
                    Parse.string(data.birthplace),
                    Parse.date(data.deathdate),
                    Parse.string(data.deathplace),
                    Parse.query(
                        { exhibitions: data.exhibitedExhibitions }, Exhibition
                    )
                )
            );
    }
}

interface ArtistRaw {
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
    exhibitedExhibitions: any
}