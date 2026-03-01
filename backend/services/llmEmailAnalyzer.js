/**
 * LLM-based email phishing classifier using Claude (claude-haiku-4-5 for speed + cost).
 * Requires ANTHROPIC_API_KEY in .env
 */
const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') return null;
    client = new Anthropic({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a cybersecurity expert specializing in phishing email detection.
Analyze the provided email content and return ONLY a valid JSON object — no markdown, no explanation.

JSON schema:
{
  "verdict": "Phishing" | "Legitimate" | "Suspicious",
  "confidence": <number 0-100>,
  "summary": "<one sentence explanation>",
  "red_flags": ["<flag1>", "<flag2>"]
}`;

/**
 * @param {string} emailText
 * @param {string} senderDomain
 * @returns {{ verdict: string, confidence: number, summary: string, red_flags: string[] } | null}
 */
async function classifyEmailWithLLM(emailText, senderDomain = '') {
  const claude = getClient();
  if (!claude) return null;

  // Truncate to 3000 chars to stay within token budget
  const truncated = emailText.slice(0, 3000);
  const context = senderDomain ? `Sender domain: ${senderDomain}\n\n` : '';

  try {
    const message = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${context}Email content:\n${truncated}`,
        },
      ],
    });

    const raw = message.content[0]?.text?.trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('[LLM] Classification error:', err.message);
    return null;
  }
}

module.exports = { classifyEmailWithLLM };
