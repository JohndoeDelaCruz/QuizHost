import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { calculateShot } from "../../../../../shared/shotMath";
import { POWER_UPS } from "../../../../../shared/teamGames";
import type { GameScreenProps } from "../types";
import { TeamToken } from "./TeamToken";
import { SportsScene } from "./SportsScene";
import { MemoryBoard } from "./MemoryBoard";
export function TeamActivity(props: GameScreenProps) {
  const { room, busy, act } = props,
    state = room.teamGame!;
  const [target, setTarget] = useState("");
  const [angle, setAngle] = useState(45),
    [power, setPower] = useState(80);
  if (state.id === "memory")
    return (
      <section className="team-activity">
        <TeamToken room={room} id={room.activeTeam!} size={42} name />
        <h2>Look closely at the pair.</h2>
        <MemoryBoard {...props} />
      </section>
    );
  const powerup = state.powerup,
    shot = state.shot;
  return (
    <section
      className="team-activity"
      aria-label={powerup ? "Power-up" : "Skill shot"}
    >
      <TeamToken room={room} id={room.activeTeam!} size={50} name />
      {powerup ? (
        <>
          <div
            className="powerup-reveal"
            key={`${state.round}:${powerup.id}`}
            aria-hidden="true"
          >
            {POWER_UPS[powerup.id].symbol}
          </div>
          <h1>{POWER_UPS[powerup.id].title}</h1>
          <p>{POWER_UPS[powerup.id].text}</p>
          {!powerup.applied ? (
            <>
              {POWER_UPS[powerup.id].target && (
                <fieldset className="powerup-targets">
                  <legend>Choose another team</legend>
                  {room.scores
                    .filter((team) => team.id !== room.activeTeam)
                    .map((team) => (
                      <label
                        key={team.id}
                        className={target === team.id ? "selected" : ""}
                      >
                        <input
                          type="radio"
                          name="powerup-target"
                          value={team.id}
                          checked={target === team.id}
                          disabled={busy}
                          onChange={() => setTarget(team.id)}
                        />
                        <TeamToken room={room} id={team.id} size={42} name />
                        <small>
                          {team.score} {state.unit}
                        </small>
                      </label>
                    ))}
                </fieldset>
              )}
              <button
                className="btn primary"
                disabled={busy || (!!POWER_UPS[powerup.id].target && !target)}
                onClick={() =>
                  void act("host:team-action", {
                    type: "powerup",
                    ...(target ? { targetId: target } : {}),
                  })
                }
              >
                Apply power-up
              </button>
            </>
          ) : (
            <>
              <p role="status">{state.summary}</p>
              <div className="powerup-changes">
                {powerup.changes
                  ?.filter((change) => change.delta !== 0)
                  .map((change) => (
                    <div key={change.teamId}>
                      <TeamToken
                        room={room}
                        id={change.teamId}
                        size={32}
                        name
                      />
                      <strong className={change.delta < 0 ? "loss" : "gain"}>
                        {change.delta > 0 ? "+" : ""}
                        {change.delta} {state.unit}
                      </strong>
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      ) : shot ? (
        <>
          <span className="eyebrow">CORRECT ANSWER · YOUR SHOT</span>
          <h1>
            {state.id === "football"
              ? "Read the wind. Find your angle."
              : state.id === "bowling"
                ? "Aim for the pins!"
                : state.id === "soccer"
                  ? "Beat the goalkeeper!"
                  : "Find your shooting arc!"}
          </h1>
          <SportsScene
            game={state.id}
            shot={shot}
            preview={
              shot.result ? undefined : calculateShot(shot, angle, power)
            }
          />
          {!shot.result ? (
            <div className="shot-controls">
              <label>
                {state.id === "soccer" || state.id === "bowling"
                  ? "Aim"
                  : "Angle"}
                <strong>
                  {angle}
                  {state.id === "football" || state.id === "basketball"
                    ? "°"
                    : ""}
                </strong>
                <input
                  aria-label="Shot angle"
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={angle}
                  disabled={busy}
                  onChange={(e) => setAngle(Number(e.target.value))}
                />
              </label>
              <label>
                Power<strong>{power}%</strong>
                <input
                  aria-label="Shot power"
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={power}
                  disabled={busy}
                  onChange={(e) => setPower(Number(e.target.value))}
                />
              </label>
              <p className="team-setting-note">
                {state.id === "football"
                  ? `Wind: ${shot.wind < 0 ? "against" : shot.wind > 0 ? "with" : "calm"} ${Math.abs(shot.wind)} · target distance ${shot.targetX}`
                  : state.id === "basketball"
                    ? `Descend through the hoop · ${shot.targetX >= 60 ? 3 : 2} points`
                    : state.id === "soccer"
                      ? "Stay inside the posts, away from the keeper. Power 45–95 reaches the goal."
                      : "Aim the preview toward the standing pins. More power widens the impact."}
              </p>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  void act("host:team-action", { type: "shoot", angle, power })
                }
              >
                {state.id === "football" || state.id === "soccer"
                  ? "Kick!"
                  : state.id === "bowling"
                    ? "Bowl!"
                    : "Shoot!"}
              </button>
            </div>
          ) : (
            <p
              className={"shot-result " + (shot.result.hit ? "hit" : "miss")}
              role="status"
            >
              {shot.result.message}
            </p>
          )}
        </>
      ) : null}
      {(powerup?.applied || shot?.result) && (
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void act("host:team-action", { type: "continue" })}
        >
          Show rankings <ArrowRight size={18} />
        </button>
      )}
    </section>
  );
}
