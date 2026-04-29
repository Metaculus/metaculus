import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";
import Tooltip from "@/components/ui/tooltip";

type Props = {
  aggregationMethod: string;
};

const AggregationRankTooltip: FC<Props> = ({ aggregationMethod }) => {
  const t = useTranslations();

  // Map aggregation method to translation key
  const translationKey =
    aggregationMethod === "recency_weighted"
      ? "leaderboardCpInfo"
      : aggregationMethod === "unweighted"
        ? "leaderboardUnweightedInfo"
        : "leaderboardCpInfo"; // Default fallback

  return (
    <div className="flex flex-1 items-center justify-start">
      <div className="relative pr-1 text-blue-700 dark:text-blue-700-dark">
        <span className="font-league-gothic text-xl">M</span>
        <Tooltip
          showDelayMs={200}
          placement={"right"}
          tooltipContent={
            <RichText>
              {(tags) =>
                t.rich(translationKey, {
                  ...tags,
                  link: (chunks) => (
                    <Link href={"/faq/#community-prediction"}>{chunks}</Link>
                  ),
                })
              }
            </RichText>
          }
          className="absolute left-full top-1/2 ml-0 inline-flex -translate-y-1/2 items-center justify-center font-sans text-base leading-none"
          tooltipClassName="font-sans text-center text-gray-800 dark:text-gray-800-dark border-blue-400 dark:border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark"
        >
          <span className="leading-none">ⓘ</span>
        </Tooltip>
      </div>
    </div>
  );
};

export default AggregationRankTooltip;
