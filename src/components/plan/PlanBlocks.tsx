import { Text, View } from 'react-native';
import type { PlanBlock } from '@/types';
import { cn } from '@/utils/cn';

const KIND_COLOR: Record<NonNullable<PlanBlock['kind']>, string> = {
  focus: '#5B8DEF',
  break: '#3FBF9F',
  admin: '#F2B441',
  buffer: '#9B8CFF',
};

export function PlanBlocks({ blocks }: { blocks: PlanBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <Text className="text-sm text-ink/45 dark:text-paper/45">
        No time blocks yet.
      </Text>
    );
  }
  return (
    <View className="gap-2">
      {blocks.map((b, i) => {
        const color = KIND_COLOR[b.kind ?? 'focus'];
        return (
          <View key={`${b.start}-${i}`} className="flex-row gap-3">
            <View className="w-14 pt-0.5">
              <Text className="text-xs font-semibold text-ink/70 dark:text-paper/70">
                {b.start}
              </Text>
              <Text className="text-[10px] text-ink/35 dark:text-paper/35">
                {b.end}
              </Text>
            </View>
            <View
              className="w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            <View className="flex-1 pb-1">
              <Text
                className={cn('text-[15px] font-medium text-ink dark:text-paper')}
              >
                {b.title}
              </Text>
              {b.kind ? (
                <Text className="text-xs capitalize text-ink/40 dark:text-paper/40">
                  {b.kind}
                  {b.energy_cost ? ` · ${b.energy_cost} energy` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
