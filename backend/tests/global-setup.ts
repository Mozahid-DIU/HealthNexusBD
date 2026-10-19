import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'
import { TEST_DATABASE_URL, TEST_DB_NAME, TEST_DB_PORT } from './test-env.ts'

/**
 * Starts a throwaway local PostgreSQL for the whole test run and applies every
 * migration (including the audit_logs triggers), so tests never touch the Neon DB.
 */
export default async function setup() {
  const databaseDir = mkdtempSync(path.join(os.tmpdir(), 'healthnexus-pg-'))
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: 'postgres',
    password: 'postgres',
    port: TEST_DB_PORT,
    persistent: false,
    // Match Neon: UTF-8 storage regardless of the Windows locale (default would be WIN1252).
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: () => {},
  })

  const cleanup = async () => {
    await pg.stop().catch(() => {})
    // On Windows the server can hold files for a moment after stop; retry, and never
    // fail the run over a leftover temp folder.
    try {
      rmSync(databaseDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 })
    } catch {
      // ignore: the OS cleans its temp directory
    }
  }

  try {
    await pg.initialise()
    await pg.start()
    await pg.createDatabase(TEST_DB_NAME)
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    })
  } catch (err) {
    // Don't leave a server holding the port, or every later run fails too.
    await cleanup()
    const stderr = (err as { stderr?: Buffer }).stderr?.toString()
    throw new Error(`Test database setup failed: ${stderr || String(err)}`)
  }

  return cleanup
}
