// ═══════════════════════════════════════════════════════════════════════════
//  GUIDE TOGGLE  (per-component, persisted in localStorage)
// ═══════════════════════════════════════════════════════════════════════════

import { esc } from './utils.js';

const GUIDE_KEY = 'ia_eval_hidden_guides';

export function loadHiddenGuides() {
  try { return new Set(JSON.parse(localStorage.getItem(GUIDE_KEY) || '[]')); }
  catch { return new Set(); }
}

export function toggleGuide(type) {
  const hidden = loadHiddenGuides();
  if (hidden.has(type)) hidden.delete(type); else hidden.add(type);
  localStorage.setItem(GUIDE_KEY, JSON.stringify([...hidden]));
  document.querySelectorAll(`[data-guide-type="${type}"]`).forEach(el =>
    el.classList.toggle('guide-hidden', hidden.has(type)));
  document.querySelectorAll(`[data-guide-toggle="${type}"]`).forEach(btn =>
    btn.textContent = hidden.has(type) ? 'Show guide' : 'Hide guide');
}

export function guidePanel(type, title, rowsHTML) {
  const hidden = loadHiddenGuides().has(type);
  return `
    <div class="guide-wrap">
      <div class="guide-header">
        <span class="guide-title">${esc(title)}</span>
        <button class="guide-toggle-btn" data-guide-toggle="${type}">${hidden ? 'Show guide' : 'Hide guide'}</button>
      </div>
      <div class="guide-body ${hidden ? 'guide-hidden' : ''}" data-guide-type="${type}">
        ${rowsHTML}
      </div>
    </div>`;
}
