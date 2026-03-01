/**
 * Have I Been Pwned — Domain Breach Check
 * Checks whether a domain has appeared in any known data breach.
 * Docs: https://haveibeenpwned.com/API/v3#BreachesForDomain
 *
 * Requires a paid HIBP API key: https://haveibeenpwned.com/API/Key
 */
const axios = require('axios');

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3';

/**
 * Extracts the registered domain from a hostname.
 */
function getRegisteredDomain(hostname) {
  const parts = hostname.replace(/^www\./, '').split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}

/**
 * @param {string} hostname
 * @returns {{ breached: boolean, breach_count: number, breaches: string[] } | null}
 */
async function checkDomainBreaches(hostname) {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey || apiKey === 'your_hibp_api_key_here') {
    return null;   // Key not configured — skip silently
  }

  const domain = getRegisteredDomain(hostname);

  try {
    const response = await axios.get(`${HIBP_BASE}/breacheddomain/${domain}`, {
      headers: {
        'hibp-api-key': apiKey,
        'user-agent': 'PhishGuard-ThreatIntel',
      },
      timeout: 6000,
    });

    // Response is an object: { "DomainName": ["BreachName1", ...] }
    const entries = Object.values(response.data || {});
    const breaches = entries.flat();

    return {
      breached: breaches.length > 0,
      breach_count: breaches.length,
      breaches: breaches.slice(0, 5),   // cap at 5 names in response
    };
  } catch (err) {
    if (err.response?.status === 404) {
      // 404 = domain not found in any breach
      return { breached: false, breach_count: 0, breaches: [] };
    }
    if (err.response?.status === 401) {
      console.warn('[HIBP] Invalid API key');
      return null;
    }
    console.error('[HIBP] Error:', err.message);
    return null;
  }
}

module.exports = { checkDomainBreaches };
