"use client";

import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { KeyFactor } from "@/types/comment";
import cn from "@/utils/cn";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
};

// TODO: implement this component (B variant)
export const TwoStepKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, votes_score, user_votes },
  linkToComment = true,
}) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <div className="text-center text-base font-medium leading-5 sm:text-left">
        {text}
      </div>
      <div className="mx-auto flex flex-row gap-2 sm:mx-0">
        <Button
          variant="tertiary"
          size="sm"
          className="rounded-sm border-mint-400 bg-mint-300 text-mint-800 dark:border-mint-400-dark dark:text-mint-800-dark xs:bg-none xs:text-mint-700 xs:dark:text-mint-700-dark"
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            className={"hidden text-mint-700 dark:text-mint-700-dark sm:block"}
          />
          {t("increasesLikelihood")}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          className="rounded-sm border-salmon-300 text-salmon-700 dark:border-salmon-300-dark dark:text-salmon-700-dark"
        >
          <FontAwesomeIcon
            icon={faArrowDown}
            className={
              "hidden text-salmon-700 dark:text-salmon-700-dark sm:block"
            }
          />
          {t("decreasesLikelihood")}
        </Button>
      </div>
    </div>
  );
};

export default TwoStepKeyFactorItem;
