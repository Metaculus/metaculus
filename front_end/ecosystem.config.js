module.exports = {
  apps: [
    {
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: process.env.NODE_INSTANCES ?? 1,
      exec_mode: "cluster",
      interpreter_args: `--max-old-space-size=${process.env.NODE_HEAP_SIZE ?? 1024}`,
      max_memory_restart: "2280M",
      env: {
        PORT: 3000,
      },
    },
  ],
};
