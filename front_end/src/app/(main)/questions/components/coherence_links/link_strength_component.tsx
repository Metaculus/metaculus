import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { Strengths } from "@/types/coherence";

type Props = {
  strength: Strengths;
  disabled: boolean;
};

const LinkStrengthComponent: FC<Props> = ({ strength, disabled }) => {
  const t = useTranslations();
  const label = t(strength);
  return (
    <Button
      className={"text-bold mt-3 rounded-md border disabled:opacity-100"}
      disabled={disabled}
    >
      {label}
    </Button>
  );
};

export default LinkStrengthComponent;
