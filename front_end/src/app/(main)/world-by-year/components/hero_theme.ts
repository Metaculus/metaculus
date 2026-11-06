import cn from "@/utils/core/cn";

export const HERO_THEME_CLASSNAME = cn(
  "[--wby-pad:clamp(16px,4vw,40px)]",
  "[--wby-bg:#fbfaf7] [--wby-card:#ffffff] [--wby-ink:44,73,105] [--wby-fg:#2c4969] [--wby-fg2:#34506e] [--wby-fg3:#2c4969]",
  "[--wby-t1:#3e5873] [--wby-t2:#4d657e] [--wby-t3:#6b7d92] [--wby-muted:#7a899c] [--wby-dim:#8c99a9] [--wby-year:#161b21]",
  "[--wby-cap:#c9408f] [--wby-use:#0f8a65]",
  "[--wby-line:rgba(44,73,105,.16)] [--wby-line2:rgba(44,73,105,.32)] [--wby-tick:rgba(44,73,105,.42)]",
  "[--wby-glass:rgba(255,255,255,.55)] [--wby-glass-shadow:rgba(44,73,105,.08)] [--wby-pop-shadow:rgba(44,73,105,.18)]",
  "[--wby-frost:rgba(251,250,247,.55)] [--wby-frost-hover:rgba(251,250,247,.75)] [--wby-handle-dot:rgba(255,255,255,.9)]",
  "dark:[--wby-bg:#1c2127] dark:[--wby-card:#252b33] dark:[--wby-ink:255,255,255] dark:[--wby-fg:#f3f4f6] dark:[--wby-fg2:#eef0f3] dark:[--wby-fg3:#e8ebef]",
  "dark:[--wby-t1:#c3cad3] dark:[--wby-t2:#b3bbc6] dark:[--wby-t3:#9ba4b0] dark:[--wby-muted:#8791a0] dark:[--wby-dim:#77818e] dark:[--wby-year:#ffffff]",
  "dark:[--wby-cap:#f08cc4] dark:[--wby-use:#52cfa0]",
  "dark:[--wby-line:rgba(255,255,255,.13)] dark:[--wby-line2:rgba(255,255,255,.26)] dark:[--wby-tick:rgba(255,255,255,.36)]",
  "dark:[--wby-glass:rgba(37,43,51,.58)] dark:[--wby-glass-shadow:rgba(0,0,0,.18)] dark:[--wby-pop-shadow:rgba(0,0,0,.28)]",
  "dark:[--wby-frost:rgba(28,33,39,.55)] dark:[--wby-frost-hover:rgba(28,33,39,.75)] dark:[--wby-handle-dot:rgba(0,0,0,.5)]"
);

export const GRAIN_IMAGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const bgMix = (percent: number) =>
  `color-mix(in srgb, var(--wby-bg) ${percent}%, transparent)`;

// Fades the aurora out behind the timeline so the cards stay legible.
export const STAGE_FADE_IMAGE = `linear-gradient(to bottom, transparent 0, ${bgMix(12)} 70px, ${bgMix(38)} 150px, ${bgMix(66)} 240px, ${bgMix(84)} 340px, ${bgMix(90)} 440px, ${bgMix(90)} calc(100% - 320px), ${bgMix(96)} calc(100% - 200px), ${bgMix(99)} calc(100% - 110px), var(--wby-bg) calc(100% - 50px))`;

export const GLASS_CARD_CLASSNAME = cn(
  "rounded-md border border-[rgba(var(--wby-ink),.07)] bg-[var(--wby-glass)] px-[13px] py-[11px] shadow-[0_10px_30px_var(--wby-glass-shadow)]",
  "before:absolute before:inset-0 before:z-0 before:rounded-[inherit] before:bg-inherit before:backdrop-blur-[18px] before:backdrop-saturate-[1.3] before:content-['']"
);
