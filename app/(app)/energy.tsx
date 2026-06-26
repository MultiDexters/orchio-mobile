import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Activity, BatteryMedium } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { EnergyMeter } from '@/components/energy/EnergyMeter';
import { useEnergy, useLogEnergy } from '@/hooks/useEnergy';
import { ENERGY_EMOJI, ENERGY_LABEL } from '@/utils/energy';
import { formatWhen } from '@/utils/strings';
import { toast } from '@/stores/toastStore';
import type { EnergyLevel } from '@/types';

const BAR_COLOR: Record<EnergyLevel, string> = {
  1: '#E8657A',
  2: '#F2884B',
  3: '#F2B441',
  4: '#7FC98B',
  5: '#3FBF9F',
};

export default function Energy() {
  const energy = useEnergy(60);
  const logEnergy = useLogEnergy();
  const [selected, setSelected] = useState<EnergyLevel | null>(null);

  const logs = energy.data ?? [];
  const trend = [...logs].slice(0, 14).reverse();

  const onLog = () => {
    if (selected == null) return;
    logEnergy.mutate(
      { level: selected },
      {
        onSuccess: () => {
          toast(`Energy logged ${selected}/5`, 'success');
          setSelected(null);
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
            refreshing={energy.isRefetching}
            onRefresh={energy.refetch}
            tintColor="#5B8DEF"
          />
        }
      >
        <Text className="mb-4 mt-2 text-3xl font-bold text-ink dark:text-paper">
          Energy
        </Text>

        <Card className="mb-4">
          <Text className="mb-3 text-base font-bold text-ink dark:text-paper">
            Log your energy
          </Text>
          <EnergyMeter value={selected} onChange={setSelected} />
          <Button
            label={selected ? `Log ${selected}/5` : 'Pick a level'}
            onPress={onLog}
            disabled={selected == null}
            loading={logEnergy.isPending}
            className="mt-4"
          />
        </Card>

        {/* Trend */}
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Activity size={18} color="#5B8DEF" />
            <Text className="text-base font-bold text-ink dark:text-paper">
              Recent trend
            </Text>
          </View>
          {trend.length === 0 ? (
            <Text className="text-sm text-ink/45 dark:text-paper/45">
              Log a few times to see your trend.
            </Text>
          ) : (
            <View className="h-28 flex-row items-end justify-between gap-1.5">
              {trend.map((l) => (
                <View key={l.id} className="flex-1 items-center justify-end">
                  <View
                    style={{
                      width: '70%',
                      height: `${(l.energy_level / 5) * 100}%`,
                      backgroundColor: BAR_COLOR[l.energy_level as EnergyLevel],
                      borderRadius: 6,
                      minHeight: 6,
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* History */}
        <Text className="mb-2 text-base font-bold text-ink dark:text-paper">
          History
        </Text>
        {logs.length === 0 ? (
          <EmptyState
            icon={<BatteryMedium size={36} color="#8A95A5" />}
            title="No energy logs yet"
            subtitle="Say “I’m feeling low” or use the meter above."
          />
        ) : (
          logs.map((l) => (
            <View
              key={l.id}
              className="mb-2 flex-row items-center gap-3 rounded-2xl border border-paper-card bg-white px-3.5 py-3 dark:border-ink-card dark:bg-ink-card"
            >
              <Text className="text-2xl">
                {ENERGY_EMOJI[l.energy_level as EnergyLevel]}
              </Text>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-ink dark:text-paper">
                  {ENERGY_LABEL[l.energy_level as EnergyLevel]} · {l.energy_level}/5
                </Text>
                {l.note ? (
                  <Text
                    numberOfLines={1}
                    className="text-xs text-ink/50 dark:text-paper/50"
                  >
                    {l.note}
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-ink/40 dark:text-paper/40">
                {formatWhen(l.logged_at)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
