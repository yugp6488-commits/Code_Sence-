import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

export interface AISuggestion {
  category: "security" | "performance" | "style" | "logic" | "best-practice";
  severity: "critical" | "warning" | "info";
  lineStart?: number;
  lineEnd?: number;
  message: string;
  suggestedCode?: string;
  explanation: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function generateMockSuggestions(
  code: string,
  language: string,
  context?: string | null
): Promise<AISuggestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY not set, returning empty suggestions");
    return [];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextSection = context ? `\nProject Context / Coding Conventions:\n${context}\n` : "";

  const prompt = `You are an expert code reviewer. Analyze the following ${language} code and provide actionable, specific code review suggestions.
${contextSection}
Return a JSON array of suggestions. Each suggestion must have:
- category: one of "security", "performance", "style", "logic", "best-practice"
- severity: one of "critical", "warning", "info"
- lineStart: line number where the issue starts (integer, 1-based)
- lineEnd: line number where the issue ends (integer, 1-based)
- message: a short, specific title for the issue (max 80 chars)
- suggestedCode: fixed code snippet (optional, omit if not applicable)
- explanation: detailed explanation of why this is an issue and how to fix it

Provide 3-6 diverse, high-quality suggestions covering different aspects of the code.
Always provide at least 3 suggestions. Include style, best-practice, and performance observations even for simple code. Treat this as a teaching review, not just a bug hunt.

Code to review (${language}):
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON array, no markdown, no explanation outside the JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const suggestions: AISuggestion[] = JSON.parse(jsonText);

if (suggestions.length === 0) {
  // Gemini decided code was clean — retry with explicit instruction
  logger.warn("Gemini returned 0 suggestions, retrying with explicit prompt");
  const retryResult = await model.generateContent(
    prompt + "\n\nIMPORTANT: You MUST return at least 3 suggestions. The developer wants a teaching review. Find style, naming, or best-practice improvements."
  );
  const retryText = retryResult.response.text().trim();
  const retryJson = retryText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const retrySuggestions: AISuggestion[] = JSON.parse(retryJson);
  logger.info({ count: retrySuggestions.length }, "Retry suggestions generated");
  return retrySuggestions;
}

logger.info({ count: suggestions.length, language }, "Gemini AI suggestions generated");
return suggestions;
  } catch (err) {
    logger.error({ err }, "Failed to generate AI suggestions, falling back to empty");
    return [];
  }
}

export interface AIExplanation {
  explanation: string;
  codeFlowMermaid: string;
  mindMapMermaid: string;
}

export async function generateCodeExplanation(
  code: string,
  language: string,
  context?: string | null
): Promise<AIExplanation> {
  const fallback: AIExplanation = {
    explanation:
      "AI explanation unavailable. Please verify your GEMINI_API_KEY and try again later.",
    codeFlowMermaid: "flowchart TD\n  A[Code review explanation] --> B[Review engine]",
    mindMapMermaid: "graph TB\n  A[Code review] --> B[Files]\n  A --> C[Variables]",
  };

  if (!process.env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY not set, returning fallback explanation");
    return fallback;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const contextSection = context ? `\nProject Context / Coding Conventions:\n${context}\n` : "";

  const prompt = `You are an expert code explainer and visualization specialist. Return valid JSON only, with the following keys:\n{\n  \"explanation\": \"A step-by-step plain-English explanation of the code and its flow.\",\n  \"codeFlowMermaid\": \"A valid Mermaid flowchart definition starting with 'flowchart TD'.\",\n  \"mindMapMermaid\": \"A valid Mermaid mind map or graph definition showing files, variables, and dependencies.\"\n}\n\nDo not wrap the JSON in markdown fences. Do not include any extra text outside the JSON object.\n\nCode (${language}):\n\n\`\`\`${language}\n${code}\n\`\`\`\n${contextSection}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText) as AIExplanation;

    if (!parsed?.explanation || !parsed?.codeFlowMermaid || !parsed?.mindMapMermaid) {
      throw new Error("Parsed explanation response is missing required fields");
    }

    logger.info({ language }, "Gemini AI code explanation generated");
    return parsed;
  } catch (err) {
    logger.error({ err }, "Failed to generate AI explanation, falling back to default");
    return fallback;
  }
}

export function extractPatternsFromFeedback(
  suggestions: Array<{ category: string; severity: string; feedback: string | null; message: string }>,
  language: string
): Array<{ pattern: string; category: string; confidence: number }> {
  const patterns: Array<{ pattern: string; category: string; confidence: number }> = [];

  for (const s of suggestions) {
    if (s.feedback === "accepted") {
      patterns.push({
        pattern: s.message,
        category: s.category,
        confidence: 0.7,
      });
    } else if (s.feedback === "rejected") {
      patterns.push({
        pattern: `NOT: ${s.message}`,
        category: s.category,
        confidence: 0.3,
      });
    }
  }

  logger.info({ language, patternsExtracted: patterns.length }, "Extracted patterns from feedback");
  return patterns;
}
