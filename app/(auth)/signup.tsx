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
import { toast } from '@/stores/toastStore';

export default function Signup() {
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState('');
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
    if (!name || !email || password.length < 6) {
      setError('Enter your name, email, and a password (6+ characters).');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast('Account created — welcome to Orchio!', 'success');
    } catch (e) {
      setError((e as Error).message ?? 'Could not sign up.');
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
            <View className="mb-8">
              <Text className="text-3xl font-bold text-ink dark:text-paper">
                Create account
              </Text>
              <Text className="mt-1 text-base text-ink/50 dark:text-paper/50">
                Plan your day with your voice.
              </Text>
            </View>

            <View className="gap-3">
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                textContentType="name"
              />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                textContentType="newPassword"
                error={error}
              />
              <Button label="Create account" onPress={onSubmit} loading={loading} />
            </View>

            <View className="mt-6 flex-row justify-center gap-1">
              <Text className="text-ink/50 dark:text-paper/50">
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="font-semibold text-brand">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
