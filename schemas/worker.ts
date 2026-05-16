import { z } from "zod";

export const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

export type District = (typeof SRI_LANKA_DISTRICTS)[number];

// ============================================
// WORKER PROFILE SCHEMA
// ============================================
export const workerProfileSchema = z.object({
  title: z
    .string()
    .min(5,  "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),

  category_id: z
    .string()
    .uuid("Please select a valid category"),

  description: z
    .string()
    .min(50,  "Description must be at least 50 characters")
    .max(2000, "Description must be under 2000 characters"),

  experience_years: z
    .number()
    .int()
    .min(0, "Experience cannot be negative")
    .max(60, "Please enter a valid experience"),

  district: z.enum(SRI_LANKA_DISTRICTS, {
    required_error: "Please select a district",
  }),

  starting_price: z
    .number()
    .min(0,      "Price cannot be negative")
    .max(500000, "Price seems too high")
    .optional()
    .nullable(),

  availability: z.enum(["available", "busy", "unavailable"]).default("available"),

  profile_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
});

export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;

// ============================================
// PORTFOLIO IMAGE SCHEMA
// ============================================
export const portfolioImageSchema = z.object({
  image_url: z.string().url("Invalid image URL"),
  caption:   z.string().max(200, "Caption too long").optional(),
});

export type PortfolioImageInput = z.infer<typeof portfolioImageSchema>;

// ============================================
// PROFILE UPDATE SCHEMA (partial)
// ============================================
export const updateWorkerProfileSchema = workerProfileSchema.partial().omit({
  category_id: true,
});

export type UpdateWorkerProfileInput = z.infer<typeof updateWorkerProfileSchema>;