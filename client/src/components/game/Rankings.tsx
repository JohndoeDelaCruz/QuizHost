import { ArrowRight, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import type { RoomView } from "../../../../shared/types";
import { useMotion, useScoreMotion } from "../../animation";
import { Avatar } from "./Avatar";
import { useServerClock } from "./useServerClock";

function AnimatedPoints({ from, to }: { from: number; to: number }) {
  const { enabled } = useMotion();
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!enabled || document.hidden || from === to) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let frame: number;
    const update = (now: number) => {
      const progress = Math.min(1, (now - start) / 900);
      setValue(Math.round(from + (to - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [from, to, enabled]);
  return <>{(enabled ? value : to).toLocaleString()}</>;
}

export function Rankings({
  room,
  playerId,
  onContinue,
  busy = false,
}: {
  room: RoomView;
  playerId?: string;
  onContinue?: () => void;
  busy?: boolean;
}) {
  const { enabled } = useMotion();
  const now = useServerClock(room.serverNow);
  const [settled, setSettled] = useState(
    () =>
      !enabled ||
      document.hidden ||
      (room.ranking?.readyAt ?? 0) - room.serverNow < 1600,
  );
  useEffect(() => {
    if (!enabled || document.hidden || settled) {
      setSettled(true);
      return;
    }
    const timer = setTimeout(() => setSettled(true), 550);
    return () => clearTimeout(timer);
  }, [enabled]);
  const previous = room.ranking?.previousScores ?? room.scores;
  const before = new Map(
    previous.map((score, index) => [score.id, { ...score, rank: index + 1 }]),
  );
  const displayed = settled ? room.scores : previous;
  const registerRow = useScoreMotion(displayed);
  const ready = now >= (room.ranking?.readyAt ?? Infinity);
  const myRank = room.scores.findIndex((score) => score.id === playerId);
  const me = myRank >= 0 ? room.scores[myRank] : null;
  const myGain = me ? me.score - (before.get(me.id)?.score ?? 0) : 0;
  const last =
    room.mode === "teams"
      ? room.tiles.every((tile) => tile.used)
      : room.questionIndex + 1 >= room.questionCount;
  return (
    <section className="rankings-screen" aria-label="Round rankings">
      <span className="intro-kicker">
        <Trophy size={18} /> POINTS ARE IN
      </span>
      <h1>Look who’s moving up!</h1>
      <p className="rankings-subtitle">
        {room.mode === "teams"
          ? "Your team standings"
          : "Your classroom leaderboard"}{" "}
        · Top {Math.min(5, room.scores.length)}
      </p>
      <div
        className={"rankings-board" + (settled ? " is-settled" : "")}
        style={
          { "--visible-rows": Math.min(5, displayed.length) } as CSSProperties
        }
      >
        {displayed.map((score, index) => {
          const old = before.get(score.id);
          const gain = score.score - (old?.score ?? 0);
          const climbed = (old?.rank ?? index + 1) - index - 1;
          return (
            <div
              key={score.id}
              ref={(node) => registerRow(score.id, node)}
              className={
                "rankings-row" + (score.id === playerId ? " is-me" : "")
              }
              aria-hidden={index >= 5 ? true : undefined}
              data-player-id={score.id}
            >
              <span className="ranking-position">{index + 1}</span>
              <Avatar avatar={score.avatar} size={58} />
              <strong className="ranking-name">
                {score.name}
                {score.id === playerId && <small>You</small>}
              </strong>
              {settled && climbed > 0 && (
                <span className="rank-climb">
                  <TrendingUp size={16} />
                  {climbed}
                </span>
              )}
              <span className="round-gain">
                {settled && gain > 0 ? `+${gain.toLocaleString()}` : ""}
              </span>
              <strong className="ranking-total">
                <AnimatedPoints from={old?.score ?? 0} to={score.score} />
              </strong>
            </div>
          );
        })}
      </div>
      {me && (
        <div className="personal-ranking" role="status">
          <Avatar avatar={me.avatar} size={54} />
          <div>
            <strong>You’re #{myRank + 1}</strong>
            <span>
              {myGain > 0
                ? `+${myGain.toLocaleString()} points this round`
                : "Keep thinking. Every question is a fresh chance."}
            </span>
          </div>
        </div>
      )}
      {onContinue ? (
        <button
          className="btn primary ranking-continue"
          disabled={busy || !ready}
          onClick={onContinue}
        >
          {!ready
            ? "Updating rankings…"
            : last
              ? "Show final podium"
              : room.mode === "teams"
                ? "Back to the board"
                : "Next question"}
          <ArrowRight size={19} />
        </button>
      ) : (
        <p className="rankings-wait">
          Watch the rankings. Your teacher will continue.
        </p>
      )}
    </section>
  );
}
