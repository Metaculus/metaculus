import { WorldForecast } from "./questions";
import { yearToTimestamp } from "../helpers/forecast";

// Stand-ins for the API until the real question IDs arrive. Each sample is a
// log-normal fitted to a median and a spread, emitted the way the API returns
// a date question's forecast.
const RANGE_START = 2026;
const RANGE_YEARS = 40;
// Finer fixture sampling preserves the fitted curves; real CDFs may use any length.
const CDF_POINTS = 2001;
const LOG_NORMAL_ORIGIN = 2026.5;

// [median, spread, forecasters]
const SAMPLES: Record<string, [number, number, number]> = {
  he1: [2027.9, 0.4, 921],
  he2: [2031.2, 0.45, 866],
  he5: [2029.0, 0.45, 1033],
  he3: [2032.4, 0.5, 691],
  he6: [2036.0, 0.5, 604],
  he4: [2031.1, 0.4, 1408],
  he7: [2042.0, 0.6, 877],
  l6: [2032.0, 0.55, 2544],
  mq10411: [2039.87, 2.04, 72],
  w5: [2027.8, 0.4, 2210],
  w6: [2036.0, 0.6, 1702],
  p3: [2028.9, 0.4, 1840],
  p1: [2029.2, 0.45, 1320],
  p2: [2034.0, 0.5, 760],
  mq38391: [2027.47, 1.16, 66],
  mq406: [2027.83, 1.72, 646],
  w1: [2029.4, 0.55, 3190],
  w2: [2029.1, 0.45, 1017],
  w7: [2029.8, 0.4, 655],
  w3: [2034.0, 0.5, 1480],
  w4: [2045.3, 0.6, 1344],
  l3: [2027.7, 0.4, 1976],
  l4: [2033.0, 0.5, 402],
  l5: [2037.0, 0.6, 611],
  c1: [2028.4, 0.4, 488],
  c2: [2033.3, 0.5, 612],
  mq19356: [2042.7, 1.78, 178],
  mq16625: [2030.7, 0.87, 58],
  h4: [2034.2, 0.5, 2031],
  h5: [2036.4, 0.55, 742],
  m1: [2030.4, 0.45, 1890],
  m2: [2031.3, 0.45, 2415],
  m3: [2040.1, 0.45, 1122],
  m4: [2035.5, 0.5, 812],
  m5: [2041.0, 0.55, 944],
  m6: [2046.0, 0.6, 530],
  mq43262: [2029.85, 0.64, 32],
  mq43263: [2030.11, 0.78, 23],
  h6: [2028.2, 0.4, 1560],
  mq17401: [2030.94, 1.03, 115],
  c4: [2031.8, 0.55, 1253],
  c5: [2034.0, 0.55, 1377],
  md2: [2030.5, 0.5, 870],
  md1: [2032.0, 0.5, 1105],
  mq10955: [2029.78, 1.68, 179],
  mq11679: [2030.89, 1.81, 101],
};

const erf = (value: number) => {
  const sign = Math.sign(value);
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  return (
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x))
  );
};

const logNormalCdf = (t: number, median: number, spread: number) => {
  const x = t - LOG_NORMAL_ORIGIN;
  if (x <= 0) return 0;
  return (
    0.5 *
    (1 +
      erf(
        (Math.log(x) - Math.log(median - LOG_NORMAL_ORIGIN)) /
          spread /
          Math.SQRT2
      ))
  );
};

const scaling = {
  range_min: yearToTimestamp(RANGE_START),
  range_max: yearToTimestamp(RANGE_START + RANGE_YEARS),
  zero_point: null,
};

export const SAMPLE_FORECASTS: Record<string, WorldForecast> =
  Object.fromEntries(
    Object.entries(SAMPLES).map(([id, [median, spread, forecasters]]) => [
      id,
      {
        cdf: Array.from({ length: CDF_POINTS }, (_, i) =>
          logNormalCdf(
            RANGE_START + (RANGE_YEARS * i) / (CDF_POINTS - 1),
            median,
            spread
          )
        ),
        scaling,
        forecasters,
      },
    ])
  );
