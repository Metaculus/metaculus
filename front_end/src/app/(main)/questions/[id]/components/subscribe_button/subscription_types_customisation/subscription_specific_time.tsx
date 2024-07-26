import { formatInTimeZone } from "date-fns-tz";
import { useLocale } from "next-intl";
import { FC, useMemo } from "react";

import DatetimeUtc from "@/components/ui/datetime_utc";
import { SelectOption } from "@/components/ui/listbox";
import Select from "@/components/ui/select";
import { PostSubscriptionSpecificTime } from "@/types/post";
import { formatDate } from "@/utils/date_formatters";

import { SubscriptionSectionProps } from "./types";

const RECURRENCE_INTERVAL_OPTIONS: SelectOption<string>[] = [
  { value: "", label: "Doesn't repeat" },
  { value: "7 00:00:00", label: "Weekly" },
  { value: "30 00:00:00", label: "Monthly" },
  { value: "365 00:00:00", label: "Yearly" },
];

const SubscriptionSectionSpecificTime: FC<
  SubscriptionSectionProps<PostSubscriptionSpecificTime>
> = ({ subscription, onChange, post }) => {
  const locale = useLocale();

  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  return (
    <div>
      <p>Notify me on: </p>
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
          options={RECURRENCE_INTERVAL_OPTIONS}
          className="ml-2 border-0"
        />
      </div>
      <p className="mt-4 opacity-70">
        Reminder: this question opened on{" "}
        {post.published_at && formatDate(locale, new Date(post.published_at))}{" "}
        and closes on{" "}
        {post.scheduled_close_time &&
          formatDate(locale, new Date(post.scheduled_close_time))}
      </p>
    </div>
  );
};

export default SubscriptionSectionSpecificTime;
