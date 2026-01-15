"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";

import anthropicDark from "@/app/(main)/aib/assets/ai-models/anthropic-black.png";
import anthropicLight from "@/app/(main)/aib/assets/ai-models/anthropic-white.webp";
import googleLight from "@/app/(main)/aib/assets/ai-models/google.svg?url";
import openaiLight from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openaiDark from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import xLight from "@/app/(main)/aib/assets/ai-models/x.svg?url";
import xDark from "@/app/(main)/aib/assets/ai-models/x_dark.svg?url";
import cn from "@/utils/core/cn";

import OrbitAutoCarousel, { CarouselChip } from "./orbit-auto-carousel";
import { FE_COLORS } from "../../theme";

export type OrbitItem = {
  id: string;
  label: string;
  description: string;
  action: {
    type: "scroll" | "navigate" | "tab-scroll";
    target: string;
    tabHref?: string;
  };
};

type OrbitCircleProps = {
  item: OrbitItem;
  isExpanded: boolean;
  isHoveredParent: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  strokeWidth?: number;
  className?: string;
};

// ===========================================
// CAROUSEL DATA
// ===========================================

/**
 * Top models to show in the Model Benchmark carousel
 * Hardcoded based on typical top performers
 */
const MODEL_BENCHMARK_CHIPS: CarouselChip[] = [
  {
    id: "o3",
    label: "o3",
    iconLight: openaiLight as unknown as string,
    iconDark: openaiDark as unknown as string,
  },
  {
    id: "grok-3",
    label: "Grok 3",
    iconLight: xLight as unknown as string,
    iconDark: xDark as unknown as string,
  },
  {
    id: "gemini",
    label: "Gemini",
    iconLight: googleLight as unknown as string,
  },
  {
    id: "claude",
    label: "Claude",
    iconLight: anthropicLight.src,
    iconDark: anthropicDark.src,
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    iconLight: openaiLight as unknown as string,
    iconDark: openaiDark as unknown as string,
  },
  {
    id: "grok-4",
    label: "Grok 4",
    iconLight: xLight as unknown as string,
    iconDark: xDark as unknown as string,
  },
];

/**
 * Bot Tournaments carousel shows prize/credit info
 */
const BOT_TOURNAMENTS_CHIPS: CarouselChip[] = [
  { id: "prizes", label: "$240k paid in prizes" },
  { id: "credits", label: "Complementary AI credits provided" },
];

// ===========================================
// MAIN COMPONENT
// ===========================================

/**
 * OrbitCircle - A circle that sits on the orbit and can expand to show details
 * Fills its container (sized by parent)
 */
const OrbitCircle: React.FC<OrbitCircleProps> = ({
  item,
  isExpanded,
  isHoveredParent,
  onMouseEnter,
  onMouseLeave,
  onClick,
  strokeWidth = 1,
  className,
}) => {
  return (
    <div
      className={cn("relative h-full w-full", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* The circle itself - fills container */}
      <button
        onClick={onClick}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full transition-all duration-200",
          "cursor-pointer select-none",
          "border-futureeval-primary-light dark:border-futureeval-primary-dark",
          // Use solid colors - hover color hides the orbit ring behind
          isHoveredParent && !isExpanded
            ? FE_COLORS.orbitCircleHoverBg
            : FE_COLORS.orbitCircleBg,
          // Hide circle when expanded
          isExpanded && "opacity-0"
        )}
        style={{ borderWidth: strokeWidth }}
      >
        <span
          className={cn(
            "whitespace-pre-line px-1 text-center font-newsreader text-base font-normal leading-tight md:text-sm lg:text-lg",
            FE_COLORS.textPrimary
          )}
        >
          {item.label}
        </span>
      </button>

      {/* Expanded state card */}
      {isExpanded && (
        <ExpandedCard item={item} onClick={onClick} strokeWidth={strokeWidth} />
      )}
    </div>
  );
};

// ===========================================
// EXPANDED CARD
// ===========================================

type ExpandedCardProps = {
  item: OrbitItem;
  onClick: () => void;
  strokeWidth: number;
};

const ExpandedCard: React.FC<ExpandedCardProps> = ({
  item,
  onClick,
  strokeWidth,
}) => {
  // Get carousel chips based on item type
  const getCarouselChips = (): CarouselChip[] => {
    if (item.id === "model-benchmark") {
      return MODEL_BENCHMARK_CHIPS;
    }
    if (item.id === "bot-tournaments") {
      return BOT_TOURNAMENTS_CHIPS;
    }
    return [];
  };

  const carouselChips = getCarouselChips();

  const CardContent = (
    <div
      className={cn(
        "absolute rounded-lg p-3",
        FE_COLORS.orbitCircleBg,
        "border-futureeval-primary-light dark:border-futureeval-primary-dark",
        "z-50 shadow-lg"
      )}
      style={{
        // Position card centered on the circle
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        minWidth: 200,
        maxWidth: 240,
        borderWidth: strokeWidth,
      }}
    >
      {/* Arrow icon */}
      <div className="absolute right-2 top-2">
        <FontAwesomeIcon
          icon={faArrowRight}
          className={cn("text-xs", FE_COLORS.textMuted)}
        />
      </div>

      {/* Title - same font as non-expanded state */}
      <h4
        className={cn(
          "m-0 pr-4 font-newsreader text-lg font-normal",
          FE_COLORS.textAccent
        )}
      >
        {item.label.replace(/\n/g, " ")}
      </h4>

      {/* Description */}
      <p
        className={cn(
          "m-0 mt-1.5 font-sans text-xs leading-snug",
          FE_COLORS.textSecondary
        )}
      >
        {item.description}
      </p>

      {/* Auto-scrolling carousel */}
      {carouselChips.length > 0 && (
        <div className="mt-2.5">
          <OrbitAutoCarousel chips={carouselChips} speed={25} />
        </div>
      )}
    </div>
  );

  // For navigation actions, wrap in Link
  if (item.action.type === "navigate") {
    return (
      <Link href={item.action.target} className="contents">
        {CardContent}
      </Link>
    );
  }

  // For scroll actions, use button/div
  return (
    <div onClick={onClick} className="cursor-pointer">
      {CardContent}
    </div>
  );
};

export default OrbitCircle;
