import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/env';

export default function Login() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('Supabase isn’t configured. Add your keys to .env.');
      return;
    }
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Root layout redirects on auth change.
    } catch (e) {
      setError((e as Error).message ?? 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 360 }}
          >
            <View className="mb-8 items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-brand">
                <View className="h-5 w-5 rounded-full bg-white" />
              </View>
              <Text className="text-3xl font-bold text-ink dark:text-paper">
                Orchio
              </Text>
              <Text className="mt-1 text-center text-base text-ink/50 dark:text-paper/50">
                Your energy-aware, voice-first day planner.
              </Text>
            </View>

            <View className="gap-3">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                error={error}
              />
              <Button label="Sign in" onPress={onSubmit} loading={loading} />
            </View>

            <View className="mt-6 flex-row justify-center gap-1">
              <Text className="text-ink/50 dark:text-paper/50">New here?</Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text className="font-semibold text-brand">Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
