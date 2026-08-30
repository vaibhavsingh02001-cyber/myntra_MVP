import Groq from 'groq-sdk';
import { EXTRACTION_PROMPT } from './prompt';
import { ProductAttributes } from '../../../../shared/models/product.types';
import { logger } from '../../../../shared/middleware/logger';

export class LLMExtractor {
  /**
   * Extracts structured fashion attributes from an unstructured text description using Groq LLM (Llama 3.3 70B Versatile).
   * If GROQ_API_KEY is missing or API fails, falls back gracefully to keyword heuristic extraction.
   */
  static async extract(description?: string): Promise<ProductAttributes> {
    if (!description || !description.trim()) {
      return LLMExtractor.emptyResult();
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey === 'your_gemini_api_key_here') {
      logger.warn('[LLMExtractor] GROQ_API_KEY missing — using keyword heuristic fallback');
      return LLMExtractor.fallbackKeywordExtract(description);
    }

    try {
      const groq = new Groq({ apiKey });
      const prompt = EXTRACTION_PROMPT.replace('{{DESCRIPTION}}', description);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a precise fashion attribute extractor. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawText = completion.choices[0]?.message?.content?.trim() || '{}';
      const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);

      return {
        cut:        parsed.cut ?? undefined,
        fabric:     parsed.fabric ?? undefined,
        silhouette: parsed.silhouette ?? undefined,
        fitType:    parsed.fitType ?? parsed.fit_type ?? undefined,
        length:     parsed.length ?? undefined,
        source:     'llm_extracted',
        isComplete: () => Boolean(parsed.silhouette || parsed.cut),
      };
    } catch (err) {
      logger.error({ err }, '[LLMExtractor] Groq API call failed — using keyword fallback');
      return LLMExtractor.fallbackKeywordExtract(description);
    }
  }

  /**
   * Keyword-based fallback when Groq API is offline or unconfigured.
   */
  private static fallbackKeywordExtract(text: string): ProductAttributes {
    const lower = text.toLowerCase();

    let cut: string | undefined;
    if (lower.includes('wrap')) cut = 'wrap';
    else if (lower.includes('a-line') || lower.includes('aline')) cut = 'a-line';
    else if (lower.includes('flared') || lower.includes('flare')) cut = 'flared';
    else if (lower.includes('pleated')) cut = 'pleated';
    else if (lower.includes('straight')) cut = 'straight';

    let fabric: string | undefined;
    if (lower.includes('cotton')) fabric = 'cotton';
    else if (lower.includes('chiffon')) fabric = 'chiffon';
    else if (lower.includes('denim')) fabric = 'denim';
    else if (lower.includes('polyester')) fabric = 'polyester';

    let silhouette: string | undefined;
    if (lower.includes('bodycon')) silhouette = 'bodycon';
    else if (lower.includes('fitted')) silhouette = 'fitted';
    else if (lower.includes('relaxed')) silhouette = 'relaxed';
    else if (lower.includes('oversized')) silhouette = 'oversized';
    else if (cut === 'a-line' || lower.includes('a-line')) silhouette = 'a-line';

    return {
      cut,
      fabric,
      silhouette,
      source: 'llm_extracted',
      isComplete: () => Boolean(silhouette || cut),
    };
  }

  private static emptyResult(): ProductAttributes {
    return {
      source: 'llm_extracted',
      isComplete: () => false,
    };
  }
}
