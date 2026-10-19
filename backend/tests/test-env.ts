/** Shared by the global setup (starts Postgres) and the per-file env setup (points the app at it). */
export const TEST_DB_PORT = 54329
export const TEST_DB_NAME = 'healthnexus_test'
export const TEST_DATABASE_URL = `postgresql://postgres:postgres@localhost:${TEST_DB_PORT}/${TEST_DB_NAME}`
