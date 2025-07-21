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

const NewGroupPredictionsTooltip: FC<Props> = ({
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
    <table className="w-max px-1.5 text-xs font-normal text-gray-700 dark:text-gray-700-dark">
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th
            className="px-1.5 py-2 pl-3 text-left text-xs font-normal text-gray-700 dark:text-gray-700-dark"
            colSpan={2}
          >
            {title}
          </th>
          <td className="px-1.5 py-2 text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              size="sm"
              className={cn(
                "align-middle text-olive-700 dark:text-olive-700-dark",
                {
                  "pr-3": !containUserChoices,
                }
              )}
            />
          </td>
          {containUserChoices && (
            <td className="px-1.5 py-2 pr-3 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
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
                <td className="px-1.5 py-1 pl-3">
                  <ChoiceIcon color={color} />
                </td>
              )}
              <th
                className={cn(
                  "px-1.5 py-1 text-left font-normal text-gray-600 dark:text-gray-600-dark",
                  {
                    "font-medium text-gray-800 dark:text-gray-800-dark":
                      choiceLabel.toLowerCase() === "median",
                    "pl-3": !color,
                  }
                )}
                colSpan={color ? 1 : 2}
              >
                {choiceLabel}
              </th>
              <td className="px-1.5 py-1 text-center text-xs text-olive-800 dark:text-olive-800-dark">
                {valueElement}
              </td>
              {containUserChoices && (
                <td className="px-1.5 py-1 pr-3 text-center text-xs text-orange-800 dark:text-orange-800-dark">
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

export default NewGroupPredictionsTooltip;
