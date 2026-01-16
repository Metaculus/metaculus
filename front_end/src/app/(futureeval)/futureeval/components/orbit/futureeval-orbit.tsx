"use client";

import { useRouter } from "next/navigation";
import React, { useState, useCallback, useRef, useEffect } from "react";

import cn from "@/utils/core/cn";

import MetaculusHub from "./metaculus-hub";
import OrbitCircle, { OrbitItem } from "./orbit-circle";

// ===========================================
// CONFIGURATION
// ===========================================

/**
 * Rotation speed in degrees per second
 * Set to 0 to disable rotation
 */
export const ORBIT_ROTATION_SPEED: number = 4; // degrees per second

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
  const [rotation, setRotation] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Animation loop
  useEffect(() => {
    if (ORBIT_ROTATION_SPEED === 0) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Only rotate if no item is expanded (desktop or mobile)
      if (!expandedItem && !mobileExpandedItem) {
        setRotation(
          (prev) => (prev + (ORBIT_ROTATION_SPEED * delta) / 1000) % 360
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [expandedItem, mobileExpandedItem]);

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

  // Calculate circle position as percentage offsets from center
  const getCirclePosition = (index: number) => {
    const angle =
      ORBIT_CONFIG.startAngle + index * ORBIT_CONFIG.angleIncrement + rotation;
    const angleInRad = (angle * Math.PI) / 180;
    // Position is percentage of container, orbit radius is half of orbit diameter
    const radius = ORBIT_CONFIG.orbitDiameter / 2;
    const x = Math.cos(angleInRad) * radius;
    const y = Math.sin(angleInRad) * radius;
    return { x, y };
  };

  // Handle click on container background (mobile: close expanded item)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks directly on the container (not bubbled from children)
      if (e.target === e.currentTarget && isTouchDevice && mobileExpandedItem) {
        setMobileExpandedItem(null);
      }
    },
    [isTouchDevice, mobileExpandedItem]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full", className)}
      onClick={handleContainerClick}
    >
      {/* Mobile backdrop with 75% opacity overlay - closes expanded item when tapped */}
      {/* Extends beyond container to cover orbit circles that may extend outside */}
      {isTouchDevice && mobileExpandedItem && (
        <div
          className="absolute z-40 bg-futureeval-bg-light/75 dark:bg-futureeval-bg-dark/75"
          style={{
            // Extend 15% beyond container on all sides to cover protruding circles
            top: "-10%",
            left: "-10%",
            right: "-10%",
            bottom: "-10%",
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

      {/* Orbit circles */}
      {ORBIT_ITEMS.map((item, index) => {
        const pos = getCirclePosition(index);
        return (
          <div
            key={item.id}
            className="absolute will-change-transform"
            style={{
              // Position using left/top (percentages relative to container)
              left: `calc(50% + ${pos.x}%)`,
              top: `calc(50% + ${pos.y}%)`,
              // Center the circle + force GPU acceleration for smooth animation
              transform: "translate3d(-50%, -50%, 0)",
              // Expanded items get higher z-index
              zIndex:
                expandedItem === item.id || mobileExpandedItem === item.id
                  ? 50
                  : 10,
              // Circle size as percentage of container
              width: `${ORBIT_CONFIG.circleSize}%`,
              height: `${ORBIT_CONFIG.circleSize}%`,
            }}
          >
            <OrbitCircle
              item={item}
              isExpanded={!isTouchDevice && expandedItem === item.id}
              onMouseEnter={() => !isTouchDevice && setExpandedItem(item.id)}
              onMouseLeave={() => !isTouchDevice && setExpandedItem(null)}
              onClick={
                isTouchDevice
                  ? () => handleMobileTap(item)
                  : () => handleItemClick(item)
              }
              strokeWidth={ORBIT_CONFIG.strokeWidth}
              shadowBlur={ORBIT_CONFIG.shadow.blur}
              shadowSpread={ORBIT_CONFIG.shadow.spread}
              mobileSpreadRatio={ORBIT_CONFIG.shadow.mobileSpreadRatio}
              expandedSpreadRatio={ORBIT_CONFIG.shadow.expandedSpreadRatio}
              isMobile={isTouchDevice}
              isMobileExpanded={isTouchDevice && mobileExpandedItem === item.id}
              onMobileClose={handleMobileClose}
              onNavigate={() => handleItemClick(item)}
              containerRef={containerRef}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FutureEvalOrbit;
