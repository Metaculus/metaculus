'use client"';

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorText from "../driver/key_factor_text";
import KeyFactorHeader from "../key_factor_header";
import KeyFactorBaseRateFrequency from "./key_factor_base_rate_frequency";
import KeyFactorDirectionVoter from "./key_factor_direction_voter";

type Props = {
  keyFactor: KeyFactor;
  mode?: "forecaster" | "consumer";
  isCompact?: boolean;
  projectPermission?: ProjectPermissions;
};

const KeyFactorBaseRate: React.FC<Props> = ({
  keyFactor,
  isCompact,
  mode,
  projectPermission,
}) => {
  const router = useRouter();
  const t = useTranslations();
  if (!keyFactor.base_rate) return null;
  const { base_rate: baseRate } = keyFactor;
  const isConsumer = mode === "consumer";
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
        })}
      />

      {baseRate.type === "frequency" && (
        <KeyFactorBaseRateFrequency
          numerator={baseRate.rate_numerator ?? 0}
          denominator={baseRate.rate_denominator ?? 0}
          withLightBoxes={isCompact || isConsumer}
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

      {isCompact && (
        <div
          className="text-left text-xs text-blue-600 hover:underline dark:text-blue-600-dark"
          role="link"
          onClick={() => router.push(baseRate.source)}
        >
          (source)
        </div>
      )}
    </>
  );
};

export default KeyFactorBaseRate;
