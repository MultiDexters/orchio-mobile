import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  /** Begin listening to Supabase auth changes. Returns an unsubscribe fn. */
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  initializing: true,

  init: () => {
    // Pull any persisted session first.
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        initializing: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        initializing: false,
      });
    });

    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // The DB trigger reads raw_user_meta_data->>'full_name'.
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw error;

    // Best-effort profile row (the DB trigger also creates one; this keeps
    // the name in sync if the user signed up while already confirmed).
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, email: email.trim(), full_name: name.trim() },
          { onConflict: 'id' },
        );
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
    void get; // keep signature stable
  },
}));
