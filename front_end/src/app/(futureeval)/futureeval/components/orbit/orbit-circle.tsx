"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import OrbitAutoCarousel from "./orbit-auto-carousel";
import { OrbitItem } from "./orbit-constants";
import { getCarouselChips, getLinkInfo } from "./orbit-utils";
import { FE_COLORS } from "../../theme";

// ===========================================
// TYPES
// ===========================================

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
  className?: string;
  // Mobile-specific props
  isMobile?: boolean;
  isMobileExpanded?: boolean;
  onMobileClose?: () => void;
  onNavigate?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

// ===========================================
// MAIN COMPONENT
// ===========================================

/**
 * OrbitCircle - A circle that sits on the orbit and can expand to show details
 * Fills its container (sized by parent)
 *
 * Shadow color is controlled via CSS variable --orbit-shadow set on parent container
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

  // Shadow styles using CSS variable for theme-aware color
  const defaultShadowStyle = {
    boxShadow: `0 0 ${shadowBlur}px ${defaultSpread}px var(--orbit-shadow)`,
  };

  const expandedShadowStyle = {
    boxShadow: `0 0 ${shadowBlur}px ${expandedSpread}px var(--orbit-shadow)`,
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
        type="button"
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
        style={{
          borderWidth: strokeWidth,
          ...defaultShadowStyle,
          // GPU optimization to prevent text flicker during rotation
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      >
        <span
          className={cn(
            "whitespace-pre-line px-3 text-center font-newsreader text-sm font-normal leading-tight lg:text-lg",
            FE_COLORS.textPrimary
          )}
          style={{
            // Force GPU layer for text to stabilize anti-aliasing during counter-rotation
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
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
  const carouselChips = getCarouselChips(item.id);
  const linkInfo = getLinkInfo(item);

  // Handle link click for scroll actions
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.action?.type === "scroll") {
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
    const container = containerRef?.current;
    if (!container) return;

    const updateWidth = () => {
      setWidth(container.getBoundingClientRect().width * 0.9);
    };

    updateWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [containerRef]);

  const carouselChips = getCarouselChips(item.id);
  const linkInfo = getLinkInfo(item);

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose?.();
  };

  // Handle link click for scroll actions
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.action?.type === "scroll") {
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
      <Button
        variant="text"
        presentationType="icon"
        onClick={handleCloseClick}
        className={cn(
          "absolute right-2 top-2 !h-5 !w-5",
          "hover:bg-futureeval-bg-dark/10 dark:hover:bg-futureeval-bg-light/10",
          FE_COLORS.textMuted
        )}
        aria-label="Close"
      >
        <FontAwesomeIcon icon={faXmark} className="text-sm" />
      </Button>

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
