import { ArrowRight, TrendingUp } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import type { RoomView } from "../../../../shared/types";
import { useMotion, useScoreMotion } from "../../animation";
import { Avatar } from "./Avatar";
import { useServerClock } from "./useServerClock";
import {
  RANKING_HOLD_MS,
  RANKING_MOVE_MS,
  RANKING_PAUSE_MS,
  RANKING_POINTS_MS,
} from "../../../../shared/presentation";
import { VictoryTrophy } from "./VictoryTrophy";

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
      const progress = Math.min(1, (now - start) / RANKING_POINTS_MS);
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
  compact = false,
}: {
  room: RoomView;
  playerId?: string;
  onContinue?: () => void;
  busy?: boolean;
  compact?: boolean;
}) {
  const { enabled } = useMotion();
  const [shortScreen, setShortScreen] = useState(
    () => (window.visualViewport?.height ?? window.innerHeight) < 520,
  );
  useEffect(() => {
    if (!compact) return;
    const update = () =>
      setShortScreen(
        (window.visualViewport?.height ?? window.innerHeight) < 520,
      );
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [compact]);
  const visibleRows = compact && shortScreen ? 3 : 5;
  const now = useServerClock(room.serverNow);
  const [settled, setSettled] = useState(
    () =>
      !enabled ||
      document.hidden ||
      (room.ranking?.readyAt ?? 0) - room.serverNow < RANKING_HOLD_MS - 1000,
  );
  useEffect(() => {
    if (!enabled || document.hidden || settled) {
      setSettled(true);
      return;
    }
    const timer = setTimeout(() => setSettled(true), RANKING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [enabled]);
  const previous = room.ranking?.previousScores ?? room.scores;
  const before = new Map(
    previous.map((score, index) => [score.id, { ...score, rank: index + 1 }]),
  );
  const displayed = settled ? room.scores : previous;
  const registerRow = useScoreMotion(displayed, RANKING_MOVE_MS);
  const ready = now >= (room.ranking?.readyAt ?? Infinity);
  const myRank = room.scores.findIndex((score) => score.id === playerId);
  const me = myRank >= 0 ? room.scores[myRank] : null;
  const myGain = me ? me.score - (before.get(me.id)?.score ?? 0) : 0;
  const last =
    room.mode === "teams"
      ? (room.teamGame?.finished ?? room.tiles.every((tile) => tile.used))
      : room.questionIndex + 1 >= room.questionCount;
  return (
    <section className="rankings-screen" aria-label="Round rankings">
      <VictoryTrophy />
      <span className="intro-kicker">POINTS ARE IN</span>
      <h1>Look who’s moving up!</h1>
      <p className="rankings-subtitle">
        {room.mode === "teams"
          ? "Your team standings"
          : "Your classroom leaderboard"}{" "}
        · Top {Math.min(visibleRows, room.scores.length)} ·{" "}
        {room.scoreUnit ?? "pts"}
      </p>
      {room.teamGame && (
        <p className="ranking-outcome" role="status">
          {room.teamGame.summary}
        </p>
      )}
      <div
        className={"rankings-board" + (settled ? " is-settled" : "")}
        style={
          {
            "--visible-rows": Math.min(visibleRows, displayed.length),
          } as CSSProperties
        }
      >
        {displayed.map((score, index) => {
          const old = before.get(score.id);
          const gain = score.score - (old?.score ?? 0);
          const climbed = (old?.rank ?? index + 1) - index - 1;
          return (
            <div
              key={score.id}
              ref={registerRow(score.id)}
              className={
                "rankings-row" + (score.id === playerId ? " is-me" : "")
              }
              aria-hidden={index >= visibleRows ? true : undefined}
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
                {settled && gain !== 0
                  ? `${gain > 0 ? "+" : ""}${gain.toLocaleString()}`
                  : ""}
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
