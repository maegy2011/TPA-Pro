// audit.js - سجل تدقيق للعمليات الحساسة
const auditLog = [];

export function log(action, details = {}) {
  const entry = {
    id: 'AUD-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
    action,
    details,
    by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? currentUser.id : (details.by || 'system'),
    at: new Date().toISOString(),
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };
  auditLog.push(entry);
  try {
    console.debug('[AUDIT]', entry);
  } catch(e) {}
  return entry;
}

export function getLog(filter = {}) {
  let res = [...auditLog];
  if (filter.action) res = res.filter(e => e.action === filter.action);
  if (filter.by) res = res.filter(e => e.by === filter.by);
  if (filter.claimId) res = res.filter(e => e.details.claimId === filter.claimId);
  return res;
}

export function clear() {
  auditLog.length = 0;
}

export default { log, getLog, clear };
