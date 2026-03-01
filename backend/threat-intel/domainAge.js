/**
 * Domain Age Lookup via WHOIS
 * Returns the domain creation date and age in days.
 * No API key required — uses direct WHOIS protocol via whoiser.
 */
const { whoisDomain } = require('whoiser');

/**
 * Extracts the registered domain (e.g. "sub.paypal.com" → "paypal.com")
 */
function getRegisteredDomain(hostname) {
  const parts = hostname.replace(/^www\./, '').split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}

/**
 * Parses a creation date string from WHOIS data into a Date object.
 * WHOIS dates come in many formats — handles the most common ones.
 */
function parseCreationDate(raw) {
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string} hostname
 * @returns {{ created_at: string|null, age_days: number|null, is_young: boolean } | null}
 */
async function getDomainAge(hostname) {
  const domain = getRegisteredDomain(hostname);

  try {
    const data = await whoisDomain(domain, { timeout: 6000, follow: 1 });

    // whoiser returns an object keyed by whois server; iterate to find creation date
    let creationDate = null;
    for (const server of Object.values(data)) {
      const raw =
        server['Created Date'] ||
        server['Creation Date'] ||
        server['created'] ||
        server['Domain Registration Date'] ||
        server['Registration Time'];

      creationDate = parseCreationDate(raw);
      if (creationDate) break;
    }

    if (!creationDate) return { created_at: null, age_days: null, is_young: false };

    const ageDays = Math.floor((Date.now() - creationDate.getTime()) / 86_400_000);
    return {
      created_at: creationDate.toISOString().split('T')[0],
      age_days: ageDays,
      is_young: ageDays < 365,     // younger than 1 year → suspicious
    };
  } catch {
    return null;   // WHOIS failed or timed out — non-fatal
  }
}

module.exports = { getDomainAge };
