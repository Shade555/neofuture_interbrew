import { supabase } from './supabaseClient';

// Increment the user's streak once per calendar day. Stores a small metadata
// object inside `graph_data.streak_meta.last_increment` (YYYY-MM-DD) so we
// don't need to change DB schema. Emits a `streak:updated` CustomEvent on success.
export async function tryIncrementStreak() {
  try {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_dashboards')
      .select('streak, graph_data')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.debug('tryIncrementStreak: failed to read dashboard', error);
      return;
    }

    const streak = Number(data?.streak || 0);
    const graph = data?.graph_data || {};
    const meta = (graph && graph.streak_meta) || {};
    const last = meta.last_increment;
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) return; // already incremented today

    const newStreak = streak + 1;
    graph.streak_meta = { ...(graph.streak_meta || {}), last_increment: today };

    const { error: upErr } = await supabase
      .from('user_dashboards')
      .update({ streak: newStreak, graph_data: graph })
      .eq('user_id', userId);
    if (upErr) {
      console.error('tryIncrementStreak: failed to update streak', upErr);
      return;
    }

    try { window.dispatchEvent(new CustomEvent('streak:updated', { detail: { streak: newStreak } })); } catch(e) {}
    return newStreak;
  } catch (e) {
    console.error('tryIncrementStreak error', e);
  }
}

export default tryIncrementStreak;
