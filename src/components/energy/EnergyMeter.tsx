import { Pressable, Text, View } from 'react-native';
import { MotiView } from 'moti';
import type { EnergyLevel } from '@/types';
import { ENERGY_LABEL } from '@/utils/energy';
import { cn } from '@/utils/cn';

const BAR_COLOR: Record<EnergyLevel, string> = {
  1: '#E8657A',
  2: '#F2884B',
  3: '#F2B441',
  4: '#7FC98B',
  5: '#3FBF9F',
};

/** Tappable 1–5 energy selector with animated bars. */
export function EnergyMeter({
  value,
  onChange,
  size = 'md',
}: {
  value: EnergyLevel | null;
  onChange?: (v: EnergyLevel) => void;
  size?: 'sm' | 'md';
}) {
  const levels: EnergyLevel[] = [1, 2, 3, 4, 5];
  const barH = size === 'sm' ? 28 : 44;

  return (
    <View>
      <View className="flex-row items-end justify-between gap-2">
        {levels.map((lvl) => {
          const active = value != null && lvl <= value;
          return (
            <Pressable
              key={lvl}
              disabled={!onChange}
              onPress={() => onChange?.(lvl)}
              className="flex-1 items-center"
            >
              <MotiView
                animate={{
                  height: barH * (0.45 + lvl * 0.11),
                  backgroundColor: active ? BAR_COLOR[lvl] : 'rgba(140,149,165,0.18)',
                }}
                transition={{ type: 'timing', duration: 220 }}
                style={{ width: '100%', borderRadius: 10 }}
              />
              <Text
                className={cn(
                  'mt-1.5 text-xs font-semibold',
                  value === lvl
                    ? 'text-ink dark:text-paper'
                    : 'text-ink/40 dark:text-paper/40',
                )}
              >
                {lvl}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value != null ? (
        <Text className="mt-2 text-center text-sm font-medium text-ink/60 dark:text-paper/60">
          {ENERGY_LABEL[value]} · {value}/5
        </Text>
      ) : null}
    </View>
  );
}
