import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthUrl, getClient } from '../../../lib/auth'
import { getBaseUrl } from '../../../lib/utils'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async () => {
        const oidcClient = await getClient()
        if (!oidcClient) {
          return new Response('OIDC not configured', { status: 500 })
        }

        const baseUrl = getBaseUrl()
        const redirectUri = `${baseUrl}/api/auth/callback`

        try {
          const { url, cookies } = await getAuthUrl(redirectUri)
          const headers = new Headers()
          cookies.forEach((cookie) => {
            headers.append('Set-Cookie', cookie)
          })
          return redirect({
            href: url,
            headers,
          })
        } catch (error) {
          console.error('Auth error:', error)
          return new Response('Authentication failed', { status: 500 })
        }
      },
    },
  },
})

