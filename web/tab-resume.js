// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Resume
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, renderTabHeader } from './utils.js';

const na = v => (!v || v === 'NA' || v === 'N/A') ? '' : v;

function parsedResumeCards(p) {
  if (!p || !Object.keys(p).length) return '<p class="muted">No parsed data available.</p>';

  const chip = (label, cls) => `<span class="jd-chip ${cls}">${esc(label)}</span>`;
  const section = (title, bodyHTML) => `
    <div class="jd-req-section">
      <div class="jd-req-sec-title">${title}</div>
      <div class="jd-req-sec-body">${bodyHTML}</div>
    </div>`;

  let html = '<div class="jd-req-view">';

  // ── Header ────────────────────────────────────────────────────────────────
  const location = [na(p.candidateAddress), na(p.region)].filter(Boolean).join(' · ');
  const contactItems = [
    ...(p.email?.length          ? [`<span class="resume-contact-item">✉ ${esc(p.email[0])}</span>`] : []),
    ...(p.phoneNo?.length        ? [`<span class="resume-contact-item">📞 ${esc(p.phoneNo[0])}</span>`] : []),
    ...(na(p.linkedinUrl)        ? [`<a href="${esc(p.linkedinUrl)}" target="_blank" class="resume-contact-item resume-contact-link">🔗 LinkedIn</a>`] : []),
    ...(na(p.githubUrl)          ? [`<a href="${esc(p.githubUrl)}"  target="_blank" class="resume-contact-item resume-contact-link">🔗 GitHub</a>`] : []),
  ];

  html += `
    <div class="jd-req-header">
      <div class="jd-req-title">${esc(p.candidateName || 'Unknown')}</div>
      <div class="jd-req-badges">
        ${p.candidateRole ? chip(p.candidateRole, 'jd-badge-seniority') : ''}
        ${location        ? `<span class="jd-chip resume-chip-location">📍 ${esc(location)}</span>` : ''}
      </div>
      ${contactItems.length ? `<div class="resume-contact-row">${contactItems.join('')}</div>` : ''}
    </div>`;

  // ── Education ─────────────────────────────────────────────────────────────
  if (p.degree?.length) {
    html += section('Education',
      `<ul class="jd-bullet-list">${p.degree.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`
    );
  }

  // ── Technical Skills ──────────────────────────────────────────────────────
  if (p.technicalSkills?.length) {
    html += section('Technical Skills',
      `<div class="jd-chips">${p.technicalSkills.map(s => chip(s, 'jd-chip-must')).join('')}</div>`
    );
  }

  // ── Soft Skills ───────────────────────────────────────────────────────────
  if (p.softSkills?.length) {
    html += section('Soft Skills',
      `<div class="jd-chips">${p.softSkills.map(s => chip(s, 'resume-chip-soft')).join('')}</div>`
    );
  }

  // ── Work Experience ───────────────────────────────────────────────────────
  if (p.workExperience?.length) {
    let expHTML = '<div class="resume-exp-list">';
    for (const exp of p.workExperience) {
      const seniority = na(exp.seniority);
      const duration  = na(exp.duration);
      const domain    = na(exp.domain);
      const dateStr   = [na(exp.startDate), na(exp.endDate)].filter(Boolean).join(' – ');
      const resps     = exp.responsibilities || [];
      const techs     = exp.technologyUsed   || [];

      expHTML += `
        <div class="resume-exp-card">
          <div class="resume-exp-header">
            <div class="resume-exp-header-left">
              <div class="resume-exp-company">${esc(exp.company || '')}</div>
              <div class="jd-req-badges" style="margin-top:.3rem">
                ${exp.role  ? chip(exp.role,  'jd-badge-seniority') : ''}
                ${seniority ? chip(seniority, 'jd-badge-yoe')       : ''}
                ${domain    ? chip(domain,    'jd-chip-domain')      : ''}
              </div>
            </div>
            <div class="resume-exp-meta">
              ${dateStr  ? `<span class="resume-exp-dates">${esc(dateStr)}</span>`    : ''}
              ${duration ? `<span class="resume-exp-duration">${esc(duration)}</span>` : ''}
            </div>
          </div>
          ${resps.length ? `<ul class="jd-bullet-list resume-exp-resps">${resps.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
          ${techs.length ? `
            <div class="resume-exp-tech">
              <div class="jd-skill-area-label">Technologies</div>
              <div class="jd-chips">${techs.map(t => chip(t, 'jd-chip-optional')).join('')}</div>
            </div>` : ''}
        </div>`;
    }
    expHTML += '</div>';
    html += section('Work Experience', expHTML);
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (p.certifications?.length) {
    let certHTML = '<div class="resume-cert-list">';
    for (const cert of p.certifications) {
      certHTML += `
        <div class="resume-cert-card">
          <div class="resume-cert-title">${esc(cert.certificateTitle || '')}</div>
          ${(cert.certificateDetails || []).map(d => `<p class="resume-cert-detail">${esc(d)}</p>`).join('')}
        </div>`;
    }
    certHTML += '</div>';
    html += section('Certifications', certHTML);
  }

  // ── Listed Skills ─────────────────────────────────────────────────────────
  if (p.listedSkills?.length) {
    html += section('Listed Skills',
      `<div class="jd-chips">${p.listedSkills.map(s => chip(s, 'jd-chip-optional')).join('')}</div>`
    );
  }

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
