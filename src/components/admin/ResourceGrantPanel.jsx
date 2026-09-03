import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Loader2 } from 'lucide-react';

const RESOURCES = [
  ['berentium', 'Berentium'], ['ferrite_titanium', 'Ferrite-Titanium'],
  ['aetherium_crystal', 'Aetherium Crystal'], ['energy', 'Energy'],
  ['vrind', 'VRIND'], ['population', 'Population'],
];

export default function ResourceGrantPanel({ users, onGranted }) {
  const [playerId, setPlayerId] = useState('');
  const [resourceKey, setResourceKey] = useState('vrind');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const grant = async () => {
    setBusy(true); setMessage('');
    try {
      const res = await base44.functions.invoke('grantPlayerResource', {
        target_user_id: playerId, resource_key: resourceKey, amount: Number(amount),
      });
      const result = res.data;
      if (result?.error) throw new Error(result.error);
      setMessage(`${Number(result.amount).toLocaleString()} ${RESOURCES.find(([key]) => key === resourceKey)?.[1]} granted to ${result.empire.empire_name}.`);
      setAmount('');
      onGranted?.(result.empire);
    } catch (error) {
      setMessage(error?.response?.data?.error || error.message || 'Grant failed.');
    } finally { setBusy(false); }
  };

  return (
    <section>
      <h2 className="font-heading text-sm tracking-[0.3em] text-cyan-200/80 uppercase mb-4">Resource Grant</h2>
      <div className="glass-panel rounded-2xl p-5 mb-10">
        <p className="text-xs text-muted-foreground mb-4">Issue resources directly to a registered player’s empire.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Select value={playerId} onValueChange={setPlayerId}><SelectTrigger className="bg-background/40"><SelectValue placeholder="Select player…" /></SelectTrigger><SelectContent>{users.map((player) => <SelectItem key={player.id} value={player.id}>{player.email}</SelectItem>)}</SelectContent></Select>
          <Select value={resourceKey} onValueChange={setResourceKey}><SelectTrigger className="bg-background/40"><SelectValue /></SelectTrigger><SelectContent>{RESOURCES.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
          <Input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="bg-background/40" />
          <Button onClick={grant} disabled={busy || !playerId || !Number(amount)} className="font-heading tracking-widest uppercase">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />} Grant Resource</Button>
        </div>
        {message && <p className="mt-3 text-sm text-cyan-200/80">{message}</p>}
      </div>
    </section>
  );
}