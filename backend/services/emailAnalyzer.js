/**
 * Email Phishing Analyzer Service
 * Detects urgency patterns, domain mismatches, and suspicious content.
 */

const URGENCY_PHRASES = [
  'act now', 'limited time', 'account suspended', 'verify immediately',
  'click here', 'urgent action', 'your account will be closed',
  'confirm your identity', 'update your information', 'security alert',
];

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;
const DOMAIN_REGEX = /(?:from|reply-to):\s*[^<]*<[^@]+@([^>]+)>/i;

/**
 * @param {string} emailText - Raw email content pasted by the user
 * @param {string} [senderDomain] - Optional parsed sender domain
 * @returns {{ risk_score: number, classification: string, reasons: string[], urls: string[] }}
 */
function analyzeEmail(emailText, senderDomain = '') {
  const reasons = [];
  let score = 0;
  const text = emailText.toLowerCase();

  // 1. Urgency phrases (+5 each, max 30)
  const foundPhrases = URGENCY_PHRASES.filter(p => text.includes(p));
  if (foundPhrases.length > 0) {
    const phraseScore = Math.min(30, foundPhrases.length * 5);
    score += phraseScore;
    reasons.push(`Urgency language detected: "${foundPhrases[0]}"${foundPhrases.length > 1 ? ` (+${foundPhrases.length - 1} more)` : ''}`);
  }

  // 2. Extract URLs from body
  const urls = emailText.match(URL_REGEX) || [];
  const suspiciousURLDomains = [];

  urls.forEach(url => {
    try {
      const parsed = new URL(url);
      const urlHostname = parsed.hostname.toLowerCase();
      // Domain mismatch with sender
      if (senderDomain && !urlHostname.endsWith(senderDomain)) {
        suspiciousURLDomains.push(urlHostname);
      }
    } catch {
      // Invalid URL in email body is itself suspicious
      score += 5;
      reasons.push('Malformed URL found in email body');
    }
  });

  if (suspiciousURLDomains.length > 0) {
    score += 20;
    reasons.push(`Link domain mismatch with sender: ${[...new Set(suspiciousURLDomains)].slice(0, 3).join(', ')}`);
  }

  // 3. Excessive exclamation marks (+10)
  const exclamations = (emailText.match(/!/g) || []).length;
  if (exclamations >= 3) {
    score += 10;
    reasons.push(`Excessive exclamation marks (${exclamations} found)`);
  }

  // 4. ALL CAPS words (+10)
  const capsWords = (emailText.match(/\b[A-Z]{4,}\b/g) || []);
  if (capsWords.length >= 3) {
    score += 10;
    reasons.push(`Aggressive capitalization (${capsWords.length} all-caps words)`);
  }

  // 5. Suspicious attachment hints (+15)
  const attachmentPatterns = /\.(exe|zip|rar|js|vbs|docm|xlsm|bat|ps1)\b/i;
  if (attachmentPatterns.test(emailText)) {
    score += 15;
    reasons.push('Suspicious attachment type referenced');
  }

  // 6. Generic greeting (+5)
  if (/dear (customer|user|valued|account holder|sir|madam)/i.test(emailText)) {
    score += 5;
    reasons.push('Generic greeting (not personalized)');
  }

  // 7. Grammar anomaly patterns (+10)
  const grammarPatterns = [
    { re: /\byour account (has|have) been (suspend|block|limit)/i, label: 'Grammatical error: subject-verb agreement' },
    { re: /\bkindly (do the needful|revert back|do needful)/i,     label: 'Unusual phrasing: "kindly do the needful"' },
    { re: /\b(we has|they has|i has)\b/i,                          label: 'Grammatical error: incorrect verb form' },
    { re: /\b(click the below|below mentioned) link/i,             label: 'Awkward phrasing typical of phishing templates' },
    { re: /\bplease to (click|verify|confirm|update)/i,            label: 'Grammatical error: "please to + verb"' },
    { re: /\byour (informations?|datas?|credentials?) (is|are) required/i, label: 'Unnatural phrasing around personal data' },
    { re: /\b(dear valued|esteemed) (customer|client|user)\b/i,    label: 'Overly formal generic salutation' },
  ];
  const grammarHits = grammarPatterns.filter(p => p.re.test(emailText));
  if (grammarHits.length > 0) {
    score += Math.min(10, grammarHits.length * 5);
    reasons.push(`Grammar anomaly: ${grammarHits[0].label}`);
  }

  const risk_score = Math.min(100, score);
  const classification =
    risk_score >= 70 ? 'High Risk' :
    risk_score >= 35 ? 'Medium Risk' :
    'Low Risk';

  return { risk_score, classification, reasons, urls };
}

module.exports = { analyzeEmail };
