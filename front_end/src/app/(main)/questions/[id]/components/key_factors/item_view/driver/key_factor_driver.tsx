"use client";
import { FC } from "react";

import KeyFactorStrengthItem from "../key_factor_strength_item";
import KeyFactorText from "../key_factor_text";

const KeyFactorDriver: FC<
  Omit<Parameters<typeof KeyFactorStrengthItem>[0], "impactMetadata"> & {
    truncateText?: boolean;
    large?: boolean;
  }
> = ({ truncateText, large, ...props }) => {
  if (!props.keyFactor.driver) return null;

  const { driver } = props.keyFactor;

  return (
    <KeyFactorStrengthItem
      {...props}
      impactMetadata={{
        impact_direction: driver.impact_direction,
        certainty: driver.certainty,
      }}
    >
      <KeyFactorText
        text={driver.text}
        className={
          large
            ? "text-base leading-6"
            : props.isCompact
              ? "text-xs leading-4"
              : "text-sm leading-5"
        }
        truncate={truncateText}
      />
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorDriver;
