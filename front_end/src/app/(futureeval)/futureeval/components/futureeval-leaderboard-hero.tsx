"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";
import FutureEvalComingSoonBanner from "./futureeval-coming-soon-banner";

type Props = {
  upcomingModels: string[];
};

const FutureEvalLeaderboardHero: React.FC<Props> = ({ upcomingModels }) => {
  return (
    <div className="mb-6 flex flex-col antialiased sm:mb-10">
      {/* Back button - FutureEval branded */}
      <div className="mb-6 sm:mb-10">
        <Button
          variant="tertiary"
          size="sm"
          href="/futureeval"
          className={cn(
            "gap-2 border",
            FE_COLORS.borderPrimary,
            FE_COLORS.textAccent,
            "hover:opacity-80"
          )}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          FutureEval
        </Button>
      </div>

      {/* Title - left aligned on desktop, centered on mobile */}
      <h1
        className={cn(
          "m-0 text-center sm:text-left",
          FE_TYPOGRAPHY.h1,
          FE_COLORS.textHeading
        )}
      >
        Model Leaderboard
      </h1>

      {/* Subtitle row - two column layout */}
      <div className="mt-3 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <div className="text-center sm:text-left">
          <p
            className={cn("m-0", FE_TYPOGRAPHY.body, FE_COLORS.textSubheading)}
          >
            Updated every day based on our standardized forecasting performance
            measurement methodology.
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <FutureEvalComingSoonBanner models={upcomingModels} />
        </div>
      </div>
    </div>
  );
};

export default FutureEvalLeaderboardHero;
