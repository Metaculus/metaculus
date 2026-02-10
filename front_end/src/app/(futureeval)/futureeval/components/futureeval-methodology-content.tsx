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
          forecasting questions. As questions resolve, we score the models&apos;
          forecasts and continuously update our leaderboard to rank them against
          each other. We also track performance trends over time to visualize
          how fast AI forecasting ability is improving.
        </p>
      ),
    },
    {
      icon: faTrophy,
      title: "Bot Tournaments",
      linkHref: "/futureeval/participate",
      content: (
        <p>
          We run open tournaments where developers enter AI-powered forecasting
          bots to compete for a share of $175k in prizes yearly. Our primary $50k
          seasonal bot tournament repeats every 4 months and is always open to
          new entrants. We also run a fast-feedback $1k tournament every 2 weeks
          called MiniBench.
        </p>
      ),
    },
    {
      icon: faUsers,
      title: "Human Baselines",
      linkHref: "/futureeval/methodology#human-baselines",
      content: (
        <p>
          Some questions in the Bot Tournaments come from Metaculus&apos;
          platform, where our community competes to make predictions. Our
          hand-picked{" "}
          <a
            href="https://www.metaculus.com/services/pro-forecasters/"
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
          >
            Pro Forecasters
          </a>{" "}
          also provide predictions on a set of questions. This gives two
          high-quality baselines each season, allowing us to publish an analysis
          comparing AI to the best humans.
        </p>
      ),
    },
  ] as const;

  return (
    <div className="space-y-8 sm:space-y-[56px] md:space-y-16">
      {/* Hero headline */}
      <h1
        className={cn(
          "m-0 mx-auto max-w-3xl text-center",
          FE_TYPOGRAPHY.h1,
          FE_COLORS.textHeading
        )}
      >
        Predicting the future is one of the few ways to evaluate{" "}
        <span className={FE_COLORS.textAccent}>reasoning against reality.</span>
      </h1>

      {/* Description paragraph */}
      <p
        className={cn(
          "m-0 mx-auto max-w-[840px] text-balance text-center antialiased",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        Making predictions is key to planning and decision making. It requires
        context and information retrieval, implicit and explicit world
        modelling, reasoning under uncertainty, and good judgement. It&apos;s
        also guaranteed leak-proof, since the ground truth is not yet known when
        the models are evaluated. FutureEval measures AI forecasting accuracy
        based on three pillars.
      </p>

      <div className="mx-auto flex max-w-5xl flex-col gap-14 lg:flex-row lg:justify-center">
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
      <div className="flex items-center gap-3">
        <FontAwesomeIcon
          className={cn("text-xl", FE_COLORS.textAccent)}
          icon={icon}
        />
        <h4
          className={cn(
            "m-0 antialiased",
            FE_TYPOGRAPHY.h4,
            FE_COLORS.textHeading
          )}
        >
          {title}
        </h4>
      </div>
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
