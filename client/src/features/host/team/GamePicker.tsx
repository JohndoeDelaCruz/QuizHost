import {
  allowedPowerUps,
  defaultTeamConfig,
  POWER_UPS,
  TEAM_GAMES,
  TEAM_GAME_IDS,
  type TeamGameConfig,
} from "../../../../../shared/teamGames";
import { GameIcon } from "./GameIcon";

export function GamePicker({
  config,
  onChange,
  questionCount,
}: {
  config: TeamGameConfig;
  onChange: (value: TeamGameConfig) => void;
  questionCount: number;
}) {
  const game = TEAM_GAMES[config.game],
    pool = allowedPowerUps(config.game);
  return (
    <fieldset className="team-game-picker">
      <legend>Choose a team game</legend>
      <div className="team-game-options">
        {TEAM_GAME_IDS.map((id) => (
          <button
            type="button"
            key={id}
            className={config.game === id ? "selected" : ""}
            aria-pressed={config.game === id}
            onClick={() => onChange(defaultTeamConfig(id))}
          >
            <GameIcon game={id} />
            <strong>{TEAM_GAMES[id].title}</strong>
            <span>{TEAM_GAMES[id].description}</span>
          </button>
        ))}
      </div>
      <p className="team-game-rules">{game.rules}</p>
      {game.twoTeams && (
        <p className="team-setting-note">This game uses exactly two teams.</p>
      )}
      {config.game === "bingo" && (
        <p className="team-setting-note">
          Bingo uses the first 9, 4 or 1 selected questions to make a square
          board. The numbers on each board match those question numbers.
        </p>
      )}
      {config.game === "memory" && (
        <p className="team-setting-note">
          Memory uses up to 12 questions with distinct correct answers.
        </p>
      )}
      <div className="team-game-settings">
        <label className="field">
          Questions to use
          <select
            value={config.questionLimit ?? "all"}
            onChange={(e) =>
              onChange({
                ...config,
                questionLimit:
                  e.target.value === "all" ? undefined : Number(e.target.value),
              })
            }
          >
            <option value="all">All {questionCount} questions</option>
            {[4, 8, 16, 24, 36, 48]
              .filter((count) => count < questionCount)
              .map((count) => (
                <option key={count} value={count}>
                  {count} questions
                </option>
              ))}
          </select>
        </label>
        {config.game !== "memory" && (
          <label className="team-setting-check">
            <input
              type="checkbox"
              checked={config.timed}
              onChange={(e) => onChange({ ...config, timed: e.target.checked })}
            />{" "}
            Use each question’s answer timer
          </label>
        )}
        {config.game === "adventure" && (
          <label className="team-setting-check">
            <input
              type="checkbox"
              checked={config.hazards}
              onChange={(e) =>
                onChange({ ...config, hazards: e.target.checked })
              }
            />{" "}
            Red hazard spaces
          </label>
        )}
        {config.game === "storyDice" && (
          <label className="field">
            Picture dice
            <input
              type="number"
              min={1}
              max={16}
              value={config.diceCount}
              onChange={(e) =>
                onChange({
                  ...config,
                  diceCount: Math.max(
                    1,
                    Math.min(16, Number(e.target.value) || 1),
                  ),
                })
              }
            />
          </label>
        )}
      </div>
      {!!pool.length && (
        <details className="powerup-settings">
          <summary>Power-ups · {config.powerUps.length} enabled</summary>
          <label className="field">
            Surprise frequency
            <select
              value={config.powerUpRate}
              onChange={(e) =>
                onChange({ ...config, powerUpRate: Number(e.target.value) })
              }
            >
              <option value={0}>Off</option>
              <option value={10}>Low · 10%</option>
              <option value={25}>Normal · 25%</option>
              <option value={40}>High · 40%</option>
            </select>
          </label>
          <p className="helper">
            Classic modes add surprise tiles relative to the question count.
            Adventure applies this chance after a successful move. Turn effects
            off to use questions alone.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn subtle small"
              onClick={() => onChange({ ...config, powerUps: [...pool] })}
            >
              Enable all
            </button>
            <button
              type="button"
              className="btn subtle small"
              onClick={() => onChange({ ...config, powerUps: [] })}
            >
              Disable all
            </button>
          </div>
          <div className="powerup-options">
            {pool.map((id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={config.powerUps.includes(id)}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      powerUps: e.target.checked
                        ? [...config.powerUps, id]
                        : config.powerUps.filter((value) => value !== id),
                    })
                  }
                />
                <span className="powerup-mini" aria-hidden="true">
                  {POWER_UPS[id].symbol}
                </span>
                <span>
                  <strong>{POWER_UPS[id].title}</strong>
                  <small>{POWER_UPS[id].text}</small>
                </span>
              </label>
            ))}
          </div>
        </details>
      )}
      <p className="helper">
        Game scores follow the selected game’s rules. Correct-answer counts are
        saved separately.
      </p>
    </fieldset>
  );
}
