import { Radio, RadioGroup } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { SubscriptionSectionProps } from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/types";
import RadioButton from "@/components/ui/radio_button";
import { PostSubscriptionCPCHange } from "@/types/post";

const SubscriptionSectionCPChange: FC<
  SubscriptionSectionProps<PostSubscriptionCPCHange>
> = ({ subscription, onChange }) => {
  const t = useTranslations();

  const options = useMemo(
    () => [
      {
        name: `${t("followModalSmallChanges")} (50% → 60%)`,
        id: 0.1,
      },
      {
        name: `${t("followModalMediumChanges")} (50% → 70%)`,
        id: 0.2,
      },
      {
        name: `${t("followModalLargeChanges")} (50% → 80%)`,
        id: 0.3,
      },
    ],
    [t]
  );

  return (
    <div>
      <p>{t("followModalNotifyMeFor")}: </p>
      <RadioGroup
        value={subscription.cp_threshold}
        onChange={(value) => onChange("cp_threshold", value)}
        as="ul"
      >
        {options.map((option, optionIdx) => (
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
