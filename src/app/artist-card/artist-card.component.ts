import { Component, Input, OnInit } from '@angular/core';
import { Artist } from '../../objects/artist';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Exhibition } from '../../objects/exhibition';
import { Place } from '../../objects/place';
import { MainMap } from '../map-view/main_map';

@Component({
  selector: 'app-artist-card',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardContent, MatCardTitle],
  templateUrl: './artist-card.component.html',
  styleUrl: './artist-card.component.css',
})
export class ArtistCardComponent implements OnInit {
  @Input() artist!: Artist;
  @Input() main_map!: MainMap;

  constructor() {}

  ngOnInit() {}

  parse_exhibitions(exhibitions: Exhibition[]): Exhibition[] {
    // Sort exhibitions by year (Necessary preprocessing)
    exhibitions.sort((a: Exhibition, b: Exhibition) => {
      if (!a.start_year || !b.start_year) return 0;
      return a.start_year - b.start_year;
    });
    return exhibitions;
  }

  print_exhibition(exhibition: Exhibition): string {
    return `[${exhibition.start_year}] ${exhibition.title}`;
  }

  highlight_exhibition(exhibition: Exhibition) {
    if (exhibition.start_year === undefined) return;
    const places: string[] = Place.from_hosts(
      exhibition.took_place_in_hosts,
    ).map((p) => p.place!);
    this.main_map.highlight_places(places, exhibition.start_year);
  }
  highlight_no_exhibition() {
    this.main_map.highlight_no_place();
  }
}
