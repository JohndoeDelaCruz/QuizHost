import type { ShotResult, ShotSetup } from "./teamGames";

export function calculateShot(
  setup: ShotSetup,
  angle: number,
  power: number,
): ShotResult {
  if (
    !Number.isFinite(angle) ||
    !Number.isFinite(power) ||
    angle < 0 ||
    angle > 90 ||
    power < 20 ||
    power > 100
  )
    throw new Error("Choose a valid aim and power.");
  if (setup.sport === "bowling") {
    const endX = ((angle - 45) / 45) * 18;
    const pinX = [0, -2, 2, -4, 0, 4, -6, -2, 2, 6];
    const width = 1.3 + power / 28;
    const pinHits = setup.pins.flatMap((standing, i) =>
      standing && Math.abs(pinX[i] - endX) <= width && power >= 30 ? [i] : [],
    );
    return {
      points: pinHits.length,
      hit: pinHits.length > 0,
      pinHits,
      path: [
        { x: 0, y: 0 },
        { x: endX, y: 100 },
      ],
      message:
        pinHits.length === 10
          ? "Strike! All ten pins!"
          : `${pinHits.length} ${pinHits.length === 1 ? "pin" : "pins"} knocked down.`,
    };
  }
  if (setup.sport === "soccer") {
    const x = (angle / 90) * 100 + setup.wind * (power / 100);
    const hit =
      power >= 45 &&
      power <= 95 &&
      x >= 8 &&
      x <= 92 &&
      Math.abs(x - setup.keeper) > 15;
    return {
      points: hit ? 1 : 0,
      hit,
      pinHits: [],
      path: [
        { x: 50, y: 0 },
        { x, y: 100 },
      ],
      message: hit
        ? "Goal! Past the goalkeeper!"
        : power < 45
          ? "Not enough power to reach the goal."
          : power > 95
            ? "Over the crossbar!"
            : x < 8 || x > 92
              ? "Wide of the posts!"
              : "Saved by the goalkeeper!",
    };
  }
  const radians = (angle * Math.PI) / 180,
    speed = (power / 100) * 22;
  const vx = speed * Math.cos(radians),
    vy = speed * Math.sin(radians);
  const points: ShotResult["path"] = [{ x: 0, y: 0 }];
  let hit = false;
  for (let t = 0.04; t <= 12; t += 0.04) {
    const x = vx * t + setup.wind * 0.08 * t * t,
      y = vy * t - 2.5 * t * t;
    const old = points.at(-1)!;
    points.push({ x, y: Math.max(0, y) });
    if (old.x <= setup.targetX && x >= setup.targetX && x > old.x) {
      const at = old.y + ((y - old.y) * (setup.targetX - old.x)) / (x - old.x);
      hit =
        setup.sport === "football"
          ? at >= setup.targetY && at <= setup.targetY + 16
          : Math.abs(at - setup.targetY) <= 3.5 && vy - 5 * t < 0;
    }
    if (y < 0) break;
  }
  const reward = setup.sport === "football" ? 3 : setup.targetX >= 60 ? 3 : 2;
  return {
    points: hit ? reward : 0,
    hit,
    path: points,
    pinHits: [],
    message: hit
      ? setup.sport === "football"
        ? "Field goal! Three points!"
        : `${reward}-point basket!`
      : setup.sport === "football"
        ? "Outside the goal window. Adjust for distance and wind."
        : "The ball missed the hoop. Try a different arc next time.",
  };
}
