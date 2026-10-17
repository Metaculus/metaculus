/**
 * Prints the `frozen` block for a Global Health Monitor edition from the live Community
 * Prediction, so the edition keeps showing its publication-day numbers once it's no longer
 * the latest. Run it right before merging an edition and paste the output into the file.
 *
 *   bun run ghm:bake
 *
 * --api  API base URL (defaults to METACULUS_API_BASE_URL, then https://www.metaculus.com/api)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { fetchGhmPostsFromApi, getApiConfig } from "./api";
import {
  GHM_VALUE_KEYS,
  GHM_VALUES,
  ValueRef,
} from "../../src/app/(main)/global-health-monitor/config/questions";
import { FrozenValue } from "../../src/app/(main)/global-health-monitor/editions/types";
import {
  findQuestion,
  readLatestForecast,
} from "../../src/app/(main)/global-health-monitor/helpers/forecast_values";

function round(value: number, ref: ValueRef) {
  return ref.format.kind === "date"
    ? Math.round(value)
    : Math.round(value * 10_000) / 10_000;
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      api: { type: "string" },
      out: { type: "string", default: ".ghm" },
    },
  });

  const posts = await fetchGhmPostsFromApi(getApiConfig(args.api));
  const frozen: Record<string, FrozenValue> = {};

  for (const key of GHM_VALUE_KEYS) {
    const ref: ValueRef = GHM_VALUES[key];
    const question = findQuestion(posts.get(ref.postId), ref);
    const latest = question ? readLatestForecast(question, ref) : null;
    if (!latest) {
      continue;
    }
    frozen[key] = {
      value: round(latest.value, ref),
      ...(latest.lower !== null ? { lower: round(latest.lower, ref) } : {}),
      ...(latest.upper !== null ? { upper: round(latest.upper, ref) } : {}),
      ...(latest.bound ? { bound: latest.bound } : {}),
      ...(ref.option === "top" && latest.option
        ? { option: latest.option }
        : {}),
    };
  }

  const outDir = path.resolve(process.cwd(), args.out ?? ".ghm");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "frozen.json"),
    JSON.stringify(frozen, null, 2)
  );
  console.log(`asOf: "${new Date().toISOString()}",`);
  console.log(`frozen: ${JSON.stringify(frozen, null, 2)},`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
