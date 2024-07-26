import { almostEqual } from "@/utils/math";

export function formatSigFig(
  val: number | string,
  sigfigs: number,
  trailingZeros?: number
) {
  val = +val;
  var k,
    p,
    // Note that leadingDigits is always at least 1
    // to account for a leading zero before the decimal.
    leadingDigits = Math.max(0, Math.floor(Math.log10(Math.abs(val)))) + 1;
  for (k = 0, p = 1; k < sigfigs - leadingDigits; k++, p *= 10) {
    if (!trailingZeros && almostEqual(Math.round(p * val), p * val)) break;
  }
  val = val.toFixed(k || 0);
  return val;
}

export function abbreviatedNumber(
  val: number | string,
  sigfigs = 3,
  maxZeros = 1
) {
  val = +val;
  if (!val) {
    return "0";
  }

  let pow = Math.floor(Math.log10(Math.abs(val)) / 3) * 3;
  pow = Math.min(Math.max(0, pow), 9);
  let suffix =
    {
      3: "k",
      6: "M",
      9: "B",
    }[pow] || "";
  val /= Math.pow(10, pow);
  pow = Math.floor(Math.log10(Math.abs(val)));
  sigfigs += Math.max(0, Math.min(-pow, maxZeros));
  if (Math.abs(val) <= 0.5 * Math.pow(10, 1 - sigfigs)) {
    val = 0;
  }
  return formatSigFig(val, sigfigs) + suffix;
}
