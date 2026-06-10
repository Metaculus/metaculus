/**
 * Regenerates the raster logo assets that cannot use the inline React SVGs
 * (favicon, email header PNGs, AI-leaderboard PNG) from the master SVGs in
 * src/components/logos/. Run after changing the logo art:
 *
 *   node scripts/generate-logo-rasters.mjs
 *
 * Baked colors (rasters can't inherit currentColor):
 *   - favicon:        white M on blue-800 (#2f4155), padded square
 *   - email outlined: white boxed-M on transparent
 *   - AI-leaderboard: near-white (#f9fbfb) M on blue-900 (#283441) square
 *
 * The .ico is assembled by hand (PNG-in-ICO) to avoid an extra dependency.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const MARK_SVG = readFileSync(
  resolve(root, "src/components/logos/metaculus_mark.svg"),
  "utf8"
);
const BOXED_SVG = readFileSync(
  resolve(root, "src/components/logos/metaculus_mark_boxed.svg"),
  "utf8"
);

const MARK_RATIO = 13 / 17; // bare-M viewBox aspect ratio (w/h)

// Recolor currentColor and pin an explicit pixel size so librsvg rasterizes
// crisply at the target resolution (no upscaling from the tiny viewBox).
function sizedSvg(svg, color, width, height) {
  const recolored = svg.replace(/currentColor/g, color);
  return Buffer.from(
    recolored.replace(/<svg /, `<svg width="${width}" height="${height}" `)
  );
}

// Bare-M at a given ink height, width preserving aspect ratio.
function markPng(color, heightPx) {
  const width = Math.round(heightPx * MARK_RATIO);
  return sharp(sizedSvg(MARK_SVG, color, width, heightPx))
    .png()
    .toBuffer();
}

// Round to the nearest EVEN integer. The favicon squares are even-sized, so an
// even mark leaves an even gap on each side → it centers exactly on the pixel
// grid. An odd mark leaves a half-pixel gap that can't be centered and reads as
// ~1px off at small sizes (notably the 16px frame).
function evenRound(value) {
  return 2 * Math.round(value / 2);
}

// One favicon frame: white M exactly centered on a padded blue-800 square.
async function faviconFrame(size) {
  const markH = evenRound(size * 0.65); // M height as a fraction of the icon; raise to enlarge
  const markW = evenRound(markH * MARK_RATIO);
  const mark = await sharp(sizedSvg(MARK_SVG, "#ffffff", markW, markH))
    .png()
    .toBuffer();
  const buffer = await sharp({
    create: { width: size, height: size, channels: 4, background: "#2f4155" },
  })
    .composite([
      { input: mark, left: (size - markW) / 2, top: (size - markH) / 2 },
    ])
    .png()
    .toBuffer();
  return { size, buffer };
}

// Assemble a multi-resolution .ico that embeds PNG frames directly.
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;
  frames.forEach((frame, i) => {
    const e = i * 16;
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, e + 0); // width
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, e + 1); // height
    directory.writeUInt8(0, e + 2); // palette colors
    directory.writeUInt8(0, e + 3); // reserved
    directory.writeUInt16LE(1, e + 4); // color planes
    directory.writeUInt16LE(32, e + 6); // bits per pixel
    directory.writeUInt32LE(frame.buffer.length, e + 8); // image byte length
    directory.writeUInt32LE(offset, e + 12); // image byte offset
    offset += frame.buffer.length;
  });

  return Buffer.concat([header, directory, ...frames.map((f) => f.buffer)]);
}

async function main() {
  // 1) favicon.ico — multi-resolution
  const frames = await Promise.all([16, 32, 48, 128].map(faviconFrame));
  writeFileSync(resolve(root, "src/app/favicon.ico"), buildIco(frames));

  // 2) email header — white boxed-M on transparent, 1x + 2x
  for (const [name, size] of [
    ["metaculus_logo_outlined.png", 50],
    ["metaculus_logo_outlined@2x.png", 100],
  ]) {
    const buf = await sharp(sizedSvg(BOXED_SVG, "#ffffff", size, size))
      .png()
      .toBuffer();
    writeFileSync(resolve(root, "public/images", name), buf);
  }

  // 3) AI-leaderboard — near-white M on a solid blue-900 square (matches old art)
  const mark = await markPng("#f9fbfb", 36);
  const aib = await sharp({
    create: { width: 60, height: 60, channels: 4, background: "#283441" },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
  writeFileSync(
    resolve(root, "src/app/(main)/aib/assets/ai-models/metaculus_logo.png"),
    aib
  );

  console.log(
    "Logo rasters regenerated: favicon.ico, email PNGs, AI-leaderboard PNG."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
