import { View, type ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

interface CardProps extends ViewProps {
  className?: string;
  padded?: boolean;
}

/** Rounded, soft-shadow surface — the base of the calm UI. */
export function Card({ className, padded = true, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          shadowColor: '#0B0F14',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
      className={cn(
        'rounded-2xl border border-paper-card bg-white dark:border-ink-card dark:bg-ink-card',
        padded && 'p-4',
        className,
      )}
      {...rest}
    />
  );
}
