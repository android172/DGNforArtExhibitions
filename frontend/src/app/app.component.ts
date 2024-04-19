import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Apollo } from 'apollo-angular';
import { ApolloQueryResult } from '@apollo/client';

import { GET_ARTIST_EXHIBITION_INFO } from './graphql.operations';

import { Artist } from '../objects/artist';
import { MapViewComponent } from './map-view/map-view.component';
import ErrorDisplay from './error_display';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Art exhibitions in early 20th century Europe';

  main_text: string = 'Hello not world';

  // --------------------------------------------------------------------------

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {}

  // --------------------------------------------------------------------------

  clicked(): void {
    this.main_text = 'Processing request...';
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

        // Load available artists list with artists name
        let artists = Artist.from_query(data);
        this.main_text = artists[0].first_name
          ? artists[0].first_name
          : 'Hello not world';
      });
  }
}
