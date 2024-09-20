import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import Button from "@/components/ui/button";
import { ChoiceItem } from "@/types/choices";
import { Aggregations } from "@/types/question";

import ChoiceCheckbox from "../../questions/[id]/components/choices_legend/choice_checkbox";

type Props = {
  choiceItem: ChoiceItem;
  valueLabel: string;
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  onTabChange: (activeTab: keyof Aggregations) => void;
};

const AggregationTooltip: FC<Props> = ({
  choiceItem,
  valueLabel,
  onChoiceChange,
  onChoiceHighlight,
  onTabChange,
}) => {
  const { color, choice, active } = choiceItem;
  return (
    <div className="flex w-[300px] border-black bg-gray-0 p-5 dark:bg-gray-0-dark">
      <div>
        <ChoiceCheckbox
          choice={choice}
          color={color.DEFAULT}
          checked={active}
          onChange={(checked) => onChoiceChange(choice, checked)}
          onHighlight={(highlighted) => onChoiceHighlight(choice, highlighted)}
        />

        <p className="mb-0">{valueLabel}</p>
      </div>
      <Button
        className="ml-auto h-10"
        onClick={() => onTabChange(choice as keyof Aggregations)}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </div>
  );
};

export default AggregationTooltip;
