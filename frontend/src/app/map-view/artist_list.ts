import { MatSelect } from '@angular/material/select';
import { Artist } from '../../objects/artist';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export class ArtistList {
  // List of available / selected artists
  public available_artists: string[] = ['...'];
  public selected_artists: string[] = [];

  // Filter
  public artists_search_control: FormControl = new FormControl();
  public filtered_artists: Observable<string[]>;

  // Select artist dropdown
  private select_artists!: MatSelect;

  // Flags
  private artists_loaded: boolean = false;

  // --------------------------------------------------------------------------

  constructor() {
    this.filtered_artists = this.artists_search_control.valueChanges.pipe(
      startWith(''),
      map((filter_string) => this.filter_artists(filter_string)),
    );
  }

  init(select_artists: MatSelect) {
    this.select_artists = select_artists;
  }

  // --------------------------------------------------------------------------

  load_artists(artists: Artist[]): void {
    this.available_artists = artists.map(
      (a) => a.first_name + ' ' + a.last_name,
    );
    this.available_artists.sort();
    this.artists_loaded = true;
  }

  select_artist(artist: string): void {
    if (!this.artists_loaded) return;
    if (this.selected_artists.includes(artist)) return;
    this.selected_artists.push(artist);
    this.available_artists = this.available_artists.filter((a) => a !== artist);
    this.select_artists.writeValue(null);
  }

  remove_artist(artist: string): void {
    this.selected_artists = this.selected_artists.filter((a) => a !== artist);
    this.available_artists.push(artist);
    this.available_artists.sort();
  }

  filter_artists(value: string): string[] {
    const filter_val = value.toLowerCase();
    return this.available_artists.filter((a) =>
      a.toLowerCase().includes(filter_val),
    );
  }
}
