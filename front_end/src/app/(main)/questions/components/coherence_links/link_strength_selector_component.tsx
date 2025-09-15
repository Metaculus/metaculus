import { FC, useState } from "react";

import LinkStrengthComponent from "@/app/(main)/questions/components/coherence_links/link_strength_component";
import { Strengths } from "@/types/coherence";

type Props = {
  onSelect: (strength: Strengths) => void;
};

const LinkStrengthSelectorComponent: FC<Props> = ({ onSelect }) => {
  const [currentStrength, setCurrentStrength] = useState<Strengths>(
    Strengths.Medium
  );
  const valueSelected = (value: Strengths) => {
    onSelect(value);
    setCurrentStrength(value);
  };
  return (
    <div className="flex items-center justify-center gap-2">
      {Object.values(Strengths).map((it, key) => (
        <LinkStrengthComponent
          strength={it}
          onClick={() => valueSelected(it)}
          key={key}
          selected={it === currentStrength}
        />
      ))}
    </div>
  );
};

export default LinkStrengthSelectorComponent;
