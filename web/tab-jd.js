// ═══════════════════════════════════════════════════════════════════════════
//  TAB — JD Parsing
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel, renderTabHeader } from './utils.js';

function parsedJDCards(record) {
  const raw = record.parsed_job_requirements_raw;
  if (!raw || typeof raw !== 'object') {
    const fallback = record.parsed_job_requirements || '';
    return `<div class="jd-req-view"><div style="font-size:.82rem;color:var(--text-mid);line-height:1.6">${fallback}</div></div>`;
  }

  const cr        = raw.candidate_requirements || {};
  const skills    = raw.skills || {};
  const mustSkills  = skills.must_have_skills  || [];
  const optSkills   = skills.optional_skills   || [];
  const categories  = cr.must_have_categorization || [];
  const degrees     = raw.degree   || [];
  const otherReqs   = cr.other_requirements || [];
  const warnings    = raw.warnings || [];
  const seniority   = cr.seniority_level || '';
  const yoe         = raw.number_of_years_of_work_experience || cr.years_of_experience || '';
  const jobTitle    = raw.job_title || '';

  const chip = (label, cls) => `<span class="jd-chip ${cls}">${esc(label)}</span>`;

  const section = (title, bodyHTML) => `
    <div class="jd-req-section">
      <div class="jd-req-sec-title">${title}</div>
      <div class="jd-req-sec-body">${bodyHTML}</div>
    </div>`;

  let html = '<div class="jd-req-view">';

  // ── Header ────────────────────────────────────────────────────────────────
  html += `
    <div class="jd-req-header">
      <div class="jd-req-title">${esc(jobTitle)}</div>
      <div class="jd-req-badges">
        ${seniority ? chip(`Seniority: ${seniority}`, 'jd-badge-seniority') : ''}
        ${yoe       ? chip(`${esc(yoe)} yrs exp`, 'jd-badge-yoe') : ''}
      </div>
    </div>`;

  // ── Warnings ──────────────────────────────────────────────────────────────
  if (warnings.length) {
    html += `<div class="jd-warnings">⚠ ${warnings.map(w => esc(w)).join(' · ')}</div>`;
  }

  // ── Must-Have Skills ──────────────────────────────────────────────────────
  if (categories.length || mustSkills.length) {
    let body = '';
    if (categories.length) {
      const categorized = new Set(categories.flatMap(c => c.skills || []));
      for (const cat of categories) {
        body += `
          <div class="jd-skill-group">
            <div class="jd-skill-area-label">${esc(cat.key_area)}</div>
            <div class="jd-chips">${(cat.skills || []).map(s => chip(s, 'jd-chip-must')).join('')}</div>
          </div>`;
      }
      const leftover = mustSkills.filter(s => !categorized.has(s));
      if (leftover.length) {
        body += `
          <div class="jd-skill-group">
            <div class="jd-skill-area-label">Other</div>
            <div class="jd-chips">${leftover.map(s => chip(s, 'jd-chip-must')).join('')}</div>
          </div>`;
      }
    } else {
      body = `<div class="jd-chips">${mustSkills.map(s => chip(s, 'jd-chip-must')).join('')}</div>`;
    }
    html += section('Must-Have Skills (BY DOMAIN KNOWLEDGE)', body);
  }

  // ── Optional Skills ───────────────────────────────────────────────────────
  if (optSkills.length) {
    html += section('Optional Skills',
      `<div class="jd-chips">${optSkills.map(s => chip(s, 'jd-chip-optional')).join('')}</div>`
    );
  }

  // ── Other Requirements ────────────────────────────────────────────────────
  if (otherReqs.length) {
    html += section('Other Requirements',
      `<ul class="jd-bullet-list">${otherReqs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
    );
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (degrees.length) {
    html += section('Education',
      `<ul class="jd-bullet-list">${degrees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`
    );
  }

  html += '</div>';
  return html;
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
            <div class="jd-parsed-scroll">${parsedJDCards(d)}</div>
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
