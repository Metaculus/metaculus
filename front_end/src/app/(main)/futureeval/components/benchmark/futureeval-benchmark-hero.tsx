"use client";

import { useTranslations } from "next-intl";

const FutureEvalBenchmarkHero: React.FC = () => {
  const t = useTranslations();

  return (
    <div className="mb-12 text-left">
      <h1 className="m-0 text-xl font-bold leading-tight text-blue-800 dark:text-blue-800-dark sm:text-2xl md:text-3xl lg:text-4xl">
        {t("aibBenchmarkHeroTitle")}
      </h1>
      <p className="m-0 mx-auto mt-4 text-base text-blue-700 dark:text-blue-700-dark sm:text-lg md:text-xl">
        {t("aibBenchmarkHeroSubtitle")}
      </p>
    </div>
  );
};

export default FutureEvalBenchmarkHero;
