/**
 * URL Unshortener Service
 *
 * Follows HTTP redirect chains using HEAD requests (no content downloaded).
 * Runs for known shortener domains and any URL with a short path pattern.
 *
 * Security:
 *  - SSRF-safe: blocks redirects that point to private / loopback addresses
 *  - Loop detection via visited-URL set
 *  - Hard cap of MAX_HOPS redirects
 *  - Per-hop timeout of TIMEOUT_MS
 */

const http  = require('http');
const https = require('https');

// ---------------------------------------------------------------------------
// Known URL shortener domains
// ---------------------------------------------------------------------------
const SHORT_DOMAINS = new Set([
  'bit.ly', 'bitly.com', 'tinyurl.com', 'ow.ly', 't.co', 'goo.gl',
  'buff.ly', 'ift.tt', 'dlvr.it', 'short.io', 'rb.gy', 'cutt.ly',
  'is.gd', 'v.gd', 'tiny.cc', 'lnkd.in', 'youtu.be', 'amzn.to',
  'fb.me', 'wp.me', 'snip.ly', 'clck.ru', 'trib.al', 'soo.gd',
  'short.link', 'shorturl.at', 'rebrand.ly', 'bl.ink', 'mcaf.ee',
  'aka.ms', 'apple.co', 'smarturl.it', 'po.st', 'nico.to',
  'qr.ae', 'adf.ly', 'bc.vc', 'n9.cl', 'ouo.io', 's.id',
  'urlzs.com', 'chilp.it', 'cli.gs', 'ff.im', 'fur.ly',
  'go2.me', 'hex.io', 'href.li', 'j.mp', 'kl.am',
  'linkd.in', 'moourl.com', 'ping.fm', 'post.ly', 'prettylinkpro.com',
  'qr.net', 'redir.ec', 'rubyurl.com', 'shrt.st', 'simurl.com',
  'su.pr', 'u.to', 'ur1.ca', 'urlcut.com', 'w3t.org', 'xrl.us',
]);

// Short-path pattern common to URL shorteners:  /abc123  /Xk9 etc.
const SHORT_PATH_RE = /^\/[A-Za-z0-9_-]{2,12}$/;

// HTTP redirect status codes
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

const MAX_HOPS    = 10;
const TIMEOUT_MS  = 4000;
const USER_AGENT  = 'Mozilla/5.0 (compatible; PhishGuard/1.0; +https://phishguard.io)';

// ---------------------------------------------------------------------------
// SSRF protection
// ---------------------------------------------------------------------------
const PRIVATE_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe80:/i,
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
];

function isSafeHostname(hostname) {
  return !PRIVATE_PATTERNS.some(p => p.test(hostname));
}

// ---------------------------------------------------------------------------
// Single-hop HEAD request — returns the Location header (or null)
// ---------------------------------------------------------------------------
function headRequest(url) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(url); } catch { return resolve(null); }

    if (!isSafeHostname(parsed.hostname)) return resolve(null);

    const mod = parsed.protocol === 'https:' ? https : http;

    const options = {
      method:   'HEAD',
      hostname: parsed.hostname,
      port:     parsed.port || undefined,
      path:     parsed.pathname + parsed.search,
      headers:  { 'User-Agent': USER_AGENT },
      timeout:  TIMEOUT_MS,
    };

    const req = mod.request(options, (res) => {
      if (REDIRECT_CODES.has(res.statusCode) && res.headers.location) {
        // Resolve relative Location headers
        try {
          const next = new URL(res.headers.location, url).href;
          resolve({ statusCode: res.statusCode, location: next });
        } catch {
          resolve(null);
        }
      } else {
        resolve({ statusCode: res.statusCode, location: null });
      }
    });

    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error',   () => resolve(null));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Follow the full redirect chain
// ---------------------------------------------------------------------------
async function followRedirects(startUrl) {
  const chain   = [startUrl];
  const visited = new Set([startUrl]);
  let   current = startUrl;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const result = await headRequest(current);
    if (!result || !result.location) break; // no more redirects

    const next = result.location;
    if (visited.has(next)) break; // loop detected

    visited.add(next);
    chain.push(next);
    current = next;
  }

  return { final: current, chain, redirect_count: chain.length - 1 };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
/**
 * Determines whether `url` looks like a shortened URL, then follows the
 * redirect chain and returns the resolved destination.
 *
 * @param {string} url
 * @returns {Promise<{
 *   was_shortened: boolean,
 *   original_url:  string,
 *   final_url:     string,
 *   redirect_count: number,
 *   chain:         string[],
 * }>}
 */
async function unshortenURL(url) {
  const base = { was_shortened: false, original_url: url, final_url: url, redirect_count: 0, chain: [url] };

  let parsed;
  try { parsed = new URL(url); } catch { return base; }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  const isKnownShortener = SHORT_DOMAINS.has(host) || SHORT_DOMAINS.has(parsed.hostname.toLowerCase());
  const hasShortPath     = SHORT_PATH_RE.test(parsed.pathname) && parsed.search === '';

  if (!isKnownShortener && !hasShortPath) return base;

  try {
    const { final, chain, redirect_count } = await followRedirects(url);
    const was_shortened = final !== url && redirect_count > 0;
    return { was_shortened, original_url: url, final_url: final, redirect_count, chain };
  } catch {
    return base; // network error — just return the original unchanged
  }
}

module.exports = { unshortenURL, SHORT_DOMAINS };
