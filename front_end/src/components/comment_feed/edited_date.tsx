import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { formatDate } from "@/utils/date_formatters";

export const EditedDate: FC<{ edited_at: string }> = ({ edited_at }) => {
  const locale = useLocale();
  const t = useTranslations();
  return (
    <span title={edited_at} className="text-sm opacity-55">
      ({t("edited")} {formatDate(locale, new Date(edited_at))})
    </span>
  );
};
