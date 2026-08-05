import { createApp } from './app.js';
import { connectDB, disconnectDB } from './db/connect.js';
import { env } from './config/env.js';

async function start() {
  await connectDB();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 H2C API listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
