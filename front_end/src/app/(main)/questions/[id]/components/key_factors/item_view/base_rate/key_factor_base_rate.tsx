'use client"';

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorHeader from "../key_factor_header";
import KeyFactorText from "../key_factor_text";
import KeyFactorBaseRateFrequency from "./key_factor_base_rate_frequency";
import KeyFactorBaseRateTrend from "./key_factor_base_rate_trend";
import KeyFactorDirectionVoter from "./key_factor_direction_voter";

type Props = {
  keyFactor: KeyFactor;
  mode?: "forecaster" | "consumer";
  isCompact?: boolean;
  projectPermission?: ProjectPermissions;
  isSuggested?: boolean;
};

const KeyFactorBaseRate: React.FC<Props> = ({
  keyFactor,
  isCompact,
  mode,
  projectPermission,
  isSuggested,
}) => {
  const router = useRouter();
  const t = useTranslations();
  if (!keyFactor.base_rate) return null;
  const { base_rate: baseRate } = keyFactor;
  const isConsumer = mode === "consumer";

  const hasSource = !!baseRate.source;
  const showSourceError = isSuggested && !hasSource;

  return (
    <>
      {!isConsumer && (
        <KeyFactorHeader
          username={keyFactor.author.username}
          linkAnchor={`#comment-${keyFactor.comment_id}`}
          label={t("baseRate")}
        />
      )}

      <KeyFactorText
        text={baseRate.reference_class}
        className={cn("text-base leading-5", {
          "text-sm": isConsumer,
          "text-xs": isCompact,
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

      {!isCompact && !isConsumer && (
        <>
          <hr className="my-0 opacity-20" />
          <KeyFactorDirectionVoter
            keyFactor={keyFactor}
            projectPermission={projectPermission}
          />
        </>
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
    </>
  );
};

export default KeyFactorBaseRate;
