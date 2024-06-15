import { Parse } from './common';
import { Exhibition } from './exhibition';

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
    public exhibited_exhibitions: Exhibition[],
  ) {}

  public static from_query(query: unknown): Artist[] {
    if (query === undefined) return [];
    const data = query as { artists: ArtistRaw[] };
    if (data.artists === undefined) return [];
    const artists = data.artists;
    return artists.map(
      (data: ArtistRaw) =>
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
          Parse.query({ exhibitions: data.exhibitedExhibitions }, Exhibition),
        ),
    );
  }

  public load_all_fields(query: unknown): void {
    // Check if its needed
    if (this.all_fields_loaded) return;

    // Load them
    if (query === undefined) return;
    const data = query as { artists: ArtistRaw[] };
    if (data.artists === undefined) return;
    const artist = data.artists[0];
    this.id = Parse.int(artist.id);
    this.title = Parse.string(artist.title);
    this.sex = Parse.string(artist.sex);
    this.country = Parse.string(artist.country);
    this.birth_date = Parse.date(artist.birthdate);
    this.birth_place = Parse.string(artist.birthplace);
    this.death_date = Parse.date(artist.deathdate);
    this.death_place = Parse.string(artist.deathplace);
    this.exhibited_exhibitions = Parse.query(
      { exhibitions: artist.exhibitedExhibitions },
      Exhibition,
    );

    this.all_fields_loaded = true;
  }

  get full_name(): string {
    return this.first_name + ' ' + this.last_name;
  }

  all_fields_loaded = false;
}

interface ArtistRaw {
  id: string;
  firstname: string;
  lastname: string;
  title: string;
  sex: string;
  country: string;
  birthdate: string;
  birthplace: string;
  deathdate: string;
  deathplace: string;
  exhibitedExhibitions: any;
}
