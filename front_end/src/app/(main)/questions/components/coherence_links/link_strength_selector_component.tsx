import { FC, useState } from "react";

import LinkStrengthComponent from "@/app/(main)/questions/components/coherence_links/link_strength_component";
import { STRENGTH_OPTIONS } from "@/types/coherence";

type Props = {
  onSelect: (strength: number) => void;
};

const LinkStrengthSelectorComponent: FC<Props> = ({ onSelect }) => {
  const [currentStrength, setCurrentStrength] = useState<number>(2);
  const valueSelected = (value: number) => {
    onSelect(value);
    setCurrentStrength(value);
  };
  return (
    <div className="flex items-center justify-start gap-2 pb-2 pt-2">
      {STRENGTH_OPTIONS.map((it, key) => (
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
