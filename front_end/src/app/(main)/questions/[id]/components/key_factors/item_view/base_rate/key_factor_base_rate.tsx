"use client";

import { useTranslations } from "next-intl";

import { KeyFactor, KeyFactorVoteTypes } from "@/types/comment";
import cn from "@/utils/core/cn";

import KeyFactorStrengthItem, {
  ImpactVoteHandler,
} from "../key_factor_strength_item";
import KeyFactorText from "../key_factor_text";
import KeyFactorBaseRateFrequency from "./key_factor_base_rate_frequency";
import KeyFactorBaseRateTrend from "./key_factor_base_rate_trend";

type Props = {
  keyFactor: KeyFactor;
  mode?: "forecaster" | "consumer";
  isCompact?: boolean;
  isSuggested?: boolean;
  impactVoteRef?: React.MutableRefObject<ImpactVoteHandler | null>;
  onVotePanelToggle?: (open: boolean) => void;
  onDownvotePanelToggle?: (open: boolean) => void;
  onMorePanelToggle?: (open: boolean) => void;
  isMorePanelOpen?: boolean;
  truncateText?: boolean;
};

const KeyFactorBaseRate: React.FC<Props> = ({
  keyFactor,
  isCompact,
  mode,
  isSuggested,
  impactVoteRef,
  onVotePanelToggle,
  onDownvotePanelToggle,
  onMorePanelToggle,
  isMorePanelOpen,
  truncateText,
}) => {
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
      impactVoteRef={impactVoteRef}
      onVotePanelToggle={onVotePanelToggle}
      onDownvotePanelToggle={onDownvotePanelToggle}
      onMorePanelToggle={onMorePanelToggle}
      isMorePanelOpen={isMorePanelOpen}
    >
      <KeyFactorText
        text={baseRate.reference_class}
        className={
          isCompact || isConsumer ? "text-xs leading-4" : "text-sm leading-5"
        }
        truncate={truncateText}
      />

      {baseRate.type === "frequency" && (
        <KeyFactorBaseRateFrequency
          numerator={baseRate.rate_numerator ?? 0}
          denominator={baseRate.rate_denominator ?? 0}
          withLightBoxes={(isCompact || isConsumer) && !isSuggested}
          hideBoxes={isCompact}
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
            baseRate.type === "trend" && "-mt-2"
          )}
        >
          {showSourceError ? (
            <span className="text-salmon-700 dark:text-salmon-700-dark">
              {t("sourceMissing")}
            </span>
          ) : hasSource ? (
            <a
              href={baseRate.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-600-dark"
            >
              ({t("source")})
            </a>
          ) : null}
        </div>
      )}
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorBaseRate;
