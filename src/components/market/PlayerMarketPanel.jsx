import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useEmpire } from '@/lib/EmpireContext';
import { Loader2, Tag, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const RESOURCES = [
  { key: 'aetherium_crystal', label: 'Aetherium Crystal', color: 'text-violet-300' },
  { key: 'ferrite_titanium', label: 'Ferrite-Titanium', color: 'text-slate-300' },
  { key: 'energy', label: 'Energy', color: 'text-amber-300' },
  { key: 'berentium', label: 'Berentium', color: 'text-emerald-300' },
];

function fmt(n) {
  if (n == null) return '0';
  return Math.floor(n).toLocaleString();
}

// Player Market — players list any raw resource from their empire for sale at
// a VRIND price of their choosing, and buy other players' listings. Listing
// escrows the resource server-side (createMarketListing); canceling returns
// it (cancelMarketListing); buying transfers it (buyMarketListing). After
// every trade action the shared empire store is refreshed so treasury values
// update instantly across all screens.
export default function PlayerMarketPanel() {
  const { empire, refresh } = useEmpire();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // New listing form
  const [resKey, setResKey] = useState(RESOURCES[0].key);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const loadListings = async () => {
    try {
      const list = await base44.entities.MarketListing.filter({ status: 'listed' }, '-created_date', 200);
      setListings(list);
    } catch (e) {
      setMsg(e.message || 'Failed to load market.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreate = async () => {
    const amt = Number(amount);
    const pr = Number(price);
    if (!amt || amt <= 0) return setMsg('Enter a valid amount.');
    if (!pr || pr <= 0) return setMsg('Enter a valid price per unit.');
    if (!empire) return setMsg('No empire found.');
    setBusy(true); setMsg('');
    try {
      await base44.functions.invoke('createMarketListing', {
        resource_key: resKey,
        amount: amt,
        price_per_unit: pr,
      });
      setAmount(''); setPrice('');
      setMsg('Listing posted — resources escrowed.');
      await Promise.all([loadListings(), refresh()]);
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to post listing.');
    } finally { setBusy(false); }
  };

  const handleCancel = async (id) => {
    setBusy(true); setMsg('');
    try {
      await base44.functions.invoke('cancelMarketListing', { listingId: id });
      setMsg('Listing canceled — stock returned.');
      await Promise.all([loadListings(), refresh()]);
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Failed to cancel listing.');
    } finally { setBusy(false); }
  };

  const handleBuy = async (listing, qty) => {
    const amt = Number(qty);
    if (!amt || amt <= 0) return setMsg('Enter a valid amount to buy.');
    setBusy(true); setMsg('');
    try {
      const res = await base44.functions.invoke('buyMarketListing', { listingId: listing.id, buyAmount: amt });
      setMsg(`Bought ${fmt(res.bought)} for ${fmt(res.totalCost)} VRIND.`);
      await Promise.all([loadListings(), refresh()]);
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Purchase failed.');
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
      </div>
    );
  }

  const labelFor = (k) => RESOURCES.find((r) => r.key === k)?.label || k;

  return (
    <div className="space-y-6">
      {/* Create listing */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-cyan-300" />
          <h2 className="font-heading text-sm tracking-[0.2em] uppercase text-cyan-100">List a Resource for Sale</h2>
        </div>
        {empire ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Resource</p>
              <Select value={resKey} onValueChange={setResKey}>
                <SelectTrigger className="bg-background/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label} ({fmt(empire[r.key])})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Amount</p>
              <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="bg-background/40" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Price / unit (VRIND)</p>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="bg-background/40" />
            </div>
            <Button onClick={handleCreate} disabled={busy} className="font-heading tracking-widest uppercase">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Post Listing
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Found an empire first to list resources.</p>
        )}
      </div>

      {/* Listings */}
      <div>
        <h2 className="font-heading text-sm tracking-[0.2em] uppercase text-cyan-100 mb-3">Open Listings</h2>
        {listings.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No active listings. Be the first to post one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                own={l.created_by_id === empire?.created_by_id}
                label={labelFor(l.resource_key)}
                busy={busy}
                onBuy={handleBuy}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>

      {msg && <p className="text-sm text-cyan-200/80 text-center">{msg}</p>}
    </div>
  );
}

function ListingCard({ listing, own, label, busy, onBuy, onCancel }) {
  const [qty, setQty] = useState('');
  const buyAmount = Number(qty) || listing.amount;
  const total = buyAmount * listing.price_per_unit;
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-heading text-sm uppercase tracking-wide text-cyan-100">{label}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">by {listing.seller_name || 'Unknown'}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{fmt(listing.amount)}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">in stock</p>
        </div>
      </div>
      <p className="font-mono text-xs text-cyan-200/80 mb-3">{fmt(listing.price_per_unit)} VRIND / unit</p>

      {own ? (
        <Button onClick={() => onCancel(listing.id)} disabled={busy} variant="destructive" className="w-full font-heading tracking-widest uppercase text-xs">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Cancel Listing
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Input type="number" min="1" max={listing.amount} value={qty} onChange={(e) => setQty(e.target.value)} placeholder={`max ${fmt(listing.amount)}`} className="bg-background/40 h-9 text-xs" />
          <Button onClick={() => onBuy(listing, buyAmount)} disabled={busy} className="font-heading tracking-widest uppercase text-xs whitespace-nowrap">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />} Buy {fmt(total)}
          </Button>
        </div>
      )}
    </div>
  );
}