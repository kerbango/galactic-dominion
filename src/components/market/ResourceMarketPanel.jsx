import React from 'react';
import { Gem, Zap, Layers, Pickaxe, Coins, Lock } from 'lucide-react';

// Admin-controlled fixed-price shop for raw materials. Prices and stock are
// set centrally (admin-configured) — players buy fixed amounts at fixed
// prices. Until prices are configured, buy controls are disabled.
//
// To enable sales, fill in the PRICE (VRIND per unit) and STOCK (units
// available per purchase) for each resource below.
const SHOP = [
  { key: 'berentium', label: 'Berentium', icon: Pickaxe, color: 'text-emerald-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', icon: Layers, color: 'text-slate-300' },
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', icon: Gem, color: 'text-violet-300' },
  { key: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-300' },
];

// Admin-configurable prices/stock. Set to null to keep a resource unavailable.
const ADMIN_PRICES = {
  berentium: { price: null, stock: null },
  ferrite_titanium: { price: null, stock: null },
  aetherium_crystal: { price: null, stock: null },
  energy: { price: null, stock: null },
};

function fmt(n) {
  if (n == null) return '—';
  return Math.floor(n).toLocaleString();
}

// Resource Market — admin-controlled fixed-price raw material exchange.
// Prices are configured centrally above; players buy fixed amounts.
export default function ResourceMarketPanel() {
  const anyConfigured = Object.values(ADMIN_PRICES).some((p) => p.price != null);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-2 text-xs text-cyan-200/70">
        <Lock className="w-3.5 h-3.5" />
        <p>
          The Resource Market Are OVERLORD CONTROLLED. Raw materials are sold in fixed amounts at fixed prices set by the galactic council.
          {!anyConfigured && ' Prices are pending configuration — check back soon.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOP.map((r) => {
          const Ic = r.icon;
          const cfg = ADMIN_PRICES[r.key];
          const available = cfg.price != null && cfg.stock != null;
          return (
            <div key={r.key} className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ic className={`w-4 h-4 ${r.color}`} />
                  <p className="font-heading text-sm uppercase tracking-wide text-cyan-100">{r.label}</p>
                </div>
                <Coins className="w-3.5 h-3.5 text-cyan-300/60" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="glass-panel rounded-lg p-2 text-center">
                  <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(cfg.price)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">VRIND / unit</p>
                </div>
                <div className="glass-panel rounded-lg p-2 text-center">
                  <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(cfg.stock)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">units / order</p>
                </div>
              </div>
              <button
                type="button"
                disabled={!available}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-[0.2em] uppercase transition-colors ${available ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
              >
                {available ? `Buy ${fmt(cfg.stock)} · ${fmt((cfg.price || 0) * (cfg.stock || 0))} VRIND` : 'Unavailable'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}