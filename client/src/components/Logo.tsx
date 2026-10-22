import { APP_VERSION, RELEASE_CHANNEL } from "../release";

export function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="brand-name">
        QuizHost<span className="brand-dot">.</span>
        {RELEASE_CHANNEL && (
          <small className="release-badge" title={`Version ${APP_VERSION}`}>
            {RELEASE_CHANNEL}
          </small>
        )}
      </span>
    </div>
  );
}
