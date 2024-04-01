import { Component, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

import { Apollo } from 'apollo-angular';
import { ApolloQueryResult } from '@apollo/client';
import { GET_HOSTS } from '../graphql.operations';
import { Host } from '../../objects/host';
import { Place } from '../../objects/place';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.css'
})
export class MapViewComponent {
  @ViewChild('main_map', { read: ElementRef })
  main_map!: ElementRef;

  map_svg: any;

  // --------------------------------------------------------------------------

  constructor(private apollo: Apollo) {
    d3.json("../assets/europe.topojson").then((map_data: any) => {
      this.draw_map(map_data);
    });
  }

  // --------------------------------------------------------------------------

  // Various settings
  private fill_color: string = "#fec";
  private selected_color: string = "red";
  private zoom_threshold: [number, number] = [1.0, 4.0];
  private current_scale: number = 1.0;

  private scale_rule_circles: any =
    (d: any) => Math.log(d.hosts.length + 1) * 3 / this.current_scale
  private scale_rule_path: any =
    (d: any) => 0.5 / this.current_scale

  private get_zoom: any =
    (width: number, height: number): any =>
      d3.zoom()
        .scaleExtent(this.zoom_threshold)
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", (e: any) => {
          // Update scale
          this.current_scale = e.transform.k;

          // Update transforms
          const g = this.map_svg.select('g');
          g.attr('transform', e.transform)

          // Update path width
          g.selectAll("path").attr("stroke-width", this.scale_rule_path);

          // Update circles
          g.selectAll("circle").attr("r", this.scale_rule_circles)
        });

  private get_projection: any =
    (width: number): any =>
      d3.geoEqualEarth()
        .translate([0.35 * width, 1.6 * width])
        .scale(1.3 * width);

  resize_map(): void {
    if (!this.map_svg) return;
    const svg = this.map_svg;

    // Get dimensions
    const rect = svg.node().getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // defines the map projection method and scales the map within the SVG
    const projection = this.get_projection(width);

    // generates the path coordinates from topojson
    const path: any = d3.geoPath().projection(projection);

    // Zoom
    const zoom = this.get_zoom(width, height, svg);

    // Update
    svg.call(zoom).selectAll("path").attr('d', path);
  }

  draw_map(map_data: any): void {
    if (this.map_svg) this.map_svg.remove();

    // Set style
    this.map_svg = d3.select(this.main_map.nativeElement);
    const svg = this.map_svg;
    svg.attr("style", "width: 50%; height: 100%; margin: 2%; border: 1px solid black; aspect-ratio: 4 / 3;");

    // Get dimensions
    const rect = svg.node().getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // defines the map projection method and scales the map within the SVG
    const projection = this.get_projection(width);

    // generates the path coordinates from topojson
    const path: any = d3.geoPath().projection(projection);

    // map geometry
    const map_fe: GeoJSON.FeatureCollection | GeoJSON.Feature =
      topojson.feature(map_data, map_data.objects.europe);
    const map_geo = map_fe.type === "Feature" ? [map_fe] : (map_fe as any).features;

    // Zoom
    const zoom = this.get_zoom(width, height, svg);

    // Add graphics
    const graph = svg.call(zoom).append("g");

    // generates and styles the SVG path
    graph.append('g')
      .selectAll('path')
      .data(map_geo)
      .enter().append('path')
      .attr('d', path)
      .attr('stroke', 'black')
      .attr('stroke-width', this.scale_rule_path)
      .attr('fill', this.fill_color)
      .attr('data-id', (d: any) => d.id)
      .on('mouseover', (_: any, item: any) => {
        svg.select(`[data-id="${item.id}"]`)
          .transition().duration(200)
          .attr("fill", this.selected_color);
      })
      .on('mouseout', (_: any, item: any) => {
        svg.select(`[data-id="${item.id}"]`)
          .transition().duration(200)
          .attr("fill", this.fill_color);
      });
    // .on('click', (event, item) => {
    //   // country_color_selected(i.properties.id)
    // })
  }

  draw_places(places: Place[]): void {
    const svg = this.map_svg;

    // Get dimensions
    const rect = svg.node().getBoundingClientRect();
    const width = rect.width;

    // Get projection
    const projection = this.get_projection(width);

    // Color will depend on host count
    const color: any =
      d3.scaleLog<string, number>()
        .domain([1, 60])
        .range(["black", "blue"]);

    // Add circles
    const graph = svg.select('g');
    graph.append('g')
      .selectAll("circle")
      .data(places)
      .enter()
      .append("circle")
      .attr("cx", (d: Place) => d.project(projection)[0])
      .attr("cy", (d: Place) => d.project(projection)[1])
      .attr("r", this.scale_rule_circles)
      .attr("fill", (d: Place) => color(d.hosts.length))
      .attr("data-id", (d: Place) => d.id!)
      .on("mouseover", (_: any, d: Place) => {
        svg.select(`[data-id="${d.id}"]`)
          .transition().duration(200)
          .attr("fill", this.selected_color);
      })
      .on('mouseout', (_: any, d: Place) => {
        svg.select(`[data-id="${d.id}"]`)
          .transition().duration(200)
          .attr("fill", color(d.hosts.length));
      })
      ;
  }

  load_hosts(): void {
    this.apollo.query({
      query: GET_HOSTS
    }).subscribe(({ data, error }: ApolloQueryResult<unknown>) => {
      if (error === undefined) {
        // Create hosts
        let hosts = Host.from_query(data);
        // Create places
        let places = Place.from_hosts(hosts);
        // Put them on the map
        this.draw_places(places);
      } else {
        // this.main_text = error.message;
      }
    })
  }
}
