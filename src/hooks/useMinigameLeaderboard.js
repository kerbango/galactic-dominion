import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const DAILY_LIMIT = 5;

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Shared leaderboard + daily-play-limit state for the Support-page minigames.
// Loads the combined top-5 scores and the caller's remaining plays for today,
// keeps them live via a realtime subscription, and exposes a submitScore
// helper that calls the backend function and refreshes state afterwards.
export function useMinigameLeaderboard() {
  const [top5, setTop5] = useState([]);
  const [remainingPlays, setRemainingPlays] = useState(DAILY_LIMIT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      const today = todayUTC();
      const [mine, all] = await Promise.all([
        base44.entities.MinigameScore.filter({ play_date: today, created_by_id: user.id }),
        base44.entities.MinigameScore.list('-score', 10),
      ]);
      setRemainingPlays(Math.max(0, DAILY_LIMIT - mine.length));
      setTop5(
        all.slice(0, 5).map((s) => ({
          id: s.id,
          empire_name: s.empire_name,
          game: s.game,
          score: s.score,
          is_me: s.created_by_id === user.id,
        }))
      );
    } catch {
      // non-critical — leaderboard stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = base44.entities.MinigameScore.subscribe(() => refresh());
    return unsub;
  }, [refresh]);

  const submitScore = useCallback(
    async (score, game) => {
      const res = await base44.functions.invoke('submitMinigameScore', { score, game });
      const data = res?.data || {};
      await refresh();
      return data;
    },
    [refresh]
  );

  return { top5, remainingPlays, loading, refresh, submitScore };
}