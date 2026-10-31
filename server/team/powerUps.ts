import { randomInt } from "node:crypto";
import { POWER_UPS, type PowerUpId } from "../../shared/teamGames";
import type { Score } from "../../shared/types";

export type Random = (max: number) => number;
export const secureRandom: Random = (max) => randomInt(max);
export function shuffled<T>(
  items: readonly T[],
  random: Random = secureRandom,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function applyPowerUp(
  id: PowerUpId,
  teams: Score[],
  activeId: string,
  targetId?: string,
  random: Random = secureRandom,
) {
  const active = teams.find((team) => team.id === activeId);
  const target = teams.find((team) => team.id === targetId);
  if (!active) throw new Error("The active team is unavailable.");
  if (POWER_UPS[id].target && (!target || target.id === active.id))
    throw new Error("Choose a different team as the target.");
  const before = new Map(teams.map((team) => [team.id, team.score]));
  const amount = () => 5 * (random(5) + 1);
  switch (id) {
    case "fairy": {
      const value = Math.max(0, target!.score);
      active.score += value;
      target!.score -= value;
      break;
    }
    case "magnet": {
      const value = amount();
      active.score += value;
      target!.score -= value;
      break;
    }
    case "thief":
    case "lifesaver": {
      const value = amount();
      active.score -= value;
      target!.score += value;
      break;
    }
    case "heart":
      target!.score += amount();
      break;
    case "rocket":
      active.score =
        Math.max(
          ...teams.filter((t) => t.id !== active.id).map((t) => t.score),
        ) + 1;
      break;
    case "banana":
      active.score =
        Math.min(
          ...teams.filter((t) => t.id !== active.id).map((t) => t.score),
        ) - 1;
      break;
    case "star":
      active.score *= 2;
      break;
    case "eraser":
      active.score = 0;
      break;
    case "virus":
      teams.forEach((team) => (team.score = 0));
      break;
    case "shark": {
      const value = amount();
      teams
        .filter((t) => t.id !== active.id)
        .forEach((team) => (team.score -= value));
      break;
    }
    case "seesaw":
      [active.score, target!.score] = [target!.score, active.score];
      break;
    case "gold":
      active.score += 50;
      break;
    case "boom":
      active.score -= 50;
      break;
    case "gift":
      active.score += amount();
      break;
    case "baam":
      active.score -= amount();
      break;
    case "trap":
      break;
    case "hop":
      active.score += 3;
      break;
    case "slide":
      active.score = Math.max(0, active.score - 3);
      break;
    case "swapPlaces":
      [active.score, target!.score] = [target!.score, active.score];
      break;
    case "shufflePlaces": {
      const places = shuffled(
        teams.map((t) => t.score),
        random,
      );
      teams.forEach((team, i) => (team.score = places[i]));
      break;
    }
  }
  teams.forEach(
    (team) =>
      (team.score = Math.max(
        -1_000_000_000,
        Math.min(1_000_000_000, team.score),
      )),
  );
  return teams.map((team) => ({
    teamId: team.id,
    delta: team.score - before.get(team.id)!,
  }));
}
