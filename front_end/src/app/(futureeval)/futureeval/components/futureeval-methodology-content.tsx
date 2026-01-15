"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faBrain, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

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
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-is-the-model-leaderboard",
      content: (
        <>
          <p>{t("aibIdeaCard1P1")}</p>
        </>
      ),
    },
    {
      icon: faBullseye,
      title: t("aibIdeaCard2Title"),
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-do-the-tournaments-look-like",
      content: (
        <>
          <p>{t("aibIdeaCard2P1")}</p>
        </>
      ),
    },
    {
      icon: faBrain,
      title: t("aibIdeaCard3Title"),
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-is-unique-about-futureeval",
      content: (
        <>
          <p>{t("aibIdeaCard3P1")}</p>
        </>
      ),
    },
  ] as const;

  return (
    <div className="space-y-8 sm:space-y-[56px] md:space-y-16">
      {/* Hero headline */}
      <h1
        className={cn("m-0 max-w-3xl", FE_TYPOGRAPHY.h1, FE_COLORS.textHeading)}
      >
        Predicting the future is one of the few ways to evaluate{" "}
        <span className={FE_COLORS.textAccent}>reasoning against reality.</span>
      </h1>

      {/* Description paragraphs */}
      <div className="max-w-[840px] space-y-4 antialiased">
        <p
          className={cn(
            "m-0 text-balance",
            FE_TYPOGRAPHY.body,
            FE_COLORS.textSubheading
          )}
        >
          {t("aibIdeaDesktopP1")}
        </p>
        <p
          className={cn(
            "m-0 text-balance",
            FE_TYPOGRAPHY.body,
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
            linkHref={card.linkHref}
          >
            {card.content}
          </FutureEvalIdeaCard>
        ))}
      </div>
    </div>
  );
};

/**
 * FutureEval-specific idea card
 */
type IdeaCardProps = PropsWithChildren<{
  icon: IconDefinition;
  title?: string;
  linkHref?: string;
}>;

const FutureEvalIdeaCard: React.FC<IdeaCardProps> = ({
  icon,
  title,
  linkHref,
  children,
}) => {
  return (
    <div className="flex flex-1 flex-col items-start">
      <FontAwesomeIcon
        className={cn("text-[26px]", FE_COLORS.textAccent)}
        icon={icon}
      />
      <h4
        className={cn(
          "m-0 mt-5 antialiased",
          FE_TYPOGRAPHY.h4,
          FE_COLORS.textHeading
        )}
      >
        {title}
      </h4>
      <div
        className={cn("mt-2.5", FE_TYPOGRAPHY.body, FE_COLORS.textSubheading)}
      >
        {children}
      </div>
      {linkHref && (
        <Link
          href={linkHref}
          className={cn("mt-3", FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
        >
          Learn more
        </Link>
      )}
    </div>
  );
};

export default FutureEvalMethodologyContent;
