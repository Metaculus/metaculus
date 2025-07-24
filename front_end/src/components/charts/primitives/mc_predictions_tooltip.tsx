import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";

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
    <table className="w-max">
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-300-dark">
          <th
            className="max-w-[150px] truncate px-3 pb-2 pt-2.5 text-left text-xs font-normal"
            colSpan={2}
          >
            {title}
          </th>
          <td className={"px-1.5 py-1 text-center"}>
            <FontAwesomeIcon
              icon={faUserGroup}
              className="align-middle text-olive-700 dark:text-olive-700-dark"
            />
          </td>

          <td className="px-3 py-1 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
            {t("me")}
          </td>
        </tr>
      </thead>
      <tbody>
        {communityPredictions.map(
          ({ color, choiceLabel, valueElement }, idx) => (
            <tr key={`choice-tooltip-row-${choiceLabel}-${idx}`}>
              {!!color && (
                <td className="w-6 py-1 pl-3">
                  <ChoiceIcon color={color} />
                </td>
              )}
              <th
                className="py-1 pl-2 pr-1 text-left text-xs font-medium"
                colSpan={color ? 1 : 2}
              >
                {choiceLabel}
              </th>
              <td className="px-1.5 py-1 text-center text-xs text-olive-800 dark:text-olive-800-dark">
                {valueElement}
              </td>

              <td className="px-1.5 py-1 text-center text-xs text-orange-800 dark:text-orange-800-dark">
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
