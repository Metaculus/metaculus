import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";

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
    <table className="w-max">
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th className="px-1.5 py-1 text-left text-sm font-bold" colSpan={2}>
            {title}
          </th>
          <td className="px-1.5 py-1 text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              size="sm"
              className="align-middle text-olive-700 dark:text-olive-700-dark"
            />
          </td>
          {containUserChoices && (
            <td className="px-1.5 py-1 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
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
                <td className="px-1.5 py-1">
                  <ChoiceIcon color={color} />
                </td>
              )}
              <th
                className="px-1.5 py-1 text-left text-sm font-bold"
                colSpan={color ? 1 : 2}
              >
                {choiceLabel}
              </th>
              <td className="px-1.5 py-1 text-right text-sm">{valueElement}</td>
              {containUserChoices && (
                <td className="px-1.5 py-1 text-right text-sm">
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
