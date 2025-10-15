import { useTranslations } from "next-intl";

const AIBHero: React.FC = () => {
  const t = useTranslations();
  return (
    <>
      <h1 className="m-0 text-center text-[32px] leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-[44px] lg:text-left lg:text-5xl">
        {t.rich("aibHeroTitle", {
          highlight: (chunks) => (
            <span className="text-blue-600 dark:text-blue-600-dark">
              {chunks}
            </span>
          ),
        })}
      </h1>

      <p className="m-0 mt-4 text-center text-[14px] leading-[20px] text-blue-700 dark:text-blue-700-dark sm:text-[18px] sm:leading-[28px] lg:text-left lg:text-[20px]">
        {t.rich("aibHeroSubtitle", {
          br: () => <br className="sm:hidden" />,
        })}
      </p>
    </>
  );
};

export default AIBHero;
