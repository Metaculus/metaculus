module.exports = {
  apps: [
    {
      script: "pm2-next.js",
      cwd: "./",
      instances: process.env.NODE_INSTANCES ?? 1,
      exec_mode: "cluster",
      interpreter_args: `--max-old-space-size=${process.env.NODE_HEAP_SIZE ?? 1024}`,
      // Only enforced in daemonized mode (pm2 bug: the God worker that checks
      // this never starts under pm2-runtime) — pm2-next.js enforces the same
      // limit in production. Kept in sync via the shared env var.
      max_memory_restart: `${process.env.NODE_MEMORY_LIMIT_MB ?? 3072}M`,
      env: {
        PORT: 3000,
      },
    },
  ],
};
