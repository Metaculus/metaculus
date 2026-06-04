import { getTranslations } from "next-intl/server";

export default async function LiveBadge() {
  const t = await getTranslations();
  return (
    <span className="inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-700-dark">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon-600 opacity-75 dark:bg-salmon-600-dark" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-salmon-600 dark:bg-salmon-600-dark" />
      </span>
      <span>{t("midtermsHubUpdatedRealtime")}</span>
    </span>
  );
}
