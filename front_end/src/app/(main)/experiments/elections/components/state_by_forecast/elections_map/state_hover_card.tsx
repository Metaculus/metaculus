import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, MouseEvent, useEffect, useState } from "react";

import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import { useBreakpoint } from "@/hooks/tailwind";
import { StateByForecastItem } from "@/types/experiments";
import cn from "@/utils/core/cn";

type Props = {
  x: number;
  y: number;
  mapArea: StateByForecastItem | null;
  onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
};

const StateHoverCard: FC<Props> = ({
  x,
  y,
  mapArea,
  onMouseEnter,
  onMouseLeave,
}) => {
  const t = useTranslations();
  const isLargeScreen = useBreakpoint("md");
  const [positionStyles, setPositionStyles] = useState({
    left: `${x - 75}px`,
    top: `${y + 30}px`,
  });

  useEffect(() => {
    setPositionStyles(
      isLargeScreen
        ? { left: `${x - 75}px`, top: `${y + 30}px` }
        : { left: "0px", top: "unset" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLargeScreen]);

  if (!mapArea) return null;
  const favouritePartyName =
    mapArea.democratProbability > 0.5 ? t("democrat") : t("republican");

  const favouriteProbability =
    mapArea.democratProbability < 0.5
      ? 1 - mapArea.democratProbability
      : mapArea.democratProbability;

  const partyPartyTextClassNames =
    mapArea.democratProbability > 0.5
      ? "text-[#0052a5] dark:text-[#A7C3DC]"
      : mapArea.democratProbability < 0.5
        ? "text-[#e0162b] dark:text-[#E7858F]"
        : "text-black dark:text-white";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={positionStyles}
      className={cn(
        "z-10 flex w-fit max-w-96 flex-col items-start justify-start gap-3 rounded bg-blue-200 p-4 font-sans shadow-md dark:bg-blue-200-dark",
        isLargeScreen
          ? "md:absolute"
          : "sticky bottom-0 left-0 z-[49] w-screen rounded-t-none px-6 shadow-2xl",
        {
          "bg-gradient-to-tr from-blue-100 from-50% to-[#BFD4E4] to-90% dark:from-blue-100-dark dark:to-[#5B6D7F]":
            mapArea.democratProbability > 0.5,
          "bg-gradient-to-tr from-blue-100 from-50% to-[#ECC8CC] to-90% dark:from-blue-100-dark dark:to-[#745460]":
            mapArea.democratProbability < 0.5,
        }
      )}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-start justify-between gap-6">
          <div className="flex flex-col items-start justify-between self-stretch">
            <div className="whitespace-nowrap text-left text-lg font-normal leading-7 text-gray-800 dark:text-gray-800-dark">
              {mapArea.name}
            </div>
            {mapArea.link ? (
              <div className="flex flex-row">
                <div
                  className={cn("text-left text-3xl", partyPartyTextClassNames)}
                >
                  {Math.round(100 * favouriteProbability)}%
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "shrink text-left text-base font-medium leading-5",
                  partyPartyTextClassNames
                )}
              >
                {t("safeParty", { party: favouritePartyName })}
              </div>
            )}
          </div>
          <div className="flex flex-row-reverse items-center justify-center gap-3 rounded bg-gray-0 p-2.5 dark:bg-gray-0-dark">
            <div className="text-center text-3xl font-light text-gray-800 dark:text-gray-800-dark">
              {mapArea.votes}
            </div>
            <div
              className={cn(
                "w-min text-left text-sm font-medium leading-4",
                partyPartyTextClassNames
              )}
            >
              {t("electoralVotes")}
            </div>
          </div>
        </div>

        {mapArea.link && (
          <div className="flex w-full flex-col items-start">
            <Link
              className="text-left capitalize text-blue-800 hover:text-blue-900 dark:text-blue-800-dark dark:hover:text-blue-900-dark"
              href={`/questions/${mapArea.link.groupId}?${SLUG_POST_SUB_QUESTION_ID}=${mapArea.link.questionId}`}
            >
              {t("partyWinProbability", { party: favouritePartyName })}
            </Link>
          </div>
        )}
      </div>

      {!!mapArea.link && (
        <div className="flex w-full items-start justify-start gap-6 border-t border-blue-400 pt-2.5 dark:border-blue-400-dark md:justify-between md:gap-4">
          <div className="flex flex-col items-start gap-0.5">
            <div className="text-left text-lg font-medium leading-6 text-gray-700 dark:text-gray-700-dark">
              {mapArea.forecastersNumber}
            </div>
            <div className="text-xs font-medium capitalize leading-3 text-gray-500 dark:text-gray-500-dark">
              {t("forecasters")}
            </div>
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <div className="text-left text-lg font-medium leading-6 text-gray-700 dark:text-gray-700-dark">
              {mapArea.forecastsNumber}
            </div>
            <div className="text-xs font-medium capitalize leading-3 text-gray-500 dark:text-gray-500-dark">
              {t("predictions")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateHoverCard;
