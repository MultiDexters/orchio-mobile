import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/utils/cn';

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
}

/** Page wrapper with safe-area + calm background. */
export function ScreenContainer({
  children,
  className,
  edges = ['top'],
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={edges}
      className="flex-1 bg-paper dark:bg-ink"
    >
      <View className={cn('flex-1 px-5', className)}>{children}</View>
    </SafeAreaView>
  );
}
