const express = require('express');
const multer = require('multer');
const { analyzeQRImage } = require('../services/qrAnalyzer');
const { scanURL } = require('../services/urlScanService');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.tif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported format. Allowed: ${ALLOWED_EXTS.join(', ')}`));
  },
});

router.post('/analyze', optionalAuth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Send a file under the "image" field.' });
  }

  try {
    const qrResult = await analyzeQRImage(req.file.buffer);

    if (!qrResult.found) {
      return res.json({
        found: false,
        filename: req.file.originalname,
        codes: [],
        message: 'No QR code detected in this image.',
      });
    }

    // For every URL payload run the full threat-intel scan in parallel
    await Promise.all(
      qrResult.codes.map(async (code) => {
        if (code.content_type === 'url') {
          try {
            code.url_analysis = await scanURL(code.raw);
          } catch {
            code.url_analysis = { error: 'URL analysis failed' };
          }
        }
      })
    );

    req.logger?.info({
      event: 'qr_scan',
      filename: req.file.originalname,
      codes_found: qrResult.codes.length,
      user_id: req.user?.id ?? 'guest',
    });

    return res.json({
      found: true,
      filename: req.file.originalname,
      codes: qrResult.codes,
    });
  } catch (err) {
    req.logger?.error({ event: 'qr_scan_error', message: err.message, stack: err.stack });
    return res.status(500).json({ error: err.message || 'Internal server error during QR analysis.' });
  }
});

module.exports = router;
