// ═══════════════════════════════════════════════════════════════════════════
//  TAB — JD Parsing
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel, renderTabHeader } from './utils.js';

function parsedJDHTML(record) {
  const raw = record.parsed_job_requirements_raw || {};
  if (raw.html_response) return raw.html_response;
  if (record.parsed_job_requirements) return record.parsed_job_requirements;
  return `<pre style="font-size:.78rem;white-space:pre-wrap">${esc(JSON.stringify(raw, null, 2))}</pre>`;
}

export function renderJDTab() {
  const d = state.data;

  return `
    <div class="jd-tab">
      <div class="tab-main-layout">
        
        <!-- Left: Main Content -->
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED
          </div>
          <div class="jd-panel">
            <div class="jd-panel-header">
              <span>AI Parsed Output — Detailed Requirements</span>
              <a href="/api/datasets/${state.idx}/jd-pdf" target="_blank" class="download-btn-inline">
                <span>📄</span> Download Original JD
              </a>
            </div>
            <div class="jd-parsed-scroll">${parsedJDHTML(d)}</div>
          </div>
        </div>

        <!-- Right: Vertical Sidebar for Evaluations -->
        <div class="scores-column">
          ${renderTabHeader('YOUR EVALUATION', '🔍', 'jd')}
          <div class="tab-side-scores">
            ${rubricPanel('JD_MUST_HAVES',   'jd_parsing.must_haves')}
            ${rubricPanel('JD_PRECISION',    'jd_parsing.precision')}
            ${rubricPanel('JD_COMPLETENESS', 'jd_parsing.completeness')}
          </div>
        </div>

      </div>
    </div>`;
}
