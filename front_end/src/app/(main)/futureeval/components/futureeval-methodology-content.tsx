"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faBrain, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS } from "../theme";

/**
 * FutureEval-specific methodology content without the main title.
 * Uses monospace fonts and FutureEval theme colors.
 */
const FutureEvalMethodologyContent: React.FC = () => {
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
                <Link
                  href="/notebooks/38928/futureeval-resources-page/#what-is-the-model-leaderboard"
                  className="underline"
                >
                  {chunks}
                </Link>
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
                <Link
                  href="/notebooks/38928/futureeval-resources-page/#what-do-the-tournaments-look-like"
                  className="underline"
                >
                  {chunks}
                </Link>
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
          <p>{t("aibIdeaCard3P1")}</p>
          <p>
            {t.rich("aibIdeaCard2P2", {
              link: (chunks) => (
                <Link
                  href="/notebooks/38928/futureeval-resources-page/#what-is-unique-about-futureeval"
                  className="underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </>
      ),
    },
  ] as const;

  return (
    <div className="space-y-8 sm:space-y-[56px] md:space-y-16">
      {/* Description paragraphs - use font-geist-mono like benchmark page */}
      <div className="max-w-[840px] space-y-4 antialiased">
        <p
          className={cn(
            "m-0 text-balance font-geist-mono text-sm sm:text-base",
            FE_COLORS.textSubheading
          )}
        >
          {t("aibIdeaDesktopP1")}
        </p>
        <p
          className={cn(
            "m-0 text-balance font-geist-mono text-sm sm:text-base",
            FE_COLORS.textSubheading
          )}
        >
          {t("aibIdeaDesktopP2")}
        </p>
      </div>

      <div className="flex flex-col gap-14 lg:flex-row">
        {CARDS.map((card) => (
          <FutureEvalIdeaCard
            key={card.title}
            icon={card.icon}
            title={card.title}
          >
            {card.content}
          </FutureEvalIdeaCard>
        ))}
      </div>
    </div>
  );
};

/**
 * FutureEval-specific idea card with monospace font for titles
 */
type IdeaCardProps = PropsWithChildren<{
  icon: IconDefinition;
  title?: string;
}>;

const FutureEvalIdeaCard: React.FC<IdeaCardProps> = ({
  icon,
  title,
  children,
}) => {
  return (
    <div className="flex flex-1 flex-col items-start">
      <FontAwesomeIcon
        className={cn("text-[26px]", FE_COLORS.textSubheading)}
        icon={icon}
      />
      {/* Title uses font-geist-mono like benchmark headers */}
      <h4
        className={cn(
          "m-0 mt-5 font-geist-mono text-xl font-semibold antialiased md:text-2xl",
          FE_COLORS.textHeading
        )}
      >
        {title}
      </h4>
      {/* Content uses font-geist-mono for consistency */}
      <div
        className={cn(
          "mt-2.5 font-geist-mono text-sm md:text-base",
          FE_COLORS.textSubheading
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default FutureEvalMethodologyContent;
