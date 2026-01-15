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
export const ORBIT_ROTATION_SPEED = 4; // degrees per second

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
  circleSize: 28,
  // Starting angle for first circle (Model Benchmark at upper-left)
  // Using CSS coordinate system where 0° = right, positive = clockwise
  startAngle: 135,
  // Angle increment between circles (negative = counter-clockwise)
  angleIncrement: -120,
  // Stroke width for orbit ring and circle borders (in pixels)
  strokeWidth: 2,
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
 * On mobile (touch devices), expanded states are disabled - tap goes directly to action
 */
const FutureEvalOrbit: React.FC<FutureEvalOrbitProps> = ({ className }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

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

      // Only rotate if not hovered and no item is expanded
      if (!isHovered && !expandedItem) {
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
  }, [isHovered, expandedItem]);

  // Handle item click actions
  const handleItemClick = useCallback(
    (item: OrbitItem) => {
      switch (item.action.type) {
        case "scroll":
          const element = document.getElementById(item.action.target);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          break;
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

  return (
    <div
      className={cn("relative aspect-square w-full", className)}
      onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => {
        if (!isTouchDevice) {
          setIsHovered(false);
          setExpandedItem(null);
        }
      }}
    >
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
              zIndex: expandedItem === item.id ? 50 : 10,
              // Circle size as percentage of container
              width: `${ORBIT_CONFIG.circleSize}%`,
              height: `${ORBIT_CONFIG.circleSize}%`,
            }}
          >
            <OrbitCircle
              item={item}
              isExpanded={!isTouchDevice && expandedItem === item.id}
              isHoveredParent={!isTouchDevice && isHovered}
              onMouseEnter={() => !isTouchDevice && setExpandedItem(item.id)}
              onMouseLeave={() => {}}
              onClick={() => handleItemClick(item)}
              strokeWidth={ORBIT_CONFIG.strokeWidth}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FutureEvalOrbit;
