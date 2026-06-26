import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { cn } from '@/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text className="mb-1.5 ml-1 text-sm font-medium text-ink/70 dark:text-paper/70">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        className={cn(
          'h-12 rounded-2xl border border-paper-card bg-white px-4 text-base text-ink',
          'dark:border-ink-card dark:bg-ink-soft dark:text-paper',
          error && 'border-calm-rose',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text className="mt-1 ml-1 text-xs text-calm-rose">{error}</Text>
      ) : null}
    </View>
  );
}
