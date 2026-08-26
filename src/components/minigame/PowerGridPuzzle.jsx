import React, { useState, useEffect } from 'react';
import { Clock, Target, Hash, Sparkles, X, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NODES = ['power', 'shield', 'cooling', 'surge'];
const NODE_META = {
  power: { icon: '⚡', label: 'Power', color: 'text-amber-300', ring: 'ring-amber-400/70', glow: 'shadow-[0_0_14px_rgba(251,191,36,0.55)]', border: 'border-amber-400/40', bg: 'bg-amber-400/10' },
  shield: { icon: '🛡️', label: 'Shield', color: 'text-cyan-300', ring: 'ring-cyan-400/70', glow: 'shadow-[0_0_14px_rgba(34,211,238,0.55)]', border: 'border-cyan-400/40', bg: 'bg-cyan-400/10' },
  cooling: { icon: '❄️', label: 'Cooling', color: 'text-sky-300', ring: 'ring-sky-400/70', glow: 'shadow-[0_0_14px_rgba(56,189,248,0.55)]', border: 'border-sky-400/40', bg: 'bg-sky-400/10' },
  surge: { icon: '💥', label: 'Surge', color: 'text-rose-300', ring: 'ring-rose-400/70', glow: 'shadow-[0_0_14px_rgba(244,63,94,0.55)]', border: 'border-rose-400/40', bg: 'bg-rose-400/10' },
};
const SIZE = 5;
const TARGET_SCORE = 1000;
const START_MOVES = 15;

const randNode = () => NODES[Math.floor(Math.random() * NODES.length)];

function makeGrid() {
  const g = [];
  for (let r = 0; r < SIZE; r++) {
    const row = [];
    for (let c = 0; c < SIZE; c++) row.push(randNode());
    g.push(row);
  }
  return g;
}

function cleanGrid(grid) {
  let g = grid.map((row) => row.slice());
  let safety = 0;
  while (safety++ < 30 && findMatches(g).size > 0) {
    g = applyClearAndGravity(g, findMatches(g));
  }
  return g;
}

function findMatches(grid) {
  const matched = new Set();
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c < SIZE; c++) {
      if (grid[r][c] && grid[r][c] === grid[r][c - 1]) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) matched.add(`${r},${c - 1 - k}`);
        run = 1;
      }
    }
    if (run >= 3) for (let k = 0; k < run; k++) matched.add(`${r},${SIZE - 1 - k}`);
  }
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r < SIZE; r++) {
      if (grid[r][c] && grid[r][c] === grid[r - 1][c]) run++;
      else {
        if (run >= 3) for (let k = 0; k < run; k++) matched.add(`${r - 1 - k},${c}`);
        run = 1;
      }
    }
    if (run >= 3) for (let k = 0; k < run; k++) matched.add(`${SIZE - 1 - k},${c}`);
  }
  return matched;
}

function applyClearAndGravity(grid, matched) {
  const g = grid.map((row) => row.slice());
  matched.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    g[r][c] = null;
  });
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (g[r][c] !== null) {
        g[write][c] = g[r][c];
        if (write !== r) g[r][c] = null;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) g[r][c] = randNode();
  }
  return g;
}

function resolveCascades(grid) {
  let g = grid.map((row) => row.slice());
  let cleared = 0;
  let safety = 0;
  while (safety++ < 50) {
    const m = findMatches(g);
    if (m.size === 0) break;
    cleared += m.size;
    g = applyClearAndGravity(g, m);
  }
  return { grid: g, cleared };
}

const isAdjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function swap(grid, a, b) {
  const g = grid.map((row) => row.slice());
  const tmp = g[a.r][a.c];
  g[a.r][a.c] = g[b.r][b.c];
  g[b.r][b.c] = tmp;
  return g;
}

function findHintSwap(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const dirs = [[0, 1], [1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < SIZE && nc < SIZE) {
          const g = swap(grid, { r, c }, { r: nr, c: nc });
          if (findMatches(g).size > 0) return { a: { r, c }, b: { r: nr, c: nc } };
        }
      }
    }
  }
  return null;
}

function freshBoard() {
  return cleanGrid(makeGrid());
}

export default function PowerGridPuzzle({ onClose }) {
  const [grid, setGrid] = useState(() => freshBoard());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(START_MOVES);
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [flash, setFlash] = useState(null); // {r,c} brief highlight on auto-resolve

  useEffect(() => {
    const id = setInterval(() => setQueueSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!won && (moves <= 0 || score >= TARGET_SCORE)) setWon(true);
  }, [moves, score, won]);

  const commitSwap = (swapped) => {
    const { grid: resolved, cleared } = resolveCascades(swapped);
    setGrid(resolved);
    setSelected(null);
    if (cleared > 0) {
      setScore((s) => s + cleared * 100);
      setMoves((m) => Math.max(0, m - 1));
    }
  };

  const handleCellClick = (r, c) => {
    if (won) return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    if (!isAdjacent(selected, { r, c })) {
      setSelected({ r, c });
      return;
    }
    const swapped = swap(grid, selected, { r, c });
    const { cleared } = resolveCascades(swapped);
    if (cleared === 0) {
      // invalid swap — revert, no cost
      setSelected(null);
      return;
    }
    commitSwap(swapped);
  };

  const handleAutoResolve = () => {
    if (won || autoBusy) return;
    setAutoBusy(true);
    const hint = findHintSwap(grid);
    if (!hint) {
      setGrid(freshBoard());
      setSelected(null);
      setAutoBusy(false);
      return;
    }
    setFlash(hint.a);
    setTimeout(() => setFlash(null), 350);
    const swapped = swap(grid, hint.a, hint.b);
    commitSwap(swapped);
    setAutoBusy(false);
  };

  const handleReset = () => {
    setGrid(freshBoard());
    setSelected(null);
    setScore(0);
    setMoves(START_MOVES);
    setWon(false);
    setQueueSeconds(0);
  };

  const mmss = `${String(Math.floor(queueSeconds / 60)).padStart(2, '0')}:${String(queueSeconds % 60).padStart(2, '0')}`;
  const progress = Math.min(100, Math.round((score / TARGET_SCORE) * 100));

  return (
    <div className="glass-panel-strong rounded-2xl p-4 md:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-300" />
          <h2 className="font-heading text-base md:text-lg tracking-[0.2em] text-white neon-text uppercase">
            Calibrate Power Grid
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-200/80">
            <Clock className="w-3.5 h-3.5 text-cyan-300/70" />
            <span className="tabular-nums">{mmss}</span>
            <span className="uppercase tracking-widest text-muted-foreground/70 text-[9px]">In Queue</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Close minigame"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        <div className="md:w-44 shrink-0 space-y-3">
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-emerald-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-200/70">Objective</p>
            </div>
            <p className="font-heading text-xs tracking-wide text-emerald-100 uppercase leading-tight">
              Stabilize Grid
            </p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">Reach {TARGET_SCORE.toLocaleString()} pts</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-amber-200/70">Score</p>
            </div>
            <p className="font-mono text-xl font-bold text-amber-100 tabular-nums">{score.toLocaleString()}</p>
            <div className="mt-1.5 h-1 rounded-full bg-black/40 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash className="w-3 h-3 text-cyan-300" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/70">Moves Left</p>
            </div>
            <p className="font-mono text-xl font-bold text-cyan-100 tabular-nums">{moves}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-5 gap-1.5 md:gap-2 p-2 rounded-xl bg-black/30 border border-cyan-400/10">
            {grid.map((row, r) =>
              row.map((node, c) => {
                const meta = NODE_META[node];
                const isSel = selected && selected.r === r && selected.c === c;
                const isFlash = flash && flash.r === r && flash.c === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative w-12 h-12 md:w-14 md:h-14 rounded-lg border ${meta.border} ${meta.bg} flex items-center justify-center text-xl md:text-2xl transition-all duration-150 hover:scale-105 ${isSel ? `ring-2 ${meta.ring} ${meta.glow} scale-105` : ''} ${isFlash ? 'animate-pulse-glow' : ''}`}
                    aria-label={`${meta.label} node ${r + 1},${c + 1}`}
                  >
                    <span className={meta.color} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}>
                      {meta.icon}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button onClick={handleAutoResolve} disabled={won || autoBusy} variant="outline" className="flex-1 font-heading tracking-widest uppercase text-xs border-cyan-400/30 text-cyan-100 hover:bg-cyan-400/10">
          <Sparkles className="w-3.5 h-3.5" /> Auto-Resolve Circuit
        </Button>
        <Button onClick={onClose || handleReset} variant="ghost" className="flex-1 font-heading tracking-widest uppercase text-xs text-rose-200 hover:bg-rose-400/10">
          <X className="w-3.5 h-3.5" /> Forfeit Minigame
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        {NODES.map((n) => (
          <div key={n} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className={NODE_META[n].color}>{NODE_META[n].icon}</span>
            {NODE_META[n].label}
          </div>
        ))}
      </div>

      {/* Victory modal */}
      {won && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
          <div className="glass-panel-strong rounded-xl p-6 max-w-xs w-[80%] text-center border-emerald-400/40">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-400/15 border border-emerald-400/40 mb-3">
              <Zap className="w-7 h-7 text-emerald-300" />
            </div>
            <h3 className="font-heading text-lg tracking-[0.2em] text-emerald-100 neon-text uppercase mb-1">
              Grid Stabilized!
            </h3>
            <p className="text-xs font-mono text-muted-foreground mb-1">
              Final Score: <span className="text-amber-200 font-bold">{score.toLocaleString()}</span>
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/60 mb-4">
              Queue Time {mmss}
            </p>
            <Button onClick={handleReset} className="w-full font-heading tracking-widest uppercase text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Board
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}