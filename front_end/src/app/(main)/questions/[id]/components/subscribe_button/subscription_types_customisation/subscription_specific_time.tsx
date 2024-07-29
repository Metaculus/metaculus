import { formatInTimeZone } from "date-fns-tz";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import DatetimeUtc from "@/components/ui/datetime_utc";
import { SelectOption } from "@/components/ui/listbox";
import Select from "@/components/ui/select";
import { PostSubscriptionSpecificTime } from "@/types/post";
import { formatDate } from "@/utils/date_formatters";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionSpecificTime: FC<
  SubscriptionSectionProps<PostSubscriptionSpecificTime>
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

  return (
    <div>
      <p>{t("reminderDateDescription")}: </p>
      <div>
        <DatetimeUtc
          min={currentDateTime}
          onChange={(dt) => onChange("next_trigger_datetime", dt)}
          defaultValue={subscription.next_trigger_datetime}
          className="!rounded-none"
        />
        <Select
          defaultValue={subscription.recurrence_interval}
          onChange={(e) => onChange("recurrence_interval", e.target.value)}
          options={options}
          className="ml-2 border-0"
        />
      </div>
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
