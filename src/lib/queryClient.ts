import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Central place for query keys so invalidation stays consistent. */
export const qk = {
  profile: ['profile'] as const,
  preferences: ['preferences'] as const,
  tasks: ['tasks'] as const,
  topTasks: ['tasks', 'top'] as const,
  energy: ['energy'] as const,
  plan: (date: string) => ['plan', date] as const,
  chat: ['chat'] as const,
  goals: ['goals'] as const,
  notes: ['notes'] as const,
};
