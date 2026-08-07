import { z } from "zod";

// Admin Authentication Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Topic Validation Schema
export const topicSchema = z.object({
  name: z.string().min(1, "Topic name is required").trim(),
  order: z.coerce.number().int().nonnegative("Order must be a positive integer"),
});

// SubTopic Validation Schema
export const subTopicSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  name: z.string().min(1, "Subtopic name is required").trim(),
  order: z.coerce.number().int().nonnegative("Order must be a positive integer"),
});

// Problem Validation Schema (for manual creation/editing)
export const problemSchema = z.object({
  subTopicId: z.string().min(1, "Subtopic ID is required"),
  problem: z.string().min(1, "Problem name is required").trim(),
  rating: z.coerce.number().int().nonnegative("Rating must be a positive integer"),
  mainTopic: z.string().min(1, "Main topic is required").trim(),
  hiddenPattern: z.string().optional().nullable(),
  link: z.string().url("Must be a valid URL").refine((val) => {
    return val.startsWith("http://") || val.startsWith("https://");
  }, "URL must begin with http:// or https://"),
  notes: z.string().optional().nullable(),
});

// CSV Row validation Schema
export const csvRowSchema = z.object({
  Problem: z.string().min(1, "Problem name is required").trim(),
  Rating: z.preprocess((val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val.trim(), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, z.number().int().nonnegative("Rating must be a positive integer")),
  "Main Topic": z.string().min(1, "Main topic is required").trim(),
  "Hidden Pattern": z.string().optional().transform((val) => (val?.trim() ? val.trim() : null)),
  Link: z.string().url("Must be a valid URL").trim().refine((val) => {
    return val.startsWith("http://") || val.startsWith("https://");
  }, "URL must begin with http:// or https://"),
});
