"use client";
import { FC } from "react";

import cn from "@/utils/core/cn";

import KeyFactorStrengthItem from "../key_factor_strength_item";
import KeyFactorText from "../key_factor_text";

const KeyFactorDriver: FC<
  Omit<Parameters<typeof KeyFactorStrengthItem>[0], "impactMetadata">
> = (props) => {
  if (!props.keyFactor.driver) return null;

  const isConsumer = props.mode === "consumer";
  const isCompactConsumer = isConsumer && props.isCompact;
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
        className={cn("text-sm leading-5", {
          "text-xs": isCompactConsumer,
        })}
      />
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorDriver;
