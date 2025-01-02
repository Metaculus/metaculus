import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import { ChoiceItem } from "@/types/choices";
import { AggregationMethod, aggregationMethodLabel } from "@/types/question";

type Props = {
  choiceItem: ChoiceItem;
  valueLabel: string;
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  onTabChange: (activeTab: AggregationMethod) => void;
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
          choice={aggregationMethodLabel[choice as AggregationMethod]}
          color={color.DEFAULT}
          checked={active}
          onChange={(checked) => onChoiceChange(choice, checked)}
          onHighlight={(highlighted) => onChoiceHighlight(choice, highlighted)}
        />

        <p className="mb-0">{valueLabel}</p>
      </div>
      <Button
        className="ml-auto h-10"
        onClick={() => onTabChange(choice as AggregationMethod)}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </div>
  );
};

export default AggregationTooltip;
