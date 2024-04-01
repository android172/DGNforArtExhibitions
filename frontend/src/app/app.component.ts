import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Apollo } from 'apollo-angular';
import { ApolloQueryResult } from '@apollo/client';

import { GET_ARTISTS } from './graphql.operations';
import { Artist } from '../objects/artist';
import { MapViewComponent } from './map-view/map-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'dfn_art_ex';

  main_text: string = "Hello not world";

  // --------------------------------------------------------------------------

  constructor(private apollo: Apollo) { }

  ngOnInit(): void { }

  // --------------------------------------------------------------------------

  clicked(): void {
    this.main_text = "Processing request...";
    this.apollo.query({
      query: GET_ARTISTS
    }).subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
      if (error === undefined) {
        let artists = Artist.from_query(data);
        this.main_text = artists[0].first_name ? artists[0].first_name : "Hello not world";
      } else {
        this.main_text = error.message;
      }
    })
  }
}
