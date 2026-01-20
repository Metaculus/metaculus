"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faBrain, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

/**
 * FutureEval-specific methodology content without the main title.
 * Uses monospace fonts and FutureEval theme colors.
 */
const FutureEvalMethodologyContent: React.FC = () => {
  const CARDS = [
    {
      icon: faCircleDot,
      title: "Model Leaderboard",
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-is-the-model-leaderboard",
      content: (
        <>
          <p>
            We run all major models with a simple prompt on most open Metaculus
            forecasting questions, and collect their forecasts. As questions
            resolve, we score the models&apos; forecasts and continuously update our
            leaderboard to rank them against each other. We also plot trends in
            model release date and score over time.
          </p>
        </>
      ),
    },
    {
      icon: faBullseye,
      title: "Bots vs Humans",
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-do-the-tournaments-look-like",
      content: (
        <>
          <p>
            We also run seasonal and biweekly Benchmarking Tournaments with
            $175k in combined prizes. They are open to all, and the best
            scaffold builders compete to share the prize pool in proportion to
            their bot&apos;s accuracy. Some of the forecasting questions are also
            submitted to our top human forecasters, allowing a direct
            comparison.
          </p>
        </>
      ),
    },
    {
      icon: faBrain,
      title: "Reasoning Beyond Memorization",
      linkHref:
        "/notebooks/38928/futureeval-resources-page/#what-is-unique-about-futureeval",
      content: (
        <>
          <p>
            Our diverse question topics range from economics, politics, tech,
            sports, war, elections, society, and more. It forces models to
            generalize beyond memorization on actively evolving interdisciplinary
            domains relevant to the world. This correlates with skill in
            long-term planning and decision-making.
          </p>
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
          FutureEval measures AI&apos;s ability to predict future outcomes, which is
          essential in many real-world tasks. Models that score high in our
          benchmark will be better at planning, risk assessment, and
          decision-making. FutureEval is guaranteed leak-proof, since answers
          are not known yet at test time.
        </p>
        <p
          className={cn(
            "m-0 text-balance",
            FE_TYPOGRAPHY.body,
            FE_COLORS.textSubheading
          )}
        >
          FutureEval has two arms: a fixed-prompt benchmark to compare model
          performance directly, and a bots vs. humans tournament to probe the
          frontier of scaffolding.
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
