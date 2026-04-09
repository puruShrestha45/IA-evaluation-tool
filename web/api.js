// ═══════════════════════════════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════════════════════════════

const getEmail = () => localStorage.getItem('eval_user_email');

export const api = {
  async getDatasets() {
    const r = await fetch('/api/datasets');
    return r.json();
  },
  async getDataset(idx) {
    const r = await fetch(`/api/datasets/${idx}`);
    return r.json();
  },
  // async getAnnotations(idx) {
  //   const r = await fetch(`/api/annotations/${idx}`);
  //   return r.json();
  // },
  // async saveAnnotations(idx, data) {
  //   await fetch(`/api/annotations/${idx}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data),
  //   });
  // },
  async getRubrics() {
    const r = await fetch('/api/rubrics');
    return r.json();
  },
  async getAnnotations(idx) {
    const email = getEmail();
    if (!email) return {};
    
    // We send the email as a query parameter (?email=...)
    const res = await fetch(`/api/annotations/${idx}?email=${encodeURIComponent(email)}`);
    if (!res.ok) return {};
    return res.json();
  },

  async saveAnnotations(idx, data) {
    const email = getEmail();
    if (!email) return { ok: false, error: 'No email' };

    const res = await fetch(`/api/annotations/${idx}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        data: data
      })
    });
    return res.json();
  }
};
