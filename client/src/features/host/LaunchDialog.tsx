import { ArrowRight, Monitor, Smartphone, X } from "lucide-react";
import type { Mode, Quiz } from "../../../../shared/types";

export function LaunchDialog({
  quiz,
  mode,
  onModeChange,
  teamNames,
  onTeamNamesChange,
  active,
  error,
  busy,
  connected,
  onClose,
  onStart,
}: {
  quiz: Quiz;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  teamNames: string;
  onTeamNamesChange: (names: string) => void;
  active: boolean;
  error: string;
  busy: boolean;
  connected: boolean;
  onClose: () => void;
  onStart: () => Promise<void>;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal launch-modal">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">CHOOSE YOUR WAY TO PLAY</span>
            <h2>Bring the class together.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close"
            onClick={() => onClose()}
          >
            <X />
          </button>
        </div>
        <p className="muted">{quiz.title}</p>
        <div className="mode-options">
          <button
            className={mode === "individual" ? "chosen" : ""}
            onClick={() => onModeChange("individual")}
          >
            <Smartphone size={27} />
            <strong>Everyone’s in</strong>
            <span>
              Students answer on their phones.
              <br />
              Shared Wi-Fi required.
            </span>
          </button>
          <button
            className={mode === "teams" ? "chosen" : ""}
            onClick={() => onModeChange("teams")}
          >
            <Monitor size={27} />
            <strong>Better together</strong>
            <span>
              Teams take turns on one screen.
              <br />
              No student devices needed.
            </span>
          </button>
        </div>
        {mode === "teams" && (
          <label className="field">
            Team names <span>One per line · 2–8 teams</span>
            <textarea
              value={teamNames}
              onChange={(e) => onTeamNamesChange(e.target.value)}
              rows={4}
            />
          </label>
        )}
        {active && (
          <p className="inline-error">
            End and close the current room before starting another.
          </p>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button className="btn secondary" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={busy || !!active || !connected}
            onClick={onStart}
          >
            Open game room <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
