"use client";

import { useRouter } from "next/navigation";
import React, { useState, useCallback, useRef, useEffect } from "react";

import cn from "@/utils/core/cn";

import MetaculusHub from "./metaculus-hub";
import OrbitCircle, { OrbitItem, useThemeShadowColor } from "./orbit-circle";

// ===========================================
// CONFIGURATION
// ===========================================

/**
 * Rotation speed in degrees per second
 * Set to 0 to disable rotation
 */
export const ORBIT_ROTATION_SPEED: number = 4; // degrees per second

/**
 * Calculate the CSS animation duration for a full rotation
 * 360 degrees / speed = seconds for full rotation
 */
const ORBIT_ANIMATION_DURATION =
  ORBIT_ROTATION_SPEED > 0 ? 360 / ORBIT_ROTATION_SPEED : 0;

/**
 * The orbit items data
 */
const ORBIT_ITEMS: OrbitItem[] = [
  {
    id: "model-benchmark",
    label: "Model\nBenchmark",
    description:
      "Latest models forecast Metaculus questions and scored against best human and AI forecasters",
    action: {
      type: "scroll",
      target: "model-leaderboard",
    },
  },
  {
    id: "bot-tournaments",
    label: "Bot\nTournaments",
    description:
      "Seasonal forecasting tournaments where the best bot makers compete",
    action: {
      type: "tab-scroll",
      target: "tournaments",
      tabHref: "/futureeval/methodology",
    },
  },
  {
    id: "minibench",
    label: "MiniBench",
    description:
      "Automated question set, quick turnaround space for testing and rapid iteration for bot makers",
    action: {
      type: "navigate",
      target: "/aib/minibench/",
    },
  },
];

// ===========================================
// SIZING CONFIGURATION
// ===========================================
// All values are percentages relative to the container size
// This ensures the orbit scales proportionally

export const ORBIT_CONFIG = {
  // Orbit ring diameter as % of container
  orbitDiameter: 75,
  // Circle size as % of container
  circleSize: 30,
  // Starting angle for first circle (Model Benchmark at upper-left)
  // Using CSS coordinate system where 0° = right, positive = clockwise
  startAngle: 135,
  // Angle increment between circles (negative = counter-clockwise)
  angleIncrement: -120,
  // Stroke width for orbit ring and circle borders (in pixels)
  strokeWidth: 2,
  // Drop shadow for orbit circles
  // Uses theme background color for a subtle glow effect
  shadow: {
    blur: 20, // px - how soft/spread the shadow edges are
    spread: 24, // px - how far the shadow extends (desktop)
    mobileSpreadRatio: 0.5, // Mobile uses this ratio of spread (50%)
    expandedSpreadRatio: 0.5, // Expanded uses this ratio of spread (50%)
  },
};

// ===========================================
// COMPONENT
// ===========================================

type FutureEvalOrbitProps = {
  className?: string;
};

/**
 * FutureEvalOrbit - Orbit visualization with rotating circles
 * Works on both desktop and mobile
 * On mobile (touch devices): tap expands the item, showing close button to dismiss
 * On desktop: hover to expand, click to navigate
 */
const FutureEvalOrbit: React.FC<FutureEvalOrbitProps> = ({ className }) => {
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(
    null
  );
  // Use hover capability detection instead of touch detection
  // This properly handles laptops with touchscreens using a mouse
  const [hasHover, setHasHover] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Get shadow color once at the parent level (avoids creating MutationObserver per OrbitCircle)
  const shadowColor = useThemeShadowColor();

  // Detect hover capability using media query (more reliable than touch detection)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Pause animation when an item is expanded
  const isPaused = expandedItem !== null || mobileExpandedItem !== null;

  // Handle item click actions
  const handleItemClick = useCallback(
    (item: OrbitItem) => {
      switch (item.action.type) {
        case "scroll": {
          const element = document.getElementById(item.action.target);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          break;
        }
        case "tab-scroll":
          if (item.action.tabHref) {
            router.push(`${item.action.tabHref}#${item.action.target}`);
          }
          break;
        case "navigate":
          router.push(item.action.target);
          break;
      }
    },
    [router]
  );

  // Handle mobile tap - expand instead of navigate
  const handleMobileTap = useCallback((item: OrbitItem) => {
    setMobileExpandedItem(item.id);
  }, []);

  // Handle mobile close - return to default state
  const handleMobileClose = useCallback(() => {
    setMobileExpandedItem(null);
  }, []);

  // Calculate circle position as percentage offsets from center (static positions)
  // The actual rotation animation is handled by CSS for maximum smoothness
  const getCirclePosition = useCallback((index: number) => {
    const angle = ORBIT_CONFIG.startAngle + index * ORBIT_CONFIG.angleIncrement;
    const angleInRad = (angle * Math.PI) / 180;
    // Position is percentage of container, orbit radius is half of orbit diameter
    const radius = ORBIT_CONFIG.orbitDiameter / 2;
    const x = Math.cos(angleInRad) * radius;
    const y = Math.sin(angleInRad) * radius;
    return { x, y };
  }, []);

  // Handle click on container background (mobile: close expanded item)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks directly on the container (not bubbled from children)
      if (e.target === e.currentTarget && !hasHover && mobileExpandedItem) {
        setMobileExpandedItem(null);
      }
    },
    [hasHover, mobileExpandedItem]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full", className)}
      onClick={handleContainerClick}
    >
      {/* Mobile backdrop with 75% opacity overlay - closes expanded item when tapped */}
      {/* Extends beyond container to cover orbit circles that may extend outside */}
      {/* z-index must be lower than expanded items (z-50) but covers other content */}
      {!hasHover && mobileExpandedItem && (
        <div
          className="absolute bg-futureeval-bg-light/75 dark:bg-futureeval-bg-dark/75"
          style={{
            // Extend 15% beyond container on all sides to cover protruding circles
            top: "-10%",
            left: "-10%",
            right: "-10%",
            bottom: "-10%",
            zIndex: 45,
          }}
          onClick={() => setMobileExpandedItem(null)}
          aria-hidden="true"
        />
      )}

      {/* Orbit ring - centered in container */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "rounded-full",
          "border-futureeval-primary-light dark:border-futureeval-primary-dark"
        )}
        style={{
          width: `${ORBIT_CONFIG.orbitDiameter}%`,
          height: `${ORBIT_CONFIG.orbitDiameter}%`,
          borderWidth: ORBIT_CONFIG.strokeWidth,
        }}
      />

      {/* Central hub - centered in container */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <MetaculusHub />
      </div>

      {/* Rotating orbit group - CSS animation for smooth GPU-accelerated rotation */}
      <div
        className="absolute inset-0"
        style={{
          animation:
            ORBIT_ANIMATION_DURATION > 0
              ? `orbit-rotate ${ORBIT_ANIMATION_DURATION}s linear infinite`
              : "none",
          animationPlayState: isPaused ? "paused" : "running",
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      >
        {ORBIT_ITEMS.map((item, index) => {
          const pos = getCirclePosition(index);
          const isItemExpanded =
            expandedItem === item.id || mobileExpandedItem === item.id;
          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                // Position using left/top (percentages relative to container)
                left: `calc(50% + ${pos.x}%)`,
                top: `calc(50% + ${pos.y}%)`,
                // Center the circle
                transform: "translate(-50%, -50%)",
                // Expanded items get higher z-index (above backdrop z-45)
                zIndex: isItemExpanded ? 50 : 10,
                // Circle size as percentage of container
                width: `${ORBIT_CONFIG.circleSize}%`,
                height: `${ORBIT_CONFIG.circleSize}%`,
              }}
            >
              {/* Counter-rotation wrapper - CSS animation perfectly synced with parent */}
              <div
                className="h-full w-full"
                style={{
                  animation:
                    ORBIT_ANIMATION_DURATION > 0
                      ? `orbit-counter-rotate ${ORBIT_ANIMATION_DURATION}s linear infinite`
                      : "none",
                  animationPlayState: isPaused ? "paused" : "running",
                  willChange: "transform",
                }}
              >
                <OrbitCircle
                  item={item}
                  isExpanded={hasHover && expandedItem === item.id}
                  onMouseEnter={() => hasHover && setExpandedItem(item.id)}
                  onMouseLeave={() => hasHover && setExpandedItem(null)}
                  onClick={
                    hasHover
                      ? () => handleItemClick(item)
                      : () => handleMobileTap(item)
                  }
                  strokeWidth={ORBIT_CONFIG.strokeWidth}
                  shadowBlur={ORBIT_CONFIG.shadow.blur}
                  shadowSpread={ORBIT_CONFIG.shadow.spread}
                  mobileSpreadRatio={ORBIT_CONFIG.shadow.mobileSpreadRatio}
                  expandedSpreadRatio={ORBIT_CONFIG.shadow.expandedSpreadRatio}
                  shadowColor={shadowColor}
                  isMobile={!hasHover}
                  isMobileExpanded={!hasHover && mobileExpandedItem === item.id}
                  onMobileClose={handleMobileClose}
                  onNavigate={() => handleItemClick(item)}
                  containerRef={containerRef}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FutureEvalOrbit;
