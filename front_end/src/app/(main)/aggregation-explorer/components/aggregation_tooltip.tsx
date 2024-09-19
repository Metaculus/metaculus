import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { useTranslations } from "next-intl";
import ChoiceCheckbox from "../../questions/[id]/components/choices_legend/choice_checkbox";
import Button from "@/components/ui/button";
import { Aggregations } from "@/types/question";

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
  const t = useTranslations();
  const { color, choice, active } = choiceItem;
  return (
    <div className="flex w-[300px] border-black bg-slate-500 p-5">
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
