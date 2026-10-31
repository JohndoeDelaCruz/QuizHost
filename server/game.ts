import { randomInt, randomUUID } from "node:crypto";
import { AVATAR_IDS, type AvatarId } from "../shared/avatars";
import { RANKING_HOLD_MS } from "../shared/presentation";
import {
  defaultTeamConfig,
  type TeamAction,
  type TeamGameConfig,
} from "../shared/teamGames";
import { prepareTeamQuiz, TeamEngine } from "./team/TeamEngine";
import type { Random } from "./team/powerUps";
import type {
  Mode,
  Phase,
  Quiz,
  RoomView,
  Result,
  Score,
} from "../shared/types";

interface Player extends Score {
  token: string;
  socketId: string;
  answers: Map<number, { index: number; correct: boolean; earned: number }>;
}
export interface GameTimings {
  preQuestionMs: number;
  readingMs: number;
  feedbackMs: number;
  rankingMs: number;
}
const DEFAULT_TIMINGS: GameTimings = {
  preQuestionMs: 5000,
  readingMs: 5000,
  feedbackMs: 2500,
  rankingMs: RANKING_HOLD_MS,
};
export class Game {
  id = randomUUID();
  pin = String(randomInt(100000, 1000000));
  phase: Phase = "lobby";
  players = new Map<string, Player>();
  questionIndex = -1;
  deadline: number | null = null;
  startsAt: number | null = null;
  used = new Set<number>();
  teamIndex = 0;
  teams: Score[];
  private timer?: ReturnType<typeof setTimeout>;
  private saved = false;
  private avatarPool: AvatarId[] = [];
  private previousScores: Score[] = [];
  private rankingReadyAt: number | null = null;
  private timings: GameTimings;
  teamEngine?: TeamEngine;
  constructor(
    public quiz: Quiz,
    public mode: Mode,
    teamNames: string[],
    private changed: () => void,
    private finished: (result: Result) => void,
    timings?: Partial<GameTimings>,
    teamConfig?: TeamGameConfig,
    teamRandom?: Random,
  ) {
    this.timings = { ...DEFAULT_TIMINGS, ...timings };
    this.quiz = structuredClone(quiz);
    this.teams =
      this.mode === "teams"
        ? teamNames.map((name) => ({
            id: randomUUID(),
            name,
            score: 0,
            correct: 0,
            avatar: this.randomAvatar(),
          }))
        : [];
    if (this.mode === "teams") {
      const config = structuredClone(teamConfig ?? defaultTeamConfig());
      this.quiz = prepareTeamQuiz(this.quiz, config);
      this.teamEngine = new TeamEngine(
        this.quiz,
        this.teams,
        config,
        this.used,
        teamRandom,
      );
    }
  }
  private randomAvatar(): AvatarId {
    if (!this.avatarPool.length) this.avatarPool = [...AVATAR_IDS];
    return this.avatarPool.splice(randomInt(this.avatarPool.length), 1)[0];
  }
  join(name: string, token: string | undefined, socketId: string) {
    if (this.mode !== "individual")
      throw new Error(
        "This is a shared-screen team game. Join your team in the classroom.",
      );
    let player = [...this.players.values()].find(
      (p) => token && p.token === token,
    );
    if (player) {
      player.connected = true;
      player.socketId = socketId;
      return player;
    }
    if ([...this.players.values()].some((p) => p.socketId === socketId))
      throw new Error("You have already joined this room.");
    if (this.phase !== "lobby")
      throw new Error(
        "The game has started. Ask the teacher to open a new room.",
      );
    if (this.players.size >= 100) throw new Error("This room is full.");
    if (
      [...this.players.values()].some(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      )
    )
      throw new Error("That name is already taken. Try adding your initial.");
    player = {
      id: randomUUID(),
      token: randomUUID(),
      name,
      score: 0,
      correct: 0,
      connected: true,
      socketId,
      answers: new Map(),
      avatar: this.randomAvatar(),
    };
    this.players.set(player.id, player);
    return player;
  }
  disconnect(socketId: string) {
    for (const p of this.players.values())
      if (p.socketId === socketId) p.connected = false;
  }
  start() {
    if (this.phase !== "lobby")
      throw new Error("This game has already started.");
    if (this.mode === "individual" && !this.players.size)
      throw new Error("Wait for at least one student to join.");
    if (this.mode === "teams") this.phase = "board";
    else this.open(0);
  }
  next() {
    if (this.phase !== "ranking" || this.rankingReadyAt === null)
      throw new Error("Show the rankings before continuing.");
    if (Date.now() < this.rankingReadyAt)
      throw new Error("Wait for the ranking animation to finish.");
    this.rankingReadyAt = null;
    if (this.mode === "individual") {
      if (this.questionIndex + 1 >= this.quiz.questions.length) this.finish();
      else this.open(this.questionIndex + 1);
    } else {
      if (this.teamEngine?.finished) {
        this.finish();
        return;
      }
      this.teamEngine?.afterTurn();
      this.teamIndex = (this.teamIndex + 1) % this.teams.length;
      this.questionIndex = -1;
      this.phase = "board";
    }
  }
  pick(index: number) {
    if (
      this.mode !== "teams" ||
      this.phase !== "board" ||
      !Number.isInteger(index) ||
      !this.teamEngine?.tileViews()[index]
    )
      throw new Error("Choose an available question tile.");
    this.teamAction({ type: "pick", index });
  }
  teamAction(action: TeamAction) {
    const engine = this.teamEngine;
    if (this.mode !== "teams" || !engine)
      throw new Error("Open a team game first.");
    if (this.phase === "board") {
      this.previousScores = structuredClone(this.scoreboard());
      const result = engine.action(action, this.teamIndex);
      if ("open" in result) {
        this.used.add(result.open);
        this.open(result.open);
      } else if ("activity" in result) this.phase = "activity";
      else if ("ranking" in result) this.showRankings();
      return;
    }
    if (this.phase === "activity") {
      if (action.type === "shoot") {
        engine.shoot(this.teamIndex, action.angle, action.power);
        return;
      }
      if (action.type === "powerup") {
        engine.resolvePowerUp(this.teamIndex, action.targetId);
        return;
      }
      if (action.type === "continue" && engine.canContinueActivity()) {
        this.showRankings();
        return;
      }
    }
    if (
      this.phase === "question" &&
      engine.config.game === "balloons" &&
      action.type === "guess"
    ) {
      const result = engine.guess(action.letter, this.teamIndex);
      if (result.done) this.reveal();
      else if (result.nextTeam)
        this.teamIndex = (this.teamIndex + 1) % this.teams.length;
      return;
    }
    if (this.phase === "reveal") {
      if (engine.config.game === "bingo" && action.type === "bingo-award") {
        engine.gradeBingo(action.teamIds);
        this.showRankings();
        return;
      }
      if (engine.config.game === "balloons" && action.type === "continue") {
        this.showRankings();
        return;
      }
    }
    throw new Error("That action is unavailable at this stage.");
  }
  private open(index: number) {
    clearTimeout(this.timer);
    this.previousScores = structuredClone(this.scoreboard());
    this.rankingReadyAt = null;
    this.questionIndex = index;
    this.phase = "preparing";
    this.deadline = null;
    this.startsAt = Date.now() + this.timings.preQuestionMs;
    this.timer = setTimeout(() => {
      this.beginReading(index);
      this.changed();
    }, this.timings.preQuestionMs);
  }
  private beginReading(index: number) {
    this.phase = "countdown";
    this.startsAt = Date.now() + this.timings.readingMs;
    this.timer = setTimeout(() => {
      this.phase = "question";
      this.startsAt = null;
      const timed = this.mode === "individual" || this.teamEngine?.config.timed;
      this.deadline = timed
        ? Date.now() + this.quiz.questions[index].seconds * 1000
        : null;
      if (timed)
        this.timer = setTimeout(() => {
          this.reveal();
          this.changed();
        }, this.quiz.questions[index].seconds * 1000);
      this.changed();
    }, this.timings.readingMs);
  }
  reveal() {
    if (this.phase !== "question")
      throw new Error("There is no open question.");
    clearTimeout(this.timer);
    this.phase = "reveal";
    this.deadline = null;
    this.teamEngine?.revealWord();
    if (this.mode === "individual") {
      this.timer = setTimeout(() => {
        this.showRankings();
        this.changed();
      }, this.timings.feedbackMs);
    }
  }
  private showRankings() {
    clearTimeout(this.timer);
    this.phase = "ranking";
    this.rankingReadyAt = Date.now() + this.timings.rankingMs;
  }
  answer(playerId: string, socketId: string, index: number) {
    if (
      this.mode !== "individual" ||
      this.phase !== "question" ||
      !this.deadline ||
      Date.now() >= this.deadline
    )
      throw new Error("This question is closed.");
    const player = this.players.get(playerId);
    if (!player || player.socketId !== socketId)
      throw new Error("Please rejoin this room.");
    if (player.answers.has(this.questionIndex))
      throw new Error("Your answer is already locked in.");
    if (!Number.isInteger(index) || index < 0 || index >= 4)
      throw new Error("Choose one of the four answers.");
    const question = this.quiz.questions[this.questionIndex];
    const correct = index === question.correctIndex;
    const earned = correct
      ? 500 +
        Math.round(
          500 *
            Math.max(
              0,
              Math.min(
                1,
                (this.deadline - Date.now()) / (question.seconds * 1000),
              ),
            ),
        )
      : 0;
    player.answers.set(this.questionIndex, { index, correct, earned });
    // Keep scores private until the reveal so they cannot give away the answer.
    if (
      [...this.players.values()].every((p) => p.answers.has(this.questionIndex))
    )
      this.reveal();
  }
  award(correct: boolean) {
    if (this.mode !== "teams" || this.phase !== "reveal")
      throw new Error("Reveal the answer before awarding points.");
    const result = this.teamEngine!.grade(correct, this.teamIndex);
    if ("activity" in result) this.phase = "activity";
    else this.showRankings();
  }
  finish() {
    if (this.phase === "question") this.reveal();
    clearTimeout(this.timer);
    this.phase = "finished";
    this.deadline = null;
    this.startsAt = null;
    this.rankingReadyAt = null;
    this.teamEngine?.forceFinish();
    if (!this.saved) {
      this.saved = true;
      this.finished({
        id: this.id,
        quizTitle: this.quiz.title,
        mode: this.mode,
        finishedAt: new Date().toISOString(),
        questionCount: this.quiz.questions.length,
        scores: this.scoreboard(),
        ...(this.teamEngine
          ? {
              teamGame: this.teamEngine.config.game,
              scoreUnit: this.teamEngine.view(this.teamIndex).unit,
              winnerIds: [...this.teamEngine.winnerIds],
              finishReason: this.teamEngine.summary,
            }
          : {}),
      });
    }
  }
  dispose() {
    clearTimeout(this.timer);
  }
  scoreboard(): Score[] {
    if (this.mode === "teams") return this.teamEngine!.orderedScores();
    return [...this.players.values()]
      .map((p) => {
        const answers = [...p.answers.entries()]
          .filter(
            ([index]) =>
              index !== this.questionIndex || this.phase !== "question",
          )
          .map(([, answer]) => answer);
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          connected: p.connected,
          score: answers.reduce((sum, a) => sum + a.earned, 0),
          correct: answers.filter((a) => a.correct).length,
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
  view(playerId?: string): RoomView {
    const q = this.quiz.questions[this.questionIndex];
    const canReveal =
      this.phase === "reveal" ||
      this.phase === "ranking" ||
      this.phase === "finished";
    const mine = playerId
      ? this.players.get(playerId)?.answers.get(this.questionIndex)
      : undefined;
    return {
      id: this.id,
      pin: this.pin,
      quizTitle: this.quiz.title,
      mode: this.mode,
      phase: this.phase,
      questionIndex: this.questionIndex,
      questionCount: this.quiz.questions.length,
      preview:
        q && this.phase === "countdown"
          ? {
              id: q.id,
              prompt: q.prompt,
              ...(q.image ? { image: q.image } : {}),
            }
          : null,
      preparationMs: this.timings.readingMs,
      preQuestionMs: this.timings.preQuestionMs,
      ranking:
        this.phase === "ranking" && this.rankingReadyAt !== null
          ? {
              previousScores: this.previousScores,
              readyAt: this.rankingReadyAt,
            }
          : null,
      question:
        q && this.phase !== "countdown" && this.phase !== "preparing"
          ? {
              id: q.id,
              prompt: q.prompt,
              options:
                this.teamEngine?.config.game === "balloons" && !canReveal
                  ? []
                  : q.options,
              seconds: q.seconds,
              points: q.points,
              ...(q.image ? { image: q.image } : {}),
              ...(canReveal ? { correctIndex: q.correctIndex } : {}),
            }
          : null,
      deadline: this.deadline,
      startsAt: this.startsAt,
      serverNow: Date.now(),
      scores: this.scoreboard(),
      answeredCount: [...this.players.values()].filter((p) =>
        p.answers.has(this.questionIndex),
      ).length,
      tiles:
        this.teamEngine?.tileViews() ??
        this.quiz.questions.map((q, index) => ({
          index,
          points: q.points,
          used: this.used.has(index),
        })),
      activeTeam: this.mode === "teams" ? this.teams[this.teamIndex].id : null,
      ...(mine ? { myAnswer: canReveal ? mine : { index: mine.index } } : {}),
      ...(this.teamEngine
        ? {
            teamGame: this.teamEngine.view(this.teamIndex),
            scoreUnit: this.teamEngine.view(this.teamIndex).unit,
          }
        : {}),
    };
  }
}
