/**
 * BLS OEWS historical employment by occupation (2015–2024), transcribed from the
 * `labor-hub-tools` occupation-forecasting dataset (`oews_cache.json`). Keyed by
 * our job slug. `employment` is the head-count per year.
 *
 * `socBreak` marks a year before which the SOC code changed and counts are not
 * comparable — those earlier years are dropped so the line doesn't show an
 * artificial jump (e.g. Laborers' 2018→2019 Stockers reclassification, and the
 * SOC-2018 introductions for Software Developers and Physicians).
 */
export type OewsSeries = {
  socBreak: number | null;
  employment: Record<number, number>;
};

export const OEWS_HISTORY: Record<string, OewsSeries> = {
  "general-managers": {
    socBreak: null,
    employment: {
      2015: 2145140,
      2016: 2188870,
      2017: 2212200,
      2018: 2289770,
      2019: 2400280,
      2020: 2347420,
      2021: 2984920,
      2022: 3376680,
      2023: 3507810,
      2024: 3584420,
    },
  },
  "financial-specialists": {
    socBreak: null,
    employment: {
      2015: 2607760,
      2016: 2651370,
      2017: 2661230,
      2018: 2698660,
      2019: 2756610,
      2020: 2755470,
      2021: 2900840,
      2022: 3016910,
      2023: 3039480,
      2024: 3033120,
    },
  },
  "software-developers": {
    socBreak: 2019,
    employment: {
      2019: 1754750,
      2020: 1811160,
      2021: 1874100,
      2022: 2049920,
      2023: 2176710,
      2024: 2154370,
    },
  },
  engineers: {
    socBreak: null,
    employment: {
      2015: 1610480,
      2016: 1635420,
      2017: 1665220,
      2018: 1700880,
      2019: 1730720,
      2020: 1673440,
      2021: 1631080,
      2022: 1659230,
      2023: 1703700,
      2024: 1746750,
    },
  },
  "lawyers-and-law-clerks": {
    socBreak: null,
    employment: {
      2015: 622590,
      2016: 632940,
      2017: 643630,
      2018: 659090,
      2019: 673800,
      2020: 672820,
      2021: 695810,
      2022: 722710,
      2023: 746020,
      2024: 760970,
    },
  },
  "k12-teachers": {
    socBreak: null,
    employment: {
      2015: 4080100,
      2016: 4133490,
      2017: 4174870,
      2018: 4193290,
      2019: 4211470,
      2020: 3998620,
      2021: 4021070,
      2022: 4177640,
      2023: 4261430,
      2024: 4321590,
    },
  },
  designers: {
    socBreak: null,
    employment: {
      2015: 469670,
      2016: 492930,
      2017: 507030,
      2018: 519180,
      2019: 536660,
      2020: 504880,
      2021: 526080,
      2022: 563810,
      2023: 570330,
      2024: 588160,
    },
  },
  "registered-nurses": {
    socBreak: null,
    employment: {
      2015: 2745910,
      2016: 2857180,
      2017: 2906840,
      2018: 2951960,
      2019: 2982280,
      2020: 2986500,
      2021: 3047530,
      2022: 3072700,
      2023: 3175390,
      2024: 3282010,
    },
  },
  physicians: {
    socBreak: 2019,
    employment: {
      2021: 641380,
      2022: 702910,
      2023: 716950,
      2024: 727050,
    },
  },
  "law-enforcement": {
    socBreak: null,
    employment: {
      2015: 1223890,
      2016: 1232490,
      2017: 1235290,
      2018: 1217260,
      2019: 1232740,
      2020: 1203450,
      2021: 1200060,
      2022: 1161080,
      2023: 1136430,
      2024: 1177270,
    },
  },
  "restaurant-servers": {
    socBreak: null,
    employment: {
      2015: 7054960,
      2016: 7355090,
      2017: 7515370,
      2018: 7630110,
      2019: 7500280,
      2020: 6135730,
      2021: 5627500,
      2022: 6309200,
      2023: 6893410,
      2024: 7101010,
    },
  },
  "janitors-and-cleaners": {
    socBreak: null,
    employment: {
      2015: 3089590,
      2016: 3101400,
      2017: 3101660,
      2018: 3094210,
      2019: 3090570,
      2020: 2803150,
      2021: 2777470,
      2022: 2935360,
      2023: 3022470,
      2024: 3071180,
    },
  },
  "services-sales-representatives": {
    socBreak: null,
    employment: {
      2015: 1808330,
      2016: 1903140,
      2017: 1983790,
      2018: 2046120,
      2019: 2084000,
      2020: 1992540,
      2021: 2009700,
      2022: 2124250,
      2023: 2245510,
      2024: 2287740,
    },
  },
  "construction-workers": {
    socBreak: null,
    employment: {
      2015: 4076800,
      2016: 4216890,
      2017: 4348180,
      2018: 4497490,
      2019: 4617440,
      2020: 4430270,
      2021: 4362080,
      2022: 4509820,
      2023: 4588620,
      2024: 4691890,
    },
  },
  "laborers-and-movers": {
    socBreak: 2019,
    employment: {
      2015: 3637790,
      2016: 3730410,
      2017: 3859520,
      2018: 4002390,
      2019: 6168600,
      2020: 6021330,
      2021: 6178560,
      2022: 6840530,
      2023: 6935980,
      2024: 6784150,
    },
  },
};

/**
 * Historical employment expressed as % change vs the latest actual year (2024),
 * which we treat as the 2025 baseline anchor (no 2025 actual exists yet). The
 * latest year therefore maps to 0, and the chart's explicit 2025=0 point
 * continues flat from it. Years before a SOC reclassification break are dropped.
 */
export function getHistoricalPercentByYear(
  slug: string
): Record<string, number> {
  const series = OEWS_HISTORY[slug];
  if (!series) return {};

  const years = Object.keys(series.employment)
    .map(Number)
    .filter((y) => series.socBreak == null || y >= series.socBreak)
    .sort((a, b) => a - b);

  const latest = years[years.length - 1];
  if (latest == null) return {};
  const base = series.employment[latest];
  if (!base) return {};

  const out: Record<string, number> = {};
  for (const y of years) {
    const value = series.employment[y];
    if (value == null) continue;
    out[String(y)] = (value / base - 1) * 100;
  }
  return out;
}
