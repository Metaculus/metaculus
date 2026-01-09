/**
 * FutureEval Theme Configuration
 *
 * This file defines the main theme colors for the FutureEval project.
 * Adjust these values to easily change the color scheme across all FutureEval pages.
 *
 * IMPORTANT: All FutureEval components import colors from this file.
 * Changing values here will update the entire FutureEval project.
 *
 * Usage: Import and use these class strings in your components.
 * Example: import { FE_COLORS } from '../theme';
 *          <div className={FE_COLORS.bgPrimary}>...</div>
 */

export const FE_COLORS = {
  // ===========================================
  // PRIMARY BACKGROUND COLORS
  // ===========================================
  // Main page background (used for hero, content sections, containers)
  bgPrimary: "bg-violet-100 dark:bg-violet-950",

  // ===========================================
  // TEXT COLORS
  // ===========================================
  textPrimary: "text-violet-900 dark:text-violet-100",
  textSecondary: "text-violet-700 dark:text-violet-300",
  textMuted: "text-violet-600 dark:text-violet-400",

  // Heading colors (used for section titles)
  textHeading: "text-blue-800 dark:text-blue-800-dark",
  textSubheading: "text-blue-700 dark:text-blue-700-dark",

  // ===========================================
  // TOOLTIP/POPOVER COLORS
  // ===========================================
  tooltipBg: "bg-violet-300 dark:bg-violet-800",
  tooltipText: "text-violet-900 dark:text-violet-100",
  tooltipTextSecondary: "text-violet-800 dark:text-violet-200",
  tooltipLink: "text-violet-950 dark:text-violet-50",

  // ===========================================
  // BUTTON/INTERACTIVE COLORS
  // ===========================================
  buttonBorder: "border-violet-500 dark:border-violet-500",

  // ===========================================
  // CAROUSEL/GRADIENT COLORS
  // ===========================================
  // Gradient fade for carousels (should match bgPrimary)
  gradientFrom: "from-violet-100 dark:from-violet-950",

  // Carousel arrow backgrounds (should match bgPrimary)
  carouselArrowBg: "bg-violet-100 dark:bg-violet-950",

  // ===========================================
  // NAVBAR COLORS
  // ===========================================
  navbarScrolled: "bg-blue-900/90 dark:bg-blue-950/90",
  navbarTransparent: "bg-blue-900",

  // ===========================================
  // BAR CHART COLORS (Model Leaderboard)
  // ===========================================
  // Aggregate bars (Community Prediction)
  barAggregateBg: "bg-violet-200 dark:bg-violet-800",
  barAggregateHover: "hover:bg-violet-300 dark:hover:bg-violet-700-dark",
  barAggregateBorder: "border-violet-800 dark:border-violet-800-dark",
  barAggregateIcon: "text-violet-800 dark:text-violet-200",

  // ===========================================
  // SECONDARY BACKGROUNDS
  // ===========================================
  // For cards, banners with subtle contrast
  bgSecondary: "bg-violet-200/50 dark:bg-violet-900/30",
  bgCard: "bg-violet-50 dark:bg-violet-900/30",
  cardBorder: "border-violet-400 dark:border-violet-700",

  // Step numbers in Participate tab
  stepNumberBg: "bg-violet-500 dark:bg-violet-600",
} as const;

// Raw color values for components that need inline styles
export const FE_RAW_COLORS = {
  light: {
    bgPrimary: "rgb(237, 233, 254)", // violet-100
    tooltipBg: "rgb(196, 181, 253)", // violet-300
  },
  dark: {
    bgPrimary: "rgb(46, 16, 101)", // violet-950
    tooltipBg: "rgb(91, 33, 182)", // violet-800
  },
} as const;

export default FE_COLORS;
