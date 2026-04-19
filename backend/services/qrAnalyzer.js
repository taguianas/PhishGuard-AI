const { Jimp } = require('jimp');
const jsQR = require('jsqr');

/**
 * Classify what type of content a QR payload contains.
 */
function classifyPayload(text) {
  if (/^https?:\/\//i.test(text))   return 'url';
  if (/^WIFI:/i.test(text))          return 'wifi';
  if (/^MAILTO:/i.test(text))        return 'email';
  if (/^TEL:/i.test(text))           return 'phone';
  if (/^BEGIN:VCARD/i.test(text))    return 'vcard';
  if (/^SMSTO:/i.test(text))         return 'sms';
  if (/^GEO:/i.test(text))           return 'geo';
  return 'text';
}

/**
 * Decode all QR codes found in an image buffer.
 * jimp handles JPEG, PNG, BMP, TIFF, GIF; jsQR does the QR recognition.
 *
 * Returns an array of decoded payloads (strings).
 * jsQR finds one code at a time, so we apply basic tiling to catch codes
 * that are small or off-centre in a large image.
 */
async function decodeQRCodes(buffer) {
  let image;
  try {
    image = await Jimp.read(buffer);
  } catch (err) {
    throw new Error(`Image decode failed: ${err.message}`);
  }

  const found = new Set();

  function scanBitmap(bmp) {
    const result = jsQR(
      new Uint8ClampedArray(bmp.data),
      bmp.width,
      bmp.height,
      { inversionAttempts: 'dontInvert' },
    );
    if (result?.data) found.add(result.data);
  }

  // 1. Scan the full image
  scanBitmap(image.bitmap);

  // 2. If nothing found, try resizing (helps with very high-res photos)
  if (found.size === 0 && (image.bitmap.width > 800 || image.bitmap.height > 800)) {
    const resized = image.clone().resize({ w: 600 });
    scanBitmap(resized.bitmap);
  }

  // 3. Quadrant scan — helps when the QR sits in a corner
  if (found.size === 0) {
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const quads = [
      { x: 0,       y: 0,       w: w / 2, h: h / 2 },
      { x: w / 2,   y: 0,       w: w / 2, h: h / 2 },
      { x: 0,       y: h / 2,   w: w / 2, h: h / 2 },
      { x: w / 2,   y: h / 2,   w: w / 2, h: h / 2 },
    ];
    for (const q of quads) {
      const cropped = image.clone().crop({
        x: Math.floor(q.x), y: Math.floor(q.y),
        w: Math.floor(q.w), h: Math.floor(q.h),
      });
      scanBitmap(cropped.bitmap);
      if (found.size > 0) break;
    }
  }

  return [...found];
}

/**
 * Main entry point.
 * Returns decoded payloads with content-type classification.
 * URL payloads also get a `url_analysis` key populated by the caller.
 */
async function analyzeQRImage(buffer) {
  const payloads = await decodeQRCodes(buffer);

  if (payloads.length === 0) {
    return { found: false, codes: [] };
  }

  const codes = payloads.map(text => ({
    raw: text,
    content_type: classifyPayload(text),
    url_analysis: null, // filled in by the route after calling scanURL
  }));

  return { found: true, codes };
}

module.exports = { analyzeQRImage };
