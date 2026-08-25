import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Flag, Loader2, Rocket } from 'lucide-react';

export default function EmpireSetup() {
  const navigate = useNavigate();
  const [empireName, setEmpireName] = useState('');
  const [rulerName, setRulerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!empireName.trim() || !rulerName.trim()) {
      setError('Both an Empire Name and a Ruler Name are required.');
      return;
    }
    setLoading(true);
    try {
      // Ask the server for a spawn coordinate that is far enough from every
      // existing empire to make travel meaningful.
      let spawn = { map_x: null, map_y: null };
      try {
        const res = await base44.functions.invoke('getGalacticMap', {});
        if (res?.data?.nextSpawn) spawn = res.data.nextSpawn;
      } catch { /* placement is best-effort; empire still creates without coords */ }
      await base44.entities.Empire.create({
        empire_name: empireName.trim(),
        ruler_name: rulerName.trim(),
        map_x: spawn.map_x,
        map_y: spawn.map_y,
      });
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Failed to found your empire.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg glass-panel-strong rounded-2xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-cyan-400/30 mb-4">
            <Crown className="w-8 h-8 text-cyan-300" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl tracking-wide text-white neon-text uppercase">
            Found Your Empire
          </h1>
          <p className="text-muted-foreground mt-3 font-body">
            Name your empire and choose the ruler name you will be known by across the galaxy.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-destructive/15 text-destructive text-sm border border-destructive/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="empireName" className="font-heading tracking-widest text-cyan-100 uppercase text-xs">
              Empire Name
            </Label>
            <div className="relative">
              <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/70" aria-hidden="true" />
              <Input
                id="empireName"
                type="text"
                autoFocus
                maxLength={40}
                placeholder="e.g. The Solar Ascendancy"
                value={empireName}
                onChange={(e) => setEmpireName(e.target.value)}
                className="pl-10 h-12 bg-background/40"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rulerName" className="font-heading tracking-widest text-cyan-100 uppercase text-xs">
              Ruler Name
            </Label>
            <div className="relative">
              <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/70" aria-hidden="true" />
              <Input
                id="rulerName"
                type="text"
                maxLength={40}
                placeholder="e.g. Emperor Vexis"
                value={rulerName}
                onChange={(e) => setRulerName(e.target.value)}
                className="pl-10 h-12 bg-background/40"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">This is your in-game identity — not your email.</p>
          </div>
          <Button type="submit" className="w-full h-12 font-heading tracking-widest uppercase" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Founding...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Found Empire
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}