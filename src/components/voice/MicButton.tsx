import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Mic, MicOff, Volume2 } from 'lucide-react-native';
import type { VoiceAgentState } from '@/stores/voiceStore';

const STATE_COLOR: Record<VoiceAgentState, string> = {
  OFF: '#5E6B7C',
  ARMED: '#5B8DEF',
  AWAKE: '#3FBF9F',
  THINKING: '#9B8CFF',
  SPEAKING: '#F2B441',
};

export function MicButton({
  state,
  onPress,
  size = 64,
}: {
  state: VoiceAgentState;
  onPress: () => void;
  size?: number;
}) {
  const color = STATE_COLOR[state];
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (state === 'AWAKE') {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [state, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.5,
    transform: [{ scale: 1 + pulse.value * 0.7 }],
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          ringStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
        className="items-center justify-center active:opacity-90"
      >
        {state === 'OFF' ? (
          <MicOff size={26} color="#fff" />
        ) : state === 'SPEAKING' ? (
          <Volume2 size={26} color="#fff" />
        ) : state === 'THINKING' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Mic size={26} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}
