/**
 * LLM-based email phishing classifier using Groq (free tier).
 * Model: llama-3.1-8b-instant — fast, free, 14,400 req/day
 * Get a free API key at: https://console.groq.com → API Keys
 *
 * Requires GROQ_API_KEY in .env
 */
const Groq = require('groq-sdk');

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') return null;
    client = new Groq({ apiKey });
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
  const groq = getClient();
  if (!groq) return null;

  const truncated = emailText.slice(0, 3000);
  const context   = senderDomain ? `Sender domain: ${senderDomain}\n\n` : '';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `${context}Email content:\n${truncated}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();

    // Strip markdown fences if present
    let clean = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/, '').trim();

    // Extract the first {...} block in case the model adds extra text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) clean = match[0];

    // Fix common invalid JSON escape sequences produced by LLMs
    clean = clean.replace(/\\'/g, "'").replace(/\\([^"\\\/bfnrtu])/g, '$1');

    return JSON.parse(clean);
  } catch (err) {
    console.error('[LLM] Classification error:', err.message);
    return null;
  }
}

module.exports = { classifyEmailWithLLM };
