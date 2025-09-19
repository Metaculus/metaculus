"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { Question } from "@/types/question";

export type BulkBulkQuestionAttrs = Partial<
  Pick<
    Question,
    | "open_time"
    | "cp_reveal_time"
    | "scheduled_close_time"
    | "scheduled_resolve_time"
  >
>;

const GroupFormBulkModal: FC<{
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onSubmit: (attrs: BulkBulkQuestionAttrs) => void;
  fields: Array<keyof BulkBulkQuestionAttrs>;
}> = ({ isOpen, setIsOpen, fields, onSubmit }) => {
  const t = useTranslations();

  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  const fieldsConfig: Array<{
    field: keyof BulkBulkQuestionAttrs;
    label: string;
  }> = useMemo(
    () => [
      {
        field: "open_time",
        label: t("openTime"),
      },
      {
        field: "cp_reveal_time",
        label: t("cpRevealTime"),
      },
      {
        field: "scheduled_close_time",
        label: t("closeTime"),
      },
      {
        field: "scheduled_resolve_time",
        label: t("resolveTime"),
      },
    ],
    [t]
  );

  const [BulkQuestionAttrs, setBulkQuestionAttrs] =
    useState<BulkBulkQuestionAttrs>({});

  return (
    <BaseModal
      isOpen={isOpen}
      label={t("bulkEdit")}
      className="max-w-md"
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-base leading-tight">{t("bulkEditDescription")}</p>
        <div className="mb-4 flex flex-col gap-4">
          {fieldsConfig
            .filter((config) => fields.includes(config.field))
            .map(({ label, field }) => (
              <div key={`question_${field}`} className="flex flex-col">
                <span className="mb-2 capitalize">{label}</span>
                <DatetimeUtc
                  min={currentDateTime}
                  onChange={(dt) =>
                    setBulkQuestionAttrs({
                      ...BulkQuestionAttrs,
                      [field]: dt,
                    })
                  }
                  defaultValue={BulkQuestionAttrs[field]}
                />
              </div>
            ))}
        </div>
        <div className="flex w-full justify-end gap-2">
          <Button onClick={() => setIsOpen(false)} variant="secondary">
            {t("cancel")}
          </Button>
          <Button
            onClick={() => {
              onSubmit(BulkQuestionAttrs);
              setIsOpen(false);
            }}
            variant="primary"
          >
            {t("apply")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default GroupFormBulkModal;
