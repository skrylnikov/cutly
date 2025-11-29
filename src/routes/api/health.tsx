import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../db'

export const Route = createFileRoute('/api/health' as any)({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Check database connectivity
          await prisma.$queryRaw`SELECT 1`
          
          return new Response(
            JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        } catch (error) {
          console.error('Health check failed:', error)
          return new Response(
            JSON.stringify({
              status: 'unhealthy',
              error: 'Database connection failed',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        }
      },
    },
  },
})

