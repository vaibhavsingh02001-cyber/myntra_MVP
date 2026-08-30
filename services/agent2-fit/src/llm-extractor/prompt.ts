export const EXTRACTION_PROMPT = `
You are a fashion attribute extractor. Given a clothing product description,
extract the following attributes in valid JSON format. Use ONLY the allowed values.

Product Description:
{{DESCRIPTION}}

Return ONLY a JSON object with these keys (use null if unknown or not mentioned):
{
  "cut": "wrap" | "a-line" | "straight" | "tapered" | "flared" | "asymmetric" | "pleated" | null,
  "fabric": "cotton" | "chiffon" | "denim" | "polyester" | "linen" | "silk" | "jersey" | "wool" | null,
  "silhouette": "fitted" | "relaxed" | "oversized" | "bodycon" | "a-line" | null,
  "fitType": "slim" | "regular" | "plus" | "petite" | null,
  "length": "mini" | "midi" | "maxi" | "crop" | "full" | null
}

Return ONLY the JSON object, no explanation, no markdown code blocks.
`.trim();
