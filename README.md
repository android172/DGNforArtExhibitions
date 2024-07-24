# DfnArtEx

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

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
