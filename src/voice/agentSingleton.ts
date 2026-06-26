import { router } from 'expo-router';
import { queryClient, qk } from '@/lib/queryClient';
import { toast } from '@/stores/toastStore';
import { useUiStore } from '@/stores/uiStore';
import { sendChatMessage, savedSummary } from '@/api/chat';
import { logEnergy as apiLogEnergy } from '@/api/energy';
import { generatePlan as apiGeneratePlan, getPlan } from '@/api/plan';
import { fetchTopTasks, listTasks, rankTopTasks } from '@/api/tasks';
import { stripMarkdown } from '@/utils/markdown';
import { VoiceAgent, type AgentActions } from './VoiceAgent';
import type { AppRoute } from './intents';

const ROUTE_HREF: Record<AppRoute, string> = {
  today: '/(app)/today',
  tasks: '/(app)/tasks',
  energy: '/(app)/energy',
  chat: '/(app)/chat',
  goals: '/(app)/goals',
  brief: '/(app)/brief',
  settings: '/(app)/settings',
};

function speakableTopTasks(titles: string[]): string {
  if (titles.length === 0) {
    return "You don't have any active tasks right now. Want to add one?";
  }
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
  const lines = titles.map((t, i) => `${ordinals[i] ?? `${i + 1}`}, ${t}.`);
  return `Here are your top ${titles.length === 1 ? 'task' : `${titles.length}`}. ${lines.join(' ')}`;
}

const actions: AgentActions = {
  navigate: (route) => {
    try {
      router.navigate(ROUTE_HREF[route] as never);
    } catch {
      /* navigation may fail if not mounted yet */
    }
  },

  sendChat: async (text) => {
    const res = await sendChatMessage(text);
    queryClient.invalidateQueries({ queryKey: qk.chat });
    queryClient.invalidateQueries({ queryKey: qk.tasks });
    queryClient.invalidateQueries({ queryKey: qk.goals });
    queryClient.invalidateQueries({ queryKey: qk.energy });
    return {
      reply: stripMarkdown(res.reply) || 'Okay.',
      savedSummary: savedSummary(res) ?? undefined,
    };
  },

  logEnergy: async (level, opts) => {
    await apiLogEnergy({ level, mood: opts?.mood ?? null, note: opts?.note ?? null });
    queryClient.invalidateQueries({ queryKey: qk.energy });
  },

  generatePlan: async (reshuffle) => {
    const plan = await apiGeneratePlan(reshuffle);
    queryClient.invalidateQueries({ queryKey: qk.plan(plan.plan_date) });
    queryClient.invalidateQueries({ queryKey: qk.tasks });
    return stripMarkdown(plan.morning_brief);
  },

  getTopTasksSpeech: async () => {
    let top;
    try {
      top = await fetchTopTasks(3);
    } catch {
      top = rankTopTasks(await listTasks(), 3);
    }
    return speakableTopTasks(top.map((t) => t.title));
  },

  getBriefSpeech: async () => {
    let plan = await getPlan();
    if (!plan?.morning_brief) {
      // No brief yet — make one.
      try {
        plan = await apiGeneratePlan(false);
        queryClient.invalidateQueries({ queryKey: qk.plan(plan.plan_date) });
      } catch {
        return "You don't have a brief yet. Say 'plan my day' and I'll make one.";
      }
    }
    return stripMarkdown(plan?.morning_brief ?? '') || 'Your brief is empty.';
  },

  openCommands: () => useUiStore.getState().openCommands(),

  toast: (msg) => toast(msg),
};

let instance: VoiceAgent | null = null;

/** The single, app-wide voice agent. */
export function getVoiceAgent(): VoiceAgent {
  instance ??= new VoiceAgent(actions);
  return instance;
}
