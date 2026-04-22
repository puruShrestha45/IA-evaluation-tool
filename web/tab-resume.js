// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Resume
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel, renderTabHeader } from './utils.js';

function parsedResumeHTML(p) {
  if (!p || !Object.keys(p).length) return '<p class="muted">No parsed data available.</p>';
  let h = '';

  h += `<div>
    <div class="resume-name">${esc(p.candidateName || 'Unknown')}</div>
    ${p.candidateRole ? `<div class="resume-role">${esc(p.candidateRole)}</div>` : ''}
    <div class="resume-meta">${[p.region, p.regionFromPhoneNo ? `📞 ${p.regionFromPhoneNo}` : ''].filter(Boolean).join(' · ')}</div>
    ${(p.degree && p.degree.length) ? `<div class="resume-degrees">${p.degree.map(d => `<span class="degree-tag">${esc(d)}</span>`).join('')}</div>` : ''}
  </div>`;

  if (p.workExperience && p.workExperience.length) {
    h += '<div class="resume-section"><h4>Work Experience</h4>';
    for (const exp of p.workExperience) {
      const resps = exp.responsibilities || [];
      const techs = exp.technologyUsed || [];
      h += `<div class="exp-entry">
        <div class="exp-header">
          <span class="exp-company">${esc(exp.company || '')}</span>
          <span class="exp-dates">${esc(exp.startDate || '')}${exp.endDate ? ' – ' + esc(exp.endDate) : ''}</span>
        </div>
        <div class="exp-role">${esc(exp.role || '')}</div>
        ${resps.length ? `<ul class="exp-resp">${resps.slice(0, 3).map(r => `<li>${esc(r)}</li>`).join('')}${resps.length > 3 ? `<li class="muted">+${resps.length - 3} more…</li>` : ''}</ul>` : ''}
        ${techs.length ? `<div class="skills-cloud" style="margin-top:.25rem">${techs.map(t => `<span class="tech-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      </div>`;
    }
    h += '</div>';
  }

  if (p.technicalSkills && p.technicalSkills.length) {
    h += `<div class="resume-section"><h4>Technical Skills</h4>
      <div class="skills-cloud">${p.technicalSkills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div>
    </div>`;
  }

  return h;
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
              <div class="parsed-resume">${parsedResumeHTML(d.parsed_data)}</div>
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
