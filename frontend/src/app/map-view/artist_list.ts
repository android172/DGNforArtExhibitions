import { MatSelect } from '@angular/material/select';
import { Artist } from '../../objects/artist';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Parse } from '../../objects/common';

export class ArtistList {
  // List of available / selected artists
  public available_artists: Artist[] = [
    new Artist(
      -1,
      'A',
      'B',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    ),
  ];
  public selected_artists: Artist[] = [];

  // Filter
  public artists_search_control: FormControl = new FormControl();
  public filtered_artists!: Observable<Artist[]>;

  // Flags
  public artists_loaded: boolean = false;

  // Select artist dropdown
  private _select_artists!: MatSelect;

  // --------------------------------------------------------------------------

  constructor() {
    this.update_filter();
  }

  init(select_artists: MatSelect) {
    this._select_artists = select_artists;
  }

  // --------------------------------------------------------------------------

  load_artists(artists: Artist[]): void {
    this.available_artists = artists.map((a) => a);
    this.available_artists.sort((a1, a2) =>
      a1.full_name < a2.full_name //
        ? -1
        : a1.full_name > a2.full_name
          ? 1
          : 0,
    );
    this.artists_loaded = true;
    this.update_filter();
  }

  select_artist(artist: Artist): void {
    if (!this.artists_loaded) return;
    if (this.selected_artists.includes(artist)) return;
    this.selected_artists.push(artist);
    this.available_artists = this.available_artists.filter(
      (a) => a.id !== artist.id,
    );
    this._select_artists.writeValue(null);
  }

  remove_artist(artist: Artist): void {
    this.selected_artists = this.selected_artists.filter(
      (a) => a.id !== artist.id,
    );
    this.available_artists.push(artist);
    this.available_artists.sort((a1, a2) =>
      a1.full_name < a2.full_name //
        ? -1
        : a1.full_name > a2.full_name
          ? 1
          : 0,
    );
    this.update_filter();
  }

  remove_all_artists() {
    this.available_artists.push(...this.selected_artists);
    this.available_artists.sort((a1, a2) =>
      a1.full_name < a2.full_name //
        ? -1
        : a1.full_name > a2.full_name
          ? 1
          : 0,
    );
    this.selected_artists = [];
    this.update_filter();
  }

  filter_artists(value: string): Artist[] {
    const filter_val = value.toLowerCase();
    return this.available_artists.filter((a) =>
      a.full_name.toLowerCase().includes(filter_val),
    );
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------
  private update_filter() {
    this.filtered_artists = this.artists_search_control.valueChanges.pipe(
      startWith(''),
      map((filter_string) => this.filter_artists(filter_string)),
    );
    console.log(this.available_artists);
  }
}
