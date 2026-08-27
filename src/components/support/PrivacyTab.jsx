import React from 'react';
import { Lock, Database, Cookie, Share2, Baby, Mail } from 'lucide-react';

const SECTIONS = [
  {
    icon: Database,
    title: 'Information We Collect',
    body: [
      'To play The Krin Wars, we collect your email address (for authentication and account recovery) and your chosen empire and ruler names. We also store in-game data you generate: resources, fleets, research progress, market listings, chat messages, and support tickets.',
      'We do not collect sensitive personal data such as your real name, location, or payment information for this game.'
    ]
  },
  {
    icon: Lock,
    title: 'How We Use Your Information',
    body: [
      'Your data is used solely to operate the game: authenticating your session, persisting your empire, enabling multiplayer interactions, and providing support. We use your email to send account-related notifications such as password resets.'
    ]
  },
  {
    icon: Cookie,
    title: 'Cookies & Local Storage',
    body: [
      'The Krin Wars uses local storage and cookies to keep you signed in and remember your session. No tracking or advertising cookies are placed by this game.'
    ]
  },
  {
    icon: Share2,
    title: 'Third-Party Services',
    body: [
      'Authentication is handled by the platform provider. We do not sell or share your personal data with third parties for marketing purposes. In-game chat messages are visible to other players and to admins for moderation.'
    ]
  },
  {
    icon: Baby,
    title: 'Children’s Privacy',
    body: [
      'The Krin Wars is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a minor has registered an account, contact us and we will remove it.'
    ]
  },
  {
    icon: Mail,
    title: 'Your Rights & Contact',
    body: [
      'You may request deletion of your account and all associated data from the Support page at any time. For privacy questions or data requests, email kerbango@proton.me.'
    ]
  }
];

export default function PrivacyTab() {
  return (
    <div className="space-y-5">
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
      <p className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-400/40 pt-2">
        Last updated: August 2026 · Mimics Den Games
      </p>
    </div>
  );
}