"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

const FutureEvalLeaderboardHero: React.FC = () => {
  const t = useTranslations();

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
        {t("aibLbTitle")}
      </h1>

      {/* Subtitle - left aligned on desktop, centered on mobile */}
      <p
        className={cn(
          "m-0 mt-3 text-center sm:text-left",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        {t("aibLbSubtitle")}
      </p>
    </div>
  );
};

export default FutureEvalLeaderboardHero;
