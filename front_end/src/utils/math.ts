import * as math from "mathjs";

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
  const mode = 1 + 2 * k;
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
  const c = x <= mode ? 0 : 1;
  const k = x <= mode ? 1 : -1;
  return (
    c +
    k *
      Fprime(k * math.divide(math.subtract(x, mode), sprime(1 - asymmetry * k)))
  );
}

export function binWeightsFromSliders(
  left: number,
  center: number,
  right: number
) {
  const params = logisticDistributionParamsFromSliders(left, center, right);
  const step = 1 / 22;
  const xArr = math.range(0 + step, 1 - step, step);
  const binWeights = [
    ...xArr
      .map((x) => logisticCDF(x, params.mode, params.scale, params.asymmetry))
      .toArray(),
    logisticCDF(0, params.mode, params.scale, params.asymmetry),
    logisticCDF(1, params.mode, params.scale, params.asymmetry),
  ];
  const numBinWeights = [];
  for (let i = 0; i < binWeights.length; i++) {
    if (i > 0) {
      numBinWeights.push(
        Number(math.subtract(binWeights[i], binWeights[i - 1]))
      );
    }
  }
  return numBinWeights;
}
