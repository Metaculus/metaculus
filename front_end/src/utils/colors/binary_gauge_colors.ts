export type BinaryGaugeColors = {
  textClass: string;
  strokeClass: string;
  hex: string;
};

export function getBinaryGaugeColors(
  percentage?: number,
  isInactive?: boolean
): BinaryGaugeColors {
  const p = Math.max(0, Math.min(100, percentage ?? 0));

  if (isInactive) {
    return {
      textClass: "text-gray-600 dark:text-gray-600-dark",
      strokeClass: "stroke-gray-600 dark:stroke-gray-600-dark",
      hex: "#777777",
    };
  }

  if (p > 85)
    return {
      textClass: "text-[#66A566]",
      strokeClass: "stroke-[#66A566]",
      hex: "#66A566",
    };
  if (p > 75)
    return {
      textClass: "text-[#7BA06B]",
      strokeClass: "stroke-[#7BA06B]",
      hex: "#7BA06B",
    };
  if (p > 50)
    return {
      textClass: "text-[#899D6E]",
      strokeClass: "stroke-[#899D6E]",
      hex: "#899D6E",
    };
  if (p > 35)
    return {
      textClass: "text-[#979A72]",
      strokeClass: "stroke-[#979A72]",
      hex: "#979A72",
    };
  if (p > 25)
    return {
      textClass: "text-[#A59775]",
      strokeClass: "stroke-[#A59775]",
      hex: "#A59775",
    };
  if (p > 15)
    return {
      textClass: "text-[#B29378]",
      strokeClass: "stroke-[#B29378]",
      hex: "#B29378",
    };
  if (p > 10)
    return {
      textClass: "text-[#C0907B]",
      strokeClass: "stroke-[#C0907B]",
      hex: "#C0907B",
    };
  return {
    textClass: "text-[#D58B80]",
    strokeClass: "stroke-[#D58B80]",
    hex: "#D58B80",
  };
}
