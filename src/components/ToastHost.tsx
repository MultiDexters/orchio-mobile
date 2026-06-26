import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';
import { useToastStore, type ToastItem } from '@/stores/toastStore';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
} as const;

const ACCENT = {
  success: '#3FBF9F',
  info: '#5B8DEF',
  error: '#E8657A',
} as const;

function Toast({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[item.kind];

  useEffect(() => {
    const h = setTimeout(() => dismiss(item.id), 2800);
    return () => clearTimeout(h);
  }, [item.id, dismiss]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -16, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -16 }}
      transition={{ type: 'timing', duration: 220 }}
      className="mb-2 flex-row items-center gap-2.5 self-center rounded-2xl bg-ink px-4 py-3 dark:bg-ink-card"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <Icon size={18} color={ACCENT[item.kind]} />
      <Text className="max-w-[280px] text-sm font-medium text-white">
        {item.text}
      </Text>
    </MotiView>
  );
}

/** Mount once near the root. Renders the toast stack at the top. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={['top']}
      className="absolute inset-x-0 top-0 z-50 items-center"
    >
      <View pointerEvents="box-none" className="mt-2 w-full items-center px-4">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </View>
    </SafeAreaView>
  );
}
