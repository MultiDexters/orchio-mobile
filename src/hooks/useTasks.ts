import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import {
  createTask,
  deleteTask,
  listTasks,
  updateTaskStatus,
  type NewTaskInput,
} from '@/api/tasks';
import type { TaskStatus } from '@/types';

export function useTasks() {
  return useQuery({ queryKey: qk.tasks, queryFn: listTasks });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTaskInput) => createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}
