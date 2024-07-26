import { formatInTimeZone } from "date-fns-tz";
import { FC, useMemo } from "react";

import DatetimeUtc from "@/components/ui/datetime_utc";
import Listbox, { SelectOption } from "@/components/ui/listbox";
import Select from "@/components/ui/select";
import { PostSubscriptionSpecificTime } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const RECURRENCE_INTERVAL_OPTIONS: SelectOption<string>[] = [
  { value: "", label: "Doesn't repeat" },
  { value: "7 00:00:00", label: "Weekly" },
  { value: "30 00:00:00", label: "Monthly" },
  { value: "365 00:00:00", label: "Yearly" },
];

const SubscriptionSectionSpecificTime: FC<
  SubscriptionSectionProps<PostSubscriptionSpecificTime>
> = ({ subscription, onChange }) => {
  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  return (
    <div>
      <p>Notify me on: </p>
      <div>
        <DatetimeUtc
          type="datetime-local"
          placeholder="date when forecasts will open"
          className="bg-transparent pl-1"
          min={currentDateTime}
          onChange={(dt) => onChange("next_trigger_datetime", dt)}
          defaultValue={subscription.next_trigger_datetime}
        />
        <Select
          defaultValue={subscription.recurrence_interval}
          onChange={(e) => onChange("recurrence_interval", e.target.value)}
          options={RECURRENCE_INTERVAL_OPTIONS}
        />
      </div>
    </div>
  );
};

export default SubscriptionSectionSpecificTime;
