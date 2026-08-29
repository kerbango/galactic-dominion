import React from 'react';
import { Trophy, Crown, Medal, Gamepad2, Radar } from 'lucide-react';

const GAME_META = {
  power_grid: { label: 'Power Grid', icon: Gamepad2, cls: 'text-amber-300' },
  radar_shooter: { label: 'Radar', icon: Radar, cls: 'text-cyan-300' },
};

const RANK_STYLE = {
  1: { ring: 'border-amber-300/60', glow: 'shadow-[0_0_16px_rgba(251,191,36,0.35)]', text: 'text-amber-200', medal: Crown, medalCls: 'text-amber-300' },
  2: { ring: 'border-slate-300/50', glow: 'shadow-[0_0_12px_rgba(203,213,225,0.25)]', text: 'text-slate-200', medal: Medal, medalCls: 'text-slate-300' },
  3: { ring: 'border-orange-400/50', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.25)]', text: 'text-orange-200', medal: Medal, medalCls: 'text-orange-300' },
};

// Combined top-5 leaderboard for both Support-page minigames. Gold/silver/
// bronze accents mark the payout ranks (1st/2nd/3rd). Each row tags which
// game the score came from and highlights the current player.
export default function LeaderboardCard({ top5, loading }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30">
          <Trophy className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h2 className="font-heading text-sm tracking-[0.25em] text-amber-100 uppercase">
            Galactic Leaderboard
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Top 5 · 1st +50 · 2nd +25 · 3rd +5 VRIND
          </p>
        </div>
      </div>

      {loading && top5.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
        </div>
      ) : top5.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            No scores yet — be the first
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {top5.map((row, i) => {
            const rank = i + 1;
            const style = RANK_STYLE[rank] || null;
            const game = GAME_META[row.game] || GAME_META.power_grid;
            const GameIcon = game.icon;
            return (
              <div
                key={row.id || i}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                  style ? `${style.ring} ${style.glow} bg-white/[0.03]` : 'border-transparent bg-white/[0.015]'
                } ${row.is_me ? 'ring-1 ring-cyan-400/40' : ''}`}
              >
                <div className="w-7 text-center shrink-0">
                  {style ? (
                    <style.medal className={`w-4 h-4 mx-auto ${style.medalCls}`} />
                  ) : (
                    <span className="font-mono text-xs text-slate-500 tabular-nums">{rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-xs tracking-wide truncate ${row.is_me ? 'text-cyan-200' : 'text-slate-100'}`}>
                    {row.empire_name || 'Unknown Empire'}
                    {row.is_me && <span className="ml-1.5 text-[9px] font-mono uppercase tracking-widest text-cyan-400">You</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <GameIcon className={`w-3 h-3 ${game.cls}`} />
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${game.cls}`}>{game.label}</span>
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className={`font-mono text-sm font-bold tabular-nums ${style ? style.text : 'text-slate-300'}`}>
                    {Number(row.score).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}