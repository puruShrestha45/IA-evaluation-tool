// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Resume
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, renderTabHeader } from './utils.js';

// Returns empty string for NA sentinel values (used for conditional logic)
const na = v => (!v || v === 'NA' || v === 'N/A') ? '' : v;
// Returns 'N/A' string for display when value is missing/NA
const naText = v => na(v) || 'N/A';
// Returns 'N/A' for empty arrays, otherwise renders via fn
const arrayOrNA = (arr, fn) =>
  (arr && arr.length) ? fn(arr) : '<span class="resume-na">N/A</span>';

function parsedResumeCards(p) {
  if (!p || !Object.keys(p).length) return '<p class="muted">No parsed data available.</p>';

  const chip    = (label, cls) => `<span class="jd-chip ${cls}">${esc(label)}</span>`;
  const naChip  = label => `<span class="resume-na-inline">${esc(label)}: N/A</span>`;
  const section = (title, bodyHTML) => `
    <div class="jd-req-section">
      <div class="jd-req-sec-title">${title}</div>
      <div class="jd-req-sec-body">${bodyHTML}</div>
    </div>`;

  let html = '<div class="jd-req-view">';

  // ── Header ────────────────────────────────────────────────────────────────
  const location = [na(p.candidateAddress), na(p.region)].filter(Boolean).join(' · ');

  const contactItems = [
    p.email?.length
      ? `<span class="resume-contact-item">✉ ${esc(p.email[0])}</span>`
      : `<span class="resume-contact-item resume-contact-na">✉ Email: N/A</span>`,
    p.phoneNo?.length
      ? `<span class="resume-contact-item">📞 ${esc(p.phoneNo[0])}</span>`
      : `<span class="resume-contact-item resume-contact-na">📞 Phone: N/A</span>`,
    na(p.linkedinUrl)
      ? `<a href="${esc(p.linkedinUrl)}" target="_blank" class="resume-contact-item resume-contact-link">🔗 LinkedIn</a>`
      : `<span class="resume-contact-item resume-contact-na">🔗 LinkedIn: N/A</span>`,
    na(p.githubUrl)
      ? `<a href="${esc(p.githubUrl)}" target="_blank" class="resume-contact-item resume-contact-link">🔗 GitHub</a>`
      : `<span class="resume-contact-item resume-contact-na">🔗 GitHub: N/A</span>`,
  ];

  html += `
    <div class="jd-req-header">
      <div class="jd-req-title">${esc(p.candidateName || 'Unknown')}</div>
      <div class="jd-req-badges">
        ${p.candidateRole
          ? chip(`Role: ${p.candidateRole}`, 'jd-badge-seniority')
          : naChip('Role')}
        ${location
          ? `<span class="jd-chip resume-chip-location">📍 ${esc(location)}</span>`
          : naChip('Location')}
      </div>
      <div class="resume-contact-row">${contactItems.join('')}</div>
    </div>`;

  // ── Education ─────────────────────────────────────────────────────────────
  html += section('Education',
    arrayOrNA(p.degree, arr =>
      `<ul class="jd-bullet-list">${arr.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`)
  );

  // ── Technical Skills ──────────────────────────────────────────────────────
  html += section('Technical Skills',
    arrayOrNA(p.technicalSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'jd-chip-must')).join('')}</div>`)
  );

  // ── Soft Skills ───────────────────────────────────────────────────────────
  html += section('Soft Skills',
    arrayOrNA(p.softSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'resume-chip-soft')).join('')}</div>`)
  );

  // ── Work Experience ───────────────────────────────────────────────────────
  if (p.workExperience?.length) {
    let expHTML = '<div class="resume-exp-list">';
    for (const exp of p.workExperience) {
      const seniority = na(exp.seniority);
      const duration  = na(exp.duration);
      const domain    = na(exp.domain);
      const startDate = na(exp.startDate);
      const endDate   = na(exp.endDate);
      const dateStr   = startDate || endDate
        ? `${startDate || 'N/A'} – ${endDate || 'N/A'}`
        : null;

      expHTML += `
        <div class="resume-exp-card">
          <div class="resume-exp-header">
            <div class="resume-exp-header-left">
              <div class="resume-exp-company">${esc(exp.company || 'N/A')}</div>
              <div class="jd-req-badges" style="margin-top:.3rem">
                ${exp.role  ? chip(`Role: ${exp.role}`, 'jd-badge-seniority') : naChip('Role')}
                ${seniority ? chip(`Seniority: ${seniority}`, 'jd-badge-yoe')  : naChip('Seniority')}
                ${domain    ? chip(`Domain: ${domain}`,    'jd-chip-domain') : naChip('Domain')}
              </div>
            </div>
            <div class="resume-exp-meta">
              <span class="resume-exp-dates">${esc(dateStr || 'Dates: N/A')}</span>
              <span class="resume-exp-duration">${esc(duration || 'Duration: N/A')}</span>
            </div>
          </div>
          ${exp.responsibilities?.length
            ? `<ul class="jd-bullet-list resume-exp-resps">${exp.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
            : '<p class="resume-na" style="margin:.5rem 0">Responsibilities: N/A</p>'}
          <div class="resume-exp-tech">
            <div class="jd-skill-area-label">Technologies</div>
            ${arrayOrNA(exp.technologyUsed, arr =>
              `<div class="jd-chips">${arr.map(t => chip(t, 'jd-chip-optional')).join('')}</div>`)}
          </div>
        </div>`;
    }
    expHTML += '</div>';
    html += section('Work Experience', expHTML);
  } else {
    html += section('Work Experience', '<span class="resume-na">N/A</span>');
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (p.projects?.length) {
    let projHTML = '<div class="resume-exp-list">';
    for (const proj of p.projects) {
      const techs = proj.technologyUsed || proj.technologies || [];
      projHTML += `
        <div class="resume-exp-card">
          <div class="resume-exp-company">${esc(proj.title || proj.name || 'Untitled Project')}</div>
          ${proj.description ? `<p style="font-size:.85rem;color:var(--text-mid);margin:.5rem 0">${esc(proj.description)}</p>` : ''}
          ${proj.responsibilities?.length
            ? `<ul class="jd-bullet-list resume-exp-resps">${proj.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
            : ''}
          ${techs.length ? `
            <div class="resume-exp-tech">
              <div class="jd-skill-area-label">Technologies</div>
              <div class="jd-chips">${techs.map(t => chip(t, 'jd-chip-optional')).join('')}</div>
            </div>` : ''}
        </div>`;
    }
    projHTML += '</div>';
    html += section('Projects', projHTML);
  } else {
    html += section('Projects', '<span class="resume-na">N/A</span>');
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (p.certifications?.length) {
    let certHTML = '<div class="resume-cert-list">';
    for (const cert of p.certifications) {
      certHTML += `
        <div class="resume-cert-card">
          <div class="resume-cert-title">${esc(cert.certificateTitle || 'N/A')}</div>
          ${(cert.certificateDetails || []).map(d => `<p class="resume-cert-detail">${esc(d)}</p>`).join('')}
        </div>`;
    }
    certHTML += '</div>';
    html += section('Certifications', certHTML);
  } else {
    html += section('Certifications', '<span class="resume-na">N/A</span>');
  }

  // ── Listed Skills ─────────────────────────────────────────────────────────
  html += section('Listed Skills',
    arrayOrNA(p.listedSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'jd-chip-optional')).join('')}</div>`)
  );

  // ── Skills from Work Experience ───────────────────────────────────────────
  html += section('Skills from Work Experience',
    arrayOrNA(p.workExperienceSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'jd-chip-must')).join('')}</div>`)
  );

  // ── Skills from Projects ──────────────────────────────────────────────────
  html += section('Skills from Projects',
    arrayOrNA(p.projectsSkills, arr =>
      `<div class="jd-chips">${arr.map(s => chip(s, 'jd-chip-optional')).join('')}</div>`)
  );

  // ── All Roles ─────────────────────────────────────────────────────────────
  html += section('All Roles Identified',
    arrayOrNA(p.roles, arr =>
      `<div class="jd-chips">${arr.map(r => chip(r, 'jd-badge-seniority')).join('')}</div>`)
  );

  // ── Industry Domains ──────────────────────────────────────────────────────
  html += section('Industry Domains',
    arrayOrNA(p.domains, arr =>
      `<div class="jd-chips">${arr.map(d => chip(d, 'jd-chip-domain')).join('')}</div>`)
  );

  html += '</div>';
  return html;
}

export function renderResumeTab() {
  const d = state.data;
  return `
    <div class="resume-tab">
      <div class="tab-main-layout">

        <!-- Left: Main Content -->
        <div class="jd-panel-column">
          <div class="tab-header-label">
            <span class="icon">&lt;/&gt;</span>
            WHAT THE SYSTEM PRODUCED
          </div>
          <div class="jd-panel">
            <div class="jd-panel-header">
              <span>AI Parsed Resume</span>
              ${d.pdf_url
      ? `<a href="${d.pdf_url}" target="_blank" class="download-btn-inline">
                     <span>📄</span> Download Original Resume
                   </a>`
      : '<span class="muted" style="font-size:0.7rem">PDF Unavailable</span>'
    }
            </div>
            <div class="jd-parsed-scroll">
              ${parsedResumeCards(d.parsed_data)}
            </div>
          </div>
        </div>

        <!-- Right: Vertical Sidebar for Evaluations -->
        <div class="scores-column">
          ${renderTabHeader('YOUR EVALUATION', '🔍', 'resume')}
          <div class="tab-side-scores">
            ${rubricPanel('RESUME_CHRONOLOGY', 'resume_parsing.chronological_fidelity')}
            ${rubricPanel('RESUME_CONTAINS', 'resume_parsing.informative_extraction')}
            ${rubricPanel('RESUME_IDENTITY', 'resume_parsing.identity_accuracy')}
            ${rubricPanel('RESUME_COMPLETENESS', 'resume_parsing.completeness')}
          </div>
        </div>

      </div>
    </div>`;
}
