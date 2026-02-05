import anthropicDark from "@/app/(main)/aib/assets/ai-models/anthropic-black.png";
import anthropicLight from "@/app/(main)/aib/assets/ai-models/anthropic-white.webp";
import googleLight from "@/app/(main)/aib/assets/ai-models/google.svg?url";
import openaiLight from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openaiDark from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import xLight from "@/app/(main)/aib/assets/ai-models/x.svg?url";
import xDark from "@/app/(main)/aib/assets/ai-models/x_dark.svg?url";

import { CarouselChip } from "./orbit-auto-carousel";

// ===========================================
// ORBIT ITEM TYPES
// ===========================================

export type OrbitItem = {
  id: string;
  label: string;
  description: string;
  action: {
    type: "scroll" | "navigate" | "tab-scroll";
    target: string;
    tabHref?: string;
  } | null;
};

// ===========================================
// ORBIT ITEMS DATA
// ===========================================

export const ORBIT_ITEMS: OrbitItem[] = [
  {
    id: "model-benchmark",
    label: "Model\nBenchmark",
    description:
      "Latest AI models forecast Metaculus questions and are scored against real-life outcomes",
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
      type: "scroll",
      target: "tournaments",
    },
  },
  {
    id: "baseline",
    label: "Human Baseline",
    description:
      "Metaculus community and top Pro Forecasters provide high-quality human baselines to compare AIs to.",
    action: null,
  },
];

// ===========================================
// CAROUSEL DATA
// ===========================================

/**
 * Top models to show in the Model Benchmark carousel
 * Hardcoded based on typical top performers
 */
export const MODEL_BENCHMARK_CHIPS: CarouselChip[] = [
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
export const BOT_TOURNAMENTS_CHIPS: CarouselChip[] = [
  { id: "prizes", label: "$175k paid in prizes" },
  { id: "credits", label: "Complimentary AI credits provided" },
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

/**
 * Rotation speed in degrees per second
 * Set to 0 to disable rotation
 */
export const ORBIT_ROTATION_SPEED: number = 4; // degrees per second

/**
 * Calculate the CSS animation duration for a full rotation
 * 360 degrees / speed = seconds for full rotation
 */
export const ORBIT_ANIMATION_DURATION =
  ORBIT_ROTATION_SPEED > 0 ? 360 / ORBIT_ROTATION_SPEED : 0;
