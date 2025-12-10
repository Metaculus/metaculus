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
 * Format a number using BIPM-style thousands separation with narrow non-breaking spaces (U+202F)
 * and a dot as the decimal separator.
 */
export function formatNumberBipm(
  val: number | string,
  decimals: number = 2
): string {
  const num = Number(val);

  if (isNil(val) || isNaN(num)) {
    return decimals > 0 ? `0.${"0".repeat(decimals)}` : "0";
  }

  const isNegative = num < 0;
  const absVal = Math.abs(num);

  // Format to the specified decimal places
  const fixed = absVal.toFixed(decimals);

  // Split into integer and fractional parts
  const [integerPart = "0", fractionalPart] = fixed.split(".");

  // Insert narrow non-breaking spaces (U+202F) as thousands separators
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "\u202F"
  );

  // Build the final string
  let result = formattedInteger;
  if (decimals > 0 && fractionalPart) {
    result += `.${fractionalPart}`;
  }

  return isNegative ? `-${result}` : result;
}
