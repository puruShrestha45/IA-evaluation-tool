// ═══════════════════════════════════════════════════════════════════════════
//  TAB — Resume
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { esc, rubricPanel } from './utils.js';

function parsedResumeHTML(p) {
  if (!p || !Object.keys(p).length) return '<p class="muted">No parsed data available.</p>';
  let h = '';

  h += `<div>
    <div class="resume-name">${esc(p.candidateName || 'Unknown')}</div>
    ${p.candidateRole ? `<div class="resume-role">${esc(p.candidateRole)}</div>` : ''}
    <div class="resume-meta">${[p.region, p.regionFromPhoneNo ? `📞 ${p.regionFromPhoneNo}` : ''].filter(Boolean).join(' · ')}</div>
    ${p.degree?.length ? `<div class="resume-degrees">${p.degree.map(d => `<span class="degree-tag">${esc(d)}</span>`).join('')}</div>` : ''}
  </div>`;

  if (p.workExperience?.length) {
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

  if (p.technicalSkills?.length) {
    h += `<div class="resume-section"><h4>Technical Skills</h4>
      <div class="skills-cloud">${p.technicalSkills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div>
    </div>`;
  }

  return h;
}

export function renderResumeTab() {
  const d = state.data;
  return `
    <div class="resume-layout">
      <!-- Evaluations at the top -->
      <div class="resume-eval-dynamic" id="eval-container">
        <div class="eval-box" id="box-entity">
          ${rubricPanel('RESUME_ENTITY', 'resume_parsing.entity_accuracy')}
        </div>
        <div class="eval-box" id="box-chronology">
          ${rubricPanel('RESUME_CHRONOLOGY', 'resume_parsing.chronological_fidelity')}
        </div>
        <div class="eval-box" id="box-quant">
          ${rubricPanel('RESUME_QUANT', 'resume_parsing.quantitative_extraction')}
        </div>
        <div class="eval-box" id="box-skills">
          ${rubricPanel('RESUME_SKILLS', 'resume_parsing.skill_classification')}
        </div>
      </div>

      <!-- Side-by-side comparison -->
      <div class="resume-comparison-grid">
        <div class="pdf-side">
          ${d.pdf_url
            ? `<div class="card">
                 <div class="card-title">Original Resume PDF</div>
                 <iframe src="${d.pdf_url}" class="pdf-viewer" title="Resume PDF"></iframe>
               </div>`
            : `<div class="no-pdf">📄 Resume PDF not available for this record.</div>`
          }
        </div>
        <div class="parsed-side">
          <div class="card">
            <div class="card-title">AI Parsed Resume</div>
            <div class="parsed-resume">${parsedResumeHTML(d.parsed_data)}</div>
          </div>
        </div>
      </div>
    </div>`;
}
