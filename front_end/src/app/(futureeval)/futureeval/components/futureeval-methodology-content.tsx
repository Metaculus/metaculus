"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChartSimple,
  faTrophy,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

/**
 * FutureEval-specific methodology content without the main title.
 * Uses Newsreader serif fonts for headings and sans-serif for body text,
 * with FutureEval theme colors (green accents, dark/light backgrounds).
 */
const FutureEvalMethodologyContent: React.FC = () => {
  const CARDS = [
    {
      icon: faChartSimple,
      title: "Model Leaderboard",
      linkHref: "/futureeval/methodology#model-leaderboard",
      content: (
        <p>
          We run all major AI models with a simple prompt on most open Metaculus
          forecasting questions. As questions resolve, we score the
          models&apos; forecasts and continuously update our leaderboard to rank
          them against each other. We also track performance trends over time to
          visualize how fast AI forecasting ability is improving.
        </p>
      ),
    },
    {
      icon: faTrophy,
      title: "Bots Tournament",
      linkHref: "/aib/2026/spring/",
      content: (
        <p>
          We run open tournaments where developers enter AI-powered forecasting
          bots to compete for a share of $175k in prizes. Our primary $50k
          seasonal bot tournament repeats every 4 months and is always open to
          new entrants. We also run a fast-feedback $1k tournament every 2 weeks
          called MiniBench.
        </p>
      ),
    },
    {
      icon: faUsers,
      title: "Human Baseline",
      linkHref: "/futureeval/methodology#human-baselines",
      content: (
        <p>
          Some of the questions in the Bot Tournaments come from Metaculus,
          where our community competes to make predictions. Our hand-picked{" "}
          <a
            href="https://www.metaculus.com/services/pro-forecasters/"
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
          >
            Pro Forecasters
          </a>{" "}
          also provide predictions on a set of questions. This gives two
          high-quality baselines each season, allowing us to publish an analysis
          comparing AI performance to the best human-made forecasts.
        </p>
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
          FutureEval measures AI&apos;s ability to predict future outcomes,
          which is essential in many real-world tasks. Models that score high in
          our benchmark will be better at planning, risk assessment, and
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
          aria-label={`Learn more about ${title}`}
        >
          Learn more
        </Link>
      )}
    </div>
  );
};

export default FutureEvalMethodologyContent;
