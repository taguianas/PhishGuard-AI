const express = require('express');
const { body, validationResult } = require('express-validator');
const { analyzeEmail } = require('../services/emailAnalyzer');
const { classifyEmailWithLLM } = require('../services/llmEmailAnalyzer');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/analyze',
  requireAuth,
  [
    body('email_text')
      .trim()
      .notEmpty()
      .withMessage('Email content is required')
      .isLength({ max: 50000 })
      .withMessage('Email content too large (max 50,000 chars)'),
    body('sender_domain')
      .optional()
      .trim()
      .isFQDN()
      .withMessage('sender_domain must be a valid domain'),
  ],
  async (req, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email_text, sender_domain = '' } = req.body;
    req.logger?.info({ event: 'email_scan', sender_domain });

    // Run heuristics + LLM in parallel
    const [heuristics, llm_verdict] = await Promise.all([
      Promise.resolve(analyzeEmail(email_text, sender_domain)),
      classifyEmailWithLLM(email_text, sender_domain).catch((e) => {
        console.error('[email route] LLM error:', e.message);
        return null;
      }),
    ]);

    // Boost score if LLM says phishing with high confidence
    let { risk_score, classification, reasons } = heuristics;
    if (llm_verdict?.verdict === 'Phishing' && llm_verdict.confidence >= 70) {
      risk_score = Math.min(100, risk_score + 15);
      reasons = [...reasons, `AI verdict: ${llm_verdict.summary}`];
    } else if (llm_verdict?.verdict === 'Suspicious' && llm_verdict.confidence >= 70) {
      risk_score = Math.min(100, risk_score + 8);
      reasons = [...reasons, `AI flagged as suspicious: ${llm_verdict.summary}`];
    }

    classification =
      risk_score >= 70 ? 'High Risk' :
      risk_score >= 35 ? 'Medium Risk' :
      'Low Risk';

    const result = {
      risk_score,
      classification,
      reasons,
      urls: heuristics.urls,
      sender_domain,
      llm_verdict,
    };

    db.saveEmailScan({ ...result, user_id: req.user.id });

    return res.json(result);
    } catch (err) {
      req.logger?.error({ event: 'email_scan_error', message: err.message, stack: err.stack });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
