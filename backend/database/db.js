/**
 * SQLite database — single file, no server required.
 * Tables: url_scans, email_scans
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'phishguard.db');

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS url_scans (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    url           TEXT NOT NULL,
    risk_score    INTEGER NOT NULL,
    classification TEXT NOT NULL,
    reasons       TEXT NOT NULL,
    threat_intel  TEXT,
    domain_age    TEXT,
    safe_browsing TEXT,
    ml_prediction TEXT,
    created_at    DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_scans (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_domain TEXT,
    risk_score    INTEGER NOT NULL,
    classification TEXT NOT NULL,
    reasons       TEXT NOT NULL,
    urls_found    TEXT,
    llm_verdict   TEXT,
    created_at    DATETIME DEFAULT (datetime('now'))
  );
`);

// Add user_id column to existing tables (safe to run every startup)
['url_scans', 'email_scans'].forEach(table => {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`); } catch (_) {}
});

// Create indexes after columns are guaranteed to exist
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_url_scans_user_id   ON url_scans(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_scans_user_id ON email_scans(user_id);
`);

// --- URL scans ---
const insertUrlScan = db.prepare(`
  INSERT INTO url_scans (url, risk_score, classification, reasons, threat_intel, domain_age, safe_browsing, ml_prediction, user_id)
  VALUES (@url, @risk_score, @classification, @reasons, @threat_intel, @domain_age, @safe_browsing, @ml_prediction, @user_id)
`);

const getUrlHistory = db.prepare(`
  SELECT id, url, risk_score, classification, reasons, created_at
  FROM url_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
`);

// --- Email scans ---
const insertEmailScan = db.prepare(`
  INSERT INTO email_scans (sender_domain, risk_score, classification, reasons, urls_found, llm_verdict, user_id)
  VALUES (@sender_domain, @risk_score, @classification, @reasons, @urls_found, @llm_verdict, @user_id)
`);

const getEmailHistory = db.prepare(`
  SELECT id, sender_domain, risk_score, classification, reasons, created_at
  FROM email_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
`);

// --- Dashboard stats (per user) ---
const getStatsStmt = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM url_scans  WHERE user_id = ?) +
    (SELECT COUNT(*) FROM email_scans WHERE user_id = ?) AS total_scans,
    (SELECT COUNT(*) FROM url_scans  WHERE classification = 'High Risk' AND user_id = ?) +
    (SELECT COUNT(*) FROM email_scans WHERE classification = 'High Risk' AND user_id = ?) AS high_risk_count,
    (SELECT COUNT(DISTINCT url) FROM url_scans WHERE classification != 'Low Risk' AND user_id = ?) AS flagged_urls
`);

module.exports = {
  saveUrlScan(data) {
    return insertUrlScan.run({
      url:           data.url,
      risk_score:    data.risk_score,
      classification: data.classification,
      reasons:       JSON.stringify(data.reasons),
      threat_intel:  JSON.stringify(data.threat_intel),
      domain_age:    JSON.stringify(data.domain_age),
      safe_browsing: JSON.stringify(data.safe_browsing),
      ml_prediction: JSON.stringify(data.ml_prediction),
      user_id:       data.user_id || null,
    });
  },

  saveEmailScan(data) {
    return insertEmailScan.run({
      sender_domain:  data.sender_domain || null,
      risk_score:     data.risk_score,
      classification: data.classification,
      reasons:        JSON.stringify(data.reasons),
      urls_found:     JSON.stringify(data.urls),
      llm_verdict:    data.llm_verdict ? JSON.stringify(data.llm_verdict) : null,
      user_id:        data.user_id || null,
    });
  },

  getHistory(userId, limit = 20) {
    const urls   = getUrlHistory.all(userId, limit).map(r => ({
      ...r, type: 'url', reasons: JSON.parse(r.reasons),
    }));
    const emails = getEmailHistory.all(userId, limit).map(r => ({
      ...r, type: 'email', reasons: JSON.parse(r.reasons),
    }));
    return [...urls, ...emails]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  getStats(userId) {
    return getStatsStmt.get(userId, userId, userId, userId, userId);
  },
};
