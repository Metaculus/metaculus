# FutureEval Subproject Improvements - Context

## Project Overview

We've been improving the `/futureeval` subproject of Metaculus - a page for measuring AI forecasting performance. The goal was to enhance communication, design consistency, and code quality.

## Key Changes Made

### 1. Custom Navbar

- Created `futureeval-navbar.tsx` with Metaculus logo (not FutureEval logo)
- "Metaculus Platform" button with left arrow (responsive: "Platform" on mobile)
- Transparent background that transitions to semi-transparent on scroll (using IntersectionObserver)
- Added ThemeToggle (dark mode) to the right of Platform button
- Bulletins are hidden on FutureEval pages (`bulletins.tsx` updated)

### 2. Hero Section

- Text: "Measuring the forecasting accuracy of AI"
- Two bullet points describing Model Benchmark and Bot Competition
- Uses `FE_COLORS.textHeading` and `FE_COLORS.textSubheading` for consistent styling

### 3. Model Leaderboard

- Left-aligned title and subtitle
- Info popover (?) button on the right with FutureEval-themed tooltip
- Carousel with smaller arrows on mobile (`w-7 h-7 sm:w-10 sm:h-10`)
- Arrow positions: `left-1 sm:left-[18px]` and `right-1 sm:right-[18px]`

### 4. Centralized Theme (`theme.ts`)

```typescript
FE_COLORS = {
  bgPrimary,
  textPrimary,
  textSecondary,
  textMuted,
  textHeading,
  textSubheading,
  tooltipBg,
  tooltipText,
  tooltipTextSecondary,
  tooltipLink,
  buttonBorder,
  gradientFrom,
  carouselArrowBg,
  navbarScrolled,
  navbarTransparent,
  barAggregateBg,
  barAggregateHover,
  barAggregateBorder,
  barAggregateIcon,
  bgSecondary,
  bgCard,
  cardBorder,
  stepNumberBg,
};
```

### 5. Text Styling Paradigms (Applied Across All Pages)

- **Headings**: `text-[24px] font-bold leading-[116%] sm:text-[32px] sm:leading-[40px] lg:text-4xl` + `FE_COLORS.textHeading`
- **Subtitles/Body**: `font-geist-mono text-sm sm:text-base` + `FE_COLORS.textSubheading`
- **Links**: Simple `underline` class
- **Text selection disabled** via `select-none` on containers

### 6. Pages Updated

- `futureeval-hero-banner.tsx` - Hero content
- `futureeval-methodology-content.tsx` - Uses font-geist-mono for all text
- `futureeval-participate-tab.tsx` - Video section, 3-step submit, resources cards
- `futureeval-tournaments.tsx` - Tournament carousel with FE theme
- `futureeval-leaderboard-hero.tsx` - Full leaderboard page header
- `futureeval-benchmark-headers.tsx` - Section headers for Forecasting Performance and Pros vs Bots

### 7. Deleted Unused Files

- `futureeval-performance-chart.tsx` (reverted to using original AIB chart)
- `futureeval-forecasting-performance.tsx`
- `futureeval-benchmark-hero.tsx`
- `futureeval-hero.tsx`
- `futureeval-bulletin.tsx`

## Current File Structure

```
futureeval/
├── components/
│   ├── benchmark/
│   │   ├── futureeval-benchmark-headers.tsx
│   │   ├── futureeval-benchmark-tab.tsx
│   │   ├── futureeval-model-bar.tsx
│   │   └── futureeval-model-benchmark.tsx
│   ├── futureeval-container.tsx
│   ├── futureeval-header.tsx
│   ├── futureeval-hero-banner.tsx
│   ├── futureeval-info-popover.tsx
│   ├── futureeval-leaderboard-hero.tsx
│   ├── futureeval-leaderboard-table.tsx
│   ├── futureeval-methodology-content.tsx
│   ├── futureeval-methodology-tab.tsx
│   ├── futureeval-navbar.tsx
│   ├── futureeval-participate-tab.tsx
│   ├── futureeval-screen.tsx
│   ├── futureeval-tabs-shell.tsx
│   ├── futureeval-tabs.tsx
│   └── futureeval-tournaments.tsx
├── theme.ts
├── page.tsx
├── methodology/
├── news/
├── participate/
├── leaderboard/
├── info/
└── assets/
```

## Import Order Convention

The codebase uses ESLint import ordering:

1. External packages (alphabetical)
2. `@/` alias imports (alphabetical)
3. Relative imports (alphabetical)

## Notes

- The benchmark tab uses `AIBBenchmarkForecastingPerformance` from the original AIB components (not a custom version)
- The tabs order is: Benchmark, Methodology, News, Participate
- FutureEval pages don't show the default Metaculus header (handled in `navigation.ts`)
