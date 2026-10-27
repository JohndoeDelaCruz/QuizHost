import { Check } from "lucide-react";
import { Celebration } from "../../../animation";
import { Podium } from "../../../components/game/Podium";
import { Scores } from "../../../components/game/Scores";
import type { GameScreenProps } from "../types";
import { VictoryTrophy } from "../../../components/game/VictoryTrophy";

export function FinishedRoom({ room, busy, act }: GameScreenProps) {
  return (
    <section className="card finish-card">
      <Celebration key={room.id} />
      <VictoryTrophy />
      <span className="eyebrow">A ROUND OF APPLAUSE</span>
      <h2>
        {room.scores[0]
          ? `${room.scores[0].name} takes the lead!`
          : "That’s a wrap!"}
      </h2>
      <p className="muted">
        Every question is a chance to learn. Your results are saved.
      </p>
      <Podium scores={room.scores} />
      <Scores room={room} />
      <button
        className="btn primary"
        disabled={busy}
        onClick={() => void act("host:close")}
      >
        Close room <Check size={18} />
      </button>
    </section>
  );
}
