import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";
import { useTranslations } from "next-intl";

type Props = {
  date: string;
  choices: ChoiceTooltipItem[];
  userChoices?: ChoiceTooltipItem[];
};

const ChoicesTooltip: FC<Props> = ({ date, choices, userChoices }) => {
  const t = useTranslations()
  const containUserChoices =
    userChoices && !userChoices.every((choice) => choice.valueLabel === "?");

  return (
    <table>
      <tbody>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th className="px-1.5 py-1 text-left text-sm font-bold" colSpan={2}>
            {date}
          </th>
          <td className="px-1.5 py-1 text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              size="sm"
              className="align-middle text-olive-700 dark:text-olive-700-dark"
            />
          </td>
          {containUserChoices && (
            <td className="px-1.5 py-1 text-center text-xs font-bold text-orange-800 dark:text-orange-800-dark capitalize">
              {t("me")}
            </td>
          )}
        </tr>
        {choices.map(({ color, choiceLabel, valueLabel }, idx) => (
          <tr key={`choice-tooltip-row-${choiceLabel}-${idx}`}>
            <td className="px-1.5 py-1">
              <ChoiceIcon color={color} />
            </td>
            <th className="px-1.5 py-1 text-left text-sm font-bold">
              {choiceLabel}
            </th>
            <td className="px-1.5 py-1 text-right text-sm">{valueLabel}</td>
            {containUserChoices && (
              <td className="px-1.5 py-1 text-right text-sm">
                {userChoices![idx].valueLabel}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ChoicesTooltip;
