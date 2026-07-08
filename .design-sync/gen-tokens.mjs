// Generate a tokens-only design-system bundle for claude.ai/design from the
// Metaculus source of truth (METAC_COLORS + tailwind.config + fonts).
// Output: ds-bundle/{styles.css, tokens/*.css, fonts/*, README.md}.
// Run: node .design-sync/gen-tokens.mjs   (from repo root)

import { build } from "../.ds-sync/node_modules/esbuild/lib/main.js";
import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const FE = join(REPO, "front_end");
const OUT = join(REPO, "ds-bundle");

// ── load METAC_COLORS from source (transpile the TS const) ────────────────
const bundled = await build({
  entryPoints: [join(FE, "src/constants/colors.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  logLevel: "silent",
});
const mod = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
const COLORS = mod.METAC_COLORS;

// ── flatten the nested palette into { name, light, dark } leaves ──────────
const slug = (s) =>
  String(s)
    .replace(/∞/g, "infinity")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const isLeaf = (v) =>
  typeof v === "string" ||
  (v && typeof v === "object" && Object.keys(v).every((k) => k === "DEFAULT" || k === "dark"));

const leaves = [];
const walk = (obj, prefix, family) => {
  for (const [k, v] of Object.entries(obj)) {
    const name = prefix ? `${prefix}-${slug(k)}` : slug(k);
    const fam = family ?? slug(k);
    if (isLeaf(v)) {
      if (typeof v === "string") leaves.push({ name, family: fam, light: v, dark: null });
      else leaves.push({ name, family: fam, light: v.DEFAULT ?? null, dark: v.dark ?? null });
    } else {
      walk(v, name, fam);
    }
  }
};
walk(COLORS, "", null);

// ── tokens/colors.css ─────────────────────────────────────────────────────
const light = leaves.filter((l) => l.light).map((l) => `  --${l.name}: ${l.light};`);
const dark = leaves.filter((l) => l.dark).map((l) => `  --${l.name}: ${l.dark};`);
const colorsCss = `/* Metaculus color palette — generated from src/constants/colors.ts.
   Light values on :root, dark-theme overrides under .dark (matching the app's
   Tailwind \`-dark\` variants). In the product these are Tailwind utilities:
   e.g. --blue-900 ⇢ bg-blue-900 / text-blue-900, dark ⇢ dark:bg-blue-900-dark. */
:root {
${light.join("\n")}
}

.dark {
${dark.join("\n")}
}
`;

// ── tokens/typography.css (fonts + type scale) ────────────────────────────
const fontFiles = [
  ["SourceSerifPro-Regular.woff2", "Source Serif Pro", 400, "normal"],
  ["SourceSerifPro-Italic.woff2", "Source Serif Pro", 400, "italic"],
  ["SourceSerifPro-Bold.woff2", "Source Serif Pro", 700, "normal"],
  ["SourceSerifPro-BoldItalic.woff2", "Source Serif Pro", 700, "italic"],
  ["league_gothic_variable.ttf", "League Gothic", "100 900", "normal"],
];
const faceRules = fontFiles
  .map(
    ([file, family, weight, style]) => `@font-face {
  font-family: "${family}";
  src: url("../fonts/${file}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`
  )
  .join("\n");
// Inter variable (sans body font)
const interFace = `@font-face {
  font-family: "Inter";
  src: url("../fonts/inter_variable.ttf");
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}`;

const typographyCss = `/* Metaculus typography — font families + type scale.
   Body/UI text is Inter; long-form/serif is Source Serif Pro; League Gothic is
   the display face. (Geist, Newsreader, JetBrains Mono are Google-hosted in the
   product and are referenced by name only here.) */
${interFace}
${faceRules}

:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Source Serif Pro", ui-serif, Georgia, serif;
  --font-display: "League Gothic", "Inter", sans-serif;
  --font-mono: "Ubuntu Mono", ui-monospace, "JetBrains Mono", monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
`;

// ── tokens/layout.css (radius, shadow, spacing extras, breakpoints) ───────
const layoutCss = `/* Radius, shadow, and layout tokens from tailwind.config.ts. */
:root {
  --radius-xs: 2px;
  --radius-sm: 0.125rem;
  --radius: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  --shadow-dropdown: 2px 3px 10px -3px #91999e;

  /* app chrome */
  --top-chrome-height: 3rem;
  --spacing-header: var(--top-chrome-height, 3rem);

  /* custom breakpoints (in addition to Tailwind defaults sm/md/lg/xl/2xl) */
  --screen-xxs: 400px;
  --screen-xs: 480px;
}
`;

// ── styles.css (entry — @import closure is what rendered designs receive) ──
const stylesCss = `/* Metaculus design tokens — entry stylesheet.
   Every rendered design receives this file's @import closure. */
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./tokens/layout.css";

:root {
  color-scheme: light dark;
}
`;

// ── write everything ──────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "tokens"), { recursive: true });
mkdirSync(join(OUT, "fonts"), { recursive: true });
writeFileSync(join(OUT, "tokens/colors.css"), colorsCss);
writeFileSync(join(OUT, "tokens/typography.css"), typographyCss);
writeFileSync(join(OUT, "tokens/layout.css"), layoutCss);
writeFileSync(join(OUT, "styles.css"), stylesCss);

for (const [file] of [...fontFiles, ["inter_variable.ttf"]]) {
  const src = join(FE, "public/fonts", file);
  if (existsSync(src)) cpSync(src, join(OUT, "fonts", file));
  else console.error(`  ! font missing: ${file}`);
}

// ── swatch preview cards (one per color family) ───────────────────────────
const pascal = (s) =>
  s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const families = [...new Set(leaves.map((l) => l.family))];
const swatchRow = (fam, mode) =>
  leaves
    .filter((l) => l.family === fam && (mode === "dark" ? l.dark : l.light))
    .map((l) => {
      const hex = mode === "dark" ? l.dark : l.light;
      return `<div class="sw"><div class="chip" style="background:var(--${l.name})"></div><div class="nm">${esc(l.name)}</div><div class="hx">${esc(hex)}</div></div>`;
    })
    .join("");

for (const fam of families) {
  const name = pascal(fam);
  const dir = join(OUT, "components", "color", name);
  mkdirSync(dir, { recursive: true });
  const hasDark = leaves.some((l) => l.family === fam && l.dark);
  const html = `<!-- @dsCard group="Color" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <link rel="stylesheet" href="../../../styles.css">
  <style>
    body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#fff}
    h3{margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}
    .row{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px}
    .sw{width:92px}
    .chip{height:52px;border-radius:6px;border:1px solid rgba(0,0,0,.12)}
    .nm{font-size:11px;margin-top:5px;color:#111827;word-break:break-all}
    .hx{font-size:10px;color:#6b7280;font-family:ui-monospace,monospace}
    .panel{background:#262f38;border-radius:8px;padding:16px 16px 0}
    .panel .nm{color:#e4e7e9}.panel .hx{color:#adb1b4}.panel h3{color:#adb1b4}
  </style>
</head><body>
  <h3>${esc(name)} — Light</h3>
  <div class="row">${swatchRow(fam, "light")}</div>
  ${hasDark ? `<div class="panel dark"><h3>${esc(name)} — Dark</h3><div class="row">${swatchRow(fam, "dark")}</div></div>` : ""}
</body></html>
`;
  writeFileSync(join(dir, `${name}.html`), html);
}

// typography card
{
  const dir = join(OUT, "components", "typography", "Typography");
  mkdirSync(dir, { recursive: true });
  const sizes = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  writeFileSync(
    join(dir, "Typography.html"),
    `<!-- @dsCard group="Typography" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <link rel="stylesheet" href="../../../styles.css">
  <style>body{margin:0;padding:24px;background:#fff;color:#161c22}
    .fam{margin-bottom:20px}.lbl{font:600 11px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px}
    .sz{display:flex;align-items:baseline;gap:12px;margin:2px 0}.sz .t{color:#6b7280;font:400 11px ui-monospace,monospace;width:44px}</style>
</head><body>
  <div class="fam"><div class="lbl">Sans — Inter (--font-sans)</div><div style="font-family:var(--font-sans);font-size:24px">The quick brown fox jumps over the lazy dog</div></div>
  <div class="fam"><div class="lbl">Serif — Source Serif Pro (--font-serif)</div><div style="font-family:var(--font-serif);font-size:24px">The quick brown fox jumps over the lazy dog</div></div>
  <div class="fam"><div class="lbl">Display — League Gothic (--font-display)</div><div style="font-family:var(--font-display);font-size:40px;letter-spacing:.02em">METACULUS FORECASTING</div></div>
  <div class="fam"><div class="lbl">Type scale</div>${sizes
    .map((s) => `<div class="sz"><span class="t">${s}</span><span style="font-family:var(--font-sans);font-size:var(--text-${s})">Metaculus ${s}</span></div>`)
    .join("")}</div>
</body></html>
`
  );
}

console.error(
  `tokens: ${leaves.length} colors (${light.length} light / ${dark.length} dark), ${families.length} family cards + typography → ${OUT}`
);
