import { Radio, RadioGroup } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import RadioButton from "@/components/ui/radio_button";
import { PostSubscriptionNewComments } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionNewComments: FC<
  SubscriptionSectionProps<PostSubscriptionNewComments>
> = ({ subscription, onChange }) => {
  const t = useTranslations();

  const options = useMemo(
    () => [
      {
        name: t("followModalEveryComment"),
        id: 1,
      },
      {
        name: t("followModalEveryNComments", { n: 3 }),
        id: 3,
      },
      {
        name: t("followModalEveryNComments", { n: 10 }),
        id: 10,
      },
    ],
    [t]
  );

  return (
    <div>
      <p>{t("notifyMe")}: </p>
      <RadioGroup
        value={subscription.comments_frequency}
        onChange={(value) => onChange("comments_frequency", value)}
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

export default SubscriptionSectionNewComments;
