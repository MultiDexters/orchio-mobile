import { cssInterop } from 'nativewind';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * NativeWind v4 only wires `className` into core React Native components
 * automatically. Third-party components must opt in via cssInterop, or their
 * classNames are silently ignored. Register the ones we style with className.
 * Import this ONCE, early (see app/_layout.tsx).
 */
cssInterop(MotiView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
