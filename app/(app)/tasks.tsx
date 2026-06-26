import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Plus, ListTodo } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskItem } from '@/components/tasks/TaskItem';
import {
  useTasks,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/useTasks';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import type { Task, TaskStatus } from '@/types';

const FILTERS: { key: 'all' | TaskStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To do' },
  { key: 'in_progress', label: 'Doing' },
  { key: 'completed', label: 'Done' },
];

export default function Tasks() {
  const tasks = useTasks();
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');

  const onAdd = () => {
    const t = title.trim();
    if (!t) return;
    createTask.mutate(
      { title: t, source: 'manual' },
      {
        onSuccess: () => {
          setTitle('');
          toast('Task added', 'success');
        },
        onError: (e) => toast((e as Error).message, 'error'),
      },
    );
  };

  const onLongPress = (task: Task) => {
    deleteTask.mutate(task.id, { onSuccess: () => toast('Task deleted') });
  };

  const list = (tasks.data ?? []).filter((t) =>
    filter === 'all' ? true : t.status === filter,
  );

  return (
    <ScreenContainer className="px-0">
      <View className="px-5 pb-2 pt-2">
        <Text className="mb-3 text-3xl font-bold text-ink dark:text-paper">
          Tasks
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Add a task…"
              returnKeyType="done"
              onSubmitEditing={onAdd}
            />
          </View>
          <Pressable
            onPress={onAdd}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-brand active:bg-brand-deep"
          >
            {createTask.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Plus size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        <View className="mt-3 flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={cn(
                'rounded-full px-3 py-1.5',
                filter === f.key
                  ? 'bg-brand'
                  : 'bg-ink/5 dark:bg-paper/10',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  filter === f.key ? 'text-white' : 'text-ink/60 dark:text-paper/60',
                )}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasks.isRefetching}
            onRefresh={tasks.refetch}
            tintColor="#5B8DEF"
          />
        }
      >
        {list.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={36} color="#8A95A5" />}
            title={filter === 'all' ? 'No tasks yet' : 'Nothing here'}
            subtitle="Add a task above, or say “Hi” and tell me what to do."
          />
        ) : (
          list.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onCycleStatus={(id, status: TaskStatus) =>
                updateStatus.mutate({ id, status })
              }
              onLongPress={onLongPress}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
