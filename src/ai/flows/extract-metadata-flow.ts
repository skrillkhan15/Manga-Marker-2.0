/**
 * @fileOverview An AI agent for extracting metadata from a URL.
 *
 * - extractMetadata - A function that handles the metadata extraction process.
 * - ExtractMetadataInput - The input type for the extractMetadata function.
 * - ExtractMetadataOutput - The return type for the extractMetadata function.
 */

import { z } from 'genkit';

const ExtractMetadataInputSchema = z.object({
 url: z.string().url().describe('The URL to extract metadata from.'),
});
export type ExtractMetadataInput = z.infer<typeof ExtractMetadataInputSchema>;

const ExtractMetadataOutputSchema = z.object({
  title: z
    .string()
 .describe(
 'The title of the manga or series. It should be concise and not include the chapter number.'
 ),
  chapter: z.number().describe('The chapter number found on the page.'),
});
export type ExtractMetadataOutput = z.infer<typeof ExtractMetadataOutputSchema>;


export async function extractMetadata(
 input: ExtractMetadataInput
): Promise<ExtractMetadataOutput> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
    // Return empty metadata or skip AI flow for static export
    return {
 title: '',
 chapter: 0, // Or perhaps undefined or null depending on how you handle missing data
    };
  } else {
    'use server';
    // Dynamically import GenKit and related logic
    const { ai } = await import('@/ai/genkit');

    const prompt = ai.definePrompt({
      name: 'extractMetadataPrompt', // This is the prompt definition
      input: { schema: ExtractMetadataInputSchema },
      output: { schema: ExtractMetadataOutputSchema },
      prompt: `You are an expert at extracting metadata from web pages. Your task is to analyze the content from the provided URL and identify the title of the series and the current chapter number.

 - For the title, extract the main name of the manga or series. Exclude any chapter-specific information. For example, if the page title is "My Hero Academia Chapter 350", the title should be "My Hero Academia".
 - For the chapter, extract only the numerical value of the chapter. For "Chapter 350.5", it should be 350.5.

 Analyze the content from this URL: {{{url}}}`,
    }); // Call the definePrompt function with the configuration

    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to extract metadata from the provided URL.');
    }
    return output;
  }
}
