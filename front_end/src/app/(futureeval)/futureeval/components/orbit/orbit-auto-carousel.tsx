"use client";

import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS } from "../../theme";

// ===========================================
// TYPES
// ===========================================

export type CarouselChip = {
  id: string;
  label: string;
  iconLight?: string;
  iconDark?: string;
};

type OrbitAutoCarouselProps = {
  chips: CarouselChip[];
  /** Speed in pixels per second */
  speed?: number;
  className?: string;
};

// ===========================================
// AUTO-SCROLLING CAROUSEL
// ===========================================

/**
 * OrbitAutoCarousel - Infinite auto-scrolling carousel with fade gradients
 * Not user-interactable, purely decorative
 */
const OrbitAutoCarousel: React.FC<OrbitAutoCarouselProps> = ({
  chips,
  speed = 30,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const contentWidthRef = useRef<number>(0);

  // Measure content width and set up animation
  useEffect(() => {
    if (!containerRef.current) return;

    const measureWidth = () => {
      const container = containerRef.current;
      if (!container) return;
      const firstSet = container.querySelector("[data-carousel-set]");
      if (firstSet) {
        contentWidthRef.current = firstSet.scrollWidth;
      }
    };

    measureWidth();

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setOffset((prev) => {
        const newOffset = prev + (speed * delta) / 1000;
        // Reset when we've scrolled one full set width
        if (
          contentWidthRef.current > 0 &&
          newOffset >= contentWidthRef.current
        ) {
          return newOffset - contentWidthRef.current;
        }
        return newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed]);

  if (chips.length === 0) return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left fade gradient */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-10 h-full w-6",
          "bg-gradient-to-r",
          FE_COLORS.gradientFrom,
          "to-transparent"
        )}
      />

      {/* Right fade gradient */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-full w-6",
          "bg-gradient-to-l",
          FE_COLORS.gradientFrom,
          "to-transparent"
        )}
      />

      {/* Scrolling content */}
      <div
        ref={containerRef}
        className="flex will-change-transform"
        style={{
          transform: `translate3d(-${offset}px, 0, 0)`,
        }}
      >
        {/* First set - used for measurement */}
        <div data-carousel-set className="flex shrink-0 gap-1.5">
          {chips.map((chip, i) => (
            <CarouselChipItem key={`${chip.id}-0-${i}`} chip={chip} />
          ))}
        </div>
        {/* Additional sets for seamless loop */}
        <div className="flex shrink-0 gap-1.5 pl-1.5">
          {chips.map((chip, i) => (
            <CarouselChipItem key={`${chip.id}-1-${i}`} chip={chip} />
          ))}
        </div>
        <div className="flex shrink-0 gap-1.5 pl-1.5">
          {chips.map((chip, i) => (
            <CarouselChipItem key={`${chip.id}-2-${i}`} chip={chip} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// CHIP ITEM
// ===========================================

type CarouselChipItemProps = {
  chip: CarouselChip;
};

const CarouselChipItem: React.FC<CarouselChipItemProps> = ({ chip }) => {
  const hasIcon = chip.iconLight || chip.iconDark;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1",
        "bg-futureeval-bg-dark/10 dark:bg-futureeval-bg-light/10",
        "font-sans text-[12px]",
        FE_COLORS.textPrimary
      )}
    >
      {hasIcon && (
        <>
          {/* Light mode icon */}
          {chip.iconLight && (
            <Image
              src={chip.iconLight}
              alt=""
              width={12}
              height={12}
              className="h-3 w-3 object-contain dark:hidden"
              unoptimized
            />
          )}
          {/* Dark mode icon */}
          {(chip.iconDark ?? chip.iconLight) && (
            <Image
              src={chip.iconDark ?? chip.iconLight ?? ""}
              alt=""
              width={12}
              height={12}
              className="hidden h-3 w-3 object-contain dark:block"
              unoptimized
            />
          )}
        </>
      )}
      {chip.label}
    </span>
  );
};

export default OrbitAutoCarousel;
