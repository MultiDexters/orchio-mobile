import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { generatePlan, getPlan } from '@/api/plan';
import { todayDateString } from '@/utils/strings';

export function usePlan(date = todayDateString()) {
  return useQuery({ queryKey: qk.plan(date), queryFn: () => getPlan(date) });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  const date = todayDateString();
  return useMutation({
    mutationFn: (reshuffle: boolean) => generatePlan(reshuffle),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plan(date) });
      qc.invalidateQueries({ queryKey: qk.tasks });
    },
  });
}
