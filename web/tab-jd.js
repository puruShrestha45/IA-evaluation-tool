// ═══════════════════════════════════════════════════════════════════════════
//  TAB — JD Parsing
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel } from './utils.js';

function parsedJDHTML(record) {
  const raw = record.parsed_job_requirements_raw || {};
  if (raw.html_response) return raw.html_response;
  if (record.parsed_job_requirements) return record.parsed_job_requirements;
  return `<pre style="font-size:.78rem;white-space:pre-wrap">${esc(JSON.stringify(raw, null, 2))}</pre>`;
}

export function renderJDTab() {
  const d = state.data;
  const stage1Val = getScore('doc_classification.label_accuracy');

  return `
    <div class="jd-tab">

      <!-- Row 1: Scoring panels -->
      <div class="jd-scores-row">
        <div class="rubric-panel primary">
          <details>
            <summary class="rubric-summary" style="cursor:default">
              <span class="rubric-summary-left">
                <span>🛡️</span> Stage 1 — Doc Classification
              </span>
              <span class="rubric-chevron">▼</span>
            </summary>
            <div style="padding: .75rem 1rem; font-size: .82rem; color: var(--text-mid); line-height: 1.4;">
              Verification of the uploaded document type and session integrity.
            </div>
          </details>
          <div class="score-row">
            <span class="score-row-label">Correct document?</span>
            <div class="binary-buttons" data-ann-key="doc_classification.label_accuracy" style="gap:.4rem">
              <button class="binary-btn ${stage1Val === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">✓ Yes</button>
              <button class="binary-btn ${stage1Val === 'FAIL'    ? 'selected fail'    : ''}" data-value="FAIL">✗ No</button>
            </div>
          </div>
        </div>
        ${rubricPanel('JD_FIDELITY',     'jd_parsing.fidelity')}
        ${rubricPanel('JD_COMPLETENESS', 'jd_parsing.completeness')}
      </div>

      <!-- Row 2: Content side-by-side -->
      <div class="jd-content-grid">
        <div class="jd-panel">
          <div class="jd-panel-header">Raw Job Description</div>
          <textarea class="jd-textarea" readonly>${esc(d.job_context || '')}</textarea>
        </div>
        <div class="jd-panel">
          <div class="jd-panel-header">AI Parsed Output</div>
          <div class="jd-parsed-scroll">${parsedJDHTML(d)}</div>
        </div>
      </div>

    </div>`;
}
