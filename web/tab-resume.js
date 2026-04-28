// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Resume
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, renderTabHeader, feedbackBox } from './utils.js';

// Returns empty string for NA sentinel values (used for conditional logic)
const na = v => (!v || v === 'NA' || v === 'N/A' || v === 'Not Found') ? '' : v;
// Returns 'Not Found' string for display when value is missing/NA
const naText = v => na(v) || 'Not Found';
// Returns 'Not Found' for empty arrays, otherwise renders via fn
const arrayOrNA = (arr, fn) =>
  (arr && arr.length) ? fn(arr) : '<span class="resume-na">Not Found</span>';

function parsedResumeCards(p) {
  if (!p || !Object.keys(p).length) return '<p class="muted">No parsed data available.</p>';

  const chip    = (label, cls) => `<span class="jd-chip ${cls}">${esc(label)}</span>`;
  const naChip  = label => `<span class="resume-na-inline">${esc(label)}: Not Found</span>`;
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
      : `<span class="resume-contact-item resume-contact-na">✉ Email: Not Found</span>`,
    p.phoneNo?.length
      ? `<span class="resume-contact-item">📞 ${esc(p.phoneNo[0])}</span>`
      : `<span class="resume-contact-item resume-contact-na">📞 Phone: Not Found</span>`,
    na(p.linkedinUrl)
      ? `<a href="${esc(p.linkedinUrl)}" target="_blank" class="resume-contact-item resume-contact-link">🔗 LinkedIn</a>`
      : `<span class="resume-contact-item resume-contact-na">🔗 LinkedIn: Not Found</span>`,
    na(p.githubUrl)
      ? `<a href="${esc(p.githubUrl)}" target="_blank" class="resume-contact-item resume-contact-link">🔗 GitHub</a>`
      : `<span class="resume-contact-item resume-contact-na">🔗 GitHub: Not Found</span>`,
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
      const industry  = na(exp.domain);
      const startDate = na(exp.startDate);
      const endDate   = na(exp.endDate);
      const dateStr   = startDate || endDate
        ? `${startDate || 'Not Found'} – ${endDate || 'Not Found'}`
        : null;

      expHTML += `
        <div class="resume-exp-card">
          <div class="resume-exp-header">
            <div class="resume-exp-header-left">
              <div class="resume-exp-company">${esc(exp.company || 'Not Found')}</div>
              <div class="jd-req-badges" style="margin-top:.3rem">
                ${exp.role  ? chip(`Role: ${exp.role}`, 'jd-badge-seniority') : naChip('Role')}
                ${seniority ? chip(`Seniority: ${seniority}`, 'jd-badge-yoe') : naChip('Seniority')}
                ${industry  ? chip(`Industry: ${industry}`, 'jd-chip-domain') : naChip('Industry')}
              </div>
            </div>
            <div class="resume-exp-meta">
              <span class="resume-exp-dates">${esc(dateStr || 'Dates: Not Found')}</span>
              <span class="resume-exp-duration">${esc(duration || 'Duration: Not Found')}</span>
            </div>
          </div>
          ${exp.responsibilities?.length
            ? `<ul class="jd-bullet-list resume-exp-resps">${exp.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
            : '<p class="resume-na" style="margin:.5rem 0">Responsibilities: Not Found</p>'}
          <div class="resume-exp-tech">
            <div class="jd-skill-area-label">Identified Skills</div>
            ${arrayOrNA(exp.technologyUsed, arr =>
              `<div class="jd-chips">${arr.map(t => chip(t, 'jd-chip-optional')).join('')}</div>`)}
          </div>
        </div>`;
    }
    expHTML += '</div>';
    html += section('Work Experience', expHTML);
  } else {
    html += section('Work Experience', '<span class="resume-na">Not Found</span>');
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
          <div class="resume-exp-tech">
            <div class="jd-skill-area-label">Identified Skills</div>
            ${arrayOrNA(techs, arr =>
              `<div class="jd-chips">${arr.map(t => chip(t, 'jd-chip-optional')).join('')}</div>`)}
          </div>
        </div>`;
    }
    projHTML += '</div>';
    html += section('Projects', projHTML);
  } else {
    html += section('Projects', '<span class="resume-na">Not Found</span>');
  }

  // ── Education & Certifications ────────────────────────────────────────────
  const eduHTML = p.degree?.length
    ? `<ul class="jd-bullet-list">${p.degree.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`
    : '<span class="resume-na">Not Found</span>';

  let certHTML = '';
  if (p.certifications?.length) {
    certHTML = '<div class="resume-cert-list">';
    for (const cert of p.certifications) {
      certHTML += `
        <div class="resume-cert-card">
          <div class="resume-cert-title">${esc(cert.certificateTitle || 'Not Found')}</div>
          ${(cert.certificateDetails || []).map(d => `<p class="resume-cert-detail">${esc(d)}</p>`).join('')}
        </div>`;
    }
    certHTML += '</div>';
  } else {
    certHTML = '<span class="resume-na">Not Found</span>';
  }

  html += section('Education & Certifications', `
    ${eduHTML}
    <hr class="resume-section-divider">
    <div class="jd-skill-area-label" style="margin-bottom:.5rem">Certifications</div>
    ${certHTML}
  `);

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
            ${rubricPanel('RESUME_PROFILE',          'resume_parsing.profile')}
            ${rubricPanel('RESUME_POSITIONS',         'resume_parsing.positions')}
            ${rubricPanel('RESUME_RESPONSIBILITIES',  'resume_parsing.responsibilities')}
            ${rubricPanel('RESUME_SKILLS',            'resume_parsing.skills')}
            ${rubricPanel('RESUME_CREDENTIALS',       'resume_parsing.credentials')}
          </div>
          ${feedbackBox('feedback.resume')}
        </div>

      </div>
    </div>`;
}
