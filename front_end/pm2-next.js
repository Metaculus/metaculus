/* eslint-disable @typescript-eslint/no-require-imports -- CJS on purpose: pm2 loads this entrypoint via require, and a static `import` of the next bin would hoist above the argv fix below and re-break `next start` */
// Production entrypoint for Next.js under pm2-runtime, working around two
// pm2 bugs with `pm2-runtime start ecosystem.config.js` (no-daemon mode):
//
// 1. pm2 leaks its own CLI positionals into cluster workers' argv, so workers
//    effectively run `next start ecosystem.config.js` and Next treats the
//    config filename as its [dir] argument and crash-loops. Pin argv.
//
// 2. pm2's periodic God worker (the thing that enforces max_memory_restart)
//    is only started on the daemonized code path, never in no-daemon mode —
//    so a memory limit must be enforced here: exceed it and exit; pm2
//    respawns the instance.
//
// The same interval emits a per-minute telemetry line. Mezmo parses the
// key=value pairs into queryable fields (rss_mb, heap_mb, external_mb, elu).
// elu is event-loop utilization (0..1) over the past minute — sustained
// values near 1 mean SSR is starving the event loop.
const { performance } = require("perf_hooks");

const rawMemoryLimit = Number(process.env.NODE_MEMORY_LIMIT_MB);
const MEMORY_LIMIT_MB =
  Number.isFinite(rawMemoryLimit) && rawMemoryLimit > 0 ? rawMemoryLimit : 3072;
if (process.env.NODE_MEMORY_LIMIT_MB && MEMORY_LIMIT_MB !== rawMemoryLimit) {
  console.warn(
    `[pm2-next] invalid NODE_MEMORY_LIMIT_MB=${JSON.stringify(process.env.NODE_MEMORY_LIMIT_MB)}; using ${MEMORY_LIMIT_MB}MB`
  );
}
const MB = 1048576;

let lastElu = performance.eventLoopUtilization();

setInterval(() => {
  const mem = process.memoryUsage();
  const rssMB = Math.round(mem.rss / MB);

  const elu = performance.eventLoopUtilization();
  const eluDelta = performance.eventLoopUtilization(elu, lastElu);
  lastElu = elu;

  console.log(
    `[pm2-next] telemetry pid=${process.pid} inst=${process.env.NODE_APP_INSTANCE ?? 0} ` +
      `rss_mb=${rssMB} heap_mb=${Math.round(mem.heapUsed / MB)} ` +
      `external_mb=${Math.round(mem.external / MB)} elu=${eluDelta.utilization.toFixed(3)}`
  );

  if (rssMB > MEMORY_LIMIT_MB) {
    console.error(
      `[pm2-next] RSS ${rssMB}MB exceeds limit ${MEMORY_LIMIT_MB}MB — exiting so pm2 restarts the instance`
    );
    process.exit(1);
  }
}, 60_000).unref();

process.argv = process.argv.slice(0, 2).concat("start");
require("next/dist/bin/next");
