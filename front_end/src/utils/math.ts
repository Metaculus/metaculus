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

export function binWeightsFromSliders(
  left: number,
  center: number,
  right: number
) {
  const params = logisticDistributionParamsFromSliders(left, center, right);
  const step = 1 / 200;
  const xArr = Array.from({ length: Math.floor(1 / step) }, (_, i) => i * step);
  const cdf = [
    ...xArr.map((x) =>
      logisticCDF(x, params.mode, params.scale, params.asymmetry)
    ),
  ];
  const pmf = [];
  for (let i = 0; i < cdf.length; i++) {
    if (i == 0) {
      pmf.push(cdf[0]);
    } else {
      pmf.push(Number(math.subtract(cdf[i], cdf[i - 1])));
    }
  }
  pmf.push(1 - cdf[cdf.length - 1]);
  return pmf;
}
