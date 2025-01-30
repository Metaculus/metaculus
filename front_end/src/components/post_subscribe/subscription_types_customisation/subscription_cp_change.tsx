import { Radio, RadioGroup } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import RadioButton from "@/components/ui/radio_button";
import { CPChangeThreshold, PostSubscriptionCPCHange } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionCPChange: FC<
  SubscriptionSectionProps<PostSubscriptionCPCHange, "cp_change_threshold">
> = ({ subscription, onChange }) => {
  const t = useTranslations();

  const options = useMemo(
    () => [
      {
        name: `${t("followModalSmallChanges")} (45% → 55%)`,
        id: CPChangeThreshold.SMALL,
      },
      {
        name: `${t("followModalMediumChanges")} (40% → 60%)`,
        id: CPChangeThreshold.MEDIUM,
      },
      {
        name: `${t("followModalLargeChanges")} (35% → 65%)`,
        id: CPChangeThreshold.LARGE,
      },
    ],
    [t]
  );

  return (
    <div>
      <p>{t("followModalNotifyMeFor")}: </p>
      <RadioGroup
        value={subscription.cp_change_threshold}
        onChange={(value) => onChange("cp_change_threshold", value)}
        as="ul"
      >
        {options.map((option) => (
          <Radio as="li" key={option.id} value={option.id}>
            {({ checked, disabled }) => (
              <RadioButton checked={checked} disabled={disabled} size="small">
                {option.name}
              </RadioButton>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};

export default SubscriptionSectionCPChange;
