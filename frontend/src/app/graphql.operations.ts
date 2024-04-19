import { gql } from 'apollo-angular';

// ----------------------------------------------------------------------------

export const GET_ARTISTS = gql`
  query GetArtists {
    artists {
      id
      firstname
      lastname
      title
      sex
      country
      birthdate
      birthplace
      deathdate
      deathplace
    }
  }
`;

export const GET_ARTIST_BY_ID = gql`
  query GetArtistById($id: String) {
    artists(where: { id: $id }) {
      id
      firstname
      lastname
      title
      sex
      country
      birthdate
      birthplace
      deathdate
      deathplace
    }
  }
`;

export const GET_ARTIST_EXHIBITION_INFO = gql`
  query GetArtistExhibitionInfo($id_list: [String!]) {
    artists(where: { id_IN: $id_list }) {
      id
      firstname
      lastname
      country
      birthdate
      birthplace
      deathdate
      deathplace
      exhibitedExhibitions {
        id
        title
        startdate
        type
        tookPlaceInHosts {
          id
          name
          country
          place
          longitude
          latitude
        }
      }
    }
  }
`;

// ----------------------------------------------------------------------------

export const GET_HOSTS = gql`
  query GetHosts {
    hosts {
      id
      name
      country
      place
      place_tgn
      town
      longitude
      latitude
    }
  }
`;

export const GET_EXHIBITIONS = gql`
  query GetExhibitions {
    exhibitions {
      id
      title
      startdate
      enddate
      organizer
      type
    }
  }
`;
