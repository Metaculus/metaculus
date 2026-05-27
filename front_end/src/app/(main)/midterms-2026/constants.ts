export const MIDTERMS_COLORS = {
  demPrimary: "#6B7AE8",
  // Slightly darker accents, used for borders / strokes so they read
  // sharply against the semi-transparent fills.
  demBorder: "#3A4DD0",
  repPrimary: "#E8827A",
  repBorder: "#C53B33",
  // Dark-mode variants — brighter / more vivid so the bars hold the
  // same perceived saturation against the navy card bg as the light
  // pair does against the white card. Starter values; tweakable.
  demPrimaryDark: "#8B96F0",
  demBorderDark: "#6877E0",
  repPrimaryDark: "#F09A92",
  repBorderDark: "#DC5F57",
  // Dark-mode text color for the contested mobile tiles, where the
  // pastel fill makes white text hard to read.
  tileTextDark: "#283441",
  // Continuous-gradient anchors. `tossUp` is the neutral midpoint at 50%,
  // `likelyR` and `likelyD` are the extremes; intermediate colors are
  // generated via getColorInSpectrum.
  spectrumDem: "#4A5CD4",
  spectrumNeutral: "#D3D1C7",
  spectrumRep: "#D4504A",
  // Theme-aware tokens for state stroke + uncontested fill.
  // Stroke matches the SectionCard background color so state borders blend
  // with the surrounding card.
  cardBgLight: "#ffffff",
  cardBgDark: "#262f38",
  // Uncontested fill is one elevation step lighter than the card bg so
  // uncontested states are subtly visible without dominating.
  uncontestedLight: "#EFF4F4",
  uncontestedDark: "#37424F",
  uncontestedHoverLight: "#CFD5E3",
  uncontestedHoverDark: "#434E5A",
} as const;

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};
