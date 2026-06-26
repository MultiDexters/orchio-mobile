import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-brand active:bg-brand-deep',
    text: 'text-white',
  },
  secondary: {
    container:
      'bg-paper-soft border border-paper-card active:opacity-80 dark:bg-ink-soft dark:border-ink-card',
    text: 'text-ink dark:text-paper',
  },
  ghost: {
    container: 'bg-transparent active:opacity-60',
    text: 'text-brand',
  },
  danger: {
    container: 'bg-calm-rose/15 active:bg-calm-rose/25',
    text: 'text-calm-rose',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className,
  fullWidth = true,
}: ButtonProps) {
  const v = VARIANT[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5',
        v.container,
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#5B8DEF'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={cn('text-base font-semibold', v.text)}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
