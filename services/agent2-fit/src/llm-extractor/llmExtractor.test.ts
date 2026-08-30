import { LLMExtractor } from './llmExtractor';

describe('LLMExtractor (Groq)', () => {
  const originalGroqKey = process.env.GROQ_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    process.env.GROQ_API_KEY = originalGroqKey;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  });

  it('uses keyword fallback when GROQ_API_KEY is not set', async () => {
    const text = 'A gorgeous floral wrap midi dress made from lightweight chiffon.';
    const result = await LLMExtractor.extract(text);

    expect(result.source).toBe('llm_extracted');
    expect(result.cut).toBe('wrap');
    expect(result.fabric).toBe('chiffon');
    expect(result.isComplete()).toBe(true);
  });

  it('handles empty descriptions gracefully', async () => {
    const result = await LLMExtractor.extract('');
    expect(result.isComplete()).toBe(false);
  });

  it('extracts denim fabric and oversized fit from description text', async () => {
    const text = 'Oversized denim jacket with straight fit';
    const result = await LLMExtractor.extract(text);

    expect(result.fabric).toBe('denim');
    expect(result.silhouette).toBe('oversized');
    expect(result.cut).toBe('straight');
  });
});
