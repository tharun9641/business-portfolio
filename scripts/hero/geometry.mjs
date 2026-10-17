/**
 * Measured geometry of incoming-assets/hero/tower-bridge.jpg (4240×2832 source px).
 * Shared by the asset pipeline and, through generated JSON, by src/content/sections/hero.ts.
 */
export const CANVAS = { w: 4240, h: 2832 }

/** Closed bascule leaves. The pivot sits at each leaf's tower-side end. */
export const BASCULES = {
  left: {
    pivot: [1700, 1652],
    // top edge, seam, then the lower chord of the girder back to the tower
    polygon: [
      [1698, 1604],
      [2150, 1604],
      [2150, 1646],
      [2090, 1640],
      [1900, 1668],
      [1712, 1700],
      [1698, 1700],
    ],
  },
  right: {
    pivot: [2602, 1652],
    polygon: [
      [2150, 1604],
      [2604, 1604],
      [2604, 1680],
      [2560, 1676],
      [2150, 1648],
    ],
  },
}

/** Region polygons that split the non-sky pixels into depth layers. */
export const REGIONS = {
  // Masts and superstructure (x < 780) plus hull and moorings down to the waterline.
  belfast: [
    [0, 0],
    [780, 0],
    [780, 1560],
    [1470, 1560],
    [1470, 2020],
    [800, 2140],
    [0, 2190],
  ],
  piers: [
    [1240, 1560],
    [3170, 1440],
    [3170, 2090],
    [1240, 2090],
  ],
  embankment: [
    [2930, 0],
    [4240, 0],
    [4240, 2832],
    [3300, 2832],
    [3160, 1700],
    [3150, 1440],
    [2930, 1440],
  ],
  /** Rows below this belong to the river unless claimed by a nearer layer. */
  horizonY: 1640,
}

/** Bridge region fed to BiRefNet (salient object = the bridge). */
export const BRIDGE_CROP = { left: 1000, top: 700, width: 2200, height: 1100 }

/** Pier region fed to BiRefNet, to tell posts from the water around them. */
export const PIERS_CROP = { left: 1240, top: 1500, width: 1930, height: 620 }

/** Depth (0..255 from Depth Anything V2) thresholds. Sky is exactly 0; the far skyline is 1–2. */
export const DEPTH = { sky: 1, belfastLow: 40, piers: 28 }

/** Globe-lamp centres on the embankment, for glow sprites. */
export const LAMPS = [
  [3700, 1090],
  [3420, 1262],
  [3262, 1402],
  [3212, 1452],
  [3182, 1492],
]
