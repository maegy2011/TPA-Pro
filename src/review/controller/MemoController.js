// MemoController.js
import { DiscountMemo } from '../models/DiscountMemo.js';
import * as ReviewController from './ReviewController.js';

let _memoCounter = 1;

export function createMemo(claimId, patient = {}, invoice = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) throw new Error('no claim');
  const id = 'DM-' + String(_memoCounter++).padStart(3, '0');
  const memo = new DiscountMemo({
    id,
    number: id,
    status: 'draft',
    patient: {
      name: patient.name || claim.patientName || '',
      membershipNo: patient.membershipNo || '',
      admissionDate: patient.admissionDate || '',
      dischargeDate: patient.dischargeDate || ''
    },
    invoice: {
      number: invoice.number || '',
      enteredValue: Number(invoice.enteredValue) || 0,
      computedValue: Number(invoice.computedValue) || 0,
      variance: 0
    },
    items: [],
    audit: [{ action: 'created', by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer', at: new Date().toISOString() }]
  });
  if (!Array.isArray(claim.memos)) claim.memos = [];
  claim.memos.push(memo);
  ReviewController.markDirty(true);
  ReviewController.emit('memo:created', { memo });
  ReviewController.recalcTotals();
  return memo;
}

export function updateMemo(memoId, patch = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) return null;
  const memo = (claim.memos || []).find(m => m.id === memoId);
  if (!memo) return null;
  Object.assign(memo, patch);
  memo._dirty = true;
  memo.audit = memo.audit || [];
  memo.audit.push({ action: 'updated', by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer', at: new Date().toISOString(), patchKeys: Object.keys(patch) });
  ReviewController.markDirty(true);
  ReviewController.emit('memo:updated', { memo });
  ReviewController.recalcTotals();
  return memo;
}

export function deleteMemo(memoId) {
  const claim = ReviewController.getClaim();
  if (!claim) return false;
  const idx = (claim.memos || []).findIndex(m => m.id === memoId);
  if (idx < 0) return false;
  claim.memos.splice(idx, 1);
  ReviewController.markDirty(true);
  ReviewController.emit('memo:removed', { memoId });
  ReviewController.recalcTotals();
  return true;
}

export function setMemoStatus(memoId, status, reason = '') {
  const memo = updateMemo(memoId, { status });
  if (memo) {
    memo.audit.push({ action: 'status_changed', by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer', at: new Date().toISOString(), status, reason });
    ReviewController.emit('memo:status', { memoId, status, reason });
  }
  return memo;
}

export function getMemos() {
  const claim = ReviewController.getClaim();
  return (claim && claim.memos) ? claim.memos : [];
}

export default { createMemo, updateMemo, deleteMemo, setMemoStatus, getMemos };
