import { z } from 'zod';
export declare const SaySchema: z.ZodObject<{
    text: z.ZodString;
    duration: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const ThinkSchema: z.ZodObject<{
    text: z.ZodDefault<z.ZodString>;
    duration: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const PlayActionSchema: z.ZodObject<{
    action: z.ZodString;
}, z.core.$strip>;
export type SayParams = z.input<typeof SaySchema>;
export type ThinkParams = z.input<typeof ThinkSchema>;
export type PlayActionParams = z.input<typeof PlayActionSchema>;
export type SayData = z.infer<typeof SaySchema>;
export type ThinkData = z.infer<typeof ThinkSchema>;
export type PlayActionData = z.infer<typeof PlayActionSchema>;
