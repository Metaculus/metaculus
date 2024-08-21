import * as math from "mathjs";

import { ExtendedQuartiles, Quartiles } from "@/types/question";

export function almostEqual(a: number, b: number, eps = 1e-12) {
  return b == 0 ? a == 0 : Math.abs((a - b) / b) < eps;
}

export function logisticDistributionParamsFromSliders(
  left: number,
  center: number,
  right: number
) {
  // k == extremisation constant
  const k = 0.15;
  const mode = (1 + 2 * k) * center - k;
  let scale = Number(math.pow(math.atanh(right - left), 2));
  let asymmetry = (right + left - 2 * center) / (right - left);
  if (asymmetry > 0.95) {
    asymmetry = 0.95;
  } else if (asymmetry < -0.95) {
    asymmetry = -0.95;
  }
  if (scale < 0.007) {
    scale = 0.007;
  } else if (scale > 10) {
    scale = 10;
  }
  return {
    mode: mode,
    scale: scale,
    asymmetry: asymmetry,
  };
}

function Fprime(x: number) {
  return Number(math.divide(1, math.add(math.pow(math.e, -x), 1)));
}

function sprime(scale: number) {
  return Number(math.divide(scale, math.log(3)));
}

function logisticCDF(
  x: number,
  mode: number,
  scale: number,
  asymmetry: number
) {
  const c = x < mode ? 0 : 1;
  const k = 1 - 2 * c;
  return (
    c +
    k *
      (1 - asymmetry * k) *
      Fprime(
        k *
          math.divide(
            math.subtract(x, mode),
            sprime(scale) * (1 - asymmetry * k)
          )
      )
  );
}

export function cdfToPmf(cdf: number[]) {
  const pdf = [];
  for (let i = 0; i < cdf.length; i++) {
    if (i === 0) {
      pdf.push(cdf[i]);
    } else {
      pdf.push(cdf[i] - cdf[i - 1]);
    }
  }
  return pdf;
}

export function binWeightsFromSliders(
  left: number,
  center: number,
  right: number,
  lowerOpen: boolean,
  upperOpen: boolean
) {
  // TODO: deal with boundaries
  const params = logisticDistributionParamsFromSliders(left, center, right);
  const step = 1 / 200;
  const xArr = Array.from(
    { length: Math.floor(1 / step) + 1 },
    (_, i) => i * step
  );
  let cdf = [
    ...xArr.map((x) =>
      logisticCDF(x, params.mode, params.scale, params.asymmetry)
    ),
  ];
  // clip cdf from closed_bounds
  const scale_lower_to = lowerOpen ? 0 : cdf[0];
  const scale_upper_to = upperOpen ? 1 : cdf[cdf.length - 1];
  const rescaled_inbound_mass = scale_upper_to - scale_lower_to;
  cdf = cdf.map((x) => (x - scale_lower_to) / rescaled_inbound_mass);

  if (cdf === null) {
    cdf = [];
  }
  const pmf = cdfToPmf(cdf);
  return { pmf: pmf, cdf: cdf };
}

export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles: true
): ExtendedQuartiles;
export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles?: false
): Quartiles;
export function computeQuartilesFromCDF(cdf: number[]): Quartiles;
export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles?: boolean
): Quartiles | ExtendedQuartiles {
  function findPercentile(cdf: number[], percentile: number) {
    if (cdf === null) {
      cdf = [];
    }
    const target = percentile / 100;

    for (let i = 0; i < cdf.length; i++) {
      if (cdf[i] >= target) {
        if (i === 0) return 0;

        const diff = cdf[i] - cdf[i - 1];
        const adjustedPercentile = (target - cdf[i - 1]) / diff;
        return (i - 1 + adjustedPercentile) / (cdf.length - 1);
      }
    }
    return 1;
  }

  const median = findPercentile(cdf, 50);
  const lower25 = findPercentile(cdf, 25);
  const upper75 = findPercentile(cdf, 75);

  if (extendedQuartiles) {
    const lower10 = findPercentile(cdf, 10);
    const upper90 = findPercentile(cdf, 90);
    return {
      median: median,
      lower25: lower25,
      upper75: upper75,
      lower10: lower10,
      upper90: upper90,
    };
  } else {
    return {
      median: median,
      lower25: lower25,
      upper75: upper75,
    };
  }
}
