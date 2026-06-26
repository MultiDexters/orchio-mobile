import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarRange, ChevronRight, Sparkles, Target } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EnergyMeter } from '@/components/energy/EnergyMeter';
import { PlanBlocks } from '@/components/plan/PlanBlocks';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useProfile } from '@/hooks/useProfile';
import { usePlan, useGeneratePlan } from '@/hooks/usePlan';
import { useEnergy, useLogEnergy } from '@/hooks/useEnergy';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { rankTopTasks } from '@/api/tasks';
import { latestEnergy } from '@/api/energy';
import { toast } from '@/stores/toastStore';
import type { EnergyLevel } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const router = useRouter();
  const profile = useProfile();
  const plan = usePlan();
  const energy = useEnergy();
  const tasks = useTasks();
  const generatePlan = useGeneratePlan();
  const logEnergy = useLogEnergy();
  const updateStatus = useUpdateTaskStatus();

  const current = energy.data ? latestEnergy(energy.data) : null;
  const top = rankTopTasks(tasks.data ?? [], 3);
  const refreshing =
    plan.isRefetching || energy.isRefetching || tasks.isRefetching;

  const onRefresh = () => {
    plan.refetch();
    energy.refetch();
    tasks.refetch();
  };

  const onLogEnergy = (v: EnergyLevel) => {
    logEnergy.mutate(
      { level: v },
      { onSuccess: () => toast(`Energy logged ${v}/5`, 'success') },
    );
  };

  const onPlan = () => {
    generatePlan.mutate(Boolean(plan.data), {
      onSuccess: () => toast(plan.data ? 'Plan reshuffled' : 'Plan ready', 'success'),
      onError: (e) => toast((e as Error).message, 'error'),
    });
  };

  return (
    <ScreenContainer className="px-0">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B8DEF" />
        }
      >
        <View className="mb-5 mt-2">
          <Text className="text-base text-ink/50 dark:text-paper/50">
            {greeting()},
          </Text>
          <Text className="text-3xl font-bold text-ink dark:text-paper">
            {profile.data?.full_name ?? 'there'} 👋
          </Text>
        </View>

        {/* Energy */}
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-ink dark:text-paper">
              How's your energy?
            </Text>
            {current ? (
              <Pill label={`Last: ${current.energy_level}/5`} tone="mint" />
            ) : null}
          </View>
          <EnergyMeter value={current?.energy_level ?? null} onChange={onLogEnergy} />
        </Card>

        {/* Brief / plan */}
        <Card className="mb-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Sparkles size={18} color="#F2B441" />
            <Text className="text-base font-bold text-ink dark:text-paper">
              Morning brief
            </Text>
          </View>
          {plan.data?.morning_brief ? (
            <>
              <Text className="text-[15px] leading-5 text-ink/80 dark:text-paper/80">
                {plan.data.morning_brief}
              </Text>
              <View className="mt-3">
                <PlanBlocks blocks={plan.data.blocks ?? []} />
              </View>
              <Button
                label="Reshuffle plan"
                variant="secondary"
                onPress={onPlan}
                loading={generatePlan.isPending}
                className="mt-4"
              />
            </>
          ) : (
            <>
              <Text className="mb-3 text-[15px] leading-5 text-ink/60 dark:text-paper/60">
                No plan yet. I’ll build an energy-aware schedule from your tasks.
              </Text>
              <Button
                label="Plan my day"
                onPress={onPlan}
                loading={generatePlan.isPending}
                icon={<CalendarRange size={18} color="#fff" />}
              />
            </>
          )}
        </Card>

        {/* Top tasks */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink dark:text-paper">
            Top priorities
          </Text>
          <Button
            label="All tasks"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.navigate('/(app)/tasks')}
            icon={<ChevronRight size={16} color="#5B8DEF" />}
          />
        </View>
        {top.length > 0 ? (
          top.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onCycleStatus={(id, status) => updateStatus.mutate({ id, status })}
            />
          ))
        ) : (
          <Card>
            <View className="flex-row items-center gap-3">
              <Target size={20} color="#8A95A5" />
              <Text className="flex-1 text-sm text-ink/60 dark:text-paper/60">
                No tasks yet. Say “Hi” then tell me what’s on your mind, or add
                one in Tasks.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
