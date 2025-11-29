import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: async () => {
        // Remove session cookie
        const cookie = 'oidc_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'

        return redirect({
          to: '/',
          headers: {
            'Set-Cookie': cookie,
          },
        })
      },
    },
  },
})

