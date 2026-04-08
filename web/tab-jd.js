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
  const stage1Val = getScore('stage1.label_accuracy');

  return `
    <div class="two-col">
      <div class="col-source">
        <div class="card">
          <div class="card-title">Raw Job Description</div>
          <textarea class="source-text" readonly>${esc(d.job_context || '')}</textarea>
        </div>
        <div class="card">
          <div class="card-title">AI Parsed Output</div>
          <div class="parsed-box">${parsedJDHTML(d)}</div>
        </div>
      </div>

      <div class="col-scores">
        <div class="card">
          <div class="card-title">Stage 1 — Document Classification</div>
          <div class="binary-check">
            <label>Was the correct document identified?</label>
            <div class="binary-buttons" data-ann-key="stage1.label_accuracy">
              <button class="binary-btn ${stage1Val === 'CORRECT' ? 'selected correct' : ''}" data-value="CORRECT">✓ Correct</button>
              <button class="binary-btn ${stage1Val === 'FAIL'    ? 'selected fail'    : ''}" data-value="FAIL">✗ Fail</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Stage 2 — JD Parsing</div>
          ${rubricPanel('JD_FIDELITY',     'stage2.fidelity')}
          ${rubricPanel('JD_COMPLETENESS', 'stage2.completeness')}
        </div>
      </div>
    </div>`;
}
