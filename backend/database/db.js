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

// --- URL scans ---
const insertUrlScan = db.prepare(`
  INSERT INTO url_scans (url, risk_score, classification, reasons, threat_intel, domain_age, safe_browsing, ml_prediction)
  VALUES (@url, @risk_score, @classification, @reasons, @threat_intel, @domain_age, @safe_browsing, @ml_prediction)
`);

const getUrlHistory = db.prepare(`
  SELECT id, url, risk_score, classification, reasons, created_at
  FROM url_scans ORDER BY created_at DESC LIMIT ?
`);

// --- Email scans ---
const insertEmailScan = db.prepare(`
  INSERT INTO email_scans (sender_domain, risk_score, classification, reasons, urls_found, llm_verdict)
  VALUES (@sender_domain, @risk_score, @classification, @reasons, @urls_found, @llm_verdict)
`);

const getEmailHistory = db.prepare(`
  SELECT id, sender_domain, risk_score, classification, reasons, created_at
  FROM email_scans ORDER BY created_at DESC LIMIT ?
`);

// --- Dashboard stats ---
const getStats = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM url_scans)  +
    (SELECT COUNT(*) FROM email_scans) AS total_scans,
    (SELECT COUNT(*) FROM url_scans  WHERE classification = 'High Risk') +
    (SELECT COUNT(*) FROM email_scans WHERE classification = 'High Risk') AS high_risk_count,
    (SELECT COUNT(DISTINCT url) FROM url_scans WHERE classification != 'Low Risk') AS flagged_urls
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
    });
  },

  getHistory(limit = 20) {
    const urls   = getUrlHistory.all(limit).map(r => ({
      ...r, type: 'url', reasons: JSON.parse(r.reasons),
    }));
    const emails = getEmailHistory.all(limit).map(r => ({
      ...r, type: 'email', reasons: JSON.parse(r.reasons),
    }));
    return [...urls, ...emails]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  getStats() {
    return getStats.get();
  },
};
