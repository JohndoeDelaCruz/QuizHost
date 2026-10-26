import { SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "./AudioProvider";
import { TRACKS } from "./catalog";

export function AudioControls() {
  const { settings, snapshot, unlock, update } = useAudio();
  const ready = snapshot.status === "ready";
  const silent = settings.muted || settings.volume === 0 || (!settings.music && !settings.effects);
  const label = silent ? "Unmute sound" : ready ? "Mute sound" :
    snapshot.status === "unavailable" ? "Retry sound" : "Enable sound";
  function toggle() {
    if (silent) {
      update({ muted: false, volume: settings.volume || 1,
        ...(!settings.music && !settings.effects ? { effects: true } : {}) });
      unlock();
    } else if (ready) update({ muted: true });
    else unlock();
  }
  return (
    <div className="audio-controls">
      <button className="sound-toggle" onClick={toggle} aria-label={label} aria-pressed={ready && !silent} title={label}>
        {silent ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{silent ? "Muted" : ready ? "Sound on" : "Enable sound"}</span>
      </button>
      <details className="sound-settings">
        <summary aria-label="Sound settings" title="Sound settings" onClick={unlock}>
          <SlidersHorizontal size={16} />
        </summary>
        <div className="sound-panel">
          <strong>Classroom sound</strong>
          <label className="volume-field">
            <span>Volume <output>{Math.round(settings.volume * 100)}%</output></span>
            <input type="range" min="0" max="100" step="5" aria-label="Sound volume"
              value={Math.round(settings.volume * 100)}
              onChange={(event) => { update({ volume: Number(event.target.value) / 100 }); unlock(); }} />
          </label>
          <label className="sound-option">
            <input type="checkbox" checked={settings.music}
              onChange={(event) => { update({ music: event.target.checked }); unlock(); }} />
            Background music
          </label>
          <label className="sound-option">
            <input type="checkbox" checked={settings.effects}
              onChange={(event) => { update({ effects: event.target.checked }); unlock(); }} />
            Game sounds
          </label>
          <p role="status">{silent ? "Sound muted" : snapshot.status === "unavailable" ?
            "Sound unavailable. Tap Retry sound." : snapshot.status !== "ready" ?
            "Tap Enable sound to begin." : snapshot.playing ?
            TRACKS[snapshot.playing].title : settings.music ? "Ready for the game" : "Game sounds only"}</p>
          <small>Saved on this device.</small>
        </div>
      </details>
    </div>
  );
}
