# design-sync notes

Design system: Metaculus front_end. **Scope: tokens-only** (colors, typography,
layout). The earlier component/story approach was dropped as unnecessary; the
sync ships design tokens, not components.

## What ships
- Source of truth: `front_end/src/constants/colors.ts` (METAC_COLORS),
  `front_end/tailwind.config.ts`, `front_end/src/utils/fonts.ts`.
- Generator: `.design-sync/gen-tokens.mjs` (run from repo root) →
  `ds-bundle/`: `styles.css`, `tokens/{colors,typography,layout}.css`,
  `fonts/*`, per-family color swatch cards + a typography card under
  `components/color/*` and `components/typography/*`, and `README.md`.
- Colors: 152 leaves (151 light / 147 dark) as `--<family>-<shade>` CSS vars;
  light on `:root`, dark under `.dark`.
- Fonts bundled (local): Inter (variable), Source Serif Pro, League Gothic.
  Google-hosted fonts (Geist, Newsreader, JetBrains Mono) are referenced by
  name only.

## Regenerate
`node .design-sync/gen-tokens.mjs` from repo root (needs `.ds-sync/node_modules`
for esbuild + playwright; recreate via the staging step if absent).

## Re-sync risks
- Token values are read live from `colors.ts`/`tailwind.config.ts`, so a re-run
  picks up palette changes automatically. Swatch card grouping keys off the
  top-level family name in METAC_COLORS.
- No `_ds_sync.json` anchor is written (manual layout) — a re-sync re-uploads
  the whole token bundle rather than diffing.

## Abandoned (reverted)
- 8 authored primitive stories under `front_end/src/stories/ui/` — deleted.
- `.storybook/main.ts` viteFinal alias/build tweaks — reverted to original.
  NOTE: the production `storybook build` is still broken by the `.js`-file
  `@/` alias in `(bridgewater)/utils/pixel-apis.js` (tsconfig `include` omits
  `.js`); left as-is since tokens-only doesn't build storybook.
