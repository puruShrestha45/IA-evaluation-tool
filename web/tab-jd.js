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
        <div class="jd-sidebar-card">
          <div class="jd-sidebar-label">Stage 1 — Doc Classification</div>
          <p class="jd-sidebar-q">Was the correct document identified?</p>
          <div class="binary-buttons" data-ann-key="doc_classification.label_accuracy">
            <button class="binary-btn ${stage1Val === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">✓ Correct</button>
            <button class="binary-btn ${stage1Val === 'FAIL'    ? 'selected fail'    : ''}" data-value="FAIL">✗ Fail</button>
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
