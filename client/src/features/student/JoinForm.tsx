import { ArrowRight, ShieldCheck } from "lucide-react";
import React from "react";
import { Avatar } from "../../components/game/Avatar";

export function JoinForm({
  pin,
  setPin,
  name,
  setName,
  connected,
  busy,
  join,
}: {
  pin: string;
  setPin: (pin: string) => void;
  name: string;
  setName: (name: string) => void;
  connected: boolean;
  busy: boolean;
  join: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <section className="join-card">
      <div className="join-avatars" aria-hidden="true">
        <Avatar avatar="dino-dude" size={64} />
        <Avatar avatar="friendly-robot" size={88} />
        <Avatar avatar="bunny-buddy" size={64} />
      </div>
      <span className="eyebrow">LET’S GET EVERYONE IN</span>
      <h1>
        Game on<span className="green-text">.</span>
      </h1>
      <p>Enter your teacher’s game PIN and join the fun.</p>
      <p className="avatar-hint">Your random avatar is waiting for you.</p>
      <form onSubmit={join}>
        <label className="field">
          Game PIN
          <input
            autoFocus
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit PIN"
            required
          />
        </label>
        <label className="field">
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="What should we call you?"
            required
          />
        </label>
        <button
          className="btn primary"
          disabled={!connected || busy || pin.length !== 6 || !name.trim()}
        >
          {busy ? "Joining…" : "Enter game"}
          <ArrowRight size={18} />
        </button>
      </form>
      <div className="join-footnote">
        <ShieldCheck size={14} />
        No account needed. Just you.
      </div>
    </section>
  );
}
