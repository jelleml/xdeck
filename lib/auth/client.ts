/**
 * Better Auth Client with Email OTP
 * Client-side auth utilities
 * See: https://www.better-auth.com/docs/integrations/next
 */
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  organizationClient,
} from 'better-auth/client/plugins';
import { customSessionClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { auth } from '@/lib/auth/providers';

/**
 * Better Auth client for use in React components with Email OTP support
 * Uses nano-store for state management and better-fetch for requests
 *
 * Automatically detects the current origin when in browser (for ngrok/tunnel support)
 * Falls back to NEXT_PUBLIC_APP_URL for SSR
 */
const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    emailOTPClient(),
    organizationClient({ schema: inferOrgAdditionalFields<typeof auth>() }),
    inferAdditionalFields<typeof auth>(),
    customSessionClient<typeof auth>(),
    adminClient(),
  ],
});

export const { useSession, signIn, signOut, emailOtp, organization } = authClient;
