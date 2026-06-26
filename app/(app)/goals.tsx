import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Plus, Target, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useGoals,
  useCreateGoal,
  useDeleteGoal,
} from '@/hooks/useGoals';
import { toast } from '@/stores/toastStore';

export default function Goals() {
  const goals = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const onAdd = () => {
    const t = title.trim();
    if (!t) return;
    createGoal.mutate(
      { title: t, description: desc.trim() || undefined },
      {
        onSuccess: () => {
          setTitle('');
          setDesc('');
          toast('Goal added', 'success');
        },
        onError: (e) => toast((e as Error).message, 'error'),
      },
    );
  };

  return (
    <ScreenContainer className="px-0">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={goals.isRefetching}
            onRefresh={goals.refetch}
            tintColor="#5B8DEF"
          />
        }
      >
        <Text className="mb-4 mt-2 text-3xl font-bold text-ink dark:text-paper">
          Goals
        </Text>

        <Card className="mb-4">
          <Text className="mb-2 text-base font-bold text-ink dark:text-paper">
            New goal
          </Text>
          <View className="gap-2">
            <Input value={title} onChangeText={setTitle} placeholder="What do you want to achieve?" />
            <Input
              value={desc}
              onChangeText={setDesc}
              placeholder="Why it matters (optional)"
            />
            <Pressable
              onPress={onAdd}
              className="h-11 flex-row items-center justify-center gap-1.5 rounded-2xl bg-brand active:bg-brand-deep"
            >
              {createGoal.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Plus size={18} color="#fff" />
                  <Text className="font-semibold text-white">Add goal</Text>
                </>
              )}
            </Pressable>
          </View>
        </Card>

        {(goals.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Target size={36} color="#8A95A5" />}
            title="No goals yet"
            subtitle="Add one above, or tell Orchio about a goal in Chat."
          />
        ) : (
          (goals.data ?? []).map((g) => (
            <Card key={g.id} className="mb-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-ink dark:text-paper">
                    {g.title}
                  </Text>
                  {g.description ? (
                    <Text className="mt-0.5 text-sm text-ink/55 dark:text-paper/55">
                      {g.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    deleteGoal.mutate(g.id, { onSuccess: () => toast('Goal removed') })
                  }
                >
                  <Trash2 size={18} color="#E8657A" />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
