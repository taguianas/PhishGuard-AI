const express = require('express');
const multer = require('multer');
const { analyzeAttachment } = require('../services/attachmentAnalyzer');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTS = ['.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.docm', '.xlsm', '.pptm'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTS.join(', ')}`));
    }
  },
});

router.post('/analyze', optionalAuth, (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a file under the "attachment" field.' });
  }

  try {
    const result = await analyzeAttachment(req.file.buffer, req.file.originalname);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    req.logger?.info({
      event: 'attachment_scan',
      filename: req.file.originalname,
      file_type: result.file_type,
      risk_score: result.risk_score,
      user_id: req.user?.id ?? 'guest',
    });

    return res.json(result);
  } catch (err) {
    req.logger?.error({ event: 'attachment_scan_error', message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error during attachment analysis.' });
  }
});

module.exports = router;
