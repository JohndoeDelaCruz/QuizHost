import type { QuestionImage } from "./types";

export const TEAM_GAME_IDS = [
  "quiz",
  "classic",
  "junior",
  "memory",
  "ticTacToe",
  "connectFour",
  "bingo",
  "snakes",
  "storyDice",
  "bowling",
  "soccer",
  "football",
  "adventure",
  "basketball",
  "balloons",
  "eggHunt",
] as const;
export type TeamGameId = (typeof TEAM_GAME_IDS)[number];
export const POWER_UP_IDS = [
  "fairy",
  "thief",
  "rocket",
  "banana",
  "star",
  "heart",
  "eraser",
  "virus",
  "shark",
  "magnet",
  "lifesaver",
  "trap",
  "seesaw",
  "gold",
  "boom",
  "gift",
  "baam",
  "hop",
  "slide",
  "swapPlaces",
  "shufflePlaces",
] as const;
export type PowerUpId = (typeof POWER_UP_IDS)[number];
export interface TeamGameConfig {
  game: TeamGameId;
  questionLimit?: number;
  powerUps: PowerUpId[];
  powerUpRate: number;
  timed: boolean;
  hazards: boolean;
  diceCount: number;
}
export const TEAM_GAMES: Record<
  TeamGameId,
  {
    title: string;
    icon: string;
    description: string;
    rules: string;
    unit: string;
    twoTeams?: boolean;
  }
> = {
  quiz: {
    title: "Quiz board",
    icon: "grid",
    description: "Choose questions, discuss and earn points.",
    rules:
      "Teams take turns picking unused question tiles. The teacher reveals and judges the answer. Highest points wins.",
    unit: "pts",
  },
  classic: {
    title: "Classic",
    icon: "sparkles",
    description: "A question grid with surprise score-changing tiles.",
    rules:
      "Hidden power-up tiles mix with the questions and consume a turn. Choose a target when asked. Scores can go below zero. Highest points wins.",
    unit: "pts",
  },
  junior: {
    title: "Classic Jr.",
    icon: "gift",
    description: "Simple surprise bonuses and losses.",
    rules:
      "Questions are mixed with Gift and Baam tiles. Surprise tiles add or subtract 5–25 points and consume a turn. Highest points wins.",
    unit: "pts",
  },
  memory: {
    title: "Memory",
    icon: "cards",
    description: "Match question cards with their answers.",
    rules:
      "Flip two cards. Match a question to its answer to earn one pair. Every attempt passes to the next team. Most pairs wins. Up to 12 distinct pairs are used.",
    unit: "pairs",
  },
  ticTacToe: {
    title: "Tic Tac Toe",
    icon: "cross",
    description: "Answer to claim a square and make a line of three.",
    rules:
      "Two teams choose an empty square, then answer a question to claim it. Three in a row wins. A full board is a draw; if questions run out first, points decide.",
    unit: "pts",
    twoTeams: true,
  },
  connectFour: {
    title: "Four in a Row",
    icon: "circles",
    description: "Drop earned counters into a seven-column board.",
    rules:
      "Two teams choose a column. A correct answer drops a counter into its lowest free space. Connect four to win. If questions run out first, points decide.",
    unit: "pts",
    twoTeams: true,
  },
  bingo: {
    title: "Bingo",
    icon: "check",
    description: "Everyone answers; complete a row, column or diagonal.",
    rules:
      "Draw a question for all teams. After reveal, the teacher selects every team that answered correctly. Mark its square on each successful team's shuffled board. A full line wins; simultaneous winners tie.",
    unit: "marks",
  },
  snakes: {
    title: "Snakes & Ladders",
    icon: "route",
    description: "Roll, answer, climb and slide to the finish.",
    rules:
      "Roll before a question. A correct answer moves that many spaces, then applies the snake or ladder. Reach or pass 30 to win. If questions run out, the furthest team wins.",
    unit: "steps",
  },
  storyDice: {
    title: "Story Dice",
    icon: "dice",
    description: "Use rolled pictures in a creative explanation.",
    rules:
      "Roll pictures, then make a story or explanation connected to the quiz prompt and all the dice. The teacher judges the response using an agreed rule. Highest awarded points wins.",
    unit: "pts",
  },
  bowling: {
    title: "Bowling",
    icon: "bowling",
    description: "Correct answers unlock a shot at ten pins.",
    rules:
      "Answer correctly to aim a bowling ball. Score the pins knocked down. Each team gets a fresh rack after two question turns or a strike. This classroom version counts pins without strike/spare bonuses.",
    unit: "pins",
  },
  soccer: {
    title: "Soccer",
    icon: "soccer",
    description: "Aim around the goalkeeper after a correct answer.",
    rules:
      "Two teams take turns answering. A correct answer unlocks a kick. Adjust aim and power to stay inside the posts and beat the visible goalkeeper. Most goals wins.",
    unit: "goals",
    twoTeams: true,
  },
  football: {
    title: "American Football",
    icon: "football",
    description: "Read the wind and kick through the goalposts.",
    rules:
      "A correct answer unlocks a field-goal kick. Adjust angle and power for the target distance and wind. A successful field goal earns three points. Highest points wins.",
    unit: "pts",
  },
  adventure: {
    title: "Adventure Trail",
    icon: "flag",
    description: "Race your avatar past hazards and position power-ups.",
    rules:
      "Choose a safe one-step hop or roll 1–3 before answering. A correct answer moves your avatar. Green spaces boost two; optional red spaces send you back two. Optional power-ups change positions. Reach or pass 20 to win; otherwise the furthest team wins.",
    unit: "steps",
  },
  basketball: {
    title: "Basketball",
    icon: "basketball",
    description: "Find the arc and sink a two- or three-point shot.",
    rules:
      "A correct answer unlocks a shot. Adjust angle and power so the ball descends through the hoop. Near hoops earn two points; far hoops earn three. Highest points wins.",
    unit: "pts",
  },
  balloons: {
    title: "Balloon Words",
    icon: "balloon",
    description: "Guess letters before all six balloons pop.",
    rules:
      "Use the question as a clue. Teams take turns guessing unused letters. Each revealed letter earns one point; solving the answer adds the question's points and one correct answer. Six misses end the word. Use a short word-game answer in the quiz editor when needed.",
    unit: "pts",
  },
  eggHunt: {
    title: "Egg Hunt",
    icon: "egg",
    description: "Move through a garden collecting hidden-value eggs.",
    rules:
      "Roll 1–3, choose a reachable garden square, then answer. A correct answer moves your avatar and collects that square's eggs once. Rocks block paths. Most eggs wins when the garden or question bank is exhausted.",
    unit: "eggs",
  },
};

export const POWER_UPS: Record<
  PowerUpId,
  {
    title: string;
    text: string;
    symbol: string;
    target?: boolean;
    position?: boolean;
  }
> = {
  fairy: {
    title: "Fairy",
    text: "Take another team's positive points.",
    symbol: "✦",
    target: true,
  },
  thief: {
    title: "Thief",
    text: "Give 5–25 points to another team.",
    symbol: "↗",
    target: true,
  },
  rocket: {
    title: "Rocket",
    text: "Move just above the highest score.",
    symbol: "🚀",
  },
  banana: {
    title: "Banana",
    text: "Move just below the lowest opposing score.",
    symbol: "🍌",
  },
  star: { title: "Star", text: "Double your current score.", symbol: "★" },
  heart: {
    title: "Heart",
    text: "Give an opponent 5–25 bonus points.",
    symbol: "♥",
    target: true,
  },
  eraser: { title: "Eraser", text: "Reset your score to zero.", symbol: "▰" },
  virus: {
    title: "Reset all",
    text: "Reset every team's score to zero.",
    symbol: "↺",
  },
  shark: {
    title: "Shark",
    text: "Other teams each lose 5–25 points.",
    symbol: "🦈",
  },
  magnet: {
    title: "Magnet",
    text: "Steal 5–25 points from another team.",
    symbol: "🧲",
    target: true,
  },
  lifesaver: {
    title: "Lifesaver",
    text: "Transfer 5–25 of your points to another team.",
    symbol: "◉",
    target: true,
  },
  trap: {
    title: "Trap",
    text: "This turn has no question and no points.",
    symbol: "⊗",
  },
  seesaw: {
    title: "Seesaw",
    text: "Swap scores with another team.",
    symbol: "⇄",
    target: true,
  },
  gold: { title: "Gold", text: "Gain 50 points.", symbol: "◆" },
  boom: { title: "Boom", text: "Lose 50 points.", symbol: "💥" },
  gift: { title: "Gift", text: "Gain 5–25 points.", symbol: "🎁" },
  baam: { title: "Baam", text: "Lose 5–25 points.", symbol: "⚡" },
  hop: {
    title: "Big hop",
    text: "Move three spaces forward.",
    symbol: "↑",
    position: true,
  },
  slide: {
    title: "Slippery step",
    text: "Move three spaces back.",
    symbol: "↓",
    position: true,
  },
  swapPlaces: {
    title: "Swap places",
    text: "Swap trail positions with another team.",
    symbol: "⇄",
    target: true,
    position: true,
  },
  shufflePlaces: {
    title: "Shuffle places",
    text: "Randomly redistribute the current trail positions.",
    symbol: "⤨",
    position: true,
  },
};
export function allowedPowerUps(game: TeamGameId): PowerUpId[] {
  return game === "classic"
    ? POWER_UP_IDS.filter((id) => !POWER_UPS[id].position)
    : game === "junior"
      ? ["gift", "baam"]
      : game === "adventure"
        ? ["hop", "slide", "swapPlaces", "shufflePlaces"]
        : [];
}
export function defaultTeamConfig(game: TeamGameId = "quiz"): TeamGameConfig {
  return {
    game,
    powerUps: allowedPowerUps(game),
    powerUpRate: 25,
    timed: !["memory", "balloons", "storyDice"].includes(game),
    hazards: true,
    diceCount: 3,
  };
}
export type TeamAction =
  | { type: "pick" | "column" | "move" | "flip"; index: number }
  | { type: "roll"; safe?: boolean }
  | { type: "draw" | "continue" }
  | { type: "guess"; letter: string }
  | { type: "shoot"; angle: number; power: number }
  | { type: "powerup"; targetId?: string }
  | { type: "bingo-award"; teamIds: string[] }
  | { type: "dice-count"; count: number };
export type ShotSport = "bowling" | "soccer" | "football" | "basketball";
export interface ShotSetup {
  sport: ShotSport;
  targetX: number;
  targetY: number;
  wind: number;
  keeper: number;
  pins: boolean[];
}
export interface ShotResult {
  points: number;
  hit: boolean;
  path: { x: number; y: number }[];
  pinHits: number[];
  message: string;
}
export interface ShotView extends ShotSetup {
  result?: ShotResult;
  angle?: number;
  power?: number;
}
export interface PictureDie {
  symbol: string;
  label: string;
  image?: QuestionImage;
}
export interface TeamGameView {
  id: TeamGameId;
  teamOrder: string[];
  unit: string;
  round: number;
  questionsUsed: number;
  rules: string;
  finished: boolean;
  winnerIds: string[];
  summary: string;
  config: TeamGameConfig;
  grid?: {
    rows: number;
    columns: number;
    cells: {
      index: number;
      owner: string | null;
      blocked?: boolean;
      eggs?: boolean;
      collected?: number;
    }[];
  };
  pendingCell?: number;
  cards?: {
    index: number;
    faceUp: boolean;
    selected: boolean;
    owner: string | null;
    content?: string;
    image?: QuestionImage;
    kind?: "question" | "answer";
  }[];
  bingo?: {
    size: number;
    drawn: number[];
    boards: {
      teamId: string;
      cells: { questionIndex: number; label: number; marked: boolean }[];
    }[];
  };
  positions?: { teamId: string; value: number }[];
  roll?: number;
  reachable?: number[];
  dice?: PictureDie[];
  word?: {
    masked: string;
    guessed: string[];
    misses: number;
    resolved: boolean;
    solved: boolean;
    answer?: string;
  };
  powerup?: {
    id: PowerUpId;
    applied: boolean;
    targetId?: string;
    changes?: { teamId: string; delta: number }[];
  };
  shot?: ShotView;
  racks?: { teamId: string; pins: boolean[]; balls: number; frames: number }[];
}
