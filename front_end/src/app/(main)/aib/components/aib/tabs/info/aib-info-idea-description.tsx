import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faBrain, faBullseye } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useTranslations } from "next-intl";

import AIBInfoIdeaCard from "./aib-info-idea-card";

const AIBInfoIdeaDescription: React.FC = () => {
  const t = useTranslations();

  const CARDS = [
    {
      icon: faCircleDot,
      title: t("aibIdeaCard1Title"),
      content: (
        <>
          <p>{t("aibIdeaCard1P1")}</p>
          <p>
            {t.rich("aibIdeaCard1P2", {
              link: (chunks) => (
                <Link href="/notebooks/38928/aib-resource-page/">{chunks}</Link>
              ),
            })}
          </p>
        </>
      ),
    },
    {
      icon: faBullseye,
      title: t("aibIdeaCard2Title"),
      content: (
        <>
          <p>{t("aibIdeaCard2P1")}</p>
          <p>
            {t.rich("aibIdeaCard2P2", {
              link: (chunks) => (
                <Link href="/notebooks/38928/aib-resource-page/">{chunks}</Link>
              ),
            })}
          </p>
        </>
      ),
    },
    {
      icon: faBrain,
      title: t("aibIdeaCard3Title"),
      content: (
        <>
          <p>{t("aibIdeaCard2P1")}</p>
          <p>
            {t.rich("aibIdeaCard2P2", {
              link: (chunks) => (
                <Link href="/notebooks/38928/aib-resource-page/">{chunks}</Link>
              ),
            })}
          </p>
        </>
      ),
    },
  ] as const;

  return (
    <div className="space-y-8 sm:space-y-[56px] sm:pt-5 md:space-y-16 2xl:pt-0">
      <div className="max-w-[840px] space-y-8 antialiased">
        <h1 className="m-0 text-center text-2xl font-bold leading-[116%] -tracking-[0.96px] text-blue-800 dark:text-blue-800-dark md:text-[32px] md:-tracking-[1.28px] lg:text-left lg:text-5xl lg:-tracking-[1.92px]">
          {t.rich("aibIdeaTitle", {
            highlight: (chunks) => (
              <span className="text-blue-600 dark:text-blue-600-dark">
                {chunks}
              </span>
            ),
          })}
        </h1>

        <div className="space-y-6 text-sm font-normal text-blue-700 dark:text-blue-700-dark md:text-xl md:font-medium">
          <p className="m-0 hidden text-center sm:block lg:text-left">
            {t("aibIdeaDesktopP1")}
          </p>

          <p className="m-0 block sm:hidden">{t("aibIdeaMobileP1")}</p>

          <p className="m-0 hidden text-center sm:block lg:text-left">
            {t("aibIdeaDesktopP2")}
          </p>

          <p className="m-0 block sm:hidden">{t("aibIdeaMobileP2")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-14 lg:flex-row">
        {CARDS.map((card) => (
          <AIBInfoIdeaCard key={card.title} icon={card.icon} title={card.title}>
            {card.content}
          </AIBInfoIdeaCard>
        ))}
      </div>
    </div>
  );
};

export default AIBInfoIdeaDescription;
