import { z } from "zod";

export const submitReviewSchema = z.object({
  worker_id: z.string().uuid("Invalid worker ID"),
  chat_id:   z.string().uuid("Invalid chat ID"),
  rating:    z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(1000, "Comment must be under 1000 characters")
    .optional()
    .nullable(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;