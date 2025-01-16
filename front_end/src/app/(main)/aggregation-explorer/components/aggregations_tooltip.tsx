"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, FC, SetStateAction, useState } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { ChoiceItem } from "@/types/choices";
import { AggregationMethod, AggregationMethodWithBots } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { logError } from "@/utils/errors";

import { AggregationMethodInfo } from "./explorer";

type Props = {
  valueLabel: string;
  tooltips: {
    aggregationMethod: AggregationMethod;
    choice: AggregationMethodWithBots;
    label: string;
    includeBots: boolean;
    color: ThemeColor;
  };
  setAggregationMethods: Dispatch<SetStateAction<AggregationMethodInfo[]>>;
  aggregationMethods: AggregationMethodInfo[];
  onFetchData: ({
    postId,
    questionId,
    includeBots,
    aggregationMethod,
  }: {
    postId: string;
    questionId?: string | null;
    includeBots?: boolean;
    aggregationMethod: AggregationMethod;
  }) => Promise<void>;
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  choiceItems: ChoiceItem[];
  onTabChange: (activeTab: AggregationMethodWithBots) => void;
  postId: number;
  questionId?: number | null;
};

const AggregationTooltip: FC<Props> = ({
  valueLabel,
  tooltips,
  onFetchData,
  onChoiceChange,
  onChoiceHighlight,
  choiceItems,
  onTabChange,
  postId,
  questionId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { label, color, aggregationMethod, includeBots, choice } = tooltips;
  const foundChoiceItem = choiceItems.find((item) => item.choice === choice);

  return (
    <div className="flex w-[300px] border-black bg-gray-0 p-5 dark:bg-gray-0-dark">
      <div className="flex flex-col">
        <ChoiceCheckbox
          choice={label}
          color={color.DEFAULT}
          checked={foundChoiceItem?.active ?? false}
          onChange={async (checked) => {
            if (checked) {
              try {
                setIsLoading(true);
                await onFetchData({
                  postId: postId.toString(),
                  questionId: questionId?.toString(),
                  includeBots,
                  aggregationMethod,
                });
              } catch (error) {
                logError(error);
              } finally {
                setIsLoading(false);
              }
            }
            onChoiceChange(
              includeBots ? `${aggregationMethod}_bot` : aggregationMethod,
              checked
            );
          }}
          onHighlight={(highlighted) => {
            onChoiceHighlight(choice, highlighted);
          }}
        />
        <p className="mb-0">{valueLabel}</p>
        <div className="mt-auto h-8">{isLoading && <LoadingIndicator />}</div>
      </div>
      <Button
        className="ml-auto h-10"
        onClick={() => {
          onTabChange(choice);
        }}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </div>
  );
};

export default AggregationTooltip;
