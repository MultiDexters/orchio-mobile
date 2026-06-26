import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

/** Entry point — bounce to the right place based on auth. */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  return <Redirect href={user ? '/(app)/today' : '/(auth)/login'} />;
}
