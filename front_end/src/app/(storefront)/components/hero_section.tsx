"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { FC, useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/auth_context";
import { SiteStats } from "@/services/api/misc/misc.shared";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

import HeroFutureEvalSymbol from "./hero_futureeval_symbol";
import HeroGlobeBackground from "./hero_globe_background";
import MetaculusStorefrontLogo from "./metaculus_storefront_logo";
import RadiantLogo from "./radiant_logo";

// Accent colors per card — used for globe tint + card hover overlay
// Adjust these to fine-tune both effects from one place
const CARD_ACCENT_COLORS = {
  platform: "#a1bdd6", // light blue
  business: "#bf9cd8", // purple
  futureeval: "#5EA29B", // teal
  radiant: "#F2C59A", // warm beige
} as const;

type HoveredCard = keyof typeof CARD_ACCENT_COLORS | null;

const DEFAULT_COLOR = "#7c8b99";
const DEFAULT_SPEED = 0.8;
const HOVER_SPEED = 0.1;
const TRANSITION_MS = 200;

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Smoothly interpolates globe color and speed toward the target,
// picking up from the current animated position on mid-transition changes
function useAnimatedGlobe(hoveredCard: HoveredCard) {
  const targetColor = hoveredCard
    ? CARD_ACCENT_COLORS[hoveredCard]
    : DEFAULT_COLOR;
  const targetSpeed = hoveredCard ? HOVER_SPEED : DEFAULT_SPEED;

  const currentRgb = useRef(parseHex(targetColor));
  const currentSpd = useRef(targetSpeed);

  const [color, setColor] = useState(targetColor);
  const [speed, setSpeed] = useState(targetSpeed);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const startRgb = useRef(parseHex(targetColor));
  const startSpd = useRef(targetSpeed);
  const targetRgb = useRef(parseHex(targetColor));
  const targetSpd = useRef(targetSpeed);

  useEffect(() => {
    startRgb.current = [...currentRgb.current] as [number, number, number];
    startSpd.current = currentSpd.current;
    targetRgb.current = parseHex(targetColor);
    targetSpd.current = targetSpeed;
    startTimeRef.current = performance.now();

    cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const t = Math.min((now - startTimeRef.current) / TRANSITION_MS, 1);
      const e = easeOutCubic(t);

      const r = Math.round(lerp(startRgb.current[0], targetRgb.current[0], e));
      const g = Math.round(lerp(startRgb.current[1], targetRgb.current[1], e));
      const b = Math.round(lerp(startRgb.current[2], targetRgb.current[2], e));

      currentRgb.current = [r, g, b];
      currentSpd.current = lerp(startSpd.current, targetSpd.current, e);

      setColor(toHex(r, g, b));
      setSpeed(currentSpd.current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [targetColor, targetSpeed]);

  return { color, speed };
}

type HeroSectionProps = {
  stats: SiteStats;
};

// Hover overlay that tints the card with its accent color (desktop only)
const ACCENT_OPACITY = 0.4; // adjust this to control hover tint intensity

const AccentOverlay: FC<{ accentKey: keyof typeof CARD_ACCENT_COLORS }> = ({
  accentKey,
}) => {
  const color = CARD_ACCENT_COLORS[accentKey];
  // Parse hex to rgb for rgba usage
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity md:block md:group-hover:opacity-100"
      style={{
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${ACCENT_OPACITY})`,
      }}
    />
  );
};

const HeroSection: FC<HeroSectionProps> = ({ stats }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const logoHref = user ? "/questions/" : "/";
  const servicesCopyVariant = useFeatureFlagVariantKey("services-copy");
  const servicesCopyTitle =
    servicesCopyVariant === "B"
      ? t("services")
      : servicesCopyVariant === "C"
        ? t("partnerWithMetaculus")
        : t("businessSolutions");

  const [hoveredCard, setHoveredCard] = useState<HoveredCard>(null);
  const { color: globeColor, speed: globeSpeed } =
    useAnimatedGlobe(hoveredCard);

  return (
    <section className="relative isolate w-full overflow-hidden rounded-b-2xl bg-[#0e1e30] md:rounded-b-3xl">
      <div className="hidden md:block">
        <HeroGlobeBackground colorFront={globeColor} speed={globeSpeed} />
      </div>

      <div className="relative z-10 mx-auto flex w-full flex-col gap-4 p-4 md:gap-8 md:px-10 md:pb-10 md:pt-8">
        {/* Logo + title */}
        <Link href={logoHref} className="inline-flex items-center no-underline">
          <MetaculusStorefrontLogo className="h-[38px] w-auto text-white md:h-[50px]" />
          <div className="ml-3.5 flex flex-col gap-0.5">
            <span className="text-lg font-bold leading-tight tracking-[-0.36px] text-white md:text-xl">
              Metaculus
            </span>
            <span className="text-xs font-medium text-[#adbfd4] opacity-75 md:text-sm">
              {t("clarityInAComplexWorld")}
            </span>
          </div>
        </Link>

        {/* CTA cards */}
        <div className="flex flex-col gap-2.5 md:gap-5">
          <div className="grid grid-cols-2 gap-2.5 md:gap-5">
            {/* Forecasting Platform */}
            <Link
              href="/questions/"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-lg p-4 no-underline md:rounded-xl md:p-10",
                "h-[140px] md:h-[259px]",
                "bg-[#c6d8e8] backdrop-blur-[1px] transition-colors md:bg-[#c6d8e8]/80 md:hover:bg-[#c6d8e8]"
              )}
              onMouseEnter={() => setHoveredCard("platform")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <AccentOverlay accentKey="platform" />
              <div className="absolute -left-[102px] -top-[60px] h-[346px] w-[341px] rounded-full bg-[rgba(41,109,169,0.76)] opacity-40 blur-[51px]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-2 md:justify-start">
                <div className="flex items-start justify-between md:items-center">
                  <span className="text-sm font-semibold text-blue-900 md:text-2xl">
                    {t("forecastingPlatform")}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="mt-0.5 text-sm text-blue-900/50 transition-transform group-hover:translate-x-1 md:mt-0 md:text-xl"
                  />
                </div>
                <p className="m-0 text-xs text-blue-800 md:text-base">
                  {t("collectiveIntelligenceForPublicGood")}
                </p>
              </div>
              <div className="relative z-10 hidden flex-wrap gap-x-3.5 gap-y-1 text-base text-blue-800 md:flex">
                <span>
                  <strong className="text-blue-900">
                    {abbreviatedNumber(stats.predictions)}+
                  </strong>{" "}
                  {t("predictions")}
                </span>
                <span>
                  <strong className="text-blue-900">
                    {abbreviatedNumber(stats.questions)}+
                  </strong>{" "}
                  {t("forecastingQuestions")}
                </span>
                <span>
                  <strong className="text-blue-900">
                    {t("yearsOfPredictions", {
                      count: stats.years_of_predictions,
                    })}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Business Solutions */}
            <Link
              href="/services/"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-lg p-4 no-underline md:rounded-xl md:p-10",
                "h-[140px] md:h-[259px]",
                "bg-[#d8c6e8] backdrop-blur-[1px] transition-colors md:bg-[#d8c6e8]/80 md:hover:bg-[#d8c6e8]"
              )}
              onMouseEnter={() => setHoveredCard("business")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <AccentOverlay accentKey="business" />
              <div className="absolute -left-[62px] -top-[57px] h-[346px] w-[341px] rounded-full bg-[rgba(63,25,49,0.76)] opacity-[0.22] blur-[51px]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-2 md:justify-start">
                <div className="flex items-start justify-between md:items-center">
                  <span className="text-sm font-semibold text-purple-900 md:text-2xl">
                    {servicesCopyTitle}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="mt-0.5 text-sm text-purple-900/50 transition-transform group-hover:translate-x-1 md:mt-0 md:text-xl"
                  />
                </div>
                <p className="m-0 text-xs text-purple-900 md:text-base">
                  {t("forInformedDecisionMaking")}
                </p>
              </div>
              <div className="relative z-10 hidden flex-wrap gap-x-2.5 gap-y-1.5 text-base text-purple-900 md:flex">
                <span>
                  <strong>{t("hire")}</strong> {t("proForecasters")}
                </span>
                <span>
                  <strong>{t("run")}</strong> {t("tournaments")}
                </span>
                <span>
                  <strong>{t("host")}</strong> {t("privateInstances")}
                </span>
              </div>
            </Link>
          </div>

          {/* FutureEval + Radiant banners */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1 md:gap-5">
            {/* FutureEval banner */}
            <Link
              href="/futureeval/"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-lg bg-[#4c6076] p-4 no-underline backdrop-blur-[1px] transition-colors md:flex-row md:items-center md:gap-4 md:rounded-xl md:bg-[#4c6076]/80 md:px-6 md:py-4 md:hover:bg-[#4c6076]"
              onMouseEnter={() => setHoveredCard("futureeval")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <AccentOverlay accentKey="futureeval" />
              <div className="absolute -left-[33px] -top-[39px] h-[130px] w-[127px] rounded-full bg-[rgba(41,169,156,0.76)] opacity-40 blur-[51px] md:-left-[142px] md:-top-[140px] md:h-[346px] md:w-[341px]" />
              <div className="relative z-10 flex items-center justify-between md:w-[170px] md:shrink-0 md:justify-start">
                <div className="flex items-center gap-2 md:gap-3">
                  <HeroFutureEvalSymbol className="h-4 w-auto shrink-0 md:h-6" />
                  <span className="text-sm font-semibold text-white md:text-xl">
                    FutureEval
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-sm text-white/50 transition-transform group-hover:translate-x-1 md:hidden"
                />
              </div>
              <p className="relative z-10 m-0 text-xs font-normal text-white opacity-50 group-hover:opacity-80  md:flex-1 md:text-sm md:opacity-60">
                {t("measuringForecastingAccuracyOfAI")}
              </p>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 hidden text-white/50 transition-transform group-hover:translate-x-1 md:block md:text-xl"
              />
            </Link>

            {/* Radiant banner */}
            <Link
              href="/notebooks/42293/map-the-future-before-you-build-it/"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-lg bg-[#4c6076] p-4 no-underline backdrop-blur-[1px] transition-colors md:flex-row md:items-center md:gap-4 md:rounded-xl md:bg-[#4c6076]/80 md:px-6 md:py-4 md:hover:bg-[#4c6076]"
              onMouseEnter={() => setHoveredCard("radiant")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <AccentOverlay accentKey="radiant" />
              <div className="absolute -left-[67px] -top-[63px] h-[132px] w-[131px] rounded-full bg-[rgba(255,228,203,0.5)] opacity-40 blur-[39px] md:-left-[166px] md:-top-[156px] md:h-[346px] md:w-[341px] md:blur-[51px]" />
              <div className="relative z-10 flex items-center justify-between md:w-[170px] md:shrink-0 md:justify-start">
                <div className="flex items-center gap-2 md:gap-3">
                  <RadiantLogo className="size-4 text-white md:size-7" />
                  <span className="text-sm font-semibold text-white md:text-xl">
                    {t("radiant")}
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-sm text-white/50 transition-transform group-hover:translate-x-1 md:hidden"
                />
              </div>
              <p className="relative z-10 m-0 text-xs font-normal text-white opacity-50 group-hover:opacity-80  md:flex-1 md:text-sm md:opacity-60">
                {t("mapTheFutureBeforeYouBuildIt")}
              </p>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 hidden text-white/50 transition-transform group-hover:translate-x-1 md:block md:text-xl"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
