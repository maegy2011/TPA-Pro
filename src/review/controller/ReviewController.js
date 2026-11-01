// ReviewController.js - الحالة والأحداث
import * as audit from '../services/audit.js';

const _state = {
  claim: null,
  workingInvoices: [],
  memos: [],
  exceptions: [],
  activeMemoId: null,
  activeTab: 'input',
  dirty: false,
  listeners: new Map()
};

export function getState() {
  return _state;
}

export function setClaim(claim) {
  _state.claim = claim;
  if (claim) {
    if (!claim.memos) claim.memos = [];
    _state.memos = claim.memos;
    if (!claim.exceptions) claim.exceptions = [];
    _state.exceptions = claim.exceptions;
    if (typeof claim._session !== 'object') claim._session = { dirty: false, lastSavedAt: null };
  }
  emit('claim:changed', { claim });
}

export function setWorkingInvoices(invoices) {
  _state.workingInvoices = Array.isArray(invoices) ? invoices : [];
  emit('invoices:changed', { invoices: _state.workingInvoices });
}

export function getClaim() {
  return _state.claim;
}

export function getWorkingInvoices() {
  return _state.workingInvoices;
}

export function markDirty(flag = true) {
  _state.dirty = !!flag;
  if (_state.claim && typeof _state.claim._session === 'object') {
    _state.claim._session.dirty = _state.dirty;
  }
  if (typeof markSessionDirty === 'function' && flag) {
    try { markSessionDirty(); } catch(e) {}
  }
  emit('dirty:changed', { dirty: _state.dirty });
}

export function isDirty() {
  return _state.dirty;
}

export function on(event, fn) {
  if (!_state.listeners.has(event)) _state.listeners.set(event, []);
  _state.listeners.get(event).push(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  if (!_state.listeners.has(event)) return;
  const arr = _state.listeners.get(event);
  const idx = arr.indexOf(fn);
  if (idx >= 0) arr.splice(idx, 1);
}

export function emit(event, payload = {}) {
  if (!_state.listeners.has(event)) return;
  const arr = _state.listeners.get(event).slice();
  arr.forEach(fn => {
    try { fn(payload); } catch(e) { console.error('ReviewController listener error', e); }
  });
}

export function recalcTotals() {
  const claim = _state.claim;
  if (!claim) return { claimed: 0, allowed: 0, discounted: 0, net: 0, discountPct: 0 };
  let claimed = 0, allowed = 0;
  (_state.memos || []).forEach(m => {
    claimed += Number(m.totals && m.totals.claimed) || 0;
    allowed += Number(m.totals && m.totals.allowed) || 0;
  });
  // fallback to workingInvoices if no memos
  if (claimed === 0 && allowed === 0) {
    (_state.workingInvoices || []).forEach(inv => {
      (inv.patients || []).forEach(p => {
        (p.lines || []).forEach(l => {
          claimed += (Number(l.qty) || 0) * (Number(l.billedUnit) || 0);
          allowed += Number(l.approved) || 0;
        });
      });
    });
  }
  const discounted = Math.max(0, claimed - allowed);
  const net = allowed;
  const discountPct = claimed > 0 ? (discounted / claimed * 100) : 0;
  claim.totals = { claimed, allowed, discounted, net, discountPct };
  claim.billed = claimed;
  claim.approved = allowed;
  emit('totals:changed', claim.totals);
  return claim.totals;
}

export function addAudit(action, details = {}) {
  return audit.log(action, { ...details, claimId: _state.claim ? _state.claim.id : null });
}

export default {
  getState, setClaim, setWorkingInvoices, getClaim, getWorkingInvoices,
  markDirty, isDirty, on, off, emit, recalcTotals, addAudit
};
