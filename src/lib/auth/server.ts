// Login gerenciado da Neon (Better Auth). As contas ficam no próprio banco, no schema neon_auth.
import { createNeonAuth } from '@neon/auth/next/server'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    // A volta do Google é uma navegação vinda de outro site: com "strict" o cookie não iria junto.
    sameSite: 'lax',
  },
})
