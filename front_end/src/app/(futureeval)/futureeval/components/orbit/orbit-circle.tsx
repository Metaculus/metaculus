"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";

import anthropicDark from "@/app/(main)/aib/assets/ai-models/anthropic-black.png";
import anthropicLight from "@/app/(main)/aib/assets/ai-models/anthropic-white.webp";
import googleLight from "@/app/(main)/aib/assets/ai-models/google.svg?url";
import openaiLight from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openaiDark from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import xLight from "@/app/(main)/aib/assets/ai-models/x.svg?url";
import xDark from "@/app/(main)/aib/assets/ai-models/x_dark.svg?url";
import cn from "@/utils/core/cn";

import OrbitAutoCarousel, { CarouselChip } from "./orbit-auto-carousel";
import { FE_COLORS, FE_RAW_COLORS } from "../../theme";

// ===========================================
// THEME-AWARE SHADOW HOOK
// ===========================================

/**
 * Hook to get the correct shadow color based on the actual DOM state.
 * This avoids hydration mismatches by checking the document's dark class
 * after mount, and also listens for changes.
 *
 * NOTE: This hook should be called once in the parent (Orbit) and the
 * shadowColor passed down as a prop to avoid creating multiple MutationObservers.
 */
export function useThemeShadowColor() {
  const [shadowColor, setShadowColor] = React.useState<string>(
    FE_RAW_COLORS.light.background
  );

  React.useEffect(() => {
    // Function to determine shadow color from document state
    const updateShadowColor = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setShadowColor(
        isDark ? FE_RAW_COLORS.dark.background : FE_RAW_COLORS.light.background
      );
    };

    // Initial check
    updateShadowColor();

    // Watch for class changes on document element (theme toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateShadowColor();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return shadowColor;
}

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
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  strokeWidth?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  mobileSpreadRatio?: number;
  expandedSpreadRatio?: number;
  shadowColor: string;
  className?: string;
  // Mobile-specific props
  isMobile?: boolean;
  isMobileExpanded?: boolean;
  onMobileClose?: () => void;
  onNavigate?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
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
  { id: "credits", label: "Complimentary AI credits provided" },
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
  onMouseEnter,
  onMouseLeave,
  onClick,
  strokeWidth = 1,
  shadowBlur = 20,
  shadowSpread = 24,
  mobileSpreadRatio = 0.5,
  expandedSpreadRatio = 0.5,
  shadowColor,
  className,
  isMobile = false,
  isMobileExpanded = false,
  onMobileClose,
  onNavigate,
  containerRef,
}) => {
  const circleRef = React.useRef<HTMLDivElement>(null);

  // Calculate shadow spread values using configurable ratios:
  // - Mobile default: uses mobileSpreadRatio of original spread
  // - Desktop default: 100% of original spread
  // - Expanded (both): uses expandedSpreadRatio of original spread
  const defaultSpread = isMobile
    ? shadowSpread * mobileSpreadRatio
    : shadowSpread;
  const expandedSpread = shadowSpread * expandedSpreadRatio;

  // Default shadow for the circle
  const defaultShadowStyle = {
    boxShadow: `0 0 ${shadowBlur}px ${defaultSpread}px ${shadowColor}`,
  };

  // Expanded shadow (smaller spread) for the expanded card
  const expandedShadowStyle = {
    boxShadow: `0 0 ${shadowBlur}px ${expandedSpread}px ${shadowColor}`,
  };

  // Show expanded card for either desktop hover or mobile tap
  const showExpanded = isExpanded || isMobileExpanded;

  // Desktop expanded card renders inline, mobile uses portal to escape rotation context
  const desktopExpandedCard = isExpanded && !isMobileExpanded && (
    <ExpandedCard
      item={item}
      onClick={onNavigate || onClick}
      strokeWidth={strokeWidth}
      shadowStyle={expandedShadowStyle}
    />
  );

  // Mobile expanded card rendered via portal to container (outside rotating context)
  const mobileExpandedCard =
    isMobileExpanded &&
    containerRef?.current &&
    createPortal(
      <MobileExpandedCard
        item={item}
        onClick={onNavigate || onClick}
        strokeWidth={strokeWidth}
        shadowStyle={expandedShadowStyle}
        onClose={onMobileClose}
        containerRef={containerRef}
      />,
      containerRef.current
    );

  return (
    <div
      ref={circleRef}
      className={cn("relative h-full w-full", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* The circle itself - fills container */}
      <button
        onClick={onClick}
        tabIndex={showExpanded ? -1 : 0}
        aria-hidden={showExpanded}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full transition-all duration-200",
          "cursor-pointer select-none",
          "border-futureeval-primary-light dark:border-futureeval-primary-dark",
          FE_COLORS.orbitCircleBg,
          // Hide circle when expanded and remove from interaction
          showExpanded && "pointer-events-none opacity-0"
        )}
        style={{ borderWidth: strokeWidth, ...defaultShadowStyle }}
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

      {/* Desktop expanded card - rendered inline */}
      {desktopExpandedCard}

      {/* Mobile expanded card - rendered via portal outside rotating context */}
      {mobileExpandedCard}
    </div>
  );
};

// ===========================================
// EXPANDED CARD (Desktop - rendered inline)
// ===========================================

type ExpandedCardProps = {
  item: OrbitItem;
  onClick: () => void;
  strokeWidth: number;
  shadowStyle: React.CSSProperties;
};

const ExpandedCard: React.FC<ExpandedCardProps> = ({
  item,
  onClick,
  strokeWidth,
  shadowStyle,
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

  // Get the link text and href based on item type
  const getLinkInfo = (): { text: string; href: string } | null => {
    switch (item.id) {
      case "model-benchmark":
        return { text: "View Leaderboard →", href: `#${item.action.target}` };
      case "bot-tournaments":
        return {
          text: "View Tournaments →",
          href: `${item.action.tabHref}#${item.action.target}`,
        };
      case "minibench":
        return { text: "Visit MiniBench →", href: item.action.target };
      default:
        return null;
    }
  };

  const linkInfo = getLinkInfo();

  // Handle link click for scroll actions
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.action.type === "scroll") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "absolute rounded-lg p-3",
        FE_COLORS.orbitCircleBg,
        "border-futureeval-primary-light dark:border-futureeval-primary-dark",
        "z-50 cursor-default select-none text-center"
      )}
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        minWidth: 200,
        maxWidth: 240,
        borderWidth: strokeWidth,
        ...shadowStyle,
      }}
    >
      {/* Title */}
      <h4
        className={cn(
          "m-0 font-newsreader text-lg font-normal",
          FE_COLORS.textPrimary
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

      {/* Action link */}
      {linkInfo && (
        <Link
          href={linkInfo.href}
          className={cn(
            "mt-3 inline-block cursor-pointer font-sans text-xs",
            FE_COLORS.textAccent,
            "underline underline-offset-2 transition-opacity hover:opacity-80"
          )}
          onClick={handleLinkClick}
        >
          {linkInfo.text}
        </Link>
      )}
    </div>
  );
};

// ===========================================
// MOBILE EXPANDED CARD (rendered via portal)
// ===========================================

type MobileExpandedCardProps = {
  item: OrbitItem;
  onClick: () => void;
  strokeWidth: number;
  shadowStyle: React.CSSProperties;
  onClose?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

const MobileExpandedCard: React.FC<MobileExpandedCardProps> = ({
  item,
  onClick,
  strokeWidth,
  shadowStyle,
  onClose,
  containerRef,
}) => {
  const [width, setWidth] = React.useState(240);

  // Calculate 90% of container width
  React.useEffect(() => {
    if (!containerRef?.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setWidth(containerRect.width * 0.9);
  }, [containerRef]);

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

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose?.();
  };

  // Get the link text and href based on item type
  const getLinkInfo = (): { text: string; href: string } | null => {
    switch (item.id) {
      case "model-benchmark":
        return { text: "View Leaderboard →", href: `#${item.action.target}` };
      case "bot-tournaments":
        return {
          text: "View Tournaments →",
          href: `${item.action.tabHref}#${item.action.target}`,
        };
      case "minibench":
        return { text: "Visit MiniBench →", href: item.action.target };
      default:
        return null;
    }
  };

  const linkInfo = getLinkInfo();

  // Handle link click for scroll actions
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.action.type === "scroll") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "absolute rounded-lg p-3",
        FE_COLORS.orbitCircleBg,
        "border-futureeval-primary-light dark:border-futureeval-primary-dark",
        "cursor-default select-none text-center"
      )}
      style={{
        // Centered in the container (portaled directly to container)
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width,
        borderWidth: strokeWidth,
        // z-index must be above backdrop (z-45) and rotating group (z-46)
        zIndex: 50,
        ...shadowStyle,
      }}
    >
      {/* Close button */}
      <div className="absolute right-2 top-2">
        <button
          type="button"
          onClick={handleCloseClick}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full transition-colors",
            "hover:bg-futureeval-bg-dark/10 dark:hover:bg-futureeval-bg-light/10"
          )}
          aria-label="Close"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className={cn("text-sm", FE_COLORS.textMuted)}
          />
        </button>
      </div>

      {/* Title */}
      <h4
        className={cn(
          "m-0 px-6 font-newsreader text-lg font-normal",
          FE_COLORS.textPrimary
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

      {/* Action link */}
      {linkInfo && (
        <Link
          href={linkInfo.href}
          className={cn(
            "mt-3 inline-block cursor-pointer font-sans text-xs",
            FE_COLORS.textAccent,
            "underline underline-offset-2 transition-opacity hover:opacity-80"
          )}
          onClick={handleLinkClick}
        >
          {linkInfo.text}
        </Link>
      )}
    </div>
  );
};

export default OrbitCircle;
