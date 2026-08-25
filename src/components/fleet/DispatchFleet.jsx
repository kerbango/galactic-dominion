import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Inline dispatch control shown for a rival empire. Creates a fleet record
// via the dispatchFleet backend function, which computes the arrival time
// from the grid distance between the player's empire and the target.
export default function DispatchFleet({ target, myEmpire, onDispatched }) {
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setError('');
    setLoading(true);
    try {
      await base44.functions.invoke('dispatchFleet', {
        target_empire_id: target.id,
        fleet_size: size,
      });
      onDispatched?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to dispatch fleet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3 border-t border-cyan-400/10 space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Ships</label>
        <input
          type="number"
          min={1}
          max={9999}
          value={size}
          onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 h-9 rounded-md bg-background/60 border border-cyan-400/20 px-2 font-mono text-sm text-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="button"
        onClick={handle}
        disabled={loading || !myEmpire}
        className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md glass-panel-strong hover:border-cyan-300/60 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 text-cyan-300" />}
        <span className="font-heading text-sm tracking-widest text-white uppercase">
          {loading ? 'Dispatching...' : 'Dispatch Fleet'}
        </span>
      </button>
    </div>
  );
}