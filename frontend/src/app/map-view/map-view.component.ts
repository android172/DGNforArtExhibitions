import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import * as d3 from 'd3';

import { Apollo } from 'apollo-angular';
import { ApolloQueryResult } from '@apollo/client';

import { Artist } from '../../objects/artist';
import { MainMap } from './main_map';
import { ArtistList } from './artist_list';

import {
  GET_ARTISTS,
  GET_ARTIST_EXHIBITION_INFO,
  GET_ARTIST_INFO,
} from '../graphql.operations';
import ErrorDisplay from '../error_display';
import { ArtistCardComponent } from '../artist-card/artist-card.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    // Components
    ArtistCardComponent,
    // Other
    CommonModule,
    ScrollingModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
  ],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.css',
})
export class MapViewComponent implements AfterViewInit {
  // Main map
  @ViewChild('main_map', { read: ElementRef })
  main_map_element!: ElementRef;
  main_map!: MainMap;

  // Artist list
  @ViewChild('select_artists', { read: MatSelect })
  select_artists!: MatSelect;
  artist_list: ArtistList = new ArtistList();

  // --------------------------------------------------------------------------

  constructor(private apollo: Apollo) {}

  ngAfterViewInit(): void {
    // Call inits
    this.artist_list.init(this.select_artists);

    // Call loads
    this.load_map();
    this.load_available_artists();
  }
  on_resize() {
    this.main_map.on_resize();
  }

  // --------------------------------------------------------------------------

  load_map(): void {
    this.main_map = new MainMap(this.main_map_element.nativeElement);
    d3.json('../assets/europe.topojson').then((map_data: any) =>
      this.main_map.draw_base_map(map_data),
    );
  }

  // --------------------------------------------------------------------------

  load_available_artists(): void {
    this.apollo
      .query({
        query: GET_ARTISTS,
      })
      .subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
        if (error !== undefined) {
          ErrorDisplay.show_message(error.message);
          return;
        }

        // Load available artists list with artists name
        this.artist_list.load_artists(Artist.from_query(data));
      });
  }

  select_artist(artist: Artist): void {
    this.artist_list.select_artist(artist);

    // Check if this action is needed
    if (artist.all_fields_loaded) return;

    // Load fields
    this.apollo
      .query({
        query: GET_ARTIST_INFO,
        variables: { id: artist.id?.toString() },
      })
      .subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
        if (error !== undefined) {
          ErrorDisplay.show_message(error.message);
          return;
        }

        // Finalize filed loading
        artist.load_all_fields(data);

        // Now we can update graph display
        this.main_map.draw_artists_life_trajectory(
          this.artist_list.selected_artists,
        );
      });
  }

  remove_artist(artist: Artist) {
    this.artist_list.remove_artist(artist);
    this.main_map.draw_artists_life_trajectory(
      this.artist_list.selected_artists,
    );
  }

  // --------------------------------------------------------------------------

  clear_artists(): void {
    this.artist_list.remove_all_artists();
    this.main_map.draw_artists_life_trajectory(
      this.artist_list.selected_artists,
    );
  }

  load_exhibitions(): void {
    this.apollo
      .query({
        query: GET_ARTIST_EXHIBITION_INFO,
        variables: {
          id_list: [
            '1', //
            '2', //
            '83', //
            '52', //
            '12',
          ],
        },
      })
      .subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
        if (error !== undefined) {
          ErrorDisplay.show_message(error.message);
          return;
        }

        // Create artists
        let artist = Artist.from_query(data);

        // Draw trajectories
        this.main_map.draw_artists_life_trajectory(artist);
      });
  }

  // --------------------------------------------------------------------------
}
