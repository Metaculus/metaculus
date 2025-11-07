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
  const t = useTranslations();
  if (!keyFactor.base_rate) return null;
  const { base_rate: baseRate } = keyFactor;
  const isConsumer = mode === "consumer";
  const isCompactConsumer = isConsumer && isCompact;
  return (
    <>
      <KeyFactorHeader
        username={keyFactor.author.username}
        linkAnchor={`#comment-${keyFactor.comment_id}`}
        label={t("baseRate")}
      />

      <KeyFactorText
        text={baseRate.reference_class}
        className={cn("text-base leading-5", {
          "text-sm": isConsumer,
          "text-xs": isCompactConsumer,
        })}
      />

      {baseRate.type === "frequency" && (
        <KeyFactorBaseRateFrequency
          numerator={baseRate.rate_numerator ?? 0}
          denominator={baseRate.rate_denominator ?? 0}
        />
      )}

      <hr className="my-0 opacity-20" />

      <KeyFactorDirectionVoter
        keyFactor={keyFactor}
        projectPermission={projectPermission}
      />
    </>
  );
};

export default KeyFactorBaseRate;
