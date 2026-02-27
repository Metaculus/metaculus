"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { KeyFactor, KeyFactorVoteTypes } from "@/types/comment";
import cn from "@/utils/core/cn";

import KeyFactorStrengthItem from "../key_factor_strength_item";
import KeyFactorText from "../key_factor_text";
import KeyFactorBaseRateFrequency from "./key_factor_base_rate_frequency";
import KeyFactorBaseRateTrend from "./key_factor_base_rate_trend";

type Props = {
  keyFactor: KeyFactor;
  mode?: "forecaster" | "consumer";
  isCompact?: boolean;
  isSuggested?: boolean;
  onVotePanelToggle?: (open: boolean) => void;
  onDownvotePanelToggle?: (open: boolean) => void;
  onMorePanelToggle?: (open: boolean) => void;
  isMorePanelOpen?: boolean;
};

const KeyFactorBaseRate: React.FC<Props> = ({
  keyFactor,
  isCompact,
  mode,
  isSuggested,
  onVotePanelToggle,
  onDownvotePanelToggle,
  onMorePanelToggle,
  isMorePanelOpen,
}) => {
  const router = useRouter();
  const t = useTranslations();
  if (!keyFactor.base_rate) return null;
  const { base_rate: baseRate } = keyFactor;
  const isConsumer = mode === "consumer";

  const hasSource = !!baseRate.source;
  const showSourceError = isSuggested && !hasSource;

  return (
    <KeyFactorStrengthItem
      keyFactor={keyFactor}
      isCompact={isCompact}
      mode={mode}
      voteType={KeyFactorVoteTypes.DIRECTION}
      onVotePanelToggle={onVotePanelToggle}
      onDownvotePanelToggle={onDownvotePanelToggle}
      onMorePanelToggle={onMorePanelToggle}
      isMorePanelOpen={isMorePanelOpen}
    >
      <KeyFactorText
        text={baseRate.reference_class}
        className={cn("text-sm leading-5", {
          "text-xs": isConsumer && isCompact,
        })}
      />

      {baseRate.type === "frequency" && (
        <KeyFactorBaseRateFrequency
          numerator={baseRate.rate_numerator ?? 0}
          denominator={baseRate.rate_denominator ?? 0}
          withLightBoxes={(isCompact || isConsumer) && !isSuggested}
        />
      )}

      {baseRate.type === "trend" && (
        <KeyFactorBaseRateTrend
          unit={baseRate.unit}
          value={baseRate.projected_value ?? 0}
          year={baseRate.projected_by_year ?? 0}
          extrapolation={baseRate.extrapolation}
          basedOn={baseRate.based_on ?? undefined}
          source={baseRate.source}
          isCompact={isCompact || isConsumer}
        />
      )}

      {(isCompact || isConsumer) && (
        <div
          className={cn(
            "text-left text-xs",
            baseRate.type === "trend" && "-mt-2",
            showSourceError
              ? "text-salmon-700 dark:text-salmon-700-dark"
              : "text-blue-600 hover:underline dark:text-blue-600-dark",
            { "cursor-pointer": !showSourceError && hasSource }
          )}
          role={!showSourceError && hasSource ? "link" : undefined}
          onClick={() => {
            if (!showSourceError && hasSource && baseRate.source) {
              router.push(baseRate.source);
            }
          }}
        >
          {showSourceError ? t("sourceMissing") : hasSource ? "(source)" : ""}{" "}
        </div>
      )}
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorBaseRate;
