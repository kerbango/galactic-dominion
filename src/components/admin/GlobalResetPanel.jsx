import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const CONFIRM_PHRASE = 'RESET';

// Admin-only global progress reset. Wipes every player's game-state and
// social data (including the admin's), preserving accounts and market config.
export default function GlobalResetPanel() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);

  const canConfirm = phrase.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleConfirm = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('resetAllProgress', {});
      const parts = Object.entries(res.counts || {}).map(([k, v]) => `${k}: ${v}`);
      toast.success(`Global reset complete — ${parts.join(' · ')}`);
      setOpen(false);
      setPhrase('');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="font-heading text-sm tracking-[0.3em] text-rose-300/80 uppercase mb-4">Global Reset</h2>
      <div className="glass-panel rounded-2xl p-5 mb-10 border border-rose-400/25">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm text-rose-100/90 font-heading tracking-wide uppercase mb-1">Reset All Player Progress</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently wipes every user's empire, units, research, fleets, intel, scores, listings, alliances, chat, and tickets — including the admin's. User accounts and market config are preserved. Everyone returns to a fresh just-signed-up state. <span className="text-rose-300/80">This cannot be undone.</span>
            </p>
          </div>
          <Button onClick={() => setOpen(true)} variant="destructive" className="font-heading tracking-widest uppercase">
            <RotateCcw className="w-4 h-4" /> Reset All Progress
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPhrase(''); }}>
        <DialogContent className="glass-panel-strong border-rose-400/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading tracking-wide text-rose-200 uppercase">
              <AlertTriangle className="w-5 h-5" /> Confirm Global Reset
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2">
              This will permanently delete <span className="text-rose-300">all</span> game progress and social data for every player, including yourself. Only user accounts and market configuration will remain. Type <span className="font-mono font-bold text-rose-300 tracking-widest">{CONFIRM_PHRASE}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={`Type ${CONFIRM_PHRASE}`}
            className="bg-background/40 font-mono tracking-widest"
            disabled={busy}
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setPhrase(''); }} disabled={busy} className="font-heading tracking-widest uppercase">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm || busy} className="font-heading tracking-widest uppercase">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Execute Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}