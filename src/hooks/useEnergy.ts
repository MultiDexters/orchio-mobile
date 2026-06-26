import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { listEnergy, logEnergy, type LogEnergyInput } from '@/api/energy';

export function useEnergy(limit = 30) {
  return useQuery({
    queryKey: [...qk.energy, limit],
    queryFn: () => listEnergy(limit),
  });
}

export function useLogEnergy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LogEnergyInput) => logEnergy(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.energy }),
  });
}
