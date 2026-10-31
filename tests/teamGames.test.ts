import { test } from "node:test";
import assert from "node:assert/strict";
import type { Quiz, Score, Result } from "../shared/types";
import { Game } from "../server/game";
import { TeamEngine, prepareTeamQuiz } from "../server/team/TeamEngine";
import { applyPowerUp, type Random } from "../server/team/powerUps";
import {
  lineWinner,
  reachableCells,
  wordAnswer,
} from "../server/team/boardMath";
import { calculateShot } from "../shared/shotMath";
import {
  defaultTeamConfig,
  POWER_UP_IDS,
  POWER_UPS,
  TEAM_GAME_IDS,
  TEAM_GAMES,
  type TeamGameId,
  type TeamAction,
  type ShotSetup,
} from "../shared/teamGames";
import { teamActionSchema, teamConfigSchema } from "../server/team/validation";
import { csvCell, resultCSV } from "../shared/resultCSV";

const noShuffle: Random = (max) => max - 1;
test("result CSV retains legacy results, new score units, shared winners and safe spreadsheet text", () => {
  const result: Result = {
    id: "result",
    quizTitle: 'Quiz, "one"',
    mode: "teams",
    finishedAt: "2026-11-01",
    questionCount: 4,
    scores: [
      { id: "a", name: "=DANGEROUS()", score: 3, correct: 2 },
      { id: "b", name: "Moon", score: 3, correct: 3 },
    ],
    teamGame: "bowling",
    scoreUnit: "pins",
    winnerIds: ["a", "b"],
    finishReason: "Shared score",
  };
  const csv = resultCSV(result);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"Game","Score unit","Winner","Finish reason"/);
  assert.match(csv, /"Bowling","pins","Yes","Shared score"/);
  assert.match(csv, /"Quiz, ""one"""/);
  assert.match(csv, /"'=DANGEROUS\(\)"/);
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  const legacy = {
    ...result,
    teamGame: undefined,
    scoreUnit: undefined,
    winnerIds: undefined,
    finishReason: undefined,
  };
  assert.match(resultCSV(legacy), /"teams","pts","Yes",""/);
  assert.match(resultCSV(legacy), /"teams","pts","No",""/);
  assert.match(
    resultCSV({ ...result, winnerIds: [] }),
    /"Bowling","pins","No","Shared score"/,
  );
});
function quiz(count = 12): Quiz {
  return {
    id: "test",
    title: "Team challenges",
    description: "",
    updatedAt: new Date().toISOString(),
    questions: Array.from({ length: count }, (_, i) => ({
      id: `q${i}`,
      prompt: `Explain challenge ${i + 1}.`,
      options: [`Answer ${i + 1}`, "Other", "Third", "Fourth"],
      correctIndex: 0,
      seconds: 5,
      points: 100,
      puzzleAnswer: "MASS",
    })),
  };
}
function engine(
  id: TeamGameId,
  count = 12,
  random = noShuffle,
  overrides = {},
) {
  const config = { ...defaultTeamConfig(id), ...overrides };
  const bank = prepareTeamQuiz(quiz(count), config),
    used = new Set<number>();
  const teams: Score[] = [
    { id: "a", name: "Sun", score: 0, correct: 0 },
    { id: "b", name: "Moon", score: 0, correct: 0 },
  ];
  const game = new TeamEngine(bank, teams, config, used, random);
  return {
    game,
    teams,
    used,
    open(action: TeamAction, index = 0) {
      const response = game.action(action, index);
      assert.ok("open" in response);
      used.add(response.open);
      return response.open;
    },
  };
}
async function openQuestion(game: Game) {
  const end = Date.now() + 1000;
  while (game.phase !== "question" && Date.now() < end)
    await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(game.phase, "question");
}

test("team settings and action validation reject incompatible effects and malformed moves", () => {
  for (const id of TEAM_GAME_IDS)
    assert.equal(teamConfigSchema.parse({ game: id }).game, id);
  for (const config of [
    { game: "unknown" },
    { game: "quiz", powerUps: ["gold"] },
    { game: "junior", powerUps: ["gift", "gift"] },
    { game: "memory", diceCount: 17 },
    { game: "classic", powerUpRate: -1 },
    { game: "quiz", questionLimit: 0 },
  ])
    assert.equal(teamConfigSchema.safeParse(config).success, false);
  for (const action of [
    { type: "pick", index: -1 },
    { type: "column", index: 1.5 },
    { type: "shoot", angle: NaN, power: 80 },
    { type: "shoot", angle: 45, power: 101 },
    { type: "guess", letter: "AB" },
    { type: "dice-count", count: 0 },
    { type: "cheat", score: 500 },
  ])
    assert.equal(teamActionSchema.safeParse(action).success, false);
  assert.deepEqual(
    teamActionSchema.parse({ type: "guess", letter: " a ", score: 999 }),
    { type: "guess", letter: "A" },
  );
});

test("every point and trail power-up has its documented effect and valid target requirements", () => {
  const expected: Record<string, number[]> = {
    fairy: [80, 0, -10],
    thief: [25, 55, -10],
    rocket: [51, 50, -10],
    banana: [-11, 50, -10],
    star: [60, 50, -10],
    heart: [30, 55, -10],
    eraser: [0, 50, -10],
    virus: [0, 0, 0],
    shark: [30, 45, -15],
    magnet: [35, 45, -10],
    lifesaver: [25, 55, -10],
    trap: [30, 50, -10],
    seesaw: [50, 30, -10],
    gold: [80, 50, -10],
    boom: [-20, 50, -10],
    gift: [35, 50, -10],
    baam: [25, 50, -10],
    hop: [33, 50, -10],
    slide: [27, 50, -10],
    swapPlaces: [50, 30, -10],
    shufflePlaces: [50, -10, 30],
  };
  for (const id of POWER_UP_IDS) {
    const teams = [30, 50, -10].map((score, i) => ({
      id: String(i),
      name: String(i),
      score,
      correct: 0,
    }));
    if (POWER_UPS[id].target) {
      assert.throws(() => applyPowerUp(id, teams, "0", "0"), /different/);
      assert.throws(() => applyPowerUp(id, teams, "0", "missing"), /different/);
      assert.deepEqual(
        teams.map((t) => t.score),
        [30, 50, -10],
      );
    }
    const deltas = applyPowerUp(id, teams, "0", "1", () => 0);
    assert.deepEqual(
      teams.map((t) => t.score),
      expected[id],
      id,
    );
    assert.deepEqual(
      deltas.map((change) => change.delta),
      expected[id].map((score, i) => score - [30, 50, -10][i]),
      id,
    );
    assert.ok(teams.every((t) => t.correct === 0));
  }
  const rich = [
    { id: "a", name: "A", score: 900_000_000, correct: 0 },
    { id: "b", name: "B", score: 0, correct: 0 },
  ];
  applyPowerUp("star", rich, "a");
  assert.equal(rich[0].score, 1_000_000_000);
});

test("Classic hides surprise locations, resolves once and plays every question; Jr. restricts effects", () => {
  const { game, used, teams } = engine("classic", 4, noShuffle, {
    powerUps: ["gold"],
    powerUpRate: 25,
  });
  assert.equal(game.tileViews().length, 5);
  assert.ok(game.tileViews().every((t) => t.points === 0 && !t.label));
  game.action({ type: "pick", index: 4 }, 0);
  assert.equal(game.view(0).powerup?.id, "gold");
  assert.equal(game.canContinueActivity(), false);
  game.resolvePowerUp(0);
  assert.equal(teams[0].score, 50);
  assert.throws(() => game.resolvePowerUp(0), /already/);
  assert.throws(() => game.action({ type: "pick", index: 4 }, 0), /available/);
  assert.equal(game.tileViews()[4].label, "Gold");
  game.afterTurn();
  for (let i = 0; i < 4; i++) {
    const r = game.action({ type: "pick", index: i }, i % 2);
    assert.ok("open" in r);
    used.add(r.open);
    game.grade(true, i % 2);
    game.afterTurn();
  }
  assert.equal(game.finished, true);
  assert.deepEqual(
    teams.map((t) => t.score),
    [250, 200],
  );
  const junior = engine("junior", 4).game;
  assert.equal(junior.tileViews().length, 5);
  const plain = engine("classic", 4, noShuffle, { powerUps: [] }).game;
  assert.equal(plain.tileViews().length, 4);
});

test("Memory hides unopened content, preserves current pair, turns mismatches back and ends on all pairs", () => {
  const { game, teams } = engine("memory", 2);
  assert.ok(
    game
      .view(0)
      .cards!.every(
        (card) =>
          !card.faceUp && card.content === undefined && card.kind === undefined,
      ),
  );
  game.action({ type: "flip", index: 0 }, 0);
  assert.equal(game.view(0).cards![0].kind, "question");
  assert.throws(() => game.action({ type: "flip", index: 0 }, 0), /face-down/);
  game.action({ type: "flip", index: 3 }, 0);
  assert.equal(teams[0].score, 0);
  assert.equal(game.canContinueActivity(), true);
  game.afterTurn();
  assert.ok(game.view(1).cards!.every((c) => !c.faceUp && !c.selected));
  game.action({ type: "flip", index: 2 }, 1);
  game.action({ type: "flip", index: 3 }, 1);
  assert.equal(teams[1].score, 1);
  game.afterTurn();
  game.action({ type: "flip", index: 0 }, 0);
  game.action({ type: "flip", index: 1 }, 0);
  assert.deepEqual(
    game
      .view(0)
      .cards!.filter((c) => c.selected)
      .map((c) => c.index),
    [0, 1],
  );
  assert.equal(game.finished, true);
  assert.deepEqual(new Set(game.winnerIds), new Set(["a", "b"]));
});

test("Memory removes ambiguous repeated answers and caps the deck; word banks filter unusable answers", () => {
  const bank = quiz(30);
  bank.questions[1].options[0] = bank.questions[0].options[0].toUpperCase();
  const filtered = prepareTeamQuiz(bank, defaultTeamConfig("memory"));
  assert.equal(filtered.questions.length, 12);
  assert.equal(
    new Set(filtered.questions.map((q) => q.options[0].toLowerCase())).size,
    12,
  );
  bank.questions.forEach((q) => {
    q.puzzleAnswer = "123";
  });
  assert.throws(
    () => prepareTeamQuiz(bank, defaultTeamConfig("balloons")),
    /short word-game/,
  );
  bank.questions[0].puzzleAnswer = "lakas";
  assert.equal(
    prepareTeamQuiz(bank, defaultTeamConfig("balloons")).questions.length,
    1,
  );
  assert.equal(wordAnswer(" Piñata "), "PINATA");
  assert.equal(
    prepareTeamQuiz(quiz(8), defaultTeamConfig("bingo")).questions.length,
    4,
  );
});

test("line detection handles horizontal, vertical, both diagonals and never wraps rows", () => {
  for (const indexes of [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [2, 4, 6],
  ]) {
    const cells = Array(9).fill(null);
    indexes.forEach((i) => (cells[i] = "a"));
    assert.equal(lineWinner(cells, 3, 3, 3), "a");
  }
  for (const indexes of [
    [35, 36, 37, 38],
    [0, 7, 14, 21],
    [0, 8, 16, 24],
    [6, 12, 18, 24],
  ]) {
    const cells = Array(42).fill(null);
    indexes.forEach((i) => (cells[i] = "b"));
    assert.equal(lineWinner(cells, 6, 7, 4), "b");
  }
  const wrapped = Array(42).fill(null);
  [5, 6, 7, 8].forEach((i) => (wrapped[i] = "a"));
  assert.equal(lineWinner(wrapped, 6, 7, 4), null);
});

test("Tic Tac Toe needs correct claims and can finish with a draw or a lower-scoring line winner", () => {
  const f = engine("ticTacToe", 12);
  for (const cell of [0, 1, 2]) {
    f.open({ type: "pick", index: cell });
    f.game.grade(true, 0);
    f.game.afterTurn();
  }
  assert.equal(f.game.finished, true);
  assert.deepEqual(f.game.winnerIds, ["a"]);
  const d = engine("ticTacToe", 12);
  for (const [cell, team] of [
    [0, 0],
    [1, 1],
    [2, 0],
    [4, 1],
    [3, 0],
    [5, 1],
    [7, 0],
    [6, 1],
    [8, 0],
  ]) {
    d.open({ type: "pick", index: cell }, team);
    d.game.grade(true, team);
    d.game.afterTurn();
  }
  assert.equal(d.game.finished, true);
  assert.deepEqual(d.game.winnerIds, []);
  assert.match(d.game.summary, /draw/);
  const w = engine("ticTacToe", 12);
  w.teams[1].score = 999;
  w.open({ type: "pick", index: 4 });
  w.game.grade(false, 0);
  w.game.afterTurn();
  assert.equal(w.game.view(0).grid!.cells[4].owner, null);
  for (const cell of [0, 1, 2]) {
    w.open({ type: "pick", index: cell });
    w.game.grade(true, 0);
    w.game.afterTurn();
  }
  assert.equal(w.game.orderedScores()[0].id, "a");
  assert.throws(
    () =>
      new TeamEngine(
        quiz(),
        [...w.teams, { id: "c", name: "C", score: 0, correct: 0 }],
        defaultTeamConfig("ticTacToe"),
        new Set(),
      ),
    /exactly two/,
  );
});

test("Four in a Row drops counters under gravity and rejects full columns", () => {
  const f = engine("connectFour", 20);
  for (let i = 0; i < 6; i++) {
    f.open({ type: "column", index: 0 }, i % 2);
    f.game.grade(true, i % 2);
    f.game.afterTurn();
  }
  assert.equal(f.game.view(0).grid!.cells[35].owner, "a");
  assert.equal(f.game.view(0).grid!.cells[0].owner, "b");
  assert.throws(() => f.open({ type: "column", index: 0 }), /full/);
  const winner = engine("connectFour", 12);
  for (let col = 0; col < 4; col++) {
    winner.open({ type: "column", index: col });
    winner.game.grade(true, 0);
    winner.game.afterTurn();
  }
  assert.deepEqual(winner.game.winnerIds, ["a"]);
});

test("Bingo awards all selected teams, rejects duplicates and supports simultaneous winners", () => {
  const f = engine("bingo", 4);
  f.open({ type: "draw" });
  assert.throws(() => f.game.gradeBingo(["a", "a"]), /at most once/);
  assert.throws(() => f.game.gradeBingo(["outsider"]), /valid team/);
  assert.deepEqual(
    f.teams.map((t) => t.score),
    [0, 0],
  );
  f.game.gradeBingo(["a", "b"]);
  f.game.afterTurn();
  f.open({ type: "draw" });
  f.game.gradeBingo(["a", "b"]);
  assert.equal(f.game.finished, true);
  assert.deepEqual(f.game.winnerIds, ["a", "b"]);
  assert.deepEqual(
    f.teams.map((t) => [t.score, t.correct]),
    [
      [2, 2],
      [2, 2],
    ],
  );
});

test("Snakes and Adventure apply dice, hazards, safe hops and positional power-ups", () => {
  const snakes = engine("snakes", 20, () => 2);
  snakes.open({ type: "roll" });
  snakes.game.grade(true, 0);
  assert.equal(snakes.teams[0].score, 11); // 3 -> 11 ladder
  snakes.game.afterTurn();
  snakes.open({ type: "roll" });
  snakes.game.grade(false, 0);
  assert.equal(snakes.teams[0].score, 11);
  const a = engine("adventure", 20, () => 0, { powerUps: [] });
  for (let i = 0; i < 3; i++) {
    a.open({ type: "roll", safe: true });
    a.game.grade(true, 0);
    a.game.afterTurn();
  }
  assert.equal(a.teams[0].score, 5); // green 3 -> 5
  for (let i = 0; i < 2; i++) {
    a.open({ type: "roll", safe: true });
    a.game.grade(true, 0);
    a.game.afterTurn();
  }
  assert.equal(a.teams[0].score, 5); // red 7 -> 5
  const off = engine("adventure", 20, () => 0, {
    powerUps: [],
    hazards: false,
  });
  for (let i = 0; i < 5; i++) {
    off.open({ type: "roll", safe: true });
    off.game.grade(true, 0);
    off.game.afterTurn();
  }
  assert.equal(off.teams[0].score, 7);
  const power = engine("adventure", 4, () => 0, {
    powerUps: ["hop"],
    powerUpRate: 50,
  });
  power.open({ type: "roll" });
  power.game.grade(true, 0);
  assert.equal(power.game.view(0).powerup?.id, "hop");
  power.game.resolvePowerUp(0);
  assert.equal(power.teams[0].score, 4);
  assert.equal(power.game.view(0).positions![0].value, 4);
});

test("Story Dice rolls the requested picture count and keeps offline image references", () => {
  const f = engine("storyDice", 3);
  f.game.action({ type: "dice-count", count: 16 }, 0);
  f.open({ type: "roll" });
  assert.equal(f.game.view(0).dice?.length, 16);
  assert.ok(f.game.view(0).dice?.every((die) => die.symbol && die.label));
  f.game.grade(true, 0);
  assert.equal(f.teams[0].score, 100);
  const bank = quiz(1);
  bank.questions[0].image = { id: "local.png", description: "A moving cart" };
  const e = new TeamEngine(
    bank,
    f.teams,
    defaultTeamConfig("storyDice"),
    new Set(),
    noShuffle,
  );
  e.action({ type: "roll" }, 0);
  assert.ok(e.view(0).dice!.every((die) => die.image?.id === "local.png"));
});

test("Balloon Words keeps the answer private, rotates guesses, prevents repeats and resolves misses", () => {
  const f = engine("balloons", 1);
  f.open({ type: "draw" });
  assert.equal(f.game.view(0).word?.masked, "____");
  assert.equal(f.game.view(0).word?.answer, undefined);
  assert.equal(f.game.guess("S", 0).nextTeam, true);
  assert.equal(f.teams[0].score, 2);
  assert.throws(() => f.game.guess("S", 1), /unused/);
  f.game.guess("M", 1);
  f.game.guess("A", 0);
  assert.equal(f.game.view(0).word?.answer, "MASS");
  assert.equal(f.teams[0].score, 103);
  assert.equal(f.teams[0].correct, 1);
  assert.equal(f.game.finished, true);
  const miss = engine("balloons", 2);
  miss.open({ type: "draw" });
  for (const letter of "BCDEFG") miss.game.guess(letter, 0);
  assert.equal(miss.game.view(0).word?.misses, 6);
  assert.equal(miss.game.view(0).word?.solved, false);
  assert.throws(() => miss.game.guess("A", 0), /no open word/);
});

test("Egg Hunt validates orthogonal paths around rocks, hides egg values and collects once", () => {
  assert.deepEqual(new Set(reachableCells(0, 1)), new Set([1, 5]));
  assert.ok(!reachableCells(6, 3).includes(7));
  assert.ok(!reachableCells(4, 1).includes(5));
  const f = engine("eggHunt", 12, () => 0);
  assert.ok(
    f.game.view(0).grid!.cells.every((cell) => cell.collected === undefined),
  );
  f.game.action({ type: "roll" }, 0);
  assert.throws(() => f.game.action({ type: "roll" }, 0), /destination/);
  assert.throws(() => f.open({ type: "move", index: 24 }), /reachable/);
  f.open({ type: "move", index: 1 });
  f.game.grade(true, 0);
  assert.equal(f.teams[0].score, 1);
  f.game.afterTurn();
  f.game.action({ type: "roll" }, 0);
  f.open({ type: "move", index: 0 });
  f.game.grade(true, 0);
  f.game.afterTurn();
  f.game.action({ type: "roll" }, 0);
  f.open({ type: "move", index: 1 });
  f.game.grade(true, 0);
  assert.equal(f.teams[0].score, 1);
  assert.equal(f.game.view(0).grid!.cells[1].eggs, false);
});

test("sports shots are deterministic, score only once, and bowling preserves its two-ball rack", () => {
  for (const id of ["bowling", "soccer", "football", "basketball"] as const) {
    const f = engine(id, 4);
    f.open({ type: "draw" });
    f.game.grade(true, 0);
    assert.ok(f.game.view(0).shot);
    assert.equal(f.teams[0].score, 0);
    assert.equal(f.teams[0].correct, 1);
    const setup = f.game.view(0).shot!;
    assert.deepEqual(
      calculateShot(setup, 45, 80),
      calculateShot(setup, 45, 80),
    );
    f.game.shoot(0, 45, 80);
    assert.equal(f.teams[0].score, f.game.view(0).shot!.result!.points);
    assert.throws(() => f.game.shoot(0, 45, 80), /already/);
    f.game.afterTurn();
    f.open({ type: "draw" });
    f.game.grade(false, 0);
    if (id === "bowling") {
      const rack = f.game.view(0).racks![0];
      assert.equal(rack.frames, 1);
      assert.equal(rack.balls, 0);
      assert.ok(rack.pins.every(Boolean));
    }
  }
  const base: ShotSetup = {
    sport: "soccer",
    targetX: 0,
    targetY: 0,
    wind: 0,
    keeper: 50,
    pins: Array(10).fill(true),
  };
  assert.equal(calculateShot(base, 45, 80).hit, false);
  assert.equal(calculateShot(base, 18, 80).points, 1);
  assert.throws(() => calculateShot(base, Infinity, 80), /valid/);
  for (const sport of ["football", "basketball"] as const) {
    for (const targetX of sport === "football" ? [55, 72] : [45, 60, 65])
      for (const targetY of sport === "football" ? [7] : [18, 22])
        for (const wind of sport === "football" ? [-2, 0, 2] : [0]) {
          const setup = { ...base, sport, targetX, targetY, wind };
          let possible = false;
          for (let angle = 20; angle <= 80 && !possible; angle++)
            for (let power = 50; power <= 100; power += 2)
              if (calculateShot(setup, angle, power).hit) {
                possible = true;
                break;
              }
          assert.ok(
            possible,
            `${sport}: ${targetX},${targetY}, wind ${wind} must be hittable`,
          );
        }
  }
});

for (const id of TEAM_GAME_IDS)
  test(`${TEAM_GAMES[id].title}: controller completes a valid turn and saves typed results`, async () => {
    const saved: Result[] = [];
    const config = { ...defaultTeamConfig(id), timed: false, powerUps: [] };
    const game = new Game(
      quiz(4),
      "teams",
      ["Sun", "Moon"],
      () => {},
      (r) => saved.push(r),
      { preQuestionMs: 0, readingMs: 0, rankingMs: 0 },
      config,
      noShuffle,
    );
    try {
      game.start();
      assert.equal(game.phase, "board");
      assert.throws(
        () => game.teamAction({ type: "shoot", angle: 45, power: 80 }),
        /unavailable/,
      );
      if (id === "memory") {
        game.teamAction({ type: "flip", index: 0 });
        game.teamAction({ type: "flip", index: 1 });
        assert.equal(game.phase, "activity");
        game.teamAction({ type: "continue" });
      } else {
        const action: TeamAction = [
          "quiz",
          "classic",
          "junior",
          "ticTacToe",
        ].includes(id)
          ? { type: "pick", index: 0 }
          : id === "connectFour"
            ? { type: "column", index: 0 }
            : ["snakes", "adventure", "storyDice"].includes(id)
              ? { type: "roll" }
              : { type: "draw" };
        if (id === "eggHunt") {
          game.teamAction({ type: "roll" });
          game.teamAction({ type: "move", index: 1 });
        } else game.teamAction(action);
        await openQuestion(game);
        assert.equal(game.deadline, null);
        if (id === "balloons") {
          assert.deepEqual(game.view().question!.options, []);
          assert.equal(game.view().teamGame!.word!.answer, undefined);
          for (const letter of "MAS")
            game.teamAction({ type: "guess", letter });
          game.teamAction({ type: "continue" });
        } else {
          game.reveal();
          if (id === "bingo")
            game.teamAction({
              type: "bingo-award",
              teamIds: game.teams.map((t) => t.id),
            });
          else game.award(true);
          if (["bowling", "soccer", "football", "basketball"].includes(id)) {
            assert.equal(game.phase, "activity");
            assert.throws(
              () => game.teamAction({ type: "continue" }),
              /unavailable/,
            );
            game.teamAction({ type: "shoot", angle: 45, power: 80 });
            game.teamAction({ type: "continue" });
          }
        }
      }
      assert.equal(game.phase, "ranking");
      assert.throws(() => game.award(true), /Reveal/);
      game.next();
      assert.equal(game.phase, "board");
      game.finish();
      game.finish();
      assert.equal(saved.length, 1);
      assert.equal(saved[0].teamGame, id);
      assert.equal(saved[0].scoreUnit, TEAM_GAMES[id].unit);
      assert.ok(saved[0].winnerIds);
      assert.match(saved[0].finishReason!, /teacher/);
    } finally {
      game.dispose();
    }
  });

test("all sixteen controllers reach a natural finish when their question bank or board is complete", async () => {
  for (const id of TEAM_GAME_IDS) {
    const results: Result[] = [],
      config = { ...defaultTeamConfig(id), timed: false, powerUps: [] };
    const game = new Game(
      quiz(1),
      "teams",
      ["A", "B"],
      () => {},
      (r) => results.push(r),
      { preQuestionMs: 0, readingMs: 0, rankingMs: 0 },
      config,
      noShuffle,
    );
    try {
      game.start();
      if (id === "memory") {
        game.teamAction({ type: "flip", index: 0 });
        game.teamAction({ type: "flip", index: 1 });
        game.teamAction({ type: "continue" });
      } else {
        if (["quiz", "classic", "junior", "ticTacToe"].includes(id))
          game.teamAction({ type: "pick", index: 0 });
        else if (id === "connectFour")
          game.teamAction({ type: "column", index: 0 });
        else if (["snakes", "adventure", "storyDice"].includes(id))
          game.teamAction({ type: "roll" });
        else if (id === "eggHunt") {
          game.teamAction({ type: "roll" });
          game.teamAction({ type: "move", index: 1 });
        } else game.teamAction({ type: "draw" });
        await openQuestion(game);
        if (id === "balloons") {
          for (const letter of "MAS")
            game.teamAction({ type: "guess", letter });
          game.teamAction({ type: "continue" });
        } else {
          game.reveal();
          if (id === "bingo")
            game.teamAction({
              type: "bingo-award",
              teamIds: game.teams.map((t) => t.id),
            });
          else game.award(true);
          if (["bowling", "soccer", "football", "basketball"].includes(id)) {
            game.teamAction({ type: "shoot", angle: 45, power: 80 });
            game.teamAction({ type: "continue" });
          }
        }
      }
      assert.equal(game.teamEngine!.finished, true, id);
      game.next();
      assert.equal(game.phase, "finished", id);
      assert.equal(results.length, 1, id);
      assert.equal(results[0].teamGame, id);
      assert.doesNotMatch(results[0].finishReason!, /Ended by the teacher/);
      assert.throws(() => game.teamAction({ type: "draw" }), /stage/);
    } finally {
      game.dispose();
    }
  }
});
