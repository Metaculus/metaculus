"use client";

import { useTranslations } from "next-intl";
import { FormEventHandler } from "react";

import Button from "@/components/ui/button";

type Props = {
  value: string;
  error: string | null;
  disabled?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onChange: (value: string) => void;
};

export default function SearchForm({
  value,
  error,
  disabled = false,
  onSubmit,
  onChange,
}: Props) {
  const t = useTranslations();

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          placeholder={t("questionUrlOrId")}
          aria-label={t("questionUrlOrId")}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-300 dark:border-gray-500-dark dark:bg-blue-950 dark:text-gray-200 dark:focus:border-blue-600-dark dark:focus:ring-blue-700/50"
        />
        <Button
          variant="primary"
          className="h-12 rounded-full px-6 text-sm font-semibold sm:min-w-[120px]"
          disabled={disabled}
          type="submit"
        >
          {t("explore")}
        </Button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </>
  );
}
