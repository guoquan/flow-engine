import { z } from 'zod';

// Shared Zod schemas for Flow Engine actions

export const SaySchema = z.object({
  text: z.string().describe("The text content to speak."),
  duration: z.number().optional().default(3000).describe("Duration in milliseconds to stay in the talking state."),
});

export const ThinkSchema = z.object({
  text: z.string().optional().default("...").describe("The thought text content (e.g., '...')."),
  duration: z.number().optional().default(3000).describe("Duration in milliseconds to stay in the thinking state."),
});

export const PlayActionSchema = z.object({
  action: z.string().describe("The name of the animation clip to play (e.g., 'wave', 'bow', 'dance')."),
});

export type SayParams = z.infer<typeof SaySchema>;
export type ThinkParams = z.infer<typeof ThinkSchema>;
export type PlayActionParams = z.infer<typeof PlayActionSchema>;
