import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";
import cn from "@/utils/core/cn";

type Props = {
  title: string;
  communityPredictions: ChoiceTooltipItem[];
  userPredictions?: ChoiceTooltipItem[];
  FooterRow?: ReactNode;
};

const GroupPredictionsTooltip: FC<Props> = ({
  title,
  communityPredictions,
  userPredictions,
  FooterRow = null,
}) => {
  const t = useTranslations();
  const containUserChoices =
    userPredictions &&
    !userPredictions.every((choice) => choice.valueElement === "?");

  return (
    <table className="block w-max rounded border border-gray-300 pb-1 font-sans dark:border-gray-300-dark">
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th
            className="max-w-[250px] truncate px-3 pb-2 pt-2.5 text-left text-sm font-medium text-olive-800 dark:text-olive-800-dark"
            colSpan={2}
          >
            {title}
          </th>
          <td className="text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              className={cn(
                "size-3.5 align-middle text-olive-700 dark:text-olive-700-dark",
                {
                  "pr-3": !containUserChoices,
                }
              )}
            />
          </td>
          {containUserChoices && (
            <td className="px-5 py-1 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
              {t("me")}
            </td>
          )}
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
                  "max-w-[250px] truncate pl-2 pr-1 text-left text-sm font-normal text-gray-800 dark:text-gray-800-dark",
                  {
                    "font-bold text-gray-800 dark:text-gray-800-dark":
                      choiceLabel.toLowerCase() === "median",
                  },
                  idx === 0 ? "pb-1 pt-2.5" : "py-1",
                  !color && "pl-3"
                )}
                colSpan={color ? 1 : 2}
              >
                {choiceLabel}
              </th>
              <td
                className={cn(
                  "px-1.5 text-right text-sm tabular-nums text-olive-800 dark:text-olive-800-dark",
                  {
                    "font-bold": choiceLabel.toLowerCase() === "median",
                    "font-normal": choiceLabel.toLowerCase() !== "median",
                  },
                  idx === 0 ? "pb-1 pt-2.5" : "py-1"
                )}
              >
                {valueElement}
              </td>
              {containUserChoices && (
                <td
                  className={cn(
                    "px-2.5 text-center text-sm tabular-nums text-orange-800 dark:text-orange-800-dark",
                    {
                      "font-bold": choiceLabel.toLowerCase() === "median",
                      "font-normal": choiceLabel.toLowerCase() !== "median",
                    },
                    idx === 0 ? "pb-1 pt-2.5" : "py-1"
                  )}
                >
                  {userPredictions?.find(
                    (item) => item.choiceLabel === choiceLabel
                  )?.valueElement || "?"}
                </td>
              )}
            </tr>
          )
        )}
        {FooterRow}
      </tbody>
    </table>
  );
};

export default GroupPredictionsTooltip;
