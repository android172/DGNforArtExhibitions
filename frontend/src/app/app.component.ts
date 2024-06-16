import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Apollo } from 'apollo-angular';

import { MapViewComponent } from './map-view/map-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Art exhibitions in early 20th century Europe';

  main_text: string = 'Art exhibitions in early 20th century Europe';

  // --------------------------------------------------------------------------

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {}

  // --------------------------------------------------------------------------
}
