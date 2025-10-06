import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import ChoiceIcon from "@/components/choice_icon";
import { ChoiceTooltipItem } from "@/types/choices";
import cn from "@/utils/core/cn";
import { getFontsString } from "@/utils/fonts";

type Props = {
  title?: string;
  communityPredictions: ChoiceTooltipItem[];
  userPredictions?: ChoiceTooltipItem[];
  showMeColumn?: boolean;
  FooterRow?: ReactNode;
};

const MCPredictionsTooltip: FC<Props> = ({
  title,
  communityPredictions,
  userPredictions,
  showMeColumn = true,
  FooterRow = null,
}) => {
  const t = useTranslations();
  const showMe = useMemo(
    () =>
      typeof showMeColumn === "boolean"
        ? showMeColumn
        : (userPredictions?.length ?? 0) > 0,
    [showMeColumn, userPredictions]
  );

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

          <td className="text-center">
            <FontAwesomeIcon
              icon={faUserGroup}
              className="size-3.5 align-middle text-olive-700 dark:text-olive-700-dark"
            />
          </td>

          {showMe && (
            <td className="px-5 py-1 text-center text-xs font-bold capitalize text-orange-800 dark:text-orange-800-dark">
              {t("me")}
            </td>
          )}
        </tr>
      </thead>
      <tbody>
        {communityPredictions.map(
          ({ color, choiceLabel, valueElement }, idx) => {
            const userVal =
              userPredictions?.find((item) => item.choiceLabel === choiceLabel)
                ?.valueElement ?? "?";

            return (
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

                {showMe && (
                  <td
                    className={cn(
                      "px-2.5 py-1 text-sm font-normal tabular-nums",
                      userVal === "?" || userVal === "..."
                        ? "text-center text-gray-500 dark:text-gray-500-dark"
                        : "text-right text-orange-800 dark:text-orange-800-dark"
                    )}
                  >
                    {userVal}
                  </td>
                )}
              </tr>
            );
          }
        )}

        {FooterRow}
      </tbody>
    </table>
  );
};

export default MCPredictionsTooltip;
