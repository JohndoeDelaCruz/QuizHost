import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { io, type Socket } from "socket.io-client";
import { startServer } from "../server/index";
import type { Ack, Quiz, RoomView } from "../shared/types";
import { AVATAR_IDS } from "../shared/avatars";
import type { GameTimings } from "../server/game";
const states = new WeakMap<Socket, RoomView | null>();
const TEST_TIMINGS: GameTimings = {
  readingMs: 500,
  feedbackMs: 500,
  rankingMs: 400,
};
async function fixture(
  t: { after: (callback: () => Promise<void>) => void },
  timings: Partial<GameTimings> = TEST_TIMINGS,
) {
  const base = path.resolve("tests");
  const directory = mkdtempSync(path.join(base, ".tmp-"));
  const sockets: Socket[] = [];
  const server = await startServer({
    dataDir: directory,
    staticDir: path.resolve("dist/client"),
    port: 0,
    timings,
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
    }, 10000);
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
async function continueAfterRanking(host: Socket) {
  const ranking = await state(host, (r) => r.phase === "ranking");
  assert.ok(ranking.ranking);
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      Math.max(0, ranking.ranking!.readyAt - Date.now() + 20),
    ),
  );
  await cmd(host, "host:next");
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

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN2UAAAAASUVORK5CYII=",
  "base64",
);
async function addImage(f: Awaited<ReturnType<typeof fixture>>) {
  const response = await fetch(f.url + "/api/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${f.server.hostToken}`,
      "Content-Type": "image/png",
    },
    body: imageBytes,
  });
  assert.equal(response.status, 200);
  return (await response.json()).id as string;
}

test("question images require teacher uploads, validate files, and use cached local URLs", async (t) => {
  const f = await fixture(t);
  const headers = {
    Authorization: `Bearer ${f.server.hostToken}`,
    "Content-Type": "image/png",
  };
  assert.equal(
    (
      await fetch(f.url + "/api/images", {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: imageBytes,
      })
    ).status,
    401,
  );
  for (const [type, bytes] of [
    ["image/svg+xml", Buffer.from("<svg/>")],
    ["image/png", Buffer.from("not an image")],
    ["image/jpeg", imageBytes],
  ] as const)
    assert.equal(
      (
        await fetch(f.url + "/api/images", {
          method: "POST",
          headers: { ...headers, "Content-Type": type },
          body: bytes,
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await fetch(f.url + "/api/images", {
        method: "POST",
        headers,
        body: Buffer.alloc(2 * 1024 * 1024 + 1),
      })
    ).status,
    413,
  );
  const id = await addImage(f);
  assert.equal(await addImage(f), id, "The same image should be stored once.");
  const image = await fetch(f.url + "/media/" + id);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.match(image.headers.get("cache-control") ?? "", /immutable/);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), imageBytes);
  assert.equal(
    (await fetch(f.url + "/media/" + "0".repeat(64) + ".png")).status,
    404,
  );
  const missing = await fetch(f.url + "/api/quizzes", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...quizBody(),
      questions: [
        {
          ...quizBody().questions[0],
          image: { id: "0".repeat(64) + ".png", description: "Missing" },
        },
      ],
    }),
  });
  assert.equal(missing.status, 400);
});

test("photo backups restore on another laptop, reject broken references, and retain legacy imports", async (t) => {
  const source = await fixture(t);
  const id = await addImage(source);
  const body = quizBody(2);
  await source.api("/quizzes", {
    ...body,
    title: "Photo backup",
    questions: body.questions.map((q) => ({
      ...q,
      image: { id, description: "A labelled diagram" },
    })),
  });
  const backup = await source.api("/backup");
  assert.equal(backup.version, 2);
  assert.equal(backup.images.length, 1);
  const target = await fixture(t);
  await target.api("/import", { ...backup, notes: " ".repeat(1100000) });
  const restored: Quiz = (await target.api("/quizzes")).find(
    (q: Quiz) => q.title === "Photo backup",
  );
  assert.deepEqual(restored.questions[0].image, {
    id,
    description: "A labelled diagram",
  });
  assert.deepEqual(
    Buffer.from(await (await fetch(target.url + "/media/" + id)).arrayBuffer()),
    imageBytes,
  );
  const { Store } = await import("../server/store");
  const reopened = await Store.open(target.directory);
  assert.equal(reopened.quiz(restored.id)?.questions[0].image?.id, id);
  reopened.close();
  const before = (await target.api("/quizzes")).length;
  const broken = {
    ...backup,
    images: [{ id, data: Buffer.from("broken").toString("base64") }],
  };
  const response = await fetch(target.url + "/api/import", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${target.server.hostToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(broken),
  });
  assert.equal(response.status, 400);
  assert.equal(
    (await target.api("/quizzes")).length,
    before,
    "A damaged import must not add partial quizzes.",
  );
  await target.api("/import", { version: 1, quizzes: [quizBody()] });
  assert.equal((await target.api("/quizzes")).length, before + 1);
});

test("both game modes send image references after preparation without sending image bytes", async (t) => {
  const f = await fixture(t);
  const id = await addImage(f);
  const image = { id, description: "Examine the diagram." };
  const quiz: Quiz = await f.api("/quizzes", {
    ...quizBody(),
    questions: [{ ...quizBody().questions[0], image }],
  });
  const host = await f.socket(true);
  for (const mode of ["individual", "teams"]) {
    await cmd(host, "host:create", {
      quizId: quiz.id,
      mode,
      teams: ["Sun", "Moon"],
    });
    const lobby = await state(host, (r) => r.phase === "lobby");
    const student = mode === "individual" ? await f.socket() : null;
    if (student)
      await cmd(student, "player:join", {
        pin: lobby.pin,
        name: "Visual learner",
      });
    await cmd(host, "host:start");
    if (mode === "teams") await cmd(host, "host:pick", 0);
    assert.equal(
      (await state(host, (r) => r.phase === "countdown")).question,
      null,
    );
    const question = await state(
      student ?? host,
      (r) => r.phase === "question",
    );
    assert.deepEqual(question.question?.image, image);
    assert.equal(question.question?.correctIndex, undefined);
    assert.ok(
      !JSON.stringify(question).includes(imageBytes.toString("base64")),
    );
    if (student) await cmd(student, "player:answer", 1);
    if (!student) await cmd(host, "host:reveal");
    assert.deepEqual(
      (await state(host, (r) => r.phase === "reveal")).question?.image,
      image,
    );
    await cmd(host, "host:end");
    student?.disconnect();
  }
});

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
  await Promise.all(
    students.slice(0, -1).map((s) => cmd(s, "player:answer", 1)),
  );
  await assert.rejects(cmd(students[0], "player:answer", 2), /already locked/);
  const locked = await state(students[0], (r) => r.answeredCount === 49);
  assert.equal(locked.myAnswer?.correct, undefined);
  assert.ok(locked.scores.every((s) => s.score === 0));
  await cmd(students[49], "player:answer", 1);
  const revealed = await state(students[0], (r) => r.phase === "reveal");
  assert.equal(revealed.question?.correctIndex, 1);
  assert.equal(revealed.myAnswer?.correct, true);
  assert.ok(revealed.scores.every((s) => s.score >= 500 && s.score <= 1000));
  await continueAfterRanking(host);
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
  await assert.rejects(cmd(second, "player:answer", 0), /closed/);
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
  await continueAfterRanking(host);
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
  await continueAfterRanking(host);
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
  await continueAfterRanking(host);
  // Read a separate database instance from the saved file to verify disk persistence.
  const { Store } = await import("../server/store");
  const store = await Store.open(f.directory);
  assert.equal(store.quiz(quiz.id)?.questions[0].correctIndex, 1);
  assert.equal(store.results()[0].scores[0].score, 200);
  store.close();
});

test("question reading exposes only the prompt, rejects early answers, resumes consistently, and preserves full answer time", async (t) => {
  const f = await fixture(t, {});
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
  assert.equal(prep.preview?.prompt, "Question 1");
  assert.equal("options" in prep.preview!, false);
  assert.equal("correctIndex" in prep.preview!, false);
  assert.equal(prep.preparationMs, 5000);
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
  assert.deepEqual(back.room.preview, prep.preview);
  const opened = await state(resumed, (r) => r.phase === "question");
  assert.equal(opened.startsAt, null);
  assert.ok(opened.deadline && opened.deadline - opened.serverNow >= 9950);
  assert.equal(opened.question?.prompt, "Question 1");
  await cmd(resumed, "player:answer", 1);
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
  await new Promise((resolve) =>
    setTimeout(resolve, TEST_TIMINGS.readingMs + 100),
  );
  assert.equal(states.get(host)?.phase, "finished");
  assert.equal((await f.api("/results")).length, 1);
});

test("random avatars cover the supplied pack before repeating and survive reconnects and results", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const identities: { id: string; token: string; avatar: (typeof AVATAR_IDS)[number] }[] = [];
  for (let index = 0; index < 11; index++) {
    const student = await f.socket();
    identities.push(
      await cmd<{
        id: string;
        token: string;
        avatar: (typeof AVATAR_IDS)[number];
      }>(student, "player:join", {
        pin: lobby.pin,
        name: `Avatar ${index}`,
        avatar: "bunny-buddy",
      }),
    );
  }
  assert.deepEqual(
    identities
      .slice(0, 10)
      .map((identity) => identity.avatar)
      .sort(),
    [...AVATAR_IDS].sort(),
  );
  assert.ok(AVATAR_IDS.includes(identities[10].avatar));
  const returning = await f.socket();
  const resumed = await cmd<{ id: string; avatar: string }>(
    returning,
    "player:join",
    {
      pin: lobby.pin,
      name: "Avatar 0",
      token: identities[0].token,
      avatar: "not-a-real-avatar",
    },
  );
  assert.equal(resumed.id, identities[0].id);
  assert.equal(resumed.avatar, identities[0].avatar);
  const lobbyWithAvatars = await state(host, (r) => r.scores.length === 11);
  assert.ok(
    lobbyWithAvatars.scores.every(
      (score) => score.avatar && AVATAR_IDS.includes(score.avatar),
    ),
  );
  await cmd(host, "host:end");
  const results = await f.api("/results");
  assert.equal(
    results[0].scores.find(
      (score: { id: string }) => score.id === identities[0].id,
    ).avatar,
    identities[0].avatar,
  );
  for (const avatar of AVATAR_IDS)
    assert.equal((await fetch(f.url + `/avatars/${avatar}.png`)).status, 200);
});

test("ranking waits for the animation, preserves previous standings, reconnects, and can change the leader", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody(2));
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const alex = await f.socket();
  const bea = await f.socket();
  const a = await cmd<{ id: string }>(alex, "player:join", {
    pin: lobby.pin,
    name: "Alex",
  });
  const b = await cmd<{ id: string; token: string }>(bea, "player:join", {
    pin: lobby.pin,
    name: "Bea",
  });
  await cmd(host, "host:start");
  await assert.rejects(cmd(host, "host:next"), /rankings/);
  await state(alex, (r) => r.phase === "question");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await cmd(alex, "player:answer", 1);
  const pending = await state(host, (r) => r.answeredCount === 1);
  assert.ok(pending.scores.every((score) => score.score === 0));
  await cmd(bea, "player:answer", 0);
  await state(host, (r) => r.phase === "reveal");
  const first = await state(host, (r) => r.phase === "ranking");
  assert.equal(first.scores[0].id, a.id);
  assert.ok(first.ranking?.previousScores.every((score) => score.score === 0));
  await assert.rejects(cmd(host, "host:next"), /animation/);
  await assert.rejects(cmd(bea, "host:next"), /Only the teacher/);
  bea.disconnect();
  const returning = await f.socket();
  const back = await cmd<{ room: RoomView }>(returning, "player:join", {
    pin: lobby.pin,
    name: "Bea",
    token: b.token,
  });
  assert.equal(back.room.phase, "ranking");
  assert.equal(back.room.ranking?.readyAt, first.ranking?.readyAt);
  await continueAfterRanking(host);
  const next = await state(
    host,
    (r) => r.phase === "countdown" && r.questionIndex === 1,
  );
  assert.equal(next.question, null);
  assert.equal(next.preview?.prompt, "Question 2");
  await state(returning, (r) => r.phase === "question");
  await cmd(returning, "player:answer", 1);
  await cmd(alex, "player:answer", 0);
  const second = await state(
    host,
    (r) => r.phase === "ranking" && r.questionIndex === 1,
  );
  assert.equal(second.ranking?.previousScores[0].id, a.id);
  assert.equal(second.scores[0].id, b.id);
  assert.ok(second.scores[0].score > second.scores[1].score);
  await continueAfterRanking(host);
  await state(host, (r) => r.phase === "finished");
  assert.equal((await f.api("/results"))[0].scores[0].id, b.id);
});

test("ending during answer feedback cancels automatic rankings and saves once", async (t) => {
  const f = await fixture(t);
  const quiz: Quiz = await f.api("/quizzes", quizBody());
  const host = await f.socket(true);
  await cmd(host, "host:create", { quizId: quiz.id, mode: "individual" });
  const lobby = await state(host, (r) => r.phase === "lobby");
  const student = await f.socket();
  await cmd(student, "player:join", { pin: lobby.pin, name: "Finish check" });
  await cmd(host, "host:start");
  await state(student, (r) => r.phase === "question");
  await cmd(student, "player:answer", 1);
  await state(host, (r) => r.phase === "reveal");
  await cmd(host, "host:end");
  await state(host, (r) => r.phase === "finished");
  await new Promise((resolve) =>
    setTimeout(resolve, TEST_TIMINGS.feedbackMs + 100),
  );
  assert.equal(states.get(host)?.phase, "finished");
  assert.equal((await f.api("/results")).length, 1);
});
