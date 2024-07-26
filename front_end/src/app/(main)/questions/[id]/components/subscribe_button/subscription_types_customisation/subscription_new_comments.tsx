import { Radio, RadioGroup } from "@headlessui/react";
import { FC, useCallback } from "react";

import { SubscriptionSectionProps } from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/types";
import RadioButton from "@/components/ui/radio_button";
import { PostSubscriptionNewComments } from "@/types/post";

const COMMENTS_FREQUENCY_OPTIONS = [
  {
    name: "every comment",
    id: 1,
  },
  {
    name: "every 3 comments",
    id: 3,
  },
  {
    name: "every 10 comments",
    id: 10,
  },
];

const SubscriptionSectionNewComments: FC<
  SubscriptionSectionProps<PostSubscriptionNewComments>
> = ({ subscription, onChange }) => {
  return (
    <div>
      <p>Notify me for: </p>
      <RadioGroup
        value={subscription.comments_frequency}
        onChange={(value) => onChange("comments_frequency", value)}
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

export default SubscriptionSectionNewComments;
