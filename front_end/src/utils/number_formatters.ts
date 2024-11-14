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
  trailingZeros: boolean = false
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
  } else if (pow >= 3) {
    suffix = "k";
    val /= 1e3;
    leadingNumbers = pow - 2;
  } else if (pow >= -3) {
    leadingNumbers = pow + 1;
  }
  return (
    toScientificNotation(val, sigfigs, leadingNumbers, trailingZeros) + suffix
  );
}
