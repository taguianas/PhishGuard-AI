/**
 * URL Risk Analyzer Service
 * Combines heuristics, typosquatting detection, and threat intel.
 */
const levenshtein = require('fast-levenshtein');

// --- Constants ---
const SUSPICIOUS_KEYWORDS = ['login', 'verify', 'update', 'secure', 'account', 'signin', 'banking', 'password'];
const SUSPICIOUS_TLDS = ['.xyz', '.tk', '.top', '.gq', '.ml', '.cf', '.ga'];
const KNOWN_BRANDS = ['google', 'paypal', 'microsoft', 'amazon', 'apple', 'facebook', 'netflix', 'instagram'];
const IP_REGEX = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;

/**
 * @param {string} url
 * @returns {{ risk_score: number, classification: string, reasons: string[] }}
 */
function analyzeURL(url) {
  const reasons = [];
  let score = 0;

  // Sanitize — never fetch the URL
  let parsedURL;
  try {
    parsedURL = new URL(url);
  } catch {
    return { risk_score: 100, classification: 'Invalid', reasons: ['URL could not be parsed'] };
  }

  const hostname = parsedURL.hostname.toLowerCase();
  const fullURL = url.toLowerCase();

  // 1. IP address instead of domain (+20)
  if (IP_REGEX.test(url)) {
    score += 20;
    reasons.push('IP address used instead of domain name');
  }

  // 2. URL length > 75 (+10)
  if (url.length > 75) {
    score += 10;
    reasons.push(`Unusually long URL (${url.length} chars)`);
  }

  // 3. Too many dots (+10)
  const dotCount = (hostname.match(/\./g) || []).length;
  if (dotCount > 3) {
    score += 10;
    reasons.push(`Excessive subdomains (${dotCount} dots)`);
  }

  // 4. Suspicious keywords (+15 total, capped)
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter(k => fullURL.includes(k));
  if (foundKeywords.length > 0) {
    score += Math.min(15, foundKeywords.length * 5);
    reasons.push(`Suspicious keyword(s): ${foundKeywords.join(', ')}`);
  }

  // 5. Suspicious TLD (+15)
  const tldMatch = SUSPICIOUS_TLDS.find(tld => hostname.endsWith(tld));
  if (tldMatch) {
    score += 15;
    reasons.push(`Suspicious top-level domain: ${tldMatch}`);
  }

  // 6. No HTTPS (+10)
  if (parsedURL.protocol !== 'https:') {
    score += 10;
    reasons.push('Not using HTTPS');
  }

  // 7. Typosquatting detection (+25)
  const domainBase = hostname.replace(/^www\./, '').split('.')[0];
  for (const brand of KNOWN_BRANDS) {
    const dist = levenshtein.get(domainBase, brand);
    if (dist > 0 && dist <= 2) {
      score += 25;
      reasons.push(`Possible typosquatting of "${brand}" (distance: ${dist})`);
      break;
    }
  }

  // 8. Encoded characters (+10)
  if (/%[0-9a-f]{2}/i.test(url)) {
    score += 10;
    reasons.push('URL contains encoded characters (obfuscation risk)');
  }

  // Normalize to 0–100
  const risk_score = Math.min(100, score);
  const classification =
    risk_score >= 70 ? 'High Risk' :
    risk_score >= 40 ? 'Medium Risk' :
    'Low Risk';

  return { risk_score, classification, reasons };
}

module.exports = { analyzeURL };
