// Production entrypoint for Next.js under pm2-runtime, working around two
// pm2 bugs with `pm2-runtime start ecosystem.config.js` (no-daemon mode):
//
// 1. pm2 leaks its own CLI positionals into cluster workers' argv, so workers
//    effectively run `next start ecosystem.config.js` and Next treats the
//    config filename as its [dir] argument and crash-loops. Pin argv.
//
// 2. pm2's periodic God worker (the thing that enforces max_memory_restart)
//    is only started on the daemonized code path, never in no-daemon mode —
//    so the ecosystem's max_memory_restart is silently ignored. Enforce the
//    same limit here: exceed it and exit; pm2 respawns the instance.
const MEMORY_LIMIT_MB = Number(process.env.NODE_MEMORY_LIMIT_MB ?? 3072);

setInterval(() => {
  const rssMB = Math.round(process.memoryUsage.rss() / 1048576);
  if (rssMB > MEMORY_LIMIT_MB) {
    console.error(
      `[pm2-next] RSS ${rssMB}MB exceeds limit ${MEMORY_LIMIT_MB}MB — exiting so pm2 restarts the instance`
    );
    process.exit(1);
  }
}, 30_000).unref();

process.argv = process.argv.slice(0, 2).concat("start");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS on purpose: a static import would hoist above the argv fix and re-break `next start`
require("next/dist/bin/next");
