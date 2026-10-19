import type { ImageAsset } from '../types'

export type LocationItem = {
  name: string
  area: string
  body: string
  /** Search phrase for the "Open in Maps" link. */
  mapsQuery: string
  /** 16:10 photo, shown full screen. */
  image: ImageAsset
  /** CSS object-position for narrow screens, where the full-screen crop is tall (default centre). */
  focus?: string
}

export type LocationsContent = {
  heading: string
  intro: string
  listLabel: string
  openInMaps: string
  locations: LocationItem[]
}

export const locationsContent: LocationsContent = {
  heading: 'Drawn between the landmarks',
  intro:
    'Most of our homes sit within sight of the river. These are the places our clients navigate by, and the light we design around.',
  listLabel: 'Iconic London locations',
  openInMaps: 'Open in Maps',
  locations: [
    {
      name: 'Tower of London',
      area: 'Tower Hill, EC3',
      body: 'Nine hundred years of stone. A daily reminder that good buildings are adapted, not replaced.',
      mapsQuery: 'Tower of London',
      image: {
        src: '/assets/locations/tower-of-london.avif',
        alt: 'The White Tower and curtain walls of the Tower of London across the Thames at blue hour.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'The Shard',
      area: 'London Bridge, SE1',
      body: 'Its glass catches the last light of the evening, which is why our Bermondsey projects all face west.',
      mapsQuery: 'The Shard, London',
      focus: '16% 50%',
      image: {
        src: '/assets/locations/the-shard.avif',
        alt: 'The Shard lit at night above London Bridge and the Thames.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'St Paul’s Cathedral',
      area: 'City of London, EC4',
      body: 'Protected sightlines shape every roof we draw in the City; we design around them, not against them.',
      mapsQuery: 'St Paul’s Cathedral, London',
      image: {
        src: '/assets/locations/st-pauls.avif',
        alt: 'St Paul’s Cathedral floodlit at night, seen along the Millennium Bridge.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'Covent Garden',
      area: 'Covent Garden, WC2',
      body: 'Glass, iron and lamplight over a market hall. Our favourite lesson in making a big room feel warm.',
      mapsQuery: 'Covent Garden Market, London',
      image: {
        src: '/assets/locations/covent-garden.avif',
        alt: 'The glass-roofed arcade of Covent Garden market under hanging lanterns.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'Westminster',
      area: 'Parliament Square, SW1',
      body: 'Gothic Revival detail at its richest: the craftsmanship our joiners still quote back to us.',
      mapsQuery: 'Palace of Westminster, London',
      image: {
        src: '/assets/locations/westminster.avif',
        alt: 'Big Ben and the Palace of Westminster at blue hour beside Westminster Bridge, lit gold and reflected in the Thames.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'Westminster Abbey',
      area: 'Broad Sanctuary, SW1',
      body: 'Seven centuries of builders added to it without erasing each other. That is how we approach every extension.',
      mapsQuery: 'Westminster Abbey, London',
      image: {
        src: '/assets/locations/westminster-abbey.avif',
        alt: 'The north front of Westminster Abbey, its rose window and pinnacles floodlit under a blue-hour sky.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'Trafalgar Square',
      area: 'Charing Cross, WC2',
      body: 'Officially the centre of London; every distance to our sites is measured from here.',
      mapsQuery: 'Trafalgar Square, London',
      image: {
        src: '/assets/locations/trafalgar-square.avif',
        alt: 'A Trafalgar Square fountain lit red at night in front of grand stone buildings.',
        width: 2000,
        height: 1250,
      },
    },
    {
      name: 'Buckingham Palace',
      area: 'St James’s, SW1',
      body: 'Formal symmetry at the end of the Mall, a study in how a long approach sets up an arrival.',
      mapsQuery: 'Buckingham Palace, London',
      image: {
        src: '/assets/locations/buckingham-palace.avif',
        alt: 'Buckingham Palace and its flower beds under a deep evening sky.',
        width: 2000,
        height: 1250,
      },
    },
  ],
}
