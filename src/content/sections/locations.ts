import type { LatLon } from '@/components/sections/Locations/geo'

export type LocationItem = {
  name: string
  area: string
  /** Real position; drives the pin on the map. */
  latLon: LatLon
  body: string
  /** Search phrase for the "Open in Maps" link. */
  mapsQuery: string
}

export type LocationsContent = {
  eyebrow: string
  heading: string
  intro: string
  listLabel: string
  openInMaps: string
  riverLabel: string
  locations: LocationItem[]
}

export const locationsContent: LocationsContent = {
  eyebrow: 'Locations',
  heading: 'Drawn between the landmarks',
  intro:
    'Most of our homes sit within sight of the river. These are the places our clients navigate by, and the light we design around.',
  listLabel: 'Iconic London locations',
  openInMaps: 'Open in Maps',
  riverLabel: 'River Thames',
  locations: [
    {
      name: 'Tower Bridge',
      area: 'Shad Thames, SE1',
      latLon: [51.5055, -0.0754],
      body: 'Our studio’s doorstep. The warehouse lofts of Shad Thames taught us how much a single river view can carry a room.',
      mapsQuery: 'Tower Bridge, London',
    },
    {
      name: 'Tower of London',
      area: 'Tower Hill, EC3',
      latLon: [51.5081, -0.0759],
      body: 'Nine hundred years of stone. A daily reminder that good buildings are adapted, not replaced.',
      mapsQuery: 'Tower of London',
    },
    {
      name: 'The Shard',
      area: 'London Bridge, SE1',
      latLon: [51.5045, -0.0865],
      body: 'Its glass catches the last light of the evening, which is why our Bermondsey projects all face west.',
      mapsQuery: 'The Shard, London',
    },
    {
      name: 'St Paul’s Cathedral',
      area: 'City of London, EC4',
      latLon: [51.5138, -0.0984],
      body: 'Protected sightlines shape every roof we draw in the City; we design around them, not against them.',
      mapsQuery: 'St Paul’s Cathedral, London',
    },
    {
      name: 'London Eye',
      area: 'South Bank, SE1',
      latLon: [51.5033, -0.1196],
      body: 'One slow revolution, thirty minutes, the whole city. The pace we like to work at.',
      mapsQuery: 'London Eye',
    },
    {
      name: 'Westminster',
      area: 'Parliament Square, SW1',
      latLon: [51.5007, -0.1246],
      body: 'Gothic Revival detail at its richest: the craftsmanship our joiners still quote back to us.',
      mapsQuery: 'Palace of Westminster, London',
    },
    {
      name: 'Trafalgar Square',
      area: 'Charing Cross, WC2',
      latLon: [51.508, -0.1281],
      body: 'Officially the centre of London; every distance to our sites is measured from here.',
      mapsQuery: 'Trafalgar Square, London',
    },
    {
      name: 'Buckingham Palace',
      area: 'St James’s, SW1',
      latLon: [51.5014, -0.1419],
      body: 'Formal symmetry at the end of the Mall, a study in how a long approach sets up an arrival.',
      mapsQuery: 'Buckingham Palace, London',
    },
  ],
}
