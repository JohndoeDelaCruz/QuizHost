import { z } from "zod";
import {
  allowedPowerUps,
  defaultTeamConfig,
  POWER_UP_IDS,
  TEAM_GAME_IDS,
} from "../../shared/teamGames";

export const teamConfigSchema = z
  .object({
    game: z.enum(TEAM_GAME_IDS),
    questionLimit: z.number().int().min(1).max(100).optional(),
    powerUps: z.array(z.enum(POWER_UP_IDS)).max(POWER_UP_IDS.length).optional(),
    powerUpRate: z.number().int().min(0).max(50).optional(),
    timed: z.boolean().optional(),
    hazards: z.boolean().optional(),
    diceCount: z.number().int().min(1).max(16).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.powerUps &&
      (new Set(value.powerUps).size !== value.powerUps.length ||
        value.powerUps.some((id) => !allowedPowerUps(value.game).includes(id)))
    )
      context.addIssue({
        code: "custom",
        message: "Choose unique power-ups supported by this game.",
        path: ["powerUps"],
      });
  })
  .transform((value) => ({
    ...defaultTeamConfig(value.game),
    ...value,
    powerUps: value.powerUps ?? allowedPowerUps(value.game),
  }));

export const teamActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["pick", "column", "move", "flip"]),
    index: z.number().int().min(0).max(199),
  }),
  z.object({ type: z.literal("roll"), safe: z.boolean().optional() }),
  z.object({ type: z.literal("draw") }),
  z.object({ type: z.literal("continue") }),
  z.object({
    type: z.literal("guess"),
    letter: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]$/),
  }),
  z.object({
    type: z.literal("shoot"),
    angle: z.number().min(0).max(90),
    power: z.number().min(20).max(100),
  }),
  z.object({
    type: z.literal("powerup"),
    targetId: z.string().max(80).optional(),
  }),
  z.object({
    type: z.literal("bingo-award"),
    teamIds: z.array(z.string().max(80)).max(8),
  }),
  z.object({
    type: z.literal("dice-count"),
    count: z.number().int().min(1).max(16),
  }),
]);
