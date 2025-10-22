"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useState } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { ChoiceItem } from "@/types/choices";
import { ThemeColor } from "@/types/theme";
import { logError } from "@/utils/core/errors";

import { AggregationExtraMethod } from "../types";

type Props = {
  valueLabel: string;
  tooltips: {
    aggregationMethod: string;
    choice: AggregationExtraMethod;
    label: string;
    includeBots: boolean;
    color: ThemeColor;
  };
  onFetchData: (aggregationOptionId: AggregationExtraMethod) => Promise<void>;
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  choiceItems: ChoiceItem[];
  onTabChange: (activeTab: AggregationExtraMethod) => void;
};

const AggregationTooltip: FC<Props> = ({
  valueLabel,
  tooltips,
  onFetchData,
  onChoiceChange,
  onChoiceHighlight,
  choiceItems,
  onTabChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { label, color, choice } = tooltips;
  const foundChoiceItem = choiceItems.find((item) => item.choice === choice);

  return (
    <div className="flex w-full border-black bg-gray-0 p-5 dark:bg-gray-0-dark">
      <div className="flex flex-col">
        <ChoiceCheckbox
          label={label}
          color={color.DEFAULT}
          checked={foundChoiceItem?.active ?? false}
          onChange={async (checked) => {
            if (checked) {
              try {
                setIsLoading(true);
                await onFetchData(choice);
              } catch (error) {
                logError(error);
              } finally {
                setIsLoading(false);
              }
            }
            onChoiceChange(choice, checked);
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
        onClick={async () => {
          try {
            setIsLoading(true);
            await onFetchData(choice);
          } catch (error) {
            logError(error);
          } finally {
            setIsLoading(false);
            onTabChange(choice);
          }
        }}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </div>
  );
};

export default AggregationTooltip;
