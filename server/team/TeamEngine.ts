import type { Quiz, Score, RoomView } from "../../shared/types";
import {
  TEAM_GAMES,
  POWER_UPS,
  type PictureDie,
  type PowerUpId,
  type ShotSport,
  type TeamAction,
  type TeamGameConfig,
  type TeamGameView,
} from "../../shared/teamGames";
import { calculateShot } from "../../shared/shotMath";
import { applyPowerUp, secureRandom, shuffled, type Random } from "./powerUps";
import {
  GARDEN_ROCKS,
  GARDEN_STARTS,
  lineWinner,
  reachableCells,
  SNAKE_LINKS,
  TRAIL_GREEN,
  TRAIL_RED,
  usableWord,
  wordAnswer,
} from "./boardMath";

export function prepareTeamQuiz(quiz: Quiz, config: TeamGameConfig): Quiz {
  let questions = quiz.questions.slice(
    0,
    config.questionLimit ?? quiz.questions.length,
  );
  if (config.game === "memory") {
    const answers = new Set<string>();
    questions = questions
      .filter((q) => {
        const answer = q.options[q.correctIndex].trim().toLowerCase();
        if (answers.has(answer)) return false;
        answers.add(answer);
        return true;
      })
      .slice(0, 12);
  }
  if (config.game === "balloons")
    questions = questions.filter((q) =>
      usableWord(q.puzzleAnswer || q.options[q.correctIndex]),
    );
  if (config.game === "bingo")
    questions = questions.slice(
      0,
      questions.length >= 9 ? 9 : questions.length >= 4 ? 4 : 1,
    );
  if (!questions.length)
    throw new Error(
      config.game === "balloons"
        ? "Add a short word-game answer (up to 60 characters with letters) to at least one question."
        : "This game needs at least one usable question.",
    );
  return { ...quiz, questions };
}
type Control =
  | { open: number }
  | { activity: true }
  | { ranking: true }
  | { update: true }
  | { wordDone: true };
const PICTURES: PictureDie[] = [
  { symbol: "🏫", label: "School" },
  { symbol: "🌊", label: "Ocean" },
  { symbol: "☀", label: "Sun" },
  { symbol: "🌧", label: "Rain" },
  { symbol: "🌳", label: "Tree" },
  { symbol: "🚲", label: "Bicycle" },
  { symbol: "⚽", label: "Ball" },
  { symbol: "🔑", label: "Key" },
  { symbol: "💡", label: "Idea" },
  { symbol: "🌉", label: "Bridge" },
  { symbol: "⛰", label: "Mountain" },
  { symbol: "🚀", label: "Rocket" },
  { symbol: "🧊", label: "Ice" },
  { symbol: "🔥", label: "Warmth" },
  { symbol: "🧲", label: "Magnet" },
  { symbol: "🦊", label: "Fox" },
  { symbol: "🤖", label: "Robot" },
  { symbol: "🌙", label: "Moon" },
  { symbol: "🎒", label: "Backpack" },
  { symbol: "🪁", label: "Kite" },
];

export class TeamEngine {
  round = 0;
  finished = false;
  winnerIds: string[] = [];
  summary = "";
  pendingCell?: number;
  roll = 0;
  private pendingQuestion = -1;
  private cards: {
    pair: number;
    answer: boolean;
    owner: string | null;
    faceUp: boolean;
  }[] = [];
  private flips: number[] = [];
  private cells: (string | null)[] = [];
  private tiles: {
    question: number | null;
    power?: PowerUpId;
    used: boolean;
  }[] = [];
  private positions = new Map<string, number>();
  private collected = new Map<number, { teamId: string; amount: number }>();
  private eggs = new Map<number, number>();
  private bingoBoards = new Map<string, number[]>();
  private bingoMarked = new Map<string, Set<number>>();
  private word?: {
    answer: string;
    guessed: Set<string>;
    misses: number;
    resolved: boolean;
    solved: boolean;
  };
  private dice: PictureDie[] = [];
  private powerup?: NonNullable<TeamGameView["powerup"]>;
  private shot?: NonNullable<TeamGameView["shot"]>;
  private racks = new Map<
    string,
    { pins: boolean[]; balls: number; frames: number }
  >();
  constructor(
    public quiz: Quiz,
    private teams: Score[],
    public config: TeamGameConfig,
    private used: Set<number>,
    private random: Random = secureRandom,
  ) {
    const game = config.game;
    if (TEAM_GAMES[game].twoTeams && teams.length !== 2)
      throw new Error(`${TEAM_GAMES[game].title} needs exactly two teams.`);
    this.tiles = quiz.questions.map((_, question) => ({
      question,
      used: false,
    }));
    if (
      (game === "classic" || game === "junior") &&
      config.powerUps.length &&
      config.powerUpRate > 0
    ) {
      const count = Math.max(
        1,
        Math.round((quiz.questions.length * config.powerUpRate) / 100),
      );
      this.tiles.push(
        ...Array.from({ length: count }, () => ({
          question: null,
          power: config.powerUps[this.random(config.powerUps.length)],
          used: false,
        })),
      );
      this.tiles = shuffled(this.tiles, this.random);
    }
    if (game === "memory")
      this.cards = shuffled(
        quiz.questions.flatMap((_, pair) => [
          { pair, answer: false, owner: null, faceUp: false },
          { pair, answer: true, owner: null, faceUp: false },
        ]),
        this.random,
      );
    if (game === "ticTacToe" || game === "connectFour")
      this.cells = Array(game === "ticTacToe" ? 9 : 42).fill(null);
    teams.forEach((team, i) => {
      this.positions.set(team.id, game === "eggHunt" ? GARDEN_STARTS[i] : 0);
      this.racks.set(team.id, {
        pins: Array(10).fill(true),
        balls: 0,
        frames: 0,
      });
      if (game === "bingo") {
        this.bingoBoards.set(
          team.id,
          shuffled(
            quiz.questions.map((_, index) => index),
            this.random,
          ),
        );
        this.bingoMarked.set(team.id, new Set());
      }
    });
    if (game === "eggHunt")
      for (let cell = 0; cell < 25; cell++)
        if (
          !GARDEN_ROCKS.includes(cell) &&
          !GARDEN_STARTS.slice(0, teams.length).includes(cell)
        )
          this.eggs.set(cell, this.random(5) + 1);
  }
  private team(index: number) {
    return this.teams[index];
  }
  private nextQuestion() {
    const available = this.quiz.questions
      .map((_, i) => i)
      .filter((i) => !this.used.has(i));
    if (!available.length) throw new Error("No questions remain.");
    return available[0];
  }
  private open(index: number): Control {
    this.pendingQuestion = index;
    this.round++;
    this.powerup = undefined;
    this.shot = undefined;
    return { open: index };
  }
  action(action: TeamAction, teamIndex: number): Control {
    const game = this.config.game,
      team = this.team(teamIndex);
    if (this.finished) throw new Error("This game has finished.");
    if (
      action.type === "pick" &&
      ["quiz", "classic", "junior"].includes(game)
    ) {
      const tile = this.tiles[action.index];
      if (!tile || tile.used)
        throw new Error("Choose an available question tile.");
      tile.used = true;
      this.round++;
      if (tile.power) {
        this.powerup = { id: tile.power, applied: false };
        this.summary = `${team.name} found ${POWER_UPS[tile.power].title}.`;
        return { activity: true };
      }
      this.round--;
      return this.open(tile.question!);
    }
    if (game === "memory" && action.type === "flip") {
      const card = this.cards[action.index];
      if (!card || card.owner || card.faceUp || this.flips.length >= 2)
        throw new Error("Choose a face-down card.");
      card.faceUp = true;
      this.flips.push(action.index);
      if (this.flips.length < 2) return { update: true };
      this.round++;
      const a = this.cards[this.flips[0]],
        b = this.cards[this.flips[1]];
      if (a.pair === b.pair) {
        a.owner = b.owner = team.id;
        team.score++;
        team.correct++;
        this.used.add(a.pair);
        this.summary = `${team.name} matched a pair!`;
      } else
        this.summary =
          "Those cards are not a pair. Remember them for your next turn.";
      this.checkEnd();
      return { activity: true };
    }
    if (game === "ticTacToe" && action.type === "pick") {
      if (action.index < 0 || action.index >= 9 || this.cells[action.index])
        throw new Error("Choose an empty square.");
      this.pendingCell = action.index;
      return this.open(this.nextQuestion());
    }
    if (game === "connectFour" && action.type === "column") {
      if (action.index < 0 || action.index >= 7)
        throw new Error("Choose a valid column.");
      let target = -1;
      for (let row = 5; row >= 0; row--)
        if (!this.cells[row * 7 + action.index]) {
          target = row * 7 + action.index;
          break;
        }
      if (target < 0) throw new Error("That column is full.");
      this.pendingCell = target;
      return this.open(this.nextQuestion());
    }
    if (game === "bingo" && action.type === "draw")
      return this.open(this.nextQuestion());
    if ((game === "snakes" || game === "adventure") && action.type === "roll") {
      this.roll =
        game === "adventure" && action.safe
          ? 1
          : this.random(game === "adventure" ? 3 : 6) + 1;
      return this.open(this.nextQuestion());
    }
    if (game === "storyDice") {
      if (action.type === "dice-count") {
        this.config.diceCount = action.count;
        return { update: true };
      }
      if (action.type === "roll") {
        const images = this.quiz.questions
          .filter((q) => q.image)
          .map((q) => ({
            symbol: "",
            label: q.image!.description || q.prompt,
            image: q.image,
          }));
        const pool = images.length ? images : PICTURES;
        this.dice = Array.from(
          { length: this.config.diceCount },
          () => pool[this.random(pool.length)],
        );
        return this.open(this.nextQuestion());
      }
    }
    if (
      ["bowling", "soccer", "football", "basketball", "balloons"].includes(
        game,
      ) &&
      action.type === "draw"
    ) {
      const index = this.nextQuestion();
      if (game === "balloons")
        this.word = {
          answer: wordAnswer(
            this.quiz.questions[index].puzzleAnswer ||
              this.quiz.questions[index].options[
                this.quiz.questions[index].correctIndex
              ],
          ),
          guessed: new Set(),
          misses: 0,
          resolved: false,
          solved: false,
        };
      return this.open(index);
    }
    if (game === "eggHunt") {
      if (action.type === "roll") {
        if (this.roll)
          throw new Error("Choose a destination for this roll first.");
        this.roll = this.random(3) + 1;
        return { update: true };
      }
      if (action.type === "move") {
        if (
          !this.roll ||
          !reachableCells(this.positions.get(team.id)!, this.roll).includes(
            action.index,
          )
        )
          throw new Error("Choose a reachable garden square.");
        this.pendingCell = action.index;
        return this.open(this.nextQuestion());
      }
    }
    throw new Error("That action is unavailable for this board.");
  }
  grade(correct: boolean, teamIndex: number): Control {
    const game = this.config.game,
      team = this.team(teamIndex),
      question = this.quiz.questions[this.pendingQuestion];
    if (!question) throw new Error("There is no question to judge.");
    if (["memory", "balloons", "bingo"].includes(game))
      throw new Error("Use this game's own answer controls.");
    if (correct) team.correct++;
    this.summary = correct
      ? `${team.name} answered correctly.`
      : `${team.name} missed this question.`;
    if (["bowling", "soccer", "football", "basketball"].includes(game)) {
      if (correct) {
        this.prepareShot(game as ShotSport, team.id);
        return { activity: true };
      }
      if (game === "bowling") this.finishBowlingBall(team.id, []);
    } else if (["quiz", "classic", "junior", "storyDice"].includes(game)) {
      if (correct) team.score += question.points;
    } else if (game === "ticTacToe" || game === "connectFour") {
      if (correct) {
        this.cells[this.pendingCell!] = team.id;
        team.score += question.points;
      }
      const winner = lineWinner(
        this.cells,
        game === "ticTacToe" ? 3 : 6,
        game === "ticTacToe" ? 3 : 7,
        game === "ticTacToe" ? 3 : 4,
      );
      if (winner) {
        this.finished = true;
        this.winnerIds = [winner];
        this.summary = `${this.teams.find((t) => t.id === winner)!.name} completed the winning line!`;
      } else if (this.cells.every(Boolean)) {
        this.finished = true;
        this.winnerIds = [];
        this.summary = "The board is full: a draw.";
      }
    } else if (game === "snakes" || game === "adventure") {
      if (correct) {
        const finish = game === "snakes" ? 30 : 20;
        let position = Math.min(
          finish,
          this.positions.get(team.id)! + this.roll,
        );
        const original = position;
        if (game === "snakes" && SNAKE_LINKS[position])
          position = SNAKE_LINKS[position];
        if (game === "adventure") {
          if (TRAIL_GREEN.includes(position))
            position = Math.min(finish, position + 2);
          else if (this.config.hazards && TRAIL_RED.includes(position))
            position = Math.max(0, position - 2);
        }
        this.positions.set(team.id, position);
        team.score = position;
        this.summary = `${team.name} rolled ${this.roll} and moved to ${original}${position !== original ? `, then ${position > original ? "climbed" : "slid"} to ${position}` : ""}.`;
        if (position >= finish) {
          this.finished = true;
          this.winnerIds = [team.id];
          this.summary = `${team.name} reached the finish!`;
        }
        if (
          game === "adventure" &&
          !this.finished &&
          this.config.powerUps.length &&
          this.random(100) < this.config.powerUpRate
        ) {
          this.powerup = {
            id: this.config.powerUps[this.random(this.config.powerUps.length)],
            applied: false,
          };
          return { activity: true };
        }
      }
    } else if (game === "eggHunt" && correct) {
      this.positions.set(team.id, this.pendingCell!);
      const eggs = this.eggs.get(this.pendingCell!) ?? 0;
      if (eggs && !this.collected.has(this.pendingCell!)) {
        team.score += eggs;
        this.collected.set(this.pendingCell!, {
          teamId: team.id,
          amount: eggs,
        });
        this.summary = `${team.name} collected ${eggs} ${eggs === 1 ? "egg" : "eggs"}!`;
      } else this.summary = `${team.name} moved to an already explored square.`;
    }
    this.checkEnd();
    return { ranking: true };
  }
  gradeBingo(teamIds: string[]): Control {
    if (this.config.game !== "bingo" || this.pendingQuestion < 0)
      throw new Error("There is no Bingo question to judge.");
    if (
      new Set(teamIds).size !== teamIds.length ||
      teamIds.some((id) => !this.teams.some((t) => t.id === id))
    )
      throw new Error("Choose each valid team at most once.");
    const size = Math.sqrt(this.quiz.questions.length),
      winners: string[] = [];
    for (const id of teamIds) {
      const marked = this.bingoMarked.get(id)!;
      if (marked.has(this.pendingQuestion))
        throw new Error("This question was already awarded.");
      marked.add(this.pendingQuestion);
      const team = this.teams.find((t) => t.id === id)!;
      team.score++;
      team.correct++;
      const board = this.bingoBoards.get(id)!;
      if (
        lineWinner(
          board.map((index) => (marked.has(index) ? id : null)),
          size,
          size,
          size,
        )
      )
        winners.push(id);
    }
    this.summary = teamIds.length
      ? `${teamIds.length} ${teamIds.length === 1 ? "team marked a square" : "teams marked squares"}.`
      : "No teams marked a square.";
    if (winners.length) {
      this.finished = true;
      this.winnerIds = winners;
      this.summary =
        winners.length > 1
          ? "Simultaneous Bingo: a shared win!"
          : "Bingo! A full line!";
    }
    this.checkEnd();
    return { ranking: true };
  }
  guess(
    letter: string,
    teamIndex: number,
  ): { done: boolean; nextTeam: boolean } {
    if (this.config.game !== "balloons" || !this.word || this.word.resolved)
      throw new Error("There is no open word.");
    if (!/^[A-Z]$/.test(letter) || this.word.guessed.has(letter))
      throw new Error("Choose an unused letter.");
    this.word.guessed.add(letter);
    const count = [...this.word.answer].filter(
        (char) => char === letter,
      ).length,
      team = this.team(teamIndex);
    if (count) {
      team.score += count;
      this.summary = `${team.name} found ${count} ${letter}${count > 1 ? " letters" : ""}.`;
    } else {
      this.word.misses++;
      this.summary = `No ${letter}: a balloon popped.`;
    }
    const solved = [...this.word.answer].every(
      (char) => !/[A-Z]/.test(char) || this.word!.guessed.has(char),
    );
    if (solved) {
      team.score += this.quiz.questions[this.pendingQuestion].points;
      team.correct++;
      this.word.solved = true;
      this.word.resolved = true;
      this.summary = `${team.name} solved the word!`;
    } else if (this.word.misses >= 6) {
      this.word.resolved = true;
      this.summary = "All six balloons popped. Reveal and learn the answer.";
    }
    if (this.word.resolved) this.checkEnd();
    return { done: this.word.resolved, nextTeam: !this.word.resolved };
  }
  revealWord() {
    if (this.word && !this.word.resolved) {
      this.word.resolved = true;
      this.summary = "Time to reveal the word.";
      this.checkEnd();
    }
  }
  resolvePowerUp(teamIndex: number, targetId?: string): Control {
    if (!this.powerup || this.powerup.applied)
      throw new Error("This power-up was already resolved or is unavailable.");
    const before = new Map(this.teams.map((team) => [team.id, team.score]));
    const changes = applyPowerUp(
      this.powerup.id,
      this.teams,
      this.team(teamIndex).id,
      targetId,
      this.random,
    );
    this.powerup = { ...this.powerup, applied: true, targetId, changes };
    if (this.config.game === "adventure") {
      this.teams.forEach((team) => {
        team.score = Math.max(0, Math.min(20, team.score));
        this.positions.set(team.id, team.score);
      });
      const winners = this.teams
        .filter((team) => team.score >= 20)
        .map((team) => team.id);
      if (winners.length) {
        this.finished = true;
        this.winnerIds = winners;
      }
      this.powerup.changes = this.teams.map((team) => ({
        teamId: team.id,
        delta: team.score - before.get(team.id)!,
      }));
    }
    this.summary = `${POWER_UPS[this.powerup.id].title} applied.`;
    this.checkEnd();
    return { update: true };
  }
  private prepareShot(sport: ShotSport, teamId: string) {
    this.shot = {
      sport,
      targetX:
        sport === "football" ? 55 + this.random(18) : 45 + this.random(21),
      targetY: sport === "football" ? 7 : 18 + this.random(5),
      wind:
        sport === "soccer"
          ? this.random(11) - 5
          : sport === "football"
            ? this.random(5) - 2
            : 0,
      keeper: 20 + this.random(61),
      pins: [...this.racks.get(teamId)!.pins],
    };
  }
  shoot(teamIndex: number, angle: number, power: number): Control {
    if (!this.shot || this.shot.result)
      throw new Error("This shot was already taken or is unavailable.");
    const result = calculateShot(this.shot, angle, power),
      team = this.team(teamIndex);
    this.shot = { ...this.shot, angle, power, result };
    team.score += result.points;
    this.summary = result.message;
    if (this.shot.sport === "bowling")
      this.finishBowlingBall(team.id, result.pinHits);
    this.checkEnd();
    return { update: true };
  }
  private finishBowlingBall(teamId: string, hits: number[]) {
    const rack = this.racks.get(teamId)!;
    hits.forEach((index) => (rack.pins[index] = false));
    rack.balls++;
    if (rack.balls >= 2 || rack.pins.every((pin) => !pin)) {
      rack.balls = 0;
      rack.frames++;
      rack.pins = Array(10).fill(true);
    }
  }
  canContinueActivity() {
    return (
      !!this.powerup?.applied ||
      !!this.shot?.result ||
      (this.config.game === "memory" && this.flips.length === 2)
    );
  }
  afterTurn() {
    this.flips.forEach((index) => {
      if (!this.cards[index].owner) this.cards[index].faceUp = false;
    });
    this.flips = [];
    this.pendingCell = undefined;
    this.pendingQuestion = -1;
    this.roll = 0;
    this.powerup = undefined;
    this.shot = undefined;
  }
  private checkEnd() {
    if (this.finished) return;
    const game = this.config.game;
    const over =
      game === "classic" || game === "junior"
        ? this.tiles.every((tile) => tile.used)
        : game === "memory"
          ? this.cards.every((card) => card.owner)
          : game === "eggHunt"
            ? this.collected.size === this.eggs.size ||
              this.used.size === this.quiz.questions.length
            : this.used.size === this.quiz.questions.length;
    if (over) {
      this.finished = true;
      if (!this.summary) this.summary = "All questions are complete.";
      this.setLeaders();
    }
  }
  private setLeaders() {
    const best = Math.max(...this.teams.map((team) => team.score));
    this.winnerIds = this.teams
      .filter((team) => team.score === best)
      .map((team) => team.id);
  }
  forceFinish() {
    if (!this.finished) {
      this.finished = true;
      this.summary = "Ended by the teacher; current standings saved.";
      this.setLeaders();
    }
  }
  orderedScores() {
    return [...this.teams]
      .sort(
        (a, b) =>
          Number(this.winnerIds.includes(b.id)) -
            Number(this.winnerIds.includes(a.id)) || b.score - a.score,
      )
      .map((team) => ({ ...team }));
  }
  tileViews(): RoomView["tiles"] {
    if (["quiz", "classic", "junior"].includes(this.config.game))
      return this.tiles.map((tile, index) => ({
        index,
        points:
          this.config.game === "quiz"
            ? this.quiz.questions[tile.question!].points
            : 0,
        used: tile.used,
        label:
          tile.used && tile.power ? POWER_UPS[tile.power].title : undefined,
      }));
    return this.quiz.questions.map((question, index) => ({
      index,
      points: question.points,
      used: this.used.has(index),
    }));
  }
  view(teamIndex: number): TeamGameView {
    const game = this.config.game;
    const view: TeamGameView = {
      id: game,
      teamOrder: this.teams.map((team) => team.id),
      unit: TEAM_GAMES[game].unit,
      round: this.round,
      questionsUsed: this.used.size,
      rules: TEAM_GAMES[game].rules,
      finished: this.finished,
      winnerIds: [...this.winnerIds],
      summary: this.summary,
      config: structuredClone(this.config),
    };
    if (this.pendingCell !== undefined) view.pendingCell = this.pendingCell;
    if (this.roll) view.roll = this.roll;
    if (this.cells.length)
      view.grid = {
        rows: game === "ticTacToe" ? 3 : 6,
        columns: game === "ticTacToe" ? 3 : 7,
        cells: this.cells.map((owner, index) => ({ index, owner })),
      };
    if (game === "memory")
      view.cards = this.cards.map((card, index) => {
        const publicCard = {
          index,
          faceUp: card.faceUp || !!card.owner,
          selected: this.flips.includes(index),
          owner: card.owner,
        };
        if (!publicCard.faceUp) return publicCard;
        const question = this.quiz.questions[card.pair];
        return {
          ...publicCard,
          kind: card.answer ? ("answer" as const) : ("question" as const),
          content: card.answer
            ? question.options[question.correctIndex]
            : question.prompt,
          ...(!card.answer && question.image ? { image: question.image } : {}),
        };
      });
    if (game === "bingo")
      view.bingo = {
        size: Math.sqrt(this.quiz.questions.length),
        drawn: [...this.used],
        boards: this.teams.map((team) => ({
          teamId: team.id,
          cells: this.bingoBoards
            .get(team.id)!
            .map((questionIndex) => ({
              questionIndex,
              label: questionIndex + 1,
              marked: this.bingoMarked.get(team.id)!.has(questionIndex),
            })),
        })),
      };
    if (["snakes", "adventure", "eggHunt"].includes(game))
      view.positions = this.teams.map((team) => ({
        teamId: team.id,
        value: this.positions.get(team.id)!,
      }));
    if (game === "eggHunt") {
      view.grid = {
        rows: 5,
        columns: 5,
        cells: Array.from({ length: 25 }, (_, index) => ({
          index,
          owner: this.collected.get(index)?.teamId ?? null,
          blocked: GARDEN_ROCKS.includes(index),
          eggs: this.eggs.has(index) && !this.collected.has(index),
          collected: this.collected.get(index)?.amount,
        })),
      };
      if (this.roll)
        view.reachable = reachableCells(
          this.positions.get(this.team(teamIndex).id)!,
          this.roll,
        );
    }
    if (game === "storyDice") view.dice = structuredClone(this.dice);
    if (this.word)
      view.word = {
        masked: [...this.word.answer]
          .map((char) =>
            /[A-Z]/.test(char) &&
            !this.word!.guessed.has(char) &&
            !this.word!.resolved
              ? "_"
              : char,
          )
          .join(""),
        guessed: [...this.word.guessed],
        misses: this.word.misses,
        resolved: this.word.resolved,
        solved: this.word.solved,
        ...(this.word.resolved ? { answer: this.word.answer } : {}),
      };
    if (this.powerup) view.powerup = structuredClone(this.powerup);
    if (this.shot) view.shot = structuredClone(this.shot);
    if (game === "bowling")
      view.racks = this.teams.map((team) => ({
        teamId: team.id,
        ...structuredClone(this.racks.get(team.id)!),
      }));
    return view;
  }
}
