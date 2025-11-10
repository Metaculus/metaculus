import React from "react";

import cn from "@/utils/core/cn";

type Props = {
  numerator: number;
  denominator: number;
  withLightBoxes?: boolean;
};

const KeyFactorBaseRateFrequency: React.FC<Props> = ({
  numerator,
  denominator,
  withLightBoxes,
}) => {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-base text-gray-500 dark:text-gray-500">
        <span className="text-2xl font-normal text-purple-800 dark:text-purple-800-dark">
          {numerator}
        </span>
        <span>in</span>
        <span className="text-2xl font-normal">{denominator}</span>
      </div>

      <FrequencyBoxes
        lightBoxes={withLightBoxes}
        numerator={numerator}
        denominator={denominator}
      />
    </div>
  );
};

const FrequencyBoxes: React.FC<{
  numerator: number;
  denominator: number;
  lightBoxes?: boolean;
}> = ({ numerator, denominator, lightBoxes }) => {
  const { filled, half, empty } = calcBoxes(numerator, denominator);
  const size = 12;
  const boxes: ("filled" | "half" | "empty")[] = [
    ...Array(filled).fill("filled"),
    ...Array(half).fill("half"),
    ...Array(empty).fill("empty"),
  ];

  return (
    <div
      className="mt-2 grid content-center items-center gap-[2px] pb-1"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, ${size}px))`,
        maxWidth: `${MAX_PER_ROW * size + (MAX_PER_ROW - 1) * GAP}px`,
      }}
      aria-label={`${numerator} of ${denominator}`}
      role="img"
    >
      {boxes.map((k, i) => (
        <Box light={lightBoxes} key={`${k}-${i}`} size={size} kind={k} />
      ))}
    </div>
  );
};

const Box: React.FC<{
  size: number;
  kind: "filled" | "half" | "empty";
  light?: boolean;
}> = ({ size, kind, light }) => {
  const base = size;
  const classBase = "rounded-[1px] shrink-0 transition-opacity";

  if (kind === "filled")
    return (
      <span
        className={cn(classBase, "bg-purple-600 dark:bg-purple-600-dark")}
        style={{ width: base, height: base }}
      />
    );

  if (kind === "half")
    return (
      <span
        className={cn(
          classBase,
          "bg-gradient-to-r from-purple-600 to-transparent dark:from-purple-600-dark"
        )}
        style={{ width: base, height: base }}
      />
    );

  return (
    <span
      style={{ width: base, height: base }}
      className={cn(
        classBase,
        light
          ? "bg-gray-0 dark:bg-gray-0-dark"
          : "bg-gray-200 dark:bg-blue-200-dark"
      )}
    />
  );
};

const MAX_BOXES = 100;
const MAX_PER_ROW = 17;
const GAP = 2;
function calcBoxes(numerator: number, denominator: number) {
  if (!denominator || denominator <= 0)
    return { filled: 0, half: 0, empty: 0, total: 0 };

  let total = denominator;
  let filled = numerator;

  if (denominator > MAX_BOXES) {
    const scale = MAX_BOXES / denominator;
    total = MAX_BOXES;
    const scaledFilled = numerator * scale;
    const filledInt = Math.floor(scaledFilled);
    const remainder = scaledFilled - filledInt;

    const half = remainder >= 0.25 && remainder < 0.75 ? 1 : 0;
    const bump = remainder >= 0.75 ? 1 : 0;

    filled = filledInt + bump;
    return {
      filled,
      half,
      empty: Math.max(0, total - filled - half),
    };
  }

  const clamped = Math.max(0, Math.min(numerator, denominator));
  return {
    filled: clamped,
    half: 0,
    empty: denominator - clamped,
  };
}

export default KeyFactorBaseRateFrequency;
