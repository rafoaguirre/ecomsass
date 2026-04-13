import { createApiClient } from '@ecomsaas/api-client';
import { createClient } from '@/lib/supabase/server';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }

  return {};
}

export const serverApi = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  getAuthHeaders,
});
