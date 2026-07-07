/**
 * Environment-backed configuration. Credentials live only in .env (gitignored) —
 * never hardcode a connection string or key in source.
 */
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mandatebench',
  },
  cors: {
    origin:
      process.env.CORS_ORIGIN ||
      'http://localhost:3000,https://mandatebench.xyz,https://www.mandatebench.xyz',
  },
  study: {
    snapshotTag: process.env.SNAPSHOT_TAG || 'v1',
    budgetUsd: Number(process.env.RUNNER_BUDGET_USD ?? '10'),
  },
});
