import { useTranslations } from "next-intl";

function HeroFall2025() {
  const t = useTranslations();

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-1 rounded bg-white p-4 dark:bg-blue-100-dark md:p-6 lg:gap-2 lg:p-8 min-[1920px]:gap-3 min-[1920px]:p-16">
      <h1 className="m-0 self-start text-balance text-left text-3xl font-bold leading-snug text-blue-600 dark:text-blue-600-dark md:text-3xl md:leading-tight lg:text-5xl lg:leading-tight min-[1920px]:text-6xl min-[1920px]:leading-normal">
        <span className="text-blue-800 dark:text-blue-800-dark">
          {t("FABHeroTitle")}
        </span>{" "}
        <span className="font-light text-blue-600 dark:text-blue-600-dark">
          {t("FABHeroSubtitle")}{" "}
          <span className="font-light text-blue-700 dark:text-blue-700-dark">
            Fall <span className="font-thin opacity-50">(2025)</span>
          </span>
        </span>
      </h1>
      <p className="mb-0 mt-2 text-lg font-light leading-tight text-blue-600 dark:text-blue-600-dark md:mt-2 md:text-xl md:leading-snug lg:text-2xl min-[1920px]:text-3xl min-[1920px]:leading-normal">
        {t("FABHeroDesc")}
      </p>
    </div>
  );
}

export default HeroFall2025;
