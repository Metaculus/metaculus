import { faUserGroup } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import { ChoiceTooltipItem } from "@/types/choices";

type Props = {
  date: string;
  choices: ChoiceTooltipItem[];
};

const ChoicesTooltip: FC<Props> = ({ date, choices }) => {
  return (
    <table>
      <tbody>
        <tr className="border-b border-metac-gray-300 dark:border-metac-gray-300-dark">
          <th className="px-1.5 py-1 text-left text-sm font-bold" colSpan={2}>
            {date}
          </th>
          <td className="px-1.5 py-1 text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              size="sm"
              className="align-middle text-metac-olive-700 dark:text-metac-olive-700-dark"
            />
          </td>
        </tr>
        {choices.map(({ color, choiceLabel, valueLabel }) => (
          <tr key={`choice-tooltip-row-${choiceLabel}`}>
            <td className="px-1.5 py-1">
              <div
                className="size-4 rounded-sm"
                style={{ background: color }}
              />
            </td>
            <th className="px-1.5 py-1 text-left text-sm font-bold">
              {choiceLabel}
            </th>
            <td className="px-1.5 py-1 text-right text-sm">{valueLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ChoicesTooltip;
