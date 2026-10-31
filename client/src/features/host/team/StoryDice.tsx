import { Dice5 } from "lucide-react";
import type { GameScreenProps } from "../types";
import type { PictureDie } from "../../../../../shared/teamGames";
import { questionImageURL } from "../../../../../shared/media";
export function StoryDice({
  room,
  busy,
  act,
  question = false,
}: GameScreenProps & { question?: boolean }) {
  const state = room.teamGame!;
  const dice: PictureDie[] = state.dice?.length
    ? state.dice
    : Array.from({ length: state.config.diceCount }, () => ({
        symbol: "?",
        label: "Ready to roll",
      }));
  return (
    <div className="story-dice-game">
      {!question && (
        <div className="team-board-action">
          <label>
            Pictures{" "}
            <select
              aria-label="Number of picture dice"
              value={state.config.diceCount}
              disabled={busy}
              onChange={(e) =>
                void act("host:team-action", {
                  type: "dice-count",
                  count: Number(e.target.value),
                })
              }
            >
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void act("host:team-action", { type: "roll" })}
          >
            <Dice5 size={20} />
            Roll pictures
          </button>
        </div>
      )}
      <div className="picture-dice-grid">
        {dice.map((die, index) => (
          <div className="picture-die" key={`${state.round}:${index}`}>
            {die.image ? (
              <img
                src={questionImageURL(die.image.id)}
                alt={die.image.description || die.label}
              />
            ) : (
              <span className="die-picture" aria-hidden="true">
                {die.symbol}
              </span>
            )}
            <strong>{die.label}</strong>
          </div>
        ))}
      </div>
      <p className="team-setting-note">
        Connect all the pictures to the prompt in your story or explanation. The
        teacher decides when the response meets the class rule.
      </p>
    </div>
  );
}
