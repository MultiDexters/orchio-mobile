import { Text, View } from 'react-native';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="items-center justify-center py-16">
      {icon ? <View className="mb-3 opacity-60">{icon}</View> : null}
      <Text className="text-center text-base font-semibold text-ink dark:text-paper">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 max-w-[260px] text-center text-sm text-ink/50 dark:text-paper/50">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
