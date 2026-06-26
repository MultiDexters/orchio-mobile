import { Pressable, Text, View } from 'react-native';
import { Circle, CircleDot, CheckCircle2, Clock } from 'lucide-react-native';
import type { EnergyCost, Task, TaskStatus } from '@/types';
import { Pill } from '@/components/ui/Pill';
import { ENERGY_COST_LABEL } from '@/utils/energy';
import { formatWhen } from '@/utils/strings';
import { cn } from '@/utils/cn';

// Tap cycles pending → in_progress → completed → pending.
const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
  cancelled: 'pending',
};

const COST_TONE: Record<EnergyCost, 'mint' | 'amber' | 'rose' | 'violet'> = {
  light: 'mint',
  moderate: 'amber',
  deep_focus: 'rose',
  admin: 'violet',
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'completed') return <CheckCircle2 size={22} color="#3FBF9F" />;
  if (status === 'in_progress') return <CircleDot size={22} color="#5B8DEF" />;
  return <Circle size={22} color="#8A95A5" />;
}

export function TaskItem({
  task,
  onCycleStatus,
  onLongPress,
}: {
  task: Task;
  onCycleStatus: (id: string, status: TaskStatus) => void;
  onLongPress?: (task: Task) => void;
}) {
  const done = task.status === 'completed';
  return (
    <Pressable
      onPress={() => onCycleStatus(task.id, NEXT_STATUS[task.status])}
      onLongPress={() => onLongPress?.(task)}
      className="mb-2 flex-row items-center gap-3 rounded-2xl border border-paper-card bg-white px-3.5 py-3 dark:border-ink-card dark:bg-ink-card"
    >
      <StatusIcon status={task.status} />
      <View className="flex-1">
        <Text
          numberOfLines={2}
          className={cn(
            'text-[15px] font-medium text-ink dark:text-paper',
            done && 'text-ink/40 line-through dark:text-paper/40',
          )}
        >
          {task.title}
        </Text>
        <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
          <Pill label={ENERGY_COST_LABEL[task.energy_cost]} tone={COST_TONE[task.energy_cost]} />
          {task.estimated_minutes ? (
            <Pill
              label={`${task.estimated_minutes}m`}
              tone="neutral"
              icon={<Clock size={11} color="#8A95A5" />}
            />
          ) : null}
          {task.deadline ? (
            <Pill label={formatWhen(task.deadline)} tone="brand" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
