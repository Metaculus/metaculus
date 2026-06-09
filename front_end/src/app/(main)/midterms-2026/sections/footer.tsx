import { getTranslations } from "next-intl/server";

export default async function FooterSection() {
  const t = await getTranslations();

  return (
    <footer className="mt-4 px-3 text-xs text-blue-700 dark:text-blue-700-dark sm:px-0">
      <p className="m-0 border-t border-blue-300 pt-4 dark:border-blue-300-dark">
        {t("midtermsHubFooterDisclaimer")}
      </p>
    </footer>
  );
}
