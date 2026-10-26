import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GameAudioEngine } from "../client/src/audio/engine";
import { defaultSoundSettings, TRACKS, type Track } from "../client/src/audio/catalog";
import { hostAudioScene, roomAudioScene, type AudioScene } from "../client/src/audio/scene";
import type { RoomView } from "../shared/types";

class FakeGain {
  gain = { value: 1, setValueAtTime(value: number) { this.value = value; },
    setTargetAtTime(value: number) { this.value = value; } };
  connect() {}
  disconnect() {}
}
class FakeSource {
  buffer: (AudioBuffer & { track: Track }) | null = null;
  loop = false;
  onended: (() => void) | null = null;
  started: number[] | null = null;
  stopped = false;
  connect() {}
  disconnect() {}
  start(when = 0, offset = 0, duration?: number) { this.started = [when, offset, duration ?? -1]; }
  stop() { this.stopped = true; }
}
class FakeContext {
  state = "suspended";
  currentTime = 0;
  destination = {};
  onstatechange: (() => void) | null = null;
  sources: FakeSource[] = [];
  createGain() { return new FakeGain(); }
  createBufferSource() { const source = new FakeSource(); this.sources.push(source); return source; }
  async resume() { this.state = "running"; this.onstatechange?.(); }
  async close() { this.state = "closed"; }
}
const audioBuffer = (track: Track) => ({ track, duration: 20 }) as unknown as AudioBuffer;
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const scene = (patch: Partial<AudioScene> = {}): AudioScene => ({
  round: "room:0", phase: "lobby", music: "lobby", feedback: null, countdown: null, ...patch,
});
function fixture(load = async (_context: AudioContext, track: Track) => audioBuffer(track)) {
  const context = new FakeContext();
  let now = 1000;
  let nextTimer = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const engine = new GameAudioEngine(defaultSoundSettings("host"), {
    createContext: () => context as unknown as AudioContext, load, now: () => now,
    setTimer(callback, ms) {
      const id = ++nextTimer;
      timers.set(id, { at: now + ms, callback });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer(id) { timers.delete(id as unknown as number); },
  });
  const advance = (ms: number) => {
    now += ms;
    for (const [id, timer] of [...timers]) if (timer.at <= now) {
      timers.delete(id); timer.callback();
    }
  };
  const active = (track: Track) => context.sources.filter((source) =>
    source.buffer?.track === track && source.started && !source.stopped);
  return { engine, context, advance, timers, active };
}

test("audio stays gesture-gated, preserves loops on updates, and stops on mute/leave", async () => {
  const f = fixture();
  f.engine.setScene(scene());
  assert.equal(f.context.sources.length, 0);
  assert.equal(f.engine.snapshot().status, "locked");
  await f.engine.unlock(); await flush();
  assert.equal(f.active("lobby").length, 1);
  assert.equal(f.active("lobby")[0].loop, true);
  const original = f.active("lobby")[0];
  f.engine.setScene(hostAudioScene(null, "library", true));
  await flush();
  assert.equal(f.active("lobby")[0], original, "Browsing the library keeps the same loop");
  f.engine.setScene(scene()); await f.engine.unlock(); await flush();
  assert.equal(f.active("lobby")[0], original);
  f.engine.setSettings({ ...defaultSoundSettings("host"), volume: 0.6 });
  assert.equal(f.active("lobby")[0], original);
  f.engine.setSettings({ ...defaultSoundSettings("host"), muted: true });
  assert.ok(original.stopped);
  assert.equal(f.engine.snapshot().playing, null);
  f.engine.setSettings(defaultSoundSettings("host")); await flush();
  assert.equal(f.active("lobby").length, 1);
  f.engine.setVisible(false);
  assert.equal(f.active("lobby").length, 0);
  f.engine.setVisible(true); await flush();
  assert.equal(f.active("lobby").length, 1);
  f.engine.setScene(null);
  assert.equal(f.active("lobby").length, 0);
  f.engine.dispose(); assert.equal(f.context.state, "closed");
});

test("late decoding cannot resurrect old music or a cancelled result cue", async () => {
  const pending = new Map<Track, (buffer: AudioBuffer) => void>();
  const f = fixture((_context, track) => new Promise((resolve) => pending.set(track, resolve)));
  f.engine.setScene(scene()); await f.engine.unlock();
  f.engine.setScene(scene({ phase: "question", music: "question" }));
  pending.get("lobby")!(audioBuffer("lobby")); await flush();
  assert.equal(f.active("lobby").length, 0);
  pending.get("question")!(audioBuffer("question")); await flush();
  assert.equal(f.active("question").length, 1);
  f.engine.setScene(scene({ phase: "reveal", music: null, feedback: "correct" }));
  f.engine.setSettings({ ...defaultSoundSettings("host"), muted: true });
  f.engine.setSettings(defaultSoundSettings("host"));
  pending.get("correct")!(audioBuffer("correct")); await flush();
  assert.equal(f.active("correct").length, 0);
  f.engine.dispose();
});

test("result cues play once, skip reconnect results, and respect student music preferences", async () => {
  const f = fixture();
  f.engine.setSettings(defaultSoundSettings("student"));
  f.engine.setScene(scene({ phase: "reveal", music: null, feedback: "correct" }));
  await f.engine.unlock(); await flush();
  assert.equal(f.active("correct").length, 0);
  f.engine.setScene(scene({ round: "room:1", phase: "question", music: "question" }));
  assert.equal(f.active("question").length, 0);
  f.engine.setScene(scene({ round: "room:1", phase: "reveal", music: null, feedback: "wrong" }));
  await flush(); assert.equal(f.active("wrong").length, 1);
  f.engine.setScene(scene({ round: "room:1", phase: "reveal", music: null, feedback: "wrong" }));
  await flush(); assert.equal(f.active("wrong").length, 1);
  f.engine.setScene(scene({ round: "room:1", phase: "ranking", music: "ranking", feedback: "wrong" }));
  await flush(); assert.equal(f.active("wrong").length, 0);
  assert.equal(f.active("ranking").length, 0);
  f.engine.setSettings({ ...defaultSoundSettings("student"), music: true });
  await flush(); assert.equal(f.active("ranking").length, 1);
  f.engine.dispose();
});

test("countdown follows the deadline, survives updates, resumes if muted before it, and stops when answered", async () => {
  const f = fixture();
  const question = scene({ phase: "question", music: "question", countdown: { key: "room:0", endsAt: 11000 } });
  f.engine.setScene(question); await f.engine.unlock(); await flush();
  assert.equal(f.timers.size, 1);
  f.advance(2000);
  f.engine.setSettings({ ...defaultSoundSettings("host"), muted: true });
  assert.equal(f.timers.size, 0);
  f.engine.setSettings(defaultSoundSettings("host")); await flush();
  assert.equal(f.timers.size, 1);
  f.engine.setScene(scene({ ...question, countdown: { key: "room:0", endsAt: 99999 } }));
  f.advance(3000); await flush();
  assert.equal(f.active("countdown").length, 1);
  assert.deepEqual(f.active("countdown")[0].started, [0, 0, 5]);
  f.engine.setScene(question); await flush();
  assert.equal(f.active("countdown").length, 1);
  f.engine.setScene(scene({ phase: "question", music: "thinking" }));
  assert.equal(f.active("countdown").length, 0);
  f.engine.dispose();
});

test("countdown seeks to the remaining time and never plays an expired or disabled cue", async () => {
  const f = fixture();
  await f.engine.unlock(); await flush();
  f.engine.setScene(scene({ phase: "question", music: "question", countdown: { key: "late", endsAt: 3000 } }));
  f.advance(0); await flush();
  assert.deepEqual(f.active("countdown")[0].started, [0, 3, 2]);
  f.engine.setScene(scene({ round: "room:1", phase: "question", music: "question", countdown: { key: "expired", endsAt: 500 } }));
  f.advance(0); await flush(); assert.equal(f.active("countdown").length, 0);
  f.engine.setSettings({ ...defaultSoundSettings("host"), effects: false });
  f.engine.setScene(scene({ round: "room:2", phase: "question", music: "question", countdown: { key: "disabled", endsAt: 3000 } }));
  f.advance(0); await flush(); assert.equal(f.active("countdown").length, 0);
  f.engine.dispose();
});

test("unsupported audio or rejected playback never throws into gameplay", async () => {
  const engine = new GameAudioEngine(defaultSoundSettings("host"), { createContext: () => { throw new Error("Unavailable"); } });
  engine.setScene(scene());
  await assert.doesNotReject(engine.unlock());
  assert.equal(engine.snapshot().status, "unavailable");
  engine.dispose();
});

test("native browser timers are invoked without an engine receiver", async () => {
  const nativeSet = globalThis.setTimeout;
  const nativeClear = globalThis.clearTimeout;
  let scheduled = false;
  let cancelled = false;
  globalThis.setTimeout = function (this: unknown, ...args: Parameters<typeof setTimeout>) {
    assert.ok(this === undefined || this === globalThis, "Browser timer receiver must be the global object");
    scheduled = true;
    return nativeSet(...args);
  } as typeof setTimeout;
  globalThis.clearTimeout = function (this: unknown, ...args: Parameters<typeof clearTimeout>) {
    assert.ok(this === undefined || this === globalThis, "Browser timer receiver must be the global object");
    cancelled = true;
    return nativeClear(...args);
  };
  const context = new FakeContext();
  const engine = new GameAudioEngine(defaultSoundSettings("host"), {
    createContext: () => context as unknown as AudioContext,
    load: async (_context, track) => audioBuffer(track),
  });
  try {
    engine.setScene(scene({ phase: "question", music: "question",
      countdown: { key: "timer", endsAt: Date.now() + 10000 } }));
    await engine.unlock(); await flush();
    assert.equal(scheduled, true);
    engine.setScene(null);
    assert.equal(cancelled, true);
  } finally {
    engine.dispose();
    globalThis.setTimeout = nativeSet;
    globalThis.clearTimeout = nativeClear;
  }
});

test("scene selection keeps personal results private and derives countdown time from the server", () => {
  const base = { id: "room", questionIndex: 0, mode: "individual", phase: "question",
    deadline: 20000, serverNow: 12000, scores: [] } as unknown as RoomView;
  const library = hostAudioScene(base, "library", true)!;
  assert.equal(library.music, "lobby", "Library music is independent of a background game");
  assert.equal(library.countdown, null);
  assert.equal(library.feedback, null);
  assert.equal(hostAudioScene(base, "room", true)?.music, "question");
  assert.equal(hostAudioScene(base, "setup", true), null);
  assert.equal(hostAudioScene(base, "library", false), null);
  assert.equal(roomAudioScene({ ...base, phase: "preparing" }, "host").music, "thinking");
  assert.equal(roomAudioScene({ ...base, phase: "preparing" }, "student").countdown, null);
  assert.equal(roomAudioScene(base, "host", 1000).countdown?.endsAt, 9000);
  assert.equal(roomAudioScene(base, "host").feedback, null);
  const locked = { ...base, myAnswer: { index: 1 } };
  assert.equal(roomAudioScene(locked, "student").countdown, null);
  assert.equal(roomAudioScene(locked, "student").music, "thinking");
  const revealed = { ...base, phase: "reveal", myAnswer: { index: 1, correct: true } } as RoomView;
  assert.equal(roomAudioScene(revealed, "student").feedback, "correct");
  assert.equal(roomAudioScene(revealed, "host").feedback, null);
  const teams = { ...base, phase: "ranking", mode: "teams", activeTeam: "sun",
    scores: [{ id: "sun", score: 100 }], ranking: { previousScores: [{ id: "sun", score: 0 }] } } as RoomView;
  assert.equal(roomAudioScene(teams, "host").feedback, "correct");
  teams.scores[0].score = 0;
  assert.equal(roomAudioScene(teams, "host").feedback, "wrong");
});

test("the complete offline pack is present in both formats", () => {
  for (const track of Object.values(TRACKS)) for (const format of ["mp3", "ogg"]) {
    const bytes = readFileSync(`client/public/audio/${track.file}.${format}`);
    assert.ok(bytes.length > 8000);
    assert.equal(bytes.subarray(0, 3).toString(), format === "mp3" ? "ID3" : "Ogg");
  }
});
