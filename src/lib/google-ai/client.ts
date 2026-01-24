/**
 * Google AI Client Helper
 *
 * Provides singleton client for Google Gemini image generation.
 * Uses the official @google/genai SDK.
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

import { GoogleGenAI } from "@google/genai";

// Lazy initialization to avoid build-time errors
let googleAIClient: GoogleGenAI | null = null;

/**
 * Get or create GoogleGenAI client
 *
 * @returns Initialized GoogleGenAI client
 * @throws Error if GOOGLE_AI_API_KEY is not configured
 */
export function getGoogleAI(): GoogleGenAI {
  if (!googleAIClient) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }
    googleAIClient = new GoogleGenAI({ apiKey });
  }
  return googleAIClient;
}

/**
 * Model selection constants
 *
 * Available Google AI models for image generation
 */
export const GOOGLE_AI_MODELS = {
  // Fast and efficient for high-volume tasks
  // - Generation time: 5-10 seconds
  // - Use case: Quick iterations, high volume
  FLASH: "gemini-2.5-flash-image",

  // Professional quality for asset production
  // - Generation time: 10-20 seconds
  // - Use case: High-quality print-ready designs
  PRO: "gemini-3-pro-image-preview"
} as const;

/**
 * Default model for merchandise design generation
 *
 * USER SELECTED: PRO (Professional quality)
 * - Higher quality designs suitable for print-on-demand
 * - Slower generation (10-20 seconds) but superior visual results
 * - Better for professional merchandise production
 */
export const DEFAULT_IMAGE_MODEL = GOOGLE_AI_MODELS.PRO;
