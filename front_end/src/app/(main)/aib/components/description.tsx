import { useTranslations } from "next-intl";
import { ReactNode } from "react";

function Description() {
  const t = useTranslations();
  const bold = (c: ReactNode) => <span className="font-bold">{c}</span>;
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded bg-white p-4 dark:bg-blue-100-dark md:w-2/3 md:gap-6 md:p-8 min-[1920px]:gap-12 min-[1920px]:p-16">
      <ul className="w-full list-none space-y-2 divide-y divide-blue-400 text-lg font-normal leading-relaxed text-blue-700 dark:divide-blue-400-dark/40 dark:text-blue-700-dark md:space-y-3 md:text-lg md:font-light lg:text-lg lg:leading-normal xl:text-xl min-[1920px]:space-y-4 min-[1920px]:text-3xl">
        <li>{t.rich("FABdesc1", { bold })}</li>
        <li className="pt-3 min-[1920px]:pt-5">
          {t.rich("FABdesc2", { bold })}
        </li>
        <li className="pt-3 min-[1920px]:pt-5">{t("FABdesc3")}</li>
        <li className="pt-3 min-[1920px]:pt-5">
          {t("FABRules.title")}:
          <ul className="list-disc pl-8 text-base">
            <li>{t("FABRules.rule1")}</li>
            <li>{t("FABRules.rule2")}</li>
            <li>{t("FABRules.rule3")}</li>
            <li>{t("FABRules.rule4")}</li>
          </ul>
        </li>
        <li className="pt-3 min-[1920px]:pt-5">
          {t("FABdesc4")}
        </li>
      </ul>
    </div>
  );
}

export default Description;
