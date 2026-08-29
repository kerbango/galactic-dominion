import React from 'react';
import { Scale, BookOpen, ShieldCheck, AlertTriangle, Ban } from 'lucide-react';

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Terms of Service',
    body: [
      'By creating an account and playing The Krin Wars, you agree to abide by these terms. The game is provided as a free-to-play online experience and may be updated, modified, or discontinued at any time without prior notice.',
      'You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.'
    ]
  },
  {
    icon: ShieldCheck,
    title: 'Acceptable Use',
    body: [
      'Players agree not to exploit bugs, use automation or bots, abuse other players through the in-game chat, or attempt to disrupt the service. Cheating, multi-accounting for unfair advantage, and reverse-engineering the client are prohibited.',
      'Admins reserve the right to moderate chat, pin announcements, and take action against accounts that violate these rules.'
    ]
  },
  {
    icon: Scale,
    title: 'Intellectual Property',
    body: [
      'All game content — including names, artwork, mechanics, and lore — is the property of Mimics Den Games. Player-created empire and ruler names remain the intellectual property of their creators, but you grant Mimics Den Games a license to display them within the game.'
    ]
  },
  {
    icon: AlertTriangle,
    title: 'Disclaimer of Liability',
    body: [
      'The Krin Wars is provided "as is" without warranties of any kind. Mimics Den Games is not liable for any loss of in-game progress, resources, or data resulting from server downtime, bugs, or account issues. In-game resources have no real-world monetary value.'
    ]
  },
  {
    icon: Ban,
    title: 'Account Termination',
    body: [
      'You may delete your account at any time from the Support page. Mimics Den Games reserves the right to suspend or terminate accounts that violate these terms or that remain inactive for extended periods.'
    ]
  }
];

export default function LegalTab() {
  return (
    <div className="space-y-5 selectable-text">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <section key={s.title} className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon className="w-5 h-5 text-cyan-300" />
              <h2 className="font-heading text-sm tracking-[0.25em] text-cyan-100 uppercase">{s.title}</h2>
            </div>
            <div className="space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground font-body leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        );
      })}
      <p className="text-center text-xs font-mono uppercase tracking-widest text-slate-400/40 pt-2">
        Last updated: August 2026 · Mimics Den Games
      </p>
    </div>
  );
}