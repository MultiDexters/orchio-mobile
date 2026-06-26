import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { getPreferences, getProfile, upsertPreferences } from '@/api/profile';
import type { Preferences } from '@/types';

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: getProfile });
}

export function usePreferences() {
  return useQuery({ queryKey: qk.preferences, queryFn: getPreferences });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      patch: Partial<Omit<Preferences, 'user_id' | 'updated_at'>>,
    ) => upsertPreferences(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.preferences }),
  });
}
