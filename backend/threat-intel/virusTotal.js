/**
 * VirusTotal API Integration
 * Checks a URL hash against the VirusTotal database.
 * Docs: https://developers.virustotal.com/reference/overview
 */
const axios = require('axios');
const crypto = require('crypto');

const VT_BASE = 'https://www.virustotal.com/api/v3';

/**
 * @param {string} url
 * @returns {{ malicious: number, suspicious: number, harmless: number, blacklisted: boolean } | null}
 */
async function checkURL(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey || apiKey === 'your_virustotal_api_key_here') {
    console.warn('[VirusTotal] API key not configured — skipping check');
    return null;
  }

  try {
    // VirusTotal uses URL-safe base64 of the URL as the ID
    const urlId = Buffer.from(url).toString('base64url').replace(/=+$/, '');
    const response = await axios.get(`${VT_BASE}/urls/${urlId}`, {
      headers: { 'x-apikey': apiKey },
      timeout: 8000,
    });

    const stats = response.data?.data?.attributes?.last_analysis_stats || {};
    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      blacklisted: (stats.malicious || 0) > 0,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { malicious: 0, suspicious: 0, harmless: 0, blacklisted: false };
    }
    console.error('[VirusTotal] Error:', err.message);
    return null;
  }
}

module.exports = { checkURL };
