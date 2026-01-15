/**
 * FutureEval Theme Configuration
 *
 * This file defines the main theme colors and typography for the FutureEval project.
 * Adjust these values to easily change the color scheme across all FutureEval pages.
 *
 * IMPORTANT: All FutureEval components import from this file.
 * Changing values here will update the entire FutureEval project.
 *
 * COLOR PALETTE:
 * - Primary Light: #00A99E (teal)
 * - Primary Dark: #23FBE3 (bright cyan)
 * - Background Light: #FBFFFC (off-white)
 * - Background Dark: #030C07 (near-black)
 */

// ===========================================
// LOGO SIZING
// ===========================================
// Adjust this value to scale the logo (1.0 = default, 1.15 = 15% larger, etc.)
// Desktop is always 40% larger than mobile, then this scale is applied on top
export const FE_LOGO_SCALE = 1.2;

// Base sizes before scaling (do not edit these directly, edit FE_LOGO_SCALE instead)
const LOGO_BASE_MOBILE = 120; // px
const LOGO_BASE_DESKTOP = LOGO_BASE_MOBILE * 1.4; // 40% larger

// Computed logo sizes (used in components)
export const FE_LOGO_SIZES = {
  mobile: Math.round(LOGO_BASE_MOBILE * FE_LOGO_SCALE),
  desktop: Math.round(LOGO_BASE_DESKTOP * FE_LOGO_SCALE),
} as const;

// ===========================================
// COLOR DEFINITIONS
// ===========================================

export const FE_COLORS = {
  // ===========================================
  // PRIMARY BACKGROUND COLORS
  // ===========================================
  // Main page background
  bgPrimary: "bg-futureeval-bg-light dark:bg-futureeval-bg-dark",

  // ===========================================
  // TEXT COLORS
  // ===========================================
  // Primary text (high contrast)
  textPrimary: "text-futureeval-bg-dark dark:text-futureeval-bg-light",
  // Secondary/muted text
  textSecondary: "text-futureeval-bg-dark/80 dark:text-futureeval-bg-light/80",
  textMuted: "text-futureeval-bg-dark/60 dark:text-futureeval-bg-light/60",
  // Hover state for muted text (use in className directly, not dynamically)
  textMutedHover:
    "text-futureeval-bg-dark/60 dark:text-futureeval-bg-light/60 hover:text-futureeval-bg-dark/80 dark:hover:text-futureeval-bg-light/80",

  // Heading colors (uses primary accent)
  textHeading: "text-futureeval-bg-dark dark:text-futureeval-bg-light",
  // Subheading/body text
  textSubheading: "text-futureeval-bg-dark/80 dark:text-futureeval-bg-light/80",

  // Accent colors for links and emphasis
  textAccent: "text-futureeval-primary-light dark:text-futureeval-primary-dark",

  // ===========================================
  // TOOLTIP/POPOVER COLORS
  // ===========================================
  tooltipBg: "bg-futureeval-bg-dark/90 dark:bg-futureeval-bg-light/90",
  tooltipText: "text-futureeval-bg-light dark:text-futureeval-bg-dark",
  tooltipTextSecondary:
    "text-futureeval-bg-light/80 dark:text-futureeval-bg-dark/80",
  tooltipLink:
    "text-futureeval-primary-dark dark:text-futureeval-primary-light",

  // ===========================================
  // BUTTON/INTERACTIVE COLORS
  // ===========================================
  buttonBorder:
    "border-futureeval-primary-light dark:border-futureeval-primary-dark",
  buttonPrimary:
    "bg-futureeval-primary-light dark:bg-futureeval-primary-dark text-futureeval-bg-light dark:text-futureeval-bg-dark",

  // ===========================================
  // CAROUSEL/GRADIENT COLORS
  // ===========================================
  // Gradient fade for carousels (should match bgPrimary)
  gradientFrom: "from-futureeval-bg-light dark:from-futureeval-bg-dark",

  // Carousel arrow backgrounds
  carouselArrowBg: "bg-futureeval-bg-light dark:bg-futureeval-bg-dark",

  // ===========================================
  // NAVBAR COLORS
  // ===========================================
  navbarScrolled: "bg-futureeval-bg-dark/95 dark:bg-futureeval-bg-dark/95",
  navbarTransparent: "bg-transparent",

  // ===========================================
  // BAR CHART COLORS (Model Leaderboard)
  // ===========================================
  // Primary bars (AI models)
  barPrimaryBg: "bg-futureeval-primary-light dark:bg-futureeval-primary-dark",
  barPrimaryBorder:
    "border-futureeval-primary-light dark:border-futureeval-primary-dark",

  // Aggregate bars (Community Prediction)
  barAggregateBg:
    "bg-futureeval-primary-light/30 dark:bg-futureeval-primary-dark/30",
  barAggregateHover:
    "hover:bg-futureeval-primary-light/40 dark:hover:bg-futureeval-primary-dark/40",
  barAggregateBorder:
    "border-futureeval-primary-light dark:border-futureeval-primary-dark",
  barAggregateIcon:
    "text-futureeval-primary-light dark:text-futureeval-primary-dark",

  // ===========================================
  // SECONDARY BACKGROUNDS
  // ===========================================
  // For cards, banners with subtle contrast
  bgSecondary: "bg-futureeval-bg-dark/5 dark:bg-futureeval-bg-light/5",
  bgCard: "bg-futureeval-bg-light dark:bg-futureeval-bg-dark",
  cardBorder:
    "border-futureeval-primary-light/30 dark:border-futureeval-primary-dark/30",

  // Step numbers in Participate tab
  stepNumberBg: "bg-futureeval-primary-light dark:bg-futureeval-primary-dark",

  // ===========================================
  // BORDER COLORS
  // ===========================================
  borderPrimary:
    "border-futureeval-primary-light dark:border-futureeval-primary-dark",
  borderSubtle:
    "border-futureeval-bg-dark/20 dark:border-futureeval-bg-light/20",
} as const;

// ===========================================
// TYPOGRAPHY CLASSES
// ===========================================
// Centralized typography styles for consistent heading and body text
// Uses Newsreader for headings, Inter for body (via font-sans)

export const FE_TYPOGRAPHY = {
  // Page title - large display heading
  h1: "font-newsreader text-2xl font-normal sm:text-5xl text-balance",

  // Section headings
  h2: "font-newsreader text-2xl font-normal sm:text-4xl text-balance",

  // Subsection headings
  h3: "font-newsreader text-lg font-normal sm:text-3xl text-balance",

  // Card titles and smaller headings
  h4: "font-newsreader text-base font-normal sm:text-2xl text-balance",

  // Body text - primary
  body: "font-sans text-sm leading-[1.6] sm:text-base",

  // Body text - small
  bodySmall: "font-sans text-xs leading-[1.5] sm:text-[14px]",

  // Labels and UI elements
  label: "font-sans text-xs font-medium leading-[1.4] sm:text-[14px]",

  // Link styling
  link: "underline underline-offset-2 hover:opacity-80 transition-opacity",
} as const;

// ===========================================
// RAW COLOR VALUES
// ===========================================
// For components that need inline styles (charts, etc.)

export const FE_RAW_COLORS = {
  light: {
    primary: "#00A99E",
    background: "#FBFFFC",
  },
  dark: {
    primary: "#23FBE3",
    background: "#030C07",
  },
} as const;

export default FE_COLORS;
