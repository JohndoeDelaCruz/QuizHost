import { z } from "zod";
import { IMAGE_ID_PATTERN, MAX_IMAGE_BYTES } from "../shared/media";

export const quizSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).default(""),
  questions: z
    .array(
      z.object({
        id: z.string().max(80).optional(),
        prompt: z.string().trim().min(1).max(600),
        options: z.array(z.string().trim().min(1).max(250)).length(4),
        correctIndex: z.number().int().min(0).max(3),
        seconds: z.number().int().min(5).max(120),
        points: z.number().int().min(10).max(2000),
        image: z
          .object({
            id: z.string().regex(IMAGE_ID_PATTERN),
            description: z.string().trim().max(240).default(""),
          })
          .optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const backupSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).optional(),
  quizzes: z.array(quizSchema).min(1).max(200),
  images: z
    .array(
      z.object({
        id: z.string().regex(IMAGE_ID_PATTERN),
        data: z.string().max(4 * Math.ceil(MAX_IMAGE_BYTES / 3)),
      }),
    )
    .max(20000)
    .optional()
    .default([]),
});
