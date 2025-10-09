import { isNil } from "lodash";

import { Scaling } from "@/types/question";

/**
 * Format a number to a given number of significant figures.
 * leadingNumbers is the number of digits to display before the decimal point.
 * trailingZeros determines whether to allow trailing zeros.
 */
export function toScientificNotation(
  val: number,
  sigfigs: number,
  leadingNumbers: number = 1,
  trailingZeros: boolean = true
): string {
  const pow =
    Math.floor(Math.log10(Math.abs(val)) + 1e-10) - leadingNumbers + 1;
  let mantissa = (val / Math.pow(10, pow)).toFixed(
    Math.max(0, sigfigs - leadingNumbers)
  );
  if (!trailingZeros) {
    // if there is a decimal point, remove trailing zeros (and the point itself if no digits follow)
    mantissa = mantissa.replace(/(\.\d*?[1-9])0+$|\.0*$/, "$1");
  }
  if (pow !== 0) {
    const superscriptDigits: { [key: string]: string } = {
      "-": "⁻",
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
    };
    const exponentStr = String(pow)
      .split("")
      .map((char) => superscriptDigits[char] || char)
      .join("");
    return `${mantissa}×10${exponentStr}`;
  }
  return mantissa;
}

export function abbreviatedNumber(
  val: number | string,
  sigfigs = 3,
  trailingZeros: boolean = false,
  scaling?: Scaling,
  minThousandsPow: number = 4
) {
  val = +val;
  if (!val) {
    return "0";
  }
  const pow = Math.floor(Math.log10(Math.abs(val)) + 1e-10);
  if (pow >= 15) {
    return toScientificNotation(val, 2, 1, false);
  }

  let suffix = "";
  let leadingNumbers = 1;
  if (pow >= 12) {
    suffix = "T";
    val /= 1e12;
    leadingNumbers = pow - 11;
  } else if (pow >= 9) {
    suffix = "B";
    val /= 1e9;
    leadingNumbers = pow - 8;
  } else if (pow >= 6) {
    suffix = "M";
    val /= 1e6;
    leadingNumbers = pow - 5;
  } else if (pow >= minThousandsPow) {
    suffix = "k";
    val /= 1e3;
    leadingNumbers = pow - 2;
  } else if (pow >= -3) {
    leadingNumbers = pow + 1;
  }
  if (!isNil(scaling?.range_min) && !isNil(scaling?.range_max)) {
    // check if sufficiently close to zero just to round
    if (
      scaling.range_min < val &&
      val < scaling.range_max &&
      scaling.range_max - scaling.range_min > 200 * Math.abs(val)
    ) {
      return "0" + suffix;
    }
  }
  return (
    toScientificNotation(val, sigfigs, leadingNumbers, trailingZeros) + suffix
  );
}

export function formatNumberWithUnit(
  val: number | string,
  unit?: string,
  sigfigs = 3,
  trailingZeros = false,
  scaling?: Scaling,
  minThousandsPow = 4
): string {
  const formattedNumber = abbreviatedNumber(
    val,
    sigfigs,
    trailingZeros,
    scaling,
    minThousandsPow
  );

  if (!unit) return formattedNumber;

  if (typeof val === "number" && Math.abs(val) === 1) {
    return `${formattedNumber} ${unit}`;
  }
  return `${formattedNumber} ${unit}`;
}

/**
 * Format a number for leaderboard display with thin space thousands separators.
 * Never uses "k" notation - always shows full digits with thin space separators.
 * Uses thin space (U+2009) per BIPM standards for thousands separators.
 *
 * @param val - The number to format
 * @param decimals - Number of decimal places (default: 0 for integers)
 * @returns Formatted string with thin space separators
 */
export function formatLeaderboardNumber(
  val: number | string,
  decimals: number = 0
): string {
  const num = +val;

  if (!isFinite(num)) {
    return "0";
  }

  // Format the number with the specified decimal places
  const fixed = num.toFixed(decimals);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixed.split(".");

  // Add thin space separators every 3 digits from the right
  // U+2009 is the thin space character per BIPM standards
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");

  // Combine with decimal part if it exists and has non-zero digits
  if (decimalPart && parseInt(decimalPart) !== 0) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
}
