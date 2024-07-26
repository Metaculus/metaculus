import { Radio, RadioGroup } from "@headlessui/react";
import { FC } from "react";

import RadioButton from "@/components/ui/radio_button";
import { PostSubscriptionMilestone } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const MILESTONE_STEP_OPTIONS = [
  {
    name: "1%",
    id: 0.01,
  },
  {
    name: "5%",
    id: 0.05,
  },
  {
    name: "10%",
    id: 0.1,
  },
  {
    name: "20%",
    id: 0.2,
  },
];

const SubscriptionSectionMilestone: FC<
  SubscriptionSectionProps<PostSubscriptionMilestone>
> = ({ subscription, onChange }) => {
  return (
    <div>
      <p>Notify me every: </p>
      <RadioGroup
        value={subscription.milestone_step}
        onChange={(value) => onChange("milestone_step", value)}
        as="ul"
      >
        {MILESTONE_STEP_OPTIONS.map((option, optionIdx) => (
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

export default SubscriptionSectionMilestone;
