import React, { useState } from 'react';
import { Gamepad2, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PowerGridPuzzle from '@/components/minigame/PowerGridPuzzle';
import RadarShooter from '@/components/minigame/RadarShooter';
import LeaderboardCard from '@/components/minigame/LeaderboardCard';
import { useMinigameLeaderboard } from '@/hooks/useMinigameLeaderboard';

// Minigames tab — hosts both playable minigames (Power Grid puzzle and
// Radar Shooter) plus the combined top-5 leaderboard. Both games share a
// single daily play limit (5 total) enforced by the backend submission
// function.
export default function MinigamesTab() {
  const [showMini, setShowMini] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const { top5, remainingPlays, loading: lbLoading, submitScore } = useMinigameLeaderboard();
  const exhausted = remainingPlays <= 0;

  return (
    <div className="space-y-6">
      {/* Power Grid puzzle toggle */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-heading text-sm tracking-[0.25em] text-amber-100 uppercase mb-0.5">
                Re-route Power Circuits
              </h2>
              <p className="text-xs text-muted-foreground font-body">
                A calibration puzzle to pass the time while you wait.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/70">
              Plays left today: <span className="text-cyan-200">{remainingPlays}/5</span>
            </span>
            <Button
              onClick={() => setShowMini((v) => !v)}
              variant={showMini ? 'ghost' : 'default'}
              disabled={!showMini && exhausted}
              className="font-heading tracking-widest uppercase text-xs"
            >
              {exhausted && !showMini ? 'Daily Limit Reached' : showMini ? 'Hide Minigame' : 'Play Minigame'}
            </Button>
          </div>
        </div>
        {exhausted && !showMini && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300/80 mt-3">
            Daily plays exhausted — return tomorrow
          </p>
        )}
        {showMini && (
          <div className="mt-4">
            <PowerGridPuzzle
              onClose={() => setShowMini(false)}
              remainingPlays={remainingPlays}
              onSubmitScore={submitScore}
            />
          </div>
        )}
      </div>

      {/* Radar shooter toggle */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Radar className="w-5 h-5 text-cyan-300" />
            <div>
              <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase mb-0.5">
                Radar Defense Drill
              </h2>
              <p className="text-xs text-muted-foreground font-body">
                A reaction trainer — clear hostile contacts before they fade.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/70">
              Plays left today: <span className="text-cyan-200">{remainingPlays}/5</span>
            </span>
            <Button
              onClick={() => setShowRadar((v) => !v)}
              variant={showRadar ? 'ghost' : 'default'}
              disabled={!showRadar && exhausted}
              className="font-heading tracking-widest uppercase text-xs"
            >
              {exhausted && !showRadar ? 'Daily Limit Reached' : showRadar ? 'Hide Minigame' : 'Play Minigame'}
            </Button>
          </div>
        </div>
        {exhausted && !showRadar && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300/80 mt-3">
            Daily plays exhausted — return tomorrow
          </p>
        )}
        {showRadar && (
          <div className="mt-4">
            <RadarShooter
              onClose={() => setShowRadar(false)}
              remainingPlays={remainingPlays}
              onSubmitScore={submitScore}
            />
          </div>
        )}
      </div>

      {/* Combined leaderboard */}
      <LeaderboardCard top5={top5} loading={lbLoading} />
    </div>
  );
}