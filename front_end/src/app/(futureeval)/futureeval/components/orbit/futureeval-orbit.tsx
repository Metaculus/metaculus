"use client";

import { useRouter } from "next/navigation";
import React, { useState, useCallback, useRef, useEffect } from "react";

import cn from "@/utils/core/cn";

import MetaculusHub from "./metaculus-hub";
import OrbitCircle from "./orbit-circle";
import {
  ORBIT_ANIMATION_DURATION,
  ORBIT_CONFIG,
  ORBIT_ITEMS,
  OrbitItem,
} from "./orbit-constants";

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
  // Reduced motion preference for accessibility
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Detect hover capability using media query (more reliable than touch detection)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Detect reduced motion preference for accessibility
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Clear mobile expanded state when hover becomes available
  // Prevents orbit from staying paused with leftover mobileExpandedItem
  useEffect(() => {
    if (hasHover) {
      setMobileExpandedItem(null);
    }
  }, [hasHover]);

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
      className={cn(
        "relative aspect-square w-full",
        // CSS variable for theme-aware shadow color (using Tailwind arbitrary properties)
        "[--orbit-shadow:#FBFFFC] dark:[--orbit-shadow:#030C07]",
        className
      )}
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
            ORBIT_ANIMATION_DURATION > 0 && !prefersReducedMotion
              ? `orbit-rotate ${ORBIT_ANIMATION_DURATION}s linear infinite`
              : "none",
          animationPlayState: isPaused ? "paused" : "running",
          transformOrigin: "50% 50%",
          willChange: prefersReducedMotion ? "auto" : "transform",
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
                    ORBIT_ANIMATION_DURATION > 0 && !prefersReducedMotion
                      ? `orbit-counter-rotate ${ORBIT_ANIMATION_DURATION}s linear infinite`
                      : "none",
                  animationPlayState: isPaused ? "paused" : "running",
                  willChange: prefersReducedMotion ? "auto" : "transform",
                  // 3D context + backface hidden for smoother text rendering during counter-rotation
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
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
