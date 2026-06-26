import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';

type Tone = 'neutral' | 'brand' | 'mint' | 'amber' | 'rose' | 'violet';

const TONE: Record<Tone, string> = {
  neutral: 'bg-ink/5 dark:bg-paper/10',
  brand: 'bg-brand/15',
  mint: 'bg-calm-mint/15',
  amber: 'bg-calm-amber/15',
  rose: 'bg-calm-rose/15',
  violet: 'bg-calm-violet/15',
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink/70 dark:text-paper/70',
  brand: 'text-brand',
  mint: 'text-calm-mint',
  amber: 'text-calm-amber',
  rose: 'text-calm-rose',
  violet: 'text-calm-violet',
};

export function Pill({
  label,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1 self-start rounded-full px-2.5 py-1',
        TONE[tone],
        className,
      )}
    >
      {icon}
      <Text className={cn('text-xs font-semibold', TONE_TEXT[tone])}>{label}</Text>
    </View>
  );
}
