// autosave.js
let _timer = null;
const STORAGE_KEY = 'review:draft:';

export function start(claim, getStateFn, intervalMs = 30000) {
  stop();
  _timer = setInterval(() => {
    try {
      if (!claim) return;
      const state = typeof getStateFn === 'function' ? getStateFn() : { claim, workingInvoices: (typeof workingInvoices !== 'undefined') ? workingInvoices : [] };
      const key = STORAGE_KEY + (claim.id || 'unknown');
      localStorage.setItem(key, JSON.stringify({
        at: new Date().toISOString(),
        claimId: claim.id,
        state
      }));
      if (typeof claim._session === 'object') {
        claim._session.lastSavedAt = new Date().toISOString();
      }
    } catch(e) {
      console.warn('autosave failed', e);
    }
  }, intervalMs);
}

export function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

export function loadDraft(claimId) {
  try {
    const key = STORAGE_KEY + claimId;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    return null;
  }
}

export function clearDraft(claimId) {
  try {
    const key = STORAGE_KEY + claimId;
    localStorage.removeItem(key);
  } catch(e) {}
}

export default { start, stop, loadDraft, clearDraft };
