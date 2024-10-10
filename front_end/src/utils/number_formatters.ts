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
  const pow = Math.floor(Math.log10(Math.abs(val))) - leadingNumbers + 1;
  let mantissa = (val / Math.pow(10, pow)).toFixed(
    Math.max(0, sigfigs - leadingNumbers)
  );
  if (!trailingZeros) {
    // if there is a decimal point, remove trailing zeros (and the point itself if no digits follow)
    mantissa = mantissa.replace(/(\.\d*?[1-9])0+$|\.0*$/, "$1");
  }
  if (pow !== 0) {
    return `${mantissa}e${pow}`;
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
  const pow = Math.floor(Math.log10(Math.abs(val)));
  if (pow >= 12) {
    return toScientificNotation(val, 2, 1, false);
  }

  let suffix = "";
  let leadingNumbers = 1;
  if (pow >= 9) {
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
  } else if (pow >= 0) {
    leadingNumbers = pow + 1;
  }
  return (
    toScientificNotation(val, sigfigs, leadingNumbers, trailingZeros) + suffix
  );
}
