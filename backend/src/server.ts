import { createApp } from './app.ts'
import { env } from './config/env.ts'
import { prisma } from './config/prisma.ts'
import { logger } from './utils/logger.ts'

async function bootstrap() {
  const app = createApp()

  // Verify DB connectivity before accepting traffic
  try {
    await prisma.$connect()
    logger.info('✅ Database connected')
  } catch (err) {
    logger.error({ err }, '❌ Failed to connect to database — check DATABASE_URL in .env')
    process.exit(1)
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 HealthNexus BD API running at http://localhost:${env.PORT}`)
    logger.info(`   Health check: http://localhost:${env.PORT}/api/health`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      await prisma.$disconnect()
      logger.info('Closed connections. Bye 👋')
      process.exit(0)
    })
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error')
  process.exit(1)
})
