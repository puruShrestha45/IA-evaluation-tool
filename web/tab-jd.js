// ═══════════════════════════════════════════════════════════════════════════
//  TAB — JD Parsing
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, getScore, rubricPanel, renderTabHeader, feedbackBox } from './utils.js';

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
  const domains     = raw.domain   || [];
  const otherReqs   = cr.other_requirements || [];
  const warnings    = raw.warnings || [];
  const seniority   = cr.seniority_level || '';
  const yoe         = raw.number_of_years_of_work_experience || cr.years_of_experience || '';
  const jobTitle    = raw.job_title || '';

  const chip      = (label, cls) => `<span class="jd-chip ${cls}">${esc(label)}</span>`;
  const naChip    = label => `<span class="resume-na-inline">${esc(label)}: Not Found</span>`;
  const arrayOrNA = (arr, fn) =>
    (arr && arr.length) ? fn(arr) : '<span class="resume-na">Not Found</span>';

  const section = (title, bodyHTML) => `
    <div class="jd-req-section">
      <div class="jd-req-sec-title">${title}</div>
      <div class="jd-req-sec-body">${bodyHTML}</div>
    </div>`;

  let html = '<div class="jd-req-view">';

  // ── Header ────────────────────────────────────────────────────────────────
  html += `
    <div class="jd-req-header">
      <div class="jd-req-title">${esc(jobTitle || 'Not Found')}</div>
      <div class="jd-req-badges">
        ${seniority ? chip(`Seniority: ${seniority}`, 'jd-badge-seniority') : naChip('Seniority')}
        ${yoe       ? chip(`Years of Experience: ${esc(yoe)}`, 'jd-badge-yoe') : naChip('Years of Experience')}
      </div>
    </div>`;

  // ── Warnings ──────────────────────────────────────────────────────────────
  if (warnings.length) {
    html += `<div class="jd-warnings">⚠ ${warnings.map(w => esc(w)).join(' · ')}</div>`;
  }

  // ── Must-Have Skills ──────────────────────────────────────────────────────
  {
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
    } else if (mustSkills.length) {
      body = `<div class="jd-chips">${mustSkills.map(s => chip(s, 'jd-chip-must')).join('')}</div>`;
    } else {
      body = '<span class="resume-na">Not Found</span>';
    }
    html += section('Must-Have Skills (BY DOMAIN KNOWLEDGE)', body);
  }

  // ── Optional Skills ───────────────────────────────────────────────────────
  html += section('Optional Skills',
    arrayOrNA(optSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'jd-chip-optional')).join('')}</div>`)
  );

  // ── Knowledge Areas ───────────────────────────────────────────────────────
  html += section('Knowledge Areas',
    arrayOrNA(domains, arr =>
      `<div class="jd-chips">${arr.map(d => chip(d, 'resume-chip-soft')).join('')}</div>`)
  );

  // ── Other Requirements ────────────────────────────────────────────────────
  html += section('Other Requirements',
    arrayOrNA(otherReqs, arr =>
      `<ul class="jd-bullet-list">${arr.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`)
  );

  // ── Education ─────────────────────────────────────────────────────────────
  html += section('Education',
    arrayOrNA(degrees, arr =>
      `<ul class="jd-bullet-list">${arr.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`)
  );

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
          ${feedbackBox('feedback.jd')}
        </div>

      </div>
    </div>`;
}
