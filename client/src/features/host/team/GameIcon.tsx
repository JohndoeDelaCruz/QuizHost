import {
  Bird,
  CircleDot,
  CircleHelp,
  Dice5,
  Flag,
  Flower2,
  Gift,
  Grid3X3,
  Layers,
  Orbit,
  Route,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import type { TeamGameId } from "../../../../../shared/teamGames";
const ICONS = {
  quiz: Grid3X3,
  classic: Sparkles,
  junior: Gift,
  memory: Layers,
  ticTacToe: X,
  connectFour: CircleDot,
  bingo: Grid3X3,
  snakes: Route,
  storyDice: Dice5,
  bowling: Target,
  soccer: Orbit,
  football: Target,
  adventure: Flag,
  basketball: Trophy,
  balloons: Bird,
  eggHunt: Flower2,
};
export function GameIcon({
  game,
  size = 24,
}: {
  game: TeamGameId;
  size?: number;
}) {
  const Icon = ICONS[game] ?? CircleHelp;
  return <Icon size={size} aria-hidden="true" />;
}
