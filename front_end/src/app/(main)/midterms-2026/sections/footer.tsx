import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function FooterSection() {
  const t = await getTranslations();

  return (
    <footer className="mt-4 px-3 text-xs text-blue-700 dark:text-blue-700-dark sm:px-0">
      <div className="flex flex-col items-start justify-between gap-2 border-t border-blue-300 pt-4 dark:border-blue-300-dark sm:flex-row sm:items-center">
        <p className="m-0">{t("midtermsHubFooterDisclaimer")}</p>
        <Link
          href="/"
          className="text-blue-600 hover:underline dark:text-blue-600-dark"
        >
          metaculus.com
        </Link>
      </div>
      <p className="mt-2 text-blue-600 dark:text-blue-600-dark">
        {t("midtermsHubForecastsRealtime")}
      </p>
    </footer>
  );
}
