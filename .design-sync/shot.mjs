import { chromium } from "../.ds-sync/node_modules/playwright/index.mjs";
const OUT = process.cwd() + "/ds-bundle";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 760, height: 900 } });
for (const [f, out] of [
  ["components/color/Gray/Gray.html", "gray"],
  ["components/color/McOption/McOption.html", "mc"],
  ["components/typography/Typography/Typography.html", "typo"],
]) {
  await p.goto("file://" + OUT + "/" + f, { waitUntil: "networkidle" });
  await p.screenshot({ path: `/private/tmp/claude-501/-Users-atakanseckin-Development-metaculus-front-end-src/68cee9ec-cce4-4b2c-847d-9dd0adefc1f1/scratchpad/card-${out}.png`, fullPage: true });
}
await b.close();
console.log("shots done");
