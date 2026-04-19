const pdfParse = require('pdf-parse');
const AdmZip = require('adm-zip');

const URL_REGEX = /https?:\/\/[^\s"'<>\])\}|\\]+/gi;

const OFFICE_XML_EXTS = ['.docx', '.xlsx', '.pptx', '.docm', '.xlsm', '.pptm'];
const OFFICE_LEGACY_EXTS = ['.doc', '.xls'];

// ---------- PDF ----------

async function analyzePDF(buffer) {
  const findings = {
    file_type: 'PDF',
    extracted_urls: [],
    has_javascript: false,
    has_auto_action: false,
    has_embedded_files: false,
    has_launch_action: false,
    suspicious_patterns: [],
    raw_text_preview: '',
  };

  try {
    const data = await pdfParse(buffer);
    findings.raw_text_preview = data.text.slice(0, 600).trim();

    const urls = data.text.match(URL_REGEX) || [];
    findings.extracted_urls = [...new Set(urls)];

    // Scan raw bytes for known PDF attack keywords
    const raw = buffer.toString('latin1');

    if (/\/JavaScript\b|\/JS\b/.test(raw)) {
      findings.has_javascript = true;
      findings.suspicious_patterns.push('Embedded JavaScript found in PDF');
    }
    if (/\/OpenAction\b|\/AA\b/.test(raw)) {
      findings.has_auto_action = true;
      findings.suspicious_patterns.push('Auto-execute action (OpenAction/AA) — runs on document open');
    }
    if (/\/EmbeddedFile\b/.test(raw)) {
      findings.has_embedded_files = true;
      findings.suspicious_patterns.push('Embedded file attachment inside PDF');
    }
    if (/\/Launch\b/.test(raw)) {
      findings.has_launch_action = true;
      findings.suspicious_patterns.push('Launch action found — can execute external programs');
    }
    if (/\/SubmitForm\b/.test(raw)) {
      findings.suspicious_patterns.push('Form submission action — may exfiltrate data');
    }
    if (/\/RichMedia\b/.test(raw)) {
      findings.suspicious_patterns.push('Rich media (Flash/video) object embedded');
    }
  } catch (err) {
    findings.suspicious_patterns.push(`PDF parse error: ${err.message}`);
  }

  return findings;
}

// ---------- Office Open XML (docx / xlsx / pptx / *m variants) ----------

function analyzeOfficeXML(buffer, ext) {
  const findings = {
    file_type: ext.replace('.', '').toUpperCase(),
    extracted_urls: [],
    has_macros: false,
    has_embedded_objects: false,
    has_external_relations: false,
    suspicious_patterns: [],
    raw_text_preview: '',
  };

  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      const name = entry.entryName.toLowerCase();

      // VBA macro project
      if (name.endsWith('vbaproject.bin')) {
        findings.has_macros = true;
        findings.suspicious_patterns.push('VBA macro project detected (vbaProject.bin)');
      }

      // Embedded OLE objects
      if (name.includes('/embeddings/') || name.includes('oleobject')) {
        findings.has_embedded_objects = true;
        findings.suspicious_patterns.push('Embedded OLE object found');
      }

      // Parse XML / relationship files
      if (name.endsWith('.xml') || name.endsWith('.rels')) {
        let content;
        try { content = entry.getData().toString('utf8'); } catch { continue; }

        const urls = content.match(URL_REGEX) || [];
        findings.extracted_urls.push(...urls);

        // External relationships in .rels (can phone home or load remote content)
        if (name.endsWith('.rels') && /Target\s*=\s*"https?:/i.test(content)) {
          findings.has_external_relations = true;
          findings.suspicious_patterns.push('External relationship reference in document');
        }

        // Grab a rough text preview from the main content part
        if (!findings.raw_text_preview &&
            (name === 'word/document.xml' || name === 'xl/sharedstrings.xml' || name === 'ppt/slides/slide1.xml')) {
          findings.raw_text_preview = content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 600);
        }
      }
    }

    findings.extracted_urls = [...new Set(findings.extracted_urls)];
  } catch (err) {
    findings.suspicious_patterns.push(`Office XML parse error: ${err.message}`);
  }

  return findings;
}

// ---------- Legacy binary Office (.doc / .xls) ----------

function analyzeLegacyOffice(buffer, ext) {
  const findings = {
    file_type: ext.replace('.', '').toUpperCase(),
    extracted_urls: [],
    has_macros: false,
    suspicious_patterns: [],
    raw_text_preview: '',
    note: 'Legacy binary format — limited static analysis',
  };

  // OLE2 compound document magic bytes
  const OLE_MAGIC = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
  if (!buffer.slice(0, 8).equals(OLE_MAGIC)) {
    findings.suspicious_patterns.push('File header does not match expected OLE2 format');
    return findings;
  }

  const raw = buffer.toString('latin1');

  // Macro / auto-run indicators
  if (/Macro|VBA|Auto_Open|AutoOpen|Document_Open|Workbook_Open|AutoExec/i.test(raw)) {
    findings.has_macros = true;
    findings.suspicious_patterns.push('VBA/macro signature strings found in binary');
  }

  // Shell execution strings
  if (/Shell\b|CreateObject|WScript|PowerShell|cmd\.exe|mshta\.exe|wscript\.exe/i.test(raw)) {
    findings.suspicious_patterns.push('Shell execution strings detected (Shell, WScript, PowerShell…)');
  }

  // URLs embedded as plain strings in the binary
  const urls = raw.match(URL_REGEX) || [];
  findings.extracted_urls = [...new Set(urls)].slice(0, 50);

  return findings;
}

// ---------- Risk scoring ----------

function scoreFindings(findings) {
  let score = 0;
  const reasons = [...findings.suspicious_patterns];

  if (findings.has_macros)           { score += 35; }
  if (findings.has_javascript)       { score += 30; }
  if (findings.has_auto_action)      { score += 25; }
  if (findings.has_launch_action)    { score += 25; }
  if (findings.has_embedded_files)   { score += 20; }
  if (findings.has_embedded_objects) { score += 20; }
  if (findings.has_external_relations) { score += 15; }

  if (findings.extracted_urls.length > 0) {
    score += Math.min(15, findings.extracted_urls.length * 3);
    reasons.push(`${findings.extracted_urls.length} URL(s) extracted from attachment`);
  }

  return { score: Math.min(100, score), reasons: [...new Set(reasons)] };
}

// ---------- Main entry point ----------

async function analyzeAttachment(buffer, filename) {
  const ext = ('.' + filename.split('.').pop()).toLowerCase();

  let findings;

  if (ext === '.pdf') {
    findings = await analyzePDF(buffer);
  } else if (OFFICE_XML_EXTS.includes(ext)) {
    findings = analyzeOfficeXML(buffer, ext);
  } else if (OFFICE_LEGACY_EXTS.includes(ext)) {
    findings = analyzeLegacyOffice(buffer, ext);
  } else {
    return { error: `Unsupported file type: ${ext}` };
  }

  const { score, reasons } = scoreFindings(findings);

  return {
    filename,
    file_type: findings.file_type,
    risk_score: score,
    classification: score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk',
    reasons,
    extracted_urls: findings.extracted_urls,
    has_macros: findings.has_macros ?? false,
    has_javascript: findings.has_javascript ?? false,
    has_auto_action: findings.has_auto_action ?? false,
    has_embedded_files: findings.has_embedded_files ?? false,
    has_embedded_objects: findings.has_embedded_objects ?? false,
    raw_text_preview: findings.raw_text_preview,
    note: findings.note ?? null,
  };
}

module.exports = { analyzeAttachment };
