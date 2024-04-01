import { gql } from "apollo-angular";

const GET_ARTISTS = gql`
   query GetArtists{
    artists {
      id
      firstname
      lastname,
      deathdate
    }
  }
`

const GET_HOSTS = gql`
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
`

export { GET_ARTISTS, GET_HOSTS }