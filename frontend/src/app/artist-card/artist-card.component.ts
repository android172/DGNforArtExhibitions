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

@Component({
  selector: 'app-artist-card',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardContent, MatCardTitle],
  templateUrl: './artist-card.component.html',
  styleUrl: './artist-card.component.css',
})
export class ArtistCardComponent implements OnInit {
  @Input() artist!: Artist;

  constructor() {}

  ngOnInit() {}

  parse_exhibitions(exhibitions: Exhibition[]): string[] {
    // Sort exhibitions by year (Necessary preprocessing)
    exhibitions.sort((a: Exhibition, b: Exhibition) => {
      if (!a.start_year || !b.start_year) return 0;
      return a.start_year - b.start_year;
    });
    return exhibitions.map(
      (exhibition) => `[${exhibition.start_year}] ${exhibition.title}`,
    );
  }
}
