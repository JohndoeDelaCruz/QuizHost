import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { io, type Socket } from "socket.io-client";
import { startServer } from "../server/index";
import type { Ack, Quiz, RoomView } from "../shared/types";
const states = new WeakMap<Socket, RoomView | null>();
async function fixture(t: { after: (callback: () => Promise<void>) => void }) {
  const base = path.resolve("tests");
  const directory = mkdtempSync(path.join(base, ".tmp-"));
  const sockets: Socket[] = [];
  const server = await startServer({
    dataDir: directory,
    staticDir: path.resolve("dist/client"),
    port: 0,
  });
  const url = `http://127.0.0.1:${server.port}`;
  async function socket(host = false) {
    const s = io(url, {
      autoConnect: false,
      transports: ["websocket"],
      auth: host ? { hostToken: server.hostToken } : {},
    });
    sockets.push(s);
    s.on("room:state", (state) => states.set(s, state));
    await new Promise<void>((resolve, reject) => {
      s.once("connect", () => resolve());
      s.once("connect_error", reject);
      s.connect();
    });
    return s;
  }
  async function api(route: string, body?: unknown, method?: string) {
    const response = await fetch(url + "/api" + route, {
      method: method ?? (body ? "POST" : "GET"),
      headers: {
        Authorization: `Bearer ${server.hostToken}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal(response.status, 200);
    return response.json();
  }
  t.after(async () => {
    sockets.forEach((s) => s.disconnect());
    await server.close();
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(base + path.sep + ".tmp-"));
    rmSync(resolved, { recursive: true, force: true });
  });
  return { server, url, socket, api, directory };
}
async function cmd<T = unknown>(
  socket: Socket,
  event: string,
  payload: unknown = null,
): Promise<T> {
  const response = await new Promise<Ack<T>>((resolve, reject) => {
    socket
      .timeout(5000)
      .emit(event, payload, (error: Error | null, result: Ack<T>) =>
        error ? reject(error) : resolve(result),
      );
  });
  if (!response.ok) throw new Error(response.error);
  return response.data as T;
}
async function state(socket: Socket, predicate: (view: RoomView) => boolean) {
  const cached = states.get(socket);
  if (cached && predicate(cached)) return cached;
  return new Promise<RoomView>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("room:state", handler);
      reject(new Error("Expected room state was not received"));
    }, 5000);
    function handler(view: RoomView) {
      if (view && predicate(view)) {
        clearTimeout(timer);
        socket.off("room:state", handler);
        resolve(view);
      }
    }
    socket.on("room:state", handler);
  });
}
function quizBody(count = 1) {
  return {
    title: "Integration quiz",
    description: "Test questions",
    questions: Array.from({ length: count }, (_, i) => ({
      prompt: "Question " + (i + 1),
      options: ["One", "Two", "Three", "Four"],
      correctIndex: 1,
      seconds: 10,
      points: 200,
    })),
  };
}

test("teacher APIs and room controls reject unauthenticated clients", async (t) => {
  const f = await fixture(t);
  assert.equal((await fetch(f.url + "/api/quizzes")).status, 401);
  assert.equal(
    (
      await fetch(f.url + "/api/quizzes", {
        headers: { Authorization: "Bearer " + "é".repeat(64) },
      })
    ).status,
    401,
  );
  const student = await f.socket();
  await assert.rejects(
    cmd(student, "host:create", { quizId: "x", mode: "individual" }),
    /Only the teacher/,
  );
  assert.equal((await fetch(f.url + "/api/config")).status, 200);
});
test("50 simultaneous players answer once; answers and scores stay hidden until reveal", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const students = await Promise.all(
    Array.from({ length: 50 }, () => f.socket()),
  );
  await Promise.all(
    students.map((s, i) =>
      cmd(s, "player:join", { pin: lobby.pin, name: "Student " + (i + 1) }),
    ),
  );
  assert.equal(
    (await state(host, (r) => r.scores.length === 50)).scores.length,
    50,
  );
  await cmd(host, "host:start");
  const question = await state(students[0], (r) => r.phase === "question");
  assert.equal(question.question?.correctIndex, undefined);
  await Promise.all(students.map((s) => cmd(s, "player:answer", 1)));
  await assert.rejects(cmd(students[0], "player:answer", 2), /already locked/);
  const locked = await state(students[0], (r) => r.answeredCount === 50);
  assert.equal(locked.myAnswer?.correct, undefined);
  assert.ok(locked.scores.every((s) => s.score === 0));
  await cmd(host, "host:reveal");
  const revealed = await state(students[0], (r) => r.phase === "reveal");
  assert.equal(revealed.question?.correctIndex, 1);
  assert.equal(revealed.myAnswer?.correct, true);
  assert.ok(revealed.scores.every((s) => s.score >= 500 && s.score <= 1000));
  await cmd(host, "host:next");
  await state(host, (r) => r.phase === "finished");
  const results = await f.api("/results");
  assert.equal(results.length, 1);
  assert.equal(results[0].scores.length, 50);
  await cmd(host, "host:end");
  assert.equal((await f.api("/results")).length, 1);
});
test("reconnection preserves identity, score and locked answer", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const first = await f.socket();
  const player = await cmd<{ id: string; token: string }>(
    first,
    "player:join",
    { pin: lobby.pin, name: "Alex" },
  );
  await cmd(host, "host:start");
  await state(first, (r) => r.phase === "question");
  await cmd(first, "player:answer", 1);
  first.disconnect();
  const second = await f.socket();
  const resumed = await cmd<{ id: string; room: RoomView }>(
    second,
    "player:join",
    { pin: lobby.pin, name: "Alex", token: player.token },
  );
  assert.equal(resumed.id, player.id);
  assert.equal(resumed.room.myAnswer?.index, 1);
  await assert.rejects(cmd(second, "player:answer", 0), /already locked/);
  await cmd(host, "host:reveal");
  assert.ok(
    (await state(second, (r) => r.phase === "reveal")).scores[0].score >= 500,
  );
});
test("team tiles enforce reveal, rotate turns, award once, and save final scores", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody(2));
  const host = await f.socket(true);
  await cmd(host, "host:create", {
    quizId: quiz.id,
    mode: "teams",
    teams: ["Sun", "Moon"],
  });
  await cmd(host, "host:start");
  const board = await state(host, (r) => r.phase === "board");
  const originalTeam = board.activeTeam;
  await cmd(host, "host:pick", 0);
  await assert.rejects(cmd(host, "host:award", true), /Reveal/);
  await state(host, (r) => r.phase === "question");
  await cmd(host, "host:reveal");
  await cmd(host, "host:award", true);
  const after = await state(
    host,
    (r) => r.phase === "board" && r.activeTeam !== originalTeam,
  );
  assert.equal(after.scores.find((s) => s.id === originalTeam)?.score, 200);
  await assert.rejects(cmd(host, "host:pick", 0), /available/);
  await assert.rejects(cmd(host, "host:award", true), /Reveal/);
  await cmd(host, "host:pick", 1);
  await state(host, (r) => r.phase === "question");
  await cmd(host, "host:reveal");
  await cmd(host, "host:award", false);
  const final = await state(host, (r) => r.phase === "finished");
  assert.equal(final.scores[0].score, 200);
  assert.equal((await f.api("/results")).length, 1);
});
test("timer closes unanswered questions and prevents late answers", async (t) => {
  const f = await fixture(t);
  const body = quizBody();
  body.questions[0].seconds = 5;
  const quiz: Quiz = await f.api("/quizzes", body);
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const student = await f.socket();
  await cmd(student, "player:join", { pin: lobby.pin, name: "Late learner" });
  await cmd(host, "host:start");
  await state(student, (r) => r.phase === "question");
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Automatic reveal did not run")),
      6500,
    );
    student.on("room:state", (r) => {
      if (r.phase === "reveal") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  await assert.rejects(cmd(student, "player:answer", 1), /closed/);
});
test("SQLite quizzes and results survive closing and reopening the store", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", {
    quizId: quiz.id,
    mode: "teams",
    teams: ["Sun", "Moon"],
  });
  await cmd(host, "host:start");
  await cmd(host, "host:pick", 0);
  await state(host, (r) => r.phase === "question");
  await cmd(host, "host:reveal");
  await cmd(host, "host:award", true);
  // Read a separate database instance from the saved file to verify disk persistence.
  const { Store } = await import("../server/store");
  const store = await Store.open(f.directory);
  assert.equal(store.quiz(quiz.id)?.questions[0].correctIndex, 1);
  assert.equal(store.results()[0].scores[0].score, 200);
  store.close();
});

test("countdown hides questions, rejects early answers, resumes consistently, and preserves full answer time", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const student = await f.socket();
  const player = await cmd<{ id: string; token: string }>(
    student,
    "player:join",
    { pin: lobby.pin, name: "Ready learner" },
  );
  await cmd(host, "host:start");
  const prep = await state(student, (r) => r.phase === "countdown");
  assert.equal(prep.question, null);
  assert.equal(prep.deadline, null);
  assert.ok(prep.startsAt && prep.startsAt > prep.serverNow);
  await assert.rejects(cmd(student, "player:answer", 1), /closed/);
  await assert.rejects(cmd(host, "host:reveal"), /no open question/);
  student.disconnect();
  const resumed = await f.socket();
  const back = await cmd<{ room: RoomView }>(resumed, "player:join", {
    pin: lobby.pin,
    name: "Ready learner",
    token: player.token,
  });
  assert.equal(back.room.phase, "countdown");
  assert.equal(back.room.startsAt, prep.startsAt);
  assert.equal(back.room.question, null);
  const opened = await state(resumed, (r) => r.phase === "question");
  assert.equal(opened.startsAt, null);
  assert.ok(opened.deadline && opened.deadline - opened.serverNow >= 9950);
  assert.equal(opened.question?.prompt, "Question 1");
  await cmd(resumed, "player:answer", 1);
  await cmd(host, "host:reveal");
  assert.ok(
    (await state(resumed, (r) => r.phase === "reveal")).scores[0].score >= 500,
  );
});

test("ending a room during countdown cancels the scheduled question", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", {
    quizId: quiz.id,
    mode: "teams",
    teams: ["Sun", "Moon"],
  });
  await cmd(host, "host:start");
  await cmd(host, "host:pick", 0);
  await state(host, (r) => r.phase === "countdown");
  await cmd(host, "host:end");
  const ended = await state(host, (r) => r.phase === "finished");
  assert.equal(ended.startsAt, null);
  assert.equal(ended.deadline, null);
  await new Promise((resolve) => setTimeout(resolve, 3200));
  assert.equal(states.get(host)?.phase, "finished");
  assert.equal((await f.api("/results")).length, 1);
});
