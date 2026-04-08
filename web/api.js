// ═══════════════════════════════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════════════════════════════

export const api = {
  async getDatasets() {
    const r = await fetch('/api/datasets');
    return r.json();
  },
  async getDataset(idx) {
    const r = await fetch(`/api/datasets/${idx}`);
    return r.json();
  },
  async getAnnotations(idx) {
    const r = await fetch(`/api/annotations/${idx}`);
    return r.json();
  },
  async saveAnnotations(idx, data) {
    await fetch(`/api/annotations/${idx}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getRubrics() {
    const r = await fetch('/api/rubrics');
    return r.json();
  },
};
