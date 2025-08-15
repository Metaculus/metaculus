import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";
import cn from "@/utils/core/cn";
import { getFontsString } from "@/utils/fonts";

type Props = {
  title?: string;
  communityPredictions: ChoiceTooltipItem[];
  userPredictions?: ChoiceTooltipItem[];
  FooterRow?: ReactNode;
};

const MCPredictionsTooltip: FC<Props> = ({
  title,
  communityPredictions,
  userPredictions,
  FooterRow = null,
}) => {
  const t = useTranslations();

  return (
    <table
      className={cn(
        "block w-max rounded border border-gray-300 pb-1 font-sans dark:border-gray-300-dark",
        getFontsString()
      )}
    >
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th
            className="max-w-[150px] truncate px-3 pb-2 pt-2.5 text-left text-sm font-normal text-gray-600 dark:text-gray-600-dark"
            colSpan={2}
          >
            {title}
          </th>
          <td className={" text-center"}>
            <FontAwesomeIcon
              icon={faUserGroup}
              className="size-3.5 align-middle text-olive-700 dark:text-olive-700-dark"
            />
          </td>

          <td className="px-5 py-1 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
            {t("me")}
          </td>
        </tr>
      </thead>
      <tbody>
        {communityPredictions.map(
          ({ color, choiceLabel, valueElement }, idx) => (
            <tr key={`choice-tooltip-row-${choiceLabel}-${idx}`}>
              {!!color && (
                <td
                  className={cn(
                    "w-6 pl-3",
                    idx === 0 ? "pb-1.5 pt-2.5" : "py-2"
                  )}
                >
                  <ChoiceIcon color={color} />
                </td>
              )}
              <th
                className={cn(
                  "max-w-[150px] truncate pl-2 pr-1 text-left text-sm font-normal text-gray-800 dark:text-gray-800-dark",
                  idx === 0 ? "pb-1 pt-2.5" : "py-1"
                )}
                colSpan={color ? 1 : 2}
              >
                {choiceLabel}
              </th>
              <td className="px-1.5 py-1 text-right text-sm font-normal tabular-nums text-olive-800 dark:text-olive-800-dark">
                {valueElement}
              </td>

              <td
                className={cn("px-2.5 py-1 text-sm font-normal tabular-nums", {
                  "text-right text-orange-800 dark:text-orange-800-dark":
                    userPredictions?.find(
                      (item) => item.choiceLabel === choiceLabel
                    )?.valueElement !== "?" &&
                    userPredictions?.find(
                      (item) => item.choiceLabel === choiceLabel
                    )?.valueElement !== "...",
                  "text-center text-gray-500 dark:text-gray-500-dark":
                    userPredictions?.find(
                      (item) => item.choiceLabel === choiceLabel
                    )?.valueElement === "?" ||
                    userPredictions?.find(
                      (item) => item.choiceLabel === choiceLabel
                    )?.valueElement === "...",
                })}
              >
                {userPredictions?.find(
                  (item) => item.choiceLabel === choiceLabel
                )?.valueElement || "?"}
              </td>
            </tr>
          )
        )}
        {FooterRow}
      </tbody>
    </table>
  );
};

export default MCPredictionsTooltip;
