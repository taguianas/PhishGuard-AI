/**
 * Shared URL scan logic — used by both the URL route and the QR route.
 * Runs heuristics + VirusTotal + domain age + Safe Browsing + ML in parallel.
 */
const axios = require('axios');
const { analyzeURL } = require('./urlAnalyzer');
const { checkURL } = require('../threat-intel/virusTotal');
const { getDomainAge } = require('../threat-intel/domainAge');
const { checkSafeBrowsing } = require('../threat-intel/safeBrowsing');
const { unshortenURL } = require('./urlUnshortener');

/**
 * @param {string} url  - fully qualified URL (must have http/https)
 * @returns {Promise<object>} scan result
 */
async function scanURL(url) {
  // Resolve any redirect chain first
  const unshortened = await unshortenURL(url).catch(() => ({
    was_shortened: false, original_url: url, final_url: url, redirect_count: 0, chain: [url],
  }));
  const targetUrl = unshortened.final_url;

  const hostname = new URL(targetUrl).hostname;

  const [threatIntel, domainAge, safeBrowsing, mlResult] = await Promise.all([
    checkURL(targetUrl).catch(() => null),
    getDomainAge(hostname).catch(() => null),
    checkSafeBrowsing(targetUrl).catch(() => null),
    process.env.ML_SERVICE_URL
      ? axios.post(`${process.env.ML_SERVICE_URL}/predict`, { url: targetUrl }, { timeout: 5000 })
          .then(r => r.data).catch(() => null)
      : Promise.resolve(null),
  ]);

  const heuristics = analyzeURL(targetUrl);
  let finalScore = heuristics.risk_score;
  const reasons = [...heuristics.reasons];

  if (unshortened.was_shortened) {
    reasons.unshift(`Shortened URL resolved to: ${targetUrl}`);
  }
  if (threatIntel?.blacklisted) {
    finalScore = Math.min(100, finalScore + 25);
    reasons.push(`Blacklisted by VirusTotal (${threatIntel.malicious} engine${threatIntel.malicious !== 1 ? 's' : ''})`);
  }
  if (domainAge?.is_young) {
    finalScore = Math.min(100, finalScore + 10);
    reasons.push(`Recently registered domain (${domainAge.age_days} days old)`);
  }
  if (safeBrowsing && !safeBrowsing.safe) {
    finalScore = Math.min(100, finalScore + 20);
    reasons.push(`Google Safe Browsing flagged: ${safeBrowsing.threats.join(', ')}`);
  }

  const classification =
    finalScore >= 70 ? 'High Risk' :
    finalScore >= 40 ? 'Medium Risk' :
    'Low Risk';

  return {
    url,
    risk_score: finalScore,
    classification,
    reasons,
    threat_intel: threatIntel,
    domain_age: domainAge,
    safe_browsing: safeBrowsing,
    ml_prediction: mlResult,
    homograph: heuristics.homograph ?? null,
    unshortened: unshortened.was_shortened ? unshortened : null,
  };
}

module.exports = { scanURL };
