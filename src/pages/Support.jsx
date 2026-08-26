import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LifeBuoy, Trash2, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'@/components/ui/dialog';

export default function Support() {
  const [empireName, setEmpireName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const empires = await base44.entities.Empire.filter({ created_by_id: user.id });
        if (active) setEmpireName(empires[0]?.empire_name || '');
      } catch {



        // no empire or not logged in — still allow deletion flow
      } finally {if (active) setLoading(false);}};
    load();
  }, []);

  const canConfirm = empireName !== '' && confirmText.trim() === empireName.trim();

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await base44.functions.invoke('deleteMyAccount', {});
      await base44.auth.logout();
      window.location.href = '/login';
    } catch (e) {
      setDeleting(false);
      setError(e.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleOpenChange = (v) => {
    setOpen(v);
    if (!v) {
      setConfirmText('');
      setError('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <LifeBuoy className="w-8 h-8 text-cyan-300" />
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white neon-text uppercase">
          Support
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-200/60">
          Account & empire management
        </p>
      </div>

      {/* General support card */}
      <div className="glass-panel rounded-2xl p-6 mb-6">
        <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase mb-3">
          Need help?
        </h2>
        <p className="text-sm text-muted-foreground font-body leading-relaxed">For Game Play Questions and Bug reporting. Please email kerbango@proton.me


        </p>
      </div>

      {/* Danger zone */}
      <div className="glass-panel rounded-2xl p-6 border border-rose-400/25">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-300" />
          <h2 className="font-heading text-sm tracking-[0.25em] text-rose-200 uppercase">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
          Deleting your account permanently wipes your empire, fleets, research progress,
          and chat messages. This action cannot be undone.
        </p>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto" disabled={loading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-strong border-rose-400/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading tracking-wide text-white uppercase flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-body pt-2">
                This will permanently erase your empire, fleets, research, and chat history.
                Type your empire name <span className="text-rose-300 font-semibold">{empireName || '—'}</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-name" className="text-xs uppercase tracking-widest text-cyan-200/70">
                Empire Name
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={empireName || 'Your empire name'}
                className="font-body"
                autoComplete="off" />
              
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!canConfirm || deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>);

}