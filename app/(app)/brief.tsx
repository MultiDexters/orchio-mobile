import { Pressable, ScrollView, Text, View } from 'react-native';
import { Sparkles, Volume2, Square, CalendarRange } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlanBlocks } from '@/components/plan/PlanBlocks';
import { usePlan, useGeneratePlan } from '@/hooks/usePlan';
import { usePlaybackStore } from '@/stores/playbackStore';
import { toast } from '@/stores/toastStore';

export default function Brief() {
  const plan = usePlan();
  const generatePlan = useGeneratePlan();
  const playingId = usePlaybackStore((s) => s.playingId);
  const toggle = usePlaybackStore((s) => s.toggle);

  const brief = plan.data?.morning_brief;
  const isPlaying = playingId === 'brief';

  const onGenerate = () => {
    generatePlan.mutate(Boolean(plan.data), {
      onSuccess: () => toast(plan.data ? 'Plan reshuffled' : 'Brief ready', 'success'),
      onError: (e) => toast((e as Error).message, 'error'),
    });
  };

  return (
    <ScreenContainer className="px-0">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 mt-2 text-3xl font-bold text-ink dark:text-paper">
          Morning brief
        </Text>

        {brief ? (
          <>
            <Card className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={18} color="#F2B441" />
                  <Text className="text-base font-bold text-ink dark:text-paper">
                    Today
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggle('brief', brief)}
                  hitSlop={8}
                  className="flex-row items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1.5"
                >
                  {isPlaying ? (
                    <Square size={13} color="#5B8DEF" fill="#5B8DEF" />
                  ) : (
                    <Volume2 size={15} color="#5B8DEF" />
                  )}
                  <Text className="text-xs font-semibold text-brand">
                    {isPlaying ? 'Stop' : 'Listen'}
                  </Text>
                </Pressable>
              </View>
              <Text className="text-[15px] leading-6 text-ink/80 dark:text-paper/80">
                {brief}
              </Text>
            </Card>

            <Card className="mb-4">
              <Text className="mb-3 text-base font-bold text-ink dark:text-paper">
                Your plan
              </Text>
              <PlanBlocks blocks={plan.data?.blocks ?? []} />
            </Card>

            <Button
              label="Reshuffle my plan"
              variant="secondary"
              onPress={onGenerate}
              loading={generatePlan.isPending}
            />
          </>
        ) : (
          <Card>
            <EmptyState
              icon={<CalendarRange size={36} color="#8A95A5" />}
              title="No brief yet"
              subtitle="Generate an energy-aware plan and a short morning brief from your tasks."
            />
            <Button
              label="Plan my day"
              onPress={onGenerate}
              loading={generatePlan.isPending}
            />
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
