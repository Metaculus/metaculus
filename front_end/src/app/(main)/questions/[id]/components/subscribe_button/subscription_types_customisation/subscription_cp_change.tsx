import { Radio, RadioGroup } from "@headlessui/react";
import { FC, useCallback } from "react";

import { SubscriptionSectionProps } from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/types";
import RadioButton from "@/components/ui/radio_button";
import { PostSubscriptionCPCHange } from "@/types/post";

const COMMENTS_FREQUENCY_OPTIONS = [
  {
    name: "small changes (50% → 60%)",
    id: 0.1,
  },
  {
    name: "medium changes (50% → 70%)",
    id: 0.2,
  },
  {
    name: "large changes (50% → 80%)",
    id: 0.3,
  },
];

const SubscriptionSectionCPChange: FC<
  SubscriptionSectionProps<PostSubscriptionCPCHange>
> = ({ subscription, onChange }) => {
  return (
    <div>
      <p>Notify me for: </p>
      <RadioGroup
        value={subscription.cp_threshold}
        onChange={(value) => onChange("cp_threshold", value)}
        as="ul"
      >
        {COMMENTS_FREQUENCY_OPTIONS.map((option, optionIdx) => (
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
