"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import KeyFactorStrengthItem from "../key_factor_strength_item";
import KeyFactorText from "../key_factor_text";

const KeyFactorDriver: FC<
  Omit<Parameters<typeof KeyFactorStrengthItem>[0], "label" | "impactMetadata">
> = (props) => {
  const t = useTranslations();
  if (!props.keyFactor.driver) return null;

  const isConsumer = props.mode === "consumer";
  const isCompactConsumer = isConsumer && props.isCompact;
  const { driver } = props.keyFactor;

  return (
    <KeyFactorStrengthItem
      {...props}
      label={t("driver")}
      impactMetadata={{
        impact_direction: driver.impact_direction,
        certainty: driver.certainty,
      }}
    >
      <KeyFactorText
        text={driver.text}
        className={cn("text-base leading-5", {
          "text-sm": isConsumer,
          "text-xs": isCompactConsumer,
        })}
      />
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorDriver;
