/**
 * Google Safe Browsing API v5 (non-legacy)
 * Uses SHA256 hash prefixes — never sends the full URL to Google.
 * Free: 10,000 requests/day
 * Docs: https://developers.google.com/safe-browsing/v5/lookup-api
 */
const axios = require('axios');
const crypto = require('crypto');

const SB_URL = 'https://safebrowsing.googleapis.com/v5/hashes:search';

const THREAT_LABELS = {
  MALWARE: 'Malware',
  SOCIAL_ENGINEERING: 'Phishing',
  UNWANTED_SOFTWARE: 'Unwanted Software',
  POTENTIALLY_HARMFUL_APPLICATION: 'Harmful Application',
};

/**
 * Canonicalizes a URL for Safe Browsing hashing.
 * Strips fragment, lowercases scheme+host, preserves path and query.
 */
function canonicalizeUrl(url) {
  try {
    const p = new URL(url);
    return `${p.protocol}//${p.hostname}${p.pathname}${p.search}`;
  } catch {
    return url;
  }
}

/**
 * Computes SHA256 of the canonicalized URL and returns a Buffer.
 */
function hashUrl(url) {
  return crypto.createHash('sha256').update(canonicalizeUrl(url)).digest();
}

/**
 * @param {string} url
 * @returns {{ safe: boolean, threats: string[] } | null}
 */
async function checkSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || apiKey === 'your_google_safe_browsing_api_key_here') {
    return null;
  }

  const fullHashBuf  = hashUrl(url);
  const prefix4Bytes = fullHashBuf.slice(0, 4);
  const prefixB64    = prefix4Bytes.toString('base64');
  const fullHashB64  = fullHashBuf.toString('base64');

  try {
    const response = await axios.get(SB_URL, {
      params: { key: apiKey, hashPrefixes: prefixB64 },
      timeout: 5000,
    });

    const fullHashes = response.data?.fullHashes || [];

    // Only report a threat if the full hash matches (not just the prefix)
    const matches = fullHashes.filter(h => h.fullHash === fullHashB64);
    const threats = [
      ...new Set(
        matches.flatMap(m =>
          (m.attributes?.threatTypes || []).map(t => THREAT_LABELS[t] || t)
        )
      ),
    ];

    return { safe: threats.length === 0, threats };
  } catch (err) {
    if (err.response?.status === 400) {
      console.warn('[SafeBrowsing] Bad request:', err.response.data?.error?.message);
    } else {
      console.error('[SafeBrowsing] Error:', err.message);
    }
    return null;
  }
}

module.exports = { checkSafeBrowsing };
