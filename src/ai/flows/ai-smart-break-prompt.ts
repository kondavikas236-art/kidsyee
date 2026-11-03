'use server';
/**
 * @fileOverview An AI agent that generates personalized, gentle break prompts for children.
 *
 * - generateSmartBreakPrompt - A function that generates a smart break prompt.
 * - SmartBreakPromptInput - The input type for the generateSmartBreakPrompt function.
 * - SmartBreakPromptOutput - The return type for the generateSmartBreakPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartBreakPromptInputSchema = z.object({
  childName: z.string().optional().describe('The name of the child for personalization.'),
  screenTimeMinutes: z.number().describe('The total screen time in minutes for the current session or day.'),
  lastActivityCategory: z.string().describe('The category of the app or activity the child was last engaged in (e.g., "Gaming", "Educational", "Reading").'),
  isEyeRestNeeded: z.boolean().describe('A flag indicating if an eye rest is particularly recommended based on continuous screen usage.'),
});
export type SmartBreakPromptInput = z.infer<typeof SmartBreakPromptInputSchema>;

const SmartBreakPromptOutputSchema = z.object({
  suggestionType: z.enum(['eye_rest', 'activity', 'general_break']).describe('The type of break suggested (e.g., eye_rest, activity, general_break).'),
  suggestionText: z.string().describe('The personalized, gentle suggestion for a break.'),
});
export type SmartBreakPromptOutput = z.infer<typeof SmartBreakPromptOutputSchema>;

export async function generateSmartBreakPrompt(input: SmartBreakPromptInput): Promise<SmartBreakPromptOutput> {
  return smartBreakPromptFlow(input);
}

const smartBreakPrompt = ai.definePrompt({
  name: 'smartBreakPrompt',
  input: { schema: SmartBreakPromptInputSchema },
  output: { schema: SmartBreakPromptOutputSchema },
  prompt: `You are a friendly and encouraging "Mindful Play" assistant, designed to help children take healthy breaks from screens without lecturing them. Your goal is to provide gentle, personalized suggestions.

Consider the following information:
- Child's Name: {{{childName}}}
- Current Screen Time: {{{screenTimeMinutes}}} minutes
- Last Activity: {{{lastActivityCategory}}}
- Is an Eye Rest Particularly Recommended: {{{isEyeRestNeeded}}}

If 'isEyeRestNeeded' is true, prioritize a suggestion for a quick eye rest exercise. Otherwise, suggest a fun, non-screen activity or a general short break. Make the suggestion playful and encouraging.

Here are some examples of what to suggest:

If 'isEyeRestNeeded' is true: "Hey {{childName}}, your eyes have been working hard! How about we give them a mini-vacation? Try looking far away for 20 seconds, then close your eyes for 20 seconds. It's like a blink-tastic superhero power for your sight!"

If 'screenTimeMinutes' is high and 'lastActivityCategory' is 'Gaming': "Wow, {{childName}}, you've been on an amazing adventure in your game! Your Focus Meter might be getting a little low. How about a super-quick real-world quest? Maybe find 3 blue things in your room, or stretch like a cat!"

If 'screenTimeMinutes' is moderate and 'lastActivityCategory' is 'Educational': "Great job learning, {{childName}}! Your brain needs a quick stretch too. Let's do a 'brain shake'! Wiggle your fingers, toes, and even your nose for 30 seconds. Ready, set, wiggle!"

If 'screenTimeMinutes' is low: "Hey {{childName}}! It's a great time for a little brain boost! Can you think of three things you're grateful for right now? It's like a happy thought superpower!"

Generate a single, personalized break suggestion based on the input, ensuring it's gentle, fun, and encourages a healthy pause. The 'suggestionType' should reflect the main idea (e.g., 'eye_rest', 'activity', 'general_break').
`,
});

const smartBreakPromptFlow = ai.defineFlow(
  {
    name: 'smartBreakPromptFlow',
    inputSchema: SmartBreakPromptInputSchema,
    outputSchema: SmartBreakPromptOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await smartBreakPrompt(input);
      if (!output) throw new Error('AI output was empty');
      return output;
    } catch (error) {
      console.error('AI Smart Break Prompt failed, providing fallback:', error);
      // Fallback response for high demand or transient failures
      return {
        suggestionType: 'general_break' as const,
        suggestionText: `Hey ${input.childName || 'Explorer'}, your digital buddy here! You've been doing an amazing job. How about we take a quick 2-minute "Power Pause"? Stand up, reach for the stars, and take three deep breaths. Your brain and eyes will feel supercharged! ✨`
      };
    }
  }
);
