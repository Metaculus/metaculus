module.exports = {
  apps: [
    {
      script: "pm2-next.js",
      cwd: "./",
      instances: process.env.NODE_INSTANCES ?? 1,
      exec_mode: "cluster",
      interpreter_args: `--max-old-space-size=${process.env.NODE_HEAP_SIZE ?? 1024}`,
      env: {
        PORT: 3000,
      },
    },
  ],
};
