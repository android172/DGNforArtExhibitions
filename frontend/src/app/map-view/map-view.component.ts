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

import { Host } from '../../objects/host';
import { Place } from '../../objects/place';
import { Exhibition } from '../../objects/exhibition';
import { Artist } from '../../objects/artist';
import { MainMap } from './main_map';
import { ArtistList } from './artist_list';

import {
  GET_ARTISTS,
  GET_ARTIST_EXHIBITION_INFO,
  GET_HOSTS,
} from '../graphql.operations';
import ErrorDisplay from '../error_display';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule,
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
    // Load map
    this.main_map = new MainMap(this.main_map_element.nativeElement);
    d3.json('../assets/europe.topojson').then((map_data: any) =>
      this.main_map.draw_base_map(map_data),
    );

    // Load artists
    this.artist_list.init(this.select_artists);
    this.load_available_artists();
  }

  // --------------------------------------------------------------------------

  map_resize() {
    this.main_map.on_resize();
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
        this.artist_list.available_artists.sort();
      });
  }

  // --------------------------------------------------------------------------

  load_hosts(): void {
    this.apollo
      .query({
        query: GET_HOSTS,
      })
      .subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
        if (error !== undefined) {
          ErrorDisplay.show_message(error.message);
          return;
        }

        // Create hosts
        let hosts = Host.from_query(data);
        // Create places
        let places = Place.from_hosts(hosts);
        // Put them on the map
        this.main_map.draw_places(places);
      });
  }

  load_exhibitions(): void {
    this.apollo
      .query({
        query: GET_ARTIST_EXHIBITION_INFO,
        variables: {
          id_list: ['12', '1', '2'],
        },
      })
      .subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
        if (error !== undefined) {
          ErrorDisplay.show_message(error.message);
          return;
        }

        // Create artists
        let artist = Artist.from_query(data);
        // Load their unique exhibitions
        let exhibitions: Exhibition[] = [];
        artist.forEach((a: Artist) =>
          a.exhibited_exhibitions.forEach((e: Exhibition) => {
            if (!exhibitions.some((ex: Exhibition) => ex.id === e.id))
              exhibitions.push(e);
          }),
        );
        // Compute unique hosts
        let hosts: Host[] = [];
        exhibitions.forEach((e: Exhibition) =>
          e.took_place_in_hosts.forEach((h: Host) => {
            if (!hosts.some((host: Host) => host.id === h.id)) hosts.push(h);
          }),
        );
        // Create places
        let places = Place.from_hosts(hosts);
        // Put them on the map
        // this.main_map.draw_places(places);
        console.log(places);

        // Draw trajectories
        this.main_map.draw_artists_life_trajectory(artist[1]);
      });
  }

  // --------------------------------------------------------------------------
}
