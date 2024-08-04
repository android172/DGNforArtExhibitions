# DfnArtEx

This project aims to visualize the trajectories of artists from early 20th-century Europe in an interactive and dynamic way. Based on the "Exhibitions of Modern European Painting 1905-1915" dataset.

Dataset: https://exhibitions.univie.ac.at/

This project was built as an Angular webapp. All visualizations are done with D3. Connection to backend GraphQL database achieved with Apollo.

### Data encodings

We represent data as a temporal-geospatial visualization. Each selected artist encodes a singular line flowing from node to node. This trajectory represents the journey of their art as it flowed from exhibition to exhibition across Europe.

Graph colors for nodes and links encode different exhibiting years, one for each year from 1905 to 1915.

Nodes represent exhibition host locations. Each place hosted many exhibitions over this period, some of which were simultaneous. We opted to aggregate these exhibitions based on the starting year and location. Thus, we divide nodes into piechart arcs based on exhibiting years, each arc colored in the appropriate year color. Arc length doesn't encode any data, but overall node size does, as it scales with piechart segment count for better readability. To avoid clutter locations with many segments are hollowed out. The inside of these rings only shows time-only transitions.

Links between node segments come in two variants. As some exhibitions occasionally partake in multiple locations simultaneously, undirected black links denote this connection between "main" and "auxiliary" hosts. Otherwise, directed links encode the transition of the artist's collection from place to place. These links transition from the source to the destination node color. When multiple artists are selected, there is a possibility of collision, where more than one artist makes the same transition. We encode this as link thickness, corresponding to the artist count.

### Interactivity

The graph view is pannable and zoomable, with element size adapting to the zoom level.

Next to the graph, on a separate menu, we can add or remove artists whose trajectories we want to highlight. We search and add artists from the dropdown. All added artists are shown as cards with their information and exhibition history.

Hovering over a link highlights all artists that made that transition, both their card and trajectory. Hovering artist cards will highlight the given artist. Hovering individual exhibitions highlights their location. All this allows for easier trajectory tracking.

Hovering over node segments highlights all segments from that year. Additional information about the selected segment is shown as a tooltip.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js** (v14.x or later)
- **npm** (v6.x or later)

## Installation

To install the project dependencies, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/android172/DGNforArtExhibitions
   cd DGNforArtExhibitions
   ```
2. Install Angular CLI globally (if not already installed):
   ```bash
   npm install -g @angular/cli
   ```
3. Install the project dependencies:
   ```bash
   npm install
   ```

## Build

To build the project, run the following command:

```bash
ng build
```

This will compile the project and generate the output files in the dist/ directory.

## Run

To serve the application locally, use the following command:

```bash
ng serve
```

This will start a development server and open the application in your default web browser. The application will automatically reload if you change any of the source files.

## Project Dependencies

Here is a brief overview of the main dependencies used in this project:

- `@angular/core` - Angular framework core
- `@angular/material` - Angular Material components
- `@apollo/client` - Apollo Client for GraphQL
- `graphql` - GraphQL library for querying APIs
- `d3` - Data visualization library
- `rxjs` - Reactive Extensions Library for JavaScript
- `topojson-client` - Topojson support

## Other

#### Running Tests

To execute the unit tests via Karma, use the following command:

```bash
ng test
```

To execute the end-to-end tests via Protractor, run:

```bash
ng e2e
```

#### Linting

To lint the project files, use the following command:

```bash
ng lint
```

#### Formatting Code

To format the code using Prettier, use the following command:

```bash
npx prettier --write .
```

#### Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
