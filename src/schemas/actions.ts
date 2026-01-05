import { z } from 'zod';

// Shared Zod schemas for Flow Engine actions

export const SaySchema = z.object({
  text: z.string().describe("The text content to speak."),
  duration: z.number().default(3000).describe("Duration in milliseconds to stay in the talking state."),
});

export const ThinkSchema = z.object({
  text: z.string().default("...").describe("The thought text content (e.g., '...')."),
  duration: z.number().default(3000).describe("Duration in milliseconds to stay in the thinking state."),
});

export const PlayActionSchema = z.object({
  action: z.string().describe("The name of the animation clip to play (e.g., 'wave', 'bow', 'dance')."),
});

// Use z.input to allow passing partial objects (with optional defaults) to the API
export type SayParams = z.input<typeof SaySchema>;
export type ThinkParams = z.input<typeof ThinkSchema>;
export type PlayActionParams = z.input<typeof PlayActionSchema>;

// Use z.infer for the fully parsed internal types
export type SayData = z.infer<typeof SaySchema>;
export type ThinkData = z.infer<typeof ThinkSchema>;
export type PlayActionData = z.infer<typeof PlayActionSchema>;