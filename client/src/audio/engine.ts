import { TRACKS, type SoundSettings, type Track } from "./catalog";
import type { AudioScene } from "./scene";

export type AudioStatus = "locked" | "ready" | "paused" | "unavailable";
export interface AudioSnapshot {
  status: AudioStatus;
  playing: Track | null;
}
type Voice = { source: AudioBufferSourceNode; gain: GainNode };
type Timer = ReturnType<typeof setTimeout>;
interface AudioDependencies {
  createContext?: () => AudioContext;
  load?: (context: AudioContext, track: Track) => Promise<AudioBuffer>;
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => Timer;
  clearTimer?: (timer: Timer) => void;
}

async function loadTrack(context: AudioContext, track: Track) {
  for (const format of ["mp3", "ogg"]) {
    try {
      const response = await fetch(`/audio/${TRACKS[track].file}.${format}`);
      if (!response.ok) throw new Error("Audio file unavailable");
      return await context.decodeAudioData(await response.arrayBuffer());
    } catch {
      // Try the other bundled format if a device cannot decode the first.
    }
  }
  throw new Error("Audio file unavailable");
}

// One mixer per page, outside changing game components. Scores and timers never
// depend on decoding, playback, or the browser's autoplay permission.
export class GameAudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: Voice;
  private effects = new Set<Voice>();
  private buffers = new Map<Track, Promise<AudioBuffer>>();
  private scene: AudioScene | null = null;
  private visible = true;
  private generation = 0;
  private musicRequest = "";
  private timer?: Timer;
  private countdownKey: string | null = null;
  private seen = new Set<string>();
  private listeners = new Set<() => void>();
  private state: AudioSnapshot = { status: "locked", playing: null };
  private disposed = false;
  private now: () => number;
  private setTimer: (callback: () => void, ms: number) => Timer;
  private clearTimer: (timer: Timer) => void;

  constructor(private settings: SoundSettings, private deps: AudioDependencies = {}) {
    this.now = deps.now ?? Date.now;
    // Browser timer functions cannot be invoked with this engine as receiver.
    this.setTimer = deps.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
    this.clearTimer = deps.clearTimer ?? ((timer) => clearTimeout(timer));
  }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(update: Partial<AudioSnapshot>) {
    const next = { ...this.state, ...update };
    if (next.status === this.state.status && next.playing === this.state.playing) return;
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
  // Call synchronously from a real click/submit handler, before awaiting sockets.
  async unlock() {
    if (this.disposed) return;
    try {
      if (!this.context) {
        this.context = this.deps.createContext?.() ?? new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.settings.muted ? 0 : this.settings.volume;
        this.master.connect(this.context.destination);
        this.context.onstatechange = () => {
          if (this.disposed || !this.context) return;
          const running = this.context.state === "running";
          this.publish({ status: running ? "ready" : "paused" });
          if (running) this.sync(); else this.stopPlayback();
        };
      }
      // Start resume during the gesture, not after fetching/decoding files.
      await this.context.resume();
      if (this.disposed) return;
      this.publish({ status: this.context.state === "running" ? "ready" : "paused" });
      this.sync();
      if (!this.settings.muted) {
        for (const track of Object.keys(TRACKS) as Track[]) void this.buffer(track).catch(() => {});
      }
    } catch {
      this.publish({ status: "unavailable" });
      this.stopPlayback();
    }
  }
  setSettings(settings: SoundSettings) {
    if (!settings.effects && this.settings.effects) this.generation++;
    this.settings = settings;
    if (this.master && this.context) {
      this.master.gain.setValueAtTime(settings.muted ? 0 : settings.volume, this.context.currentTime);
    }
    if (!settings.effects) this.stopEffects();
    this.sync();
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    this.sync();
  }
  setScene(scene: AudioScene | null) {
    const previous = this.scene;
    const changedStage = scene?.round !== previous?.round || scene?.phase !== previous?.phase;
    this.scene = scene;
    if (changedStage) {
      this.generation++;
      this.stopEffects();
    } else if (previous?.countdown && !scene?.countdown) {
      // An answered student's countdown stops as soon as their answer is locked.
      this.generation++;
      this.stopEffects();
    }
    if (scene?.feedback) {
      const key = `${scene.round}:feedback`;
      if (!this.seen.has(key)) {
        this.seen.add(key);
        // Joining/reconnecting directly into results must not replay old cues.
        if (previous?.round === scene.round &&
          (previous.phase === "question" || previous.phase === "reveal")) {
          void this.playEffect(scene.feedback, this.generation);
        }
      }
    }
    if (!scene?.countdown || scene.countdown.key !== previous?.countdown?.key) {
      this.clearCountdown();
      this.countdownKey = null;
    } else if (previous?.countdown) {
      // Repeated score/socket updates do not restart or shift the scheduled cue.
      scene.countdown = previous.countdown;
    }
    this.sync();
  }
  private audible() {
    return !this.disposed && this.visible && !!this.scene && !this.settings.muted &&
      this.settings.volume > 0 && this.context?.state === "running";
  }
  private buffer(track: Track) {
    let buffer = this.buffers.get(track);
    if (!buffer) {
      buffer = (this.deps.load ?? loadTrack)(this.context!, track);
      this.buffers.set(track, buffer);
      void buffer.catch(() => { this.buffers.delete(track); });
    }
    return buffer;
  }
  private voice(buffer: AudioBuffer): Voice {
    const source = this.context!.createBufferSource();
    source.buffer = buffer;
    const gain = this.context!.createGain();
    source.connect(gain);
    gain.connect(this.master!);
    return { source, gain };
  }
  private stop(voice: Voice) {
    voice.source.onended = null;
    try { voice.source.stop(); } catch { /* Already stopped. */ }
    voice.source.disconnect();
    voice.gain.disconnect();
  }
  private stopEffects() {
    this.effects.forEach((voice) => this.stop(voice));
    this.effects.clear();
    this.duckMusic();
  }
  private clearCountdown() {
    if (this.timer !== undefined) this.clearTimer(this.timer);
    this.timer = undefined;
    this.countdownKey = null;
  }
  private stopPlayback() {
    this.generation++;
    this.musicRequest = "";
    if (this.music) this.stop(this.music);
    this.music = undefined;
    this.stopEffects();
    this.clearCountdown();
    this.publish({ playing: null });
  }
  private duckMusic() {
    if (this.music && this.context) {
      this.music.gain.gain.setTargetAtTime(this.effects.size ? 0.22 : 0.7, this.context.currentTime, 0.06);
    }
  }
  private sync() {
    if (!this.audible()) { this.stopPlayback(); return; }
    const track = this.settings.music ? this.scene?.music : null;
    if (!track) {
      this.musicRequest = "";
      if (this.music) this.stop(this.music);
      this.music = undefined;
      this.publish({ playing: null });
    } else if (this.musicRequest !== track) {
      this.musicRequest = track;
      if (this.music) this.stop(this.music);
      this.music = undefined;
      this.publish({ playing: null });
      void this.buffer(track).then((buffer) => {
        if (!this.audible() || !this.settings.music || this.musicRequest !== track || this.music) return;
        this.music = this.voice(buffer);
        this.music.source.loop = true;
        this.music.gain.gain.value = this.effects.size ? 0.22 : 0.7;
        this.music.source.start();
        this.publish({ playing: track });
      }).catch(() => {
        if (this.musicRequest === track) {
          this.musicRequest = "";
          this.publish({ status: "unavailable" });
        }
      });
    }
    const countdown = this.scene?.countdown;
    if (this.settings.effects && countdown && this.countdownKey !== countdown.key &&
      !this.seen.has(`${countdown.key}:countdown`)) {
      this.countdownKey = countdown.key;
      const generation = this.generation;
      this.timer = this.setTimer(() => {
        this.timer = undefined;
        const remaining = countdown.endsAt - this.now();
        if (remaining > 0 && remaining <= 5050 && this.audible()) {
          this.seen.add(`${countdown.key}:countdown`);
          void this.playEffect("countdown", generation, countdown.endsAt);
        }
      }, Math.max(0, countdown.endsAt - this.now() - 5000));
    }
    if (!this.settings.effects) { this.clearCountdown(); this.countdownKey = null; }
  }
  private async playEffect(track: Track, generation: number, endsAt?: number) {
    if (!this.audible() || !this.settings.effects) return;
    try {
      const buffer = await this.buffer(track);
      if (!this.audible() || !this.settings.effects || generation !== this.generation) return;
      const remaining = endsAt === undefined ? undefined : (endsAt - this.now()) / 1000;
      if (remaining !== undefined && remaining <= 0) return;
      const voice = this.voice(buffer);
      voice.source.onended = () => {
        this.effects.delete(voice);
        voice.source.disconnect();
        voice.gain.disconnect();
        this.duckMusic();
      };
      this.effects.add(voice);
      this.duckMusic();
      voice.source.start(0, remaining === undefined ? 0 : Math.max(0, 5 - remaining), remaining);
    } catch {
      // A missing optional effect never interrupts the classroom game.
    }
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.stopPlayback();
    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close().catch(() => {});
    }
    this.listeners.clear();
  }
}
