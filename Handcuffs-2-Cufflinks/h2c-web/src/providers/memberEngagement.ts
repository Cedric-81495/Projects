import { apiGet, getMemberAccessToken } from '@/lib/api/client';

/**
 * Pulls the member's saved reactions from the server.
 *
 * Kept out of MemberProvider.tsx so that file exports only a component and
 * Fast Refresh keeps working during development.
 */
export async function fetchMemberEngagement(): Promise<Record<string, string[]> | null> {
  if (!getMemberAccessToken()) return null;
  try {
    return await apiGet<Record<string, string[]>>('/members/me/engagement');
  } catch {
    return null;
  }
}
