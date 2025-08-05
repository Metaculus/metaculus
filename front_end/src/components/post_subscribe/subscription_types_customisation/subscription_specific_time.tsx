import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addWeeks } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import Button from "@/components/ui/button";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { SelectOption } from "@/components/ui/listbox";
import Select from "@/components/ui/select";
import {
  PostSubscriptionSpecificTime,
  PostSubscriptionSpecificTimeConfig,
  PostSubscriptionType,
} from "@/types/post";
import { formatDate } from "@/utils/formatters/date";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionSpecificTime: FC<
  SubscriptionSectionProps<
    PostSubscriptionSpecificTimeConfig,
    "subscriptions",
    PostSubscriptionSpecificTime,
    "recurrence_interval" | "next_trigger_datetime"
  >
> = ({ subscription, onChange, post }) => {
  const t = useTranslations();
  const locale = useLocale();

  const options: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: t("reminderLabelNoRepeat") },
      { value: "7 00:00:00", label: t("reminderLabelWeekly") },
      { value: "30 00:00:00", label: t("reminderLabelMonthly") },
      { value: "365 00:00:00", label: t("reminderLabelAnnually") },
    ],
    [t]
  );

  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  const handleAddSubscription = () => {
    const newSubscription: PostSubscriptionSpecificTime = {
      type: PostSubscriptionType.SPECIFIC_TIME,
      next_trigger_datetime: formatInTimeZone(
        addWeeks(new Date(), 1),
        "UTC",
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      ),
      recurrence_interval: "",
    };
    onChange("subscriptions", [...subscription.subscriptions, newSubscription]);
  };

  const handleRemoveSubscription = (index: number) => {
    const newSubscriptions = subscription.subscriptions.filter(
      (_, idx) => idx !== index
    );
    onChange("subscriptions", newSubscriptions);
  };

  return (
    <div>
      <p>{t("reminderDateDescription")}: </p>
      {subscription.subscriptions.map((sub, index) => {
        return (
          <div key={index} className="mt-1 flex">
            <DatetimeUtc
              min={currentDateTime}
              onChange={(dt) =>
                onChange("next_trigger_datetime", dt ?? "", index)
              }
              defaultValue={sub.next_trigger_datetime}
              className="max-w-[190px] !rounded-none"
            />
            <Select
              defaultValue={sub.recurrence_interval}
              onChange={(e) =>
                onChange("recurrence_interval", e.target.value, index)
              }
              options={options}
              className="ml-2 border-0"
            />
            <Button
              variant="text"
              className="ml-auto"
              onClick={() => handleRemoveSubscription(index)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        );
      })}
      <Button
        variant="secondary"
        className="mt-4"
        onClick={handleAddSubscription}
      >
        {t("addAnother")}
      </Button>
      <p className="mt-4 opacity-70">
        {t("followModalReminderThisQuestionOpened", {
          published_at:
            post.published_at &&
            formatDate(locale, new Date(post.published_at)),
          scheduled_close_time:
            post.scheduled_close_time &&
            formatDate(locale, new Date(post.scheduled_close_time)),
        })}
      </p>
    </div>
  );
};

export default SubscriptionSectionSpecificTime;
