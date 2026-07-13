import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDays, addWeeks } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { SelectOption } from "@/components/ui/listbox";
import Select from "@/components/ui/select";
import {
  PostSubscriptionSpecificTime,
  PostSubscriptionSpecificTimeConfig,
  PostSubscriptionType,
} from "@/types/post";
import { formatDate } from "@/utils/formatters/date";

import { SubscriptionSectionProps } from "./types";

const getUtcDate = (iso: string): string => (iso ? iso.slice(0, 10) : "");

const toUtcMidnight = (date: string): string => `${date}T00:00:00Z`;

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

  const today = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd"),
    []
  );

  const selectedDates = useMemo(
    () =>
      subscription.subscriptions.map((sub) =>
        getUtcDate(sub.next_trigger_datetime)
      ),
    [subscription.subscriptions]
  );

  const handleAddSubscription = () => {
    const taken = new Set(selectedDates.filter(Boolean));
    let candidateDate = addWeeks(new Date(), 1);
    let candidate = formatInTimeZone(candidateDate, "UTC", "yyyy-MM-dd");
    while (taken.has(candidate) || candidate < today) {
      candidateDate = addDays(candidateDate, 1);
      candidate = formatInTimeZone(candidateDate, "UTC", "yyyy-MM-dd");
    }
    const newSubscription: PostSubscriptionSpecificTime = {
      type: PostSubscriptionType.SPECIFIC_TIME,
      next_trigger_datetime: toUtcMidnight(candidate),
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

  const handleDateChange = (index: number, dateValue: string) => {
    onChange(
      "next_trigger_datetime",
      dateValue ? toUtcMidnight(dateValue) : "",
      index
    );
  };

  return (
    <div>
      <p>{t("reminderDateDescription")}: </p>
      {subscription.subscriptions.map((sub, index) => {
        const currentDate = getUtcDate(sub.next_trigger_datetime);
        const isDuplicate =
          !!currentDate &&
          selectedDates.findIndex((d) => d === currentDate) !== index;
        return (
          <div key={index} className="mt-1">
            <div className="flex">
              <Input
                type="date"
                min={today}
                value={currentDate}
                onChange={(e) => handleDateChange(index, e.target.value)}
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
            {isDuplicate && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-500-dark">
                {t("reminderErrorDuplicateDate")}
              </p>
            )}
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
      <p className="mt-4 text-xs opacity-70">
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
