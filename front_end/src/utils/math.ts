import { isNil } from "lodash";

import {
  Bounds,
  DefaultInboundOutcomeCount,
  ExtendedQuartiles,
  Quartiles,
  Question,
  Scaling,
} from "@/types/question";

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
  let scale = Number(Math.pow(Math.atanh(Math.min(0.999, right - left)), 2));
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
  return Number(1 / (Math.pow(Math.E, -x) + 1));
}

function sprime(scale: number) {
  return Number(scale / Math.log(3));
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
      Fprime((k * (x - mode)) / (sprime(scale) * (1 - asymmetry * k)))
  );
}

export function cdfToPmf(cdf: number[]) {
  const pdf = [];
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  for (let i = 0; i < cdf.length; i++) {
    if (i === 0) {
      pdf.push(cdf[i]!);
    } else {
      pdf.push(cdf[i]! - cdf[i - 1]!);
    }
  }
  pdf.push(1 - cdf[cdf.length - 1]!);
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
  return pdf;
}

export function cdfFromSliders(
  left: number,
  center: number,
  right: number,
  lowerOpen: boolean,
  upperOpen: boolean,
  inboundOutcomeCount: number = DefaultInboundOutcomeCount
) {
  const params = logisticDistributionParamsFromSliders(left, center, right);
  const step = 1 / inboundOutcomeCount;
  const xArr = Array.from(
    { length: inboundOutcomeCount + 1 },
    (_, i) => i * step
  );
  let cdf = [
    ...xArr.map((x) =>
      logisticCDF(x, params.mode, params.scale, params.asymmetry)
    ),
  ];
  // clip cdf from closed_bounds
  const scale_lower_to = lowerOpen ? 0 : cdf[0] ?? 0;
  const scale_upper_to = upperOpen ? 1 : cdf[cdf.length - 1] ?? 1;
  const rescaled_inbound_mass = scale_upper_to - scale_lower_to;
  cdf = cdf.map((x) => (x - scale_lower_to) / rescaled_inbound_mass);

  if (cdf === null) {
    cdf = [];
  }
  return cdf;
}

export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles: true,
  discrete?: boolean
): ExtendedQuartiles;
export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles?: false,
  discrete?: boolean
): Quartiles;
export function computeQuartilesFromCDF(cdf: number[]): Quartiles;
export function computeQuartilesFromCDF(
  cdf: number[],
  extendedQuartiles?: boolean,
  discrete?: boolean
): Quartiles | ExtendedQuartiles {
  function findPercentile(cdf: number[], percentile: number) {
    if (cdf === null) {
      cdf = [];
    }
    const target = percentile / 100;
    for (let i = 0; i < cdf.length; i++) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      if (cdf[i]! >= target) {
        if (i === 0) return 0;

        if (discrete) {
          return (i - 0.5) / (cdf.length - 1);
        }

        const diff = cdf[i]! - cdf[i - 1]!;
        const adjustedPercentile = (target - cdf[i - 1]!) / diff;
        return (i - 1 + adjustedPercentile) / (cdf.length - 1);
      }
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
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

export function getCdfBounds(cdf: number[] | undefined): Bounds | undefined {
  if (!cdf) {
    return;
  }

  const start = cdf.at(0);
  const end = cdf.at(-1);
  if (isNil(start) || isNil(end)) {
    return;
  }

  return {
    belowLower: start,
    aboveUpper: 1 - end,
  };
}

export function nominalLocationToCdfLocation(
  location: number,
  question: Question
) {
  const { range_min, range_max, zero_point } = question.scaling;
  if (range_min === null || range_max === null) {
    throw new Error("range_min and range_max must be defined");
  }
  if (zero_point !== null) {
    if (location === zero_point) {
      return zero_point < range_min ? -1e-7 : 1 + 1e-7; // avoid log(0)
    }
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    return (
      (Math.log(
        (location - range_min) * (derivRatio - 1) + (range_max - range_min)
      ) -
        Math.log(range_max - range_min)) /
      Math.log(derivRatio)
    );
  }
  return (location - range_min) / (range_max - range_min);
}

/**
 * scales an internal location within a range of 0 to 1 to a location
 * within a range of range_min to range_max, taking into account any logarithmic
 * scaling determined by zero_point
 */
export function scaleInternalLocation(x: number, scaling: Scaling) {
  const { range_min, range_max, zero_point } = scaling;
  if (isNil(range_max) || isNil(range_min)) {
    return x;
  }

  let scaled_location: number;
  if (zero_point !== null) {
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    scaled_location =
      range_min +
      ((range_max - range_min) * (derivRatio ** x - 1)) / (derivRatio - 1);
  } else if (range_min === null || range_max === null) {
    scaled_location = x;
  } else {
    scaled_location = range_min + (range_max - range_min) * x;
  }
  return scaled_location;
}

/**
 * unscales a nominal location within a range of range_min to range_max
 * to an internal location within a range of 0 to 1
 * taking into account any logarithmic scaling determined by zero_point
 */
export function unscaleNominalLocation(x: number, scaling: Scaling) {
  const { range_min, range_max, zero_point } = scaling;
  if (isNil(range_max) || isNil(range_min)) {
    return x;
  }

  let unscaled_location: number;
  if (zero_point !== null) {
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    unscaled_location =
      Math.log(
        ((x - range_min) * (derivRatio - 1)) / (range_max - range_min) + 1
      ) / Math.log(derivRatio);
  } else {
    unscaled_location = (x - range_min) / (range_max - range_min);
  }
  return unscaled_location;
}

/**
 * evaluates the height of the cdf at a nominal location, given scaling
 */
export function getCdfAt(x: number, cdf: number[], scaling: Scaling) {
  const location = unscaleNominalLocation(x, scaling);
  const floatIndex = location * (cdf.length - 1);
  if (floatIndex <= 0) {
    return cdf.at(0);
  }
  if (floatIndex >= 1) {
    return cdf.at(-1);
  }
  return cdf.at(Math.round(floatIndex));
}

/**
 * Takes a cdf and rescales it to new scaling
 * NOTE: this will not behave well outside of original bounds
 */
export function rescaleCdf(
  cdf: number[],
  originalScaling: Scaling,
  newScaling: Scaling
) {
  const step = 1 / (cdf.length - 1);
  const xArr = Array.from({ length: cdf.length }, (_, i) => i * step);
  const evalLocations = xArr.map((x) => scaleInternalLocation(x, newScaling));
  const newCdf = [
    ...evalLocations.map((x) => getCdfAt(x, cdf, originalScaling) ?? 0),
  ];
  return newCdf;
}
