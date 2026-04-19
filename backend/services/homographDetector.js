/**
 * IDN Homograph Attack Detector
 *
 * Detects domains that use visually similar Unicode characters (Cyrillic, Greek,
 * Armenian, fullwidth, etc.) to impersonate legitimate brands.
 *
 * Strategy:
 *  1. Skip pure-ASCII hostnames fast.
 *  2. Identify which Unicode scripts are present.
 *  3. Normalise each character to its ASCII lookalike.
 *  4. Compare the normalised base against known brands.
 *  5. Get the real Punycode form via Node's built-in url.domainToASCII.
 */

const { domainToASCII } = require('url');

// ---------------------------------------------------------------------------
// Lookalike map  (Unicode char → ASCII equivalent)
// Sources: UC Consortium confusables list, common phishing kits
// ---------------------------------------------------------------------------
const LOOKALIKE_MAP = new Map([
  // ── Cyrillic ──────────────────────────────────────────────────────────────
  ['\u0430', 'a'],  // а  CYRILLIC SMALL LETTER A
  ['\u0435', 'e'],  // е  CYRILLIC SMALL LETTER IE
  ['\u043E', 'o'],  // о  CYRILLIC SMALL LETTER O
  ['\u0440', 'p'],  // р  CYRILLIC SMALL LETTER ER
  ['\u0441', 'c'],  // с  CYRILLIC SMALL LETTER ES
  ['\u0445', 'x'],  // х  CYRILLIC SMALL LETTER HA
  ['\u0443', 'y'],  // у  CYRILLIC SMALL LETTER U
  ['\u0456', 'i'],  // і  CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I
  ['\u0458', 'j'],  // ј  CYRILLIC SMALL LETTER JE
  ['\u0455', 's'],  // ѕ  CYRILLIC SMALL LETTER DZE
  ['\u0501', 'd'],  // ԁ  CYRILLIC SMALL LETTER KOMI DE
  ['\u051D', 'w'],  // ԝ  CYRILLIC SMALL LETTER WE
  ['\u0410', 'A'],  // А  CYRILLIC CAPITAL LETTER A
  ['\u0412', 'B'],  // В  CYRILLIC CAPITAL LETTER VE
  ['\u0415', 'E'],  // Е  CYRILLIC CAPITAL LETTER IE
  ['\u041A', 'K'],  // К  CYRILLIC CAPITAL LETTER KA
  ['\u041C', 'M'],  // М  CYRILLIC CAPITAL LETTER EM
  ['\u041D', 'H'],  // Н  CYRILLIC CAPITAL LETTER EN
  ['\u041E', 'O'],  // О  CYRILLIC CAPITAL LETTER O
  ['\u0420', 'P'],  // Р  CYRILLIC CAPITAL LETTER ER
  ['\u0421', 'C'],  // С  CYRILLIC CAPITAL LETTER ES
  ['\u0422', 'T'],  // Т  CYRILLIC CAPITAL LETTER TE
  ['\u0425', 'X'],  // Х  CYRILLIC CAPITAL LETTER HA
  ['\u0423', 'Y'],  // У  CYRILLIC CAPITAL LETTER U

  // ── Greek ─────────────────────────────────────────────────────────────────
  ['\u03B1', 'a'],  // α  GREEK SMALL LETTER ALPHA
  ['\u03B5', 'e'],  // ε  GREEK SMALL LETTER EPSILON
  ['\u03BF', 'o'],  // ο  GREEK SMALL LETTER OMICRON
  ['\u03C1', 'p'],  // ρ  GREEK SMALL LETTER RHO
  ['\u03BD', 'v'],  // ν  GREEK SMALL LETTER NU
  ['\u03B9', 'i'],  // ι  GREEK SMALL LETTER IOTA
  ['\u03BA', 'k'],  // κ  GREEK SMALL LETTER KAPPA
  ['\u03C7', 'x'],  // χ  GREEK SMALL LETTER CHI
  ['\u03C5', 'u'],  // υ  GREEK SMALL LETTER UPSILON
  ['\u03C4', 't'],  // τ  GREEK SMALL LETTER TAU
  ['\u0391', 'A'],  // Α  GREEK CAPITAL LETTER ALPHA
  ['\u0392', 'B'],  // Β  GREEK CAPITAL LETTER BETA
  ['\u0395', 'E'],  // Ε  GREEK CAPITAL LETTER EPSILON
  ['\u0396', 'Z'],  // Ζ  GREEK CAPITAL LETTER ZETA
  ['\u0397', 'H'],  // Η  GREEK CAPITAL LETTER ETA
  ['\u0399', 'I'],  // Ι  GREEK CAPITAL LETTER IOTA
  ['\u039A', 'K'],  // Κ  GREEK CAPITAL LETTER KAPPA
  ['\u039C', 'M'],  // Μ  GREEK CAPITAL LETTER MU
  ['\u039D', 'N'],  // Ν  GREEK CAPITAL LETTER NU
  ['\u039F', 'O'],  // Ο  GREEK CAPITAL LETTER OMICRON
  ['\u03A1', 'P'],  // Ρ  GREEK CAPITAL LETTER RHO
  ['\u03A4', 'T'],  // Τ  GREEK CAPITAL LETTER TAU
  ['\u03A7', 'X'],  // Χ  GREEK CAPITAL LETTER CHI
  ['\u03A5', 'Y'],  // Υ  GREEK CAPITAL LETTER UPSILON

  // ── Armenian ──────────────────────────────────────────────────────────────
  ['\u0578', 'u'],  // ո  ARMENIAN SMALL LETTER VO
  ['\u057D', 'u'],  // ս  ARMENIAN SMALL LETTER SEH
  ['\u0570', 'h'],  // հ  ARMENIAN SMALL LETTER HO
  ['\u0563', 'g'],  // գ  ARMENIAN SMALL LETTER GIM

  // ── Latin confusables ─────────────────────────────────────────────────────
  ['\u0251', 'a'],  // ɑ  LATIN SMALL LETTER SCRIPT A
  ['\u0261', 'g'],  // ɡ  LATIN SMALL LETTER SCRIPT G
  ['\u026A', 'i'],  // ɪ  LATIN LETTER SMALL CAPITAL I
  ['\u0269', 'i'],  // ɩ  LATIN SMALL LETTER IOTA
  ['\u04CF', 'l'],  // ӏ  CYRILLIC SMALL LETTER PALOCHKA  (looks like 1/l)

  // ── Fullwidth ASCII (U+FF01–U+FF5E maps to U+0021–U+007E) ────────────────
  ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'].map(
    (ch, i) => [String.fromCodePoint(0xFF21 + i > 0xFF3A ? (i < 26 ? 0xFF21 + i : 0xFF41 + i - 26) : 0xFF21 + i), ch]
  ),
]);

// ---------------------------------------------------------------------------
// Unicode script detection (code-point ranges)
// ---------------------------------------------------------------------------
const SCRIPT_RANGES = [
  { name: 'Cyrillic',   start: 0x0400, end: 0x04FF },
  { name: 'Greek',      start: 0x0370, end: 0x03FF },
  { name: 'Armenian',   start: 0x0530, end: 0x058F },
  { name: 'Hebrew',     start: 0x0590, end: 0x05FF },
  { name: 'Arabic',     start: 0x0600, end: 0x06FF },
  { name: 'Devanagari', start: 0x0900, end: 0x097F },
  { name: 'CJK',        start: 0x4E00, end: 0x9FFF },
  { name: 'Fullwidth',  start: 0xFF01, end: 0xFF60 },
];

function detectScripts(text) {
  const found = new Set();
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 128) continue; // pure ASCII — skip
    for (const { name, start, end } of SCRIPT_RANGES) {
      if (cp >= start && cp <= end) { found.add(name); break; }
    }
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// Known brands to check against (expanded for homograph accuracy)
// ---------------------------------------------------------------------------
const BRANDS = [
  'google', 'paypal', 'microsoft', 'amazon', 'apple', 'facebook', 'netflix',
  'instagram', 'twitter', 'linkedin', 'dropbox', 'github', 'yahoo', 'outlook',
  'gmail', 'office', 'onedrive', 'icloud', 'ebay', 'walmart', 'chase', 'wellsfargo',
  'bankofamerica', 'citibank', 'coinbase', 'binance', 'steam', 'discord',
  'whatsapp', 'telegram', 'tiktok', 'youtube', 'adobe', 'salesforce', 'stripe',
  'shopify', 'wordpress', 'godaddy', 'cloudflare', 'amazonaws', 'azure',
];

// ---------------------------------------------------------------------------
// Normalise: replace every character with its ASCII lookalike (if any)
// ---------------------------------------------------------------------------
function toLookalikeASCII(text) {
  return [...text].map(ch => LOOKALIKE_MAP.get(ch) ?? ch).join('');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
/**
 * @param {string} hostname  e.g. "pаypal.com" (with Cyrillic а)
 * @returns {{
 *   detected: boolean,
 *   unicode_domain: string,
 *   punycode_domain: string,
 *   ascii_lookalike: string,
 *   impersonates: string|null,
 *   scripts: string[],
 * }}
 */
function detectHomograph(hostname) {
  const result = {
    detected: false,
    unicode_domain: hostname,
    punycode_domain: hostname,
    ascii_lookalike: hostname,
    impersonates: null,
    scripts: [],
  };

  // Fast path — pure ASCII domains can't be homograph attacks
  if (/^[\x00-\x7F]+$/.test(hostname)) return result;

  // Detect scripts present in the hostname
  result.scripts = detectScripts(hostname);

  // Get Punycode via Node built-in (domainToASCII returns '' on failure)
  const puny = domainToASCII(hostname);
  if (puny) result.punycode_domain = puny;

  // Build the ASCII lookalike version
  const lookalike = toLookalikeASCII(hostname);
  result.ascii_lookalike = lookalike;

  // Extract the base label (strip www. prefix and TLD)
  const base = lookalike.toLowerCase().replace(/^www\./, '').split('.')[0];

  // Check for exact or near-exact brand match in the normalised base
  for (const brand of BRANDS) {
    if (base === brand || base.includes(brand) || brand.includes(base)) {
      result.detected = true;
      result.impersonates = brand;
      break;
    }
    // Levenshtein distance ≤ 1 after lookalike normalisation
    let dist = 0;
    const a = base, b = brand;
    if (Math.abs(a.length - b.length) <= 1) {
      // Simple edit-distance check without importing levenshtein here
      const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
        Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
      );
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          matrix[i][j] = b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
      dist = matrix[b.length][a.length];
    }
    if (dist === 1) {
      result.detected = true;
      result.impersonates = brand;
      break;
    }
  }

  // Even without a brand match, mixed scripts in a domain is suspicious
  if (!result.detected && result.scripts.length > 0) {
    result.detected = true; // flag it — mixed script alone is a red flag
  }

  return result;
}

module.exports = { detectHomograph };
