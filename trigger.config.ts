import { defineConfig } from '@trigger.dev/sdk/v3';
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';

export default defineConfig({
  project: 'proj_uaubkmlwaozfqvcanaki',
  runtime: 'node',
  logLevel: 'log',
  // Increase timeout for Printful API calls
  maxDuration: 60, // 60 seconds
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
    },
  },
  dirs: ['./src/trigger'],
  build: {
    extensions: [
      prismaExtension({
        mode: 'legacy', // Required for Prisma 5.x/6.x with prisma-client-js
        schema: 'prisma/schema.prisma',
        directUrlEnvVarName: 'DIRECT_DATABASE_URL',
      }),
    ],
  },
});
