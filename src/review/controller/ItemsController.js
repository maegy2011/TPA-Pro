// ItemsController.js
import { Item } from '../models/Item.js';
import * as ReviewController from './ReviewController.js';
import * as contractRules from '../rules/contractRules.js';

export function addItem(memoId, procedure = {}, opts = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) throw new Error('no claim');
  const memo = (claim.memos || []).find(m => m.id === memoId);
  if (!memo) throw new Error('memo not found');
  
  const enteredValue = Number(opts.enteredValue !== undefined ? opts.enteredValue : (procedure.price || procedure.allowed || 0)) || 0;
  const item = new Item({
    id: 'IT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
    memoId,
    procedure: {
      code: procedure.code || '',
      name: procedure.name || '',
      listId: procedure.listId || '',
      listName: procedure.listName || ''
    },
    enteredValue,
    allowedValue: enteredValue,
    source: opts.source || 'auto',
    note: opts.note || '',
    audit: [{ action: 'created', by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer', at: new Date().toISOString() }]
  });
  
  // تطبيق قواعد العقد
  try {
    const res = contractRules.apply(item, claim.contract);
    if (res) {
      if (res.allowedValue !== undefined) item.allowedValue = Number(res.allowedValue);
      if (res.ruleApplied) item.ruleApplied = res.ruleApplied;
      if (res.reasonCode) { item.reasonCode = res.reasonCode; item.reasonText = res.reasonText || item.reasonText; }
      if (res.exception) {
        item.status = 'exception';
        // إضافة استثناء
        if (!Array.isArray(claim.exceptions)) claim.exceptions = [];
        const ex = {
          id: 'EX-' + Date.now().toString(36),
          memoId,
          itemId: item.id,
          severity: res.exception.severity || 'medium',
          ruleCode: res.exception.ruleCode,
          ruleMessage: res.exception.ruleMessage,
          decision: null,
          reductionAmount: null,
          note: '',
          decidedBy: null,
          decidedAt: null
        };
        claim.exceptions.push(ex);
        item.exceptionId = ex.id;
        ReviewController.emit('exception:created', { exception: ex });
      }
    }
  } catch(e) {
    console.warn('contractRules.apply error', e);
  }
  
  item.recalc();
  if (!Array.isArray(memo.items)) memo.items = [];
  memo.items.push(item);
  recalcMemo(memo);
  ReviewController.markDirty(true);
  ReviewController.emit('item:added', { item, memoId });
  ReviewController.recalcTotals();
  return item;
}

export function updateItem(memoId, itemId, patch = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) return null;
  const memo = (claim.memos || []).find(m => m.id === memoId);
  if (!memo) return null;
  const item = (memo.items || []).find(it => it.id === itemId);
  if (!item) return null;
  
  const old = { ...item };
  Object.assign(item, patch);
  if (patch.enteredValue !== undefined || patch.allowedValue !== undefined) {
    item.recalc();
  }
  item.audit = item.audit || [];
  item.audit.push({ action: 'updated', by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer', at: new Date().toISOString(), oldValue: old, newValue: patch });
  recalcMemo(memo);
  ReviewController.markDirty(true);
  ReviewController.emit('item:updated', { item, memoId });
  ReviewController.recalcTotals();
  return item;
}

export function removeItem(memoId, itemId) {
  const claim = ReviewController.getClaim();
  if (!claim) return false;
  const memo = (claim.memos || []).find(m => m.id === memoId);
  if (!memo) return false;
  const idx = (memo.items || []).findIndex(it => it.id === itemId);
  if (idx < 0) return false;
  memo.items.splice(idx, 1);
  // إزالة استثناء المرتبط
  if (Array.isArray(claim.exceptions)) {
    const exIdx = claim.exceptions.findIndex(ex => ex.itemId === itemId);
    if (exIdx >= 0) claim.exceptions.splice(exIdx, 1);
  }
  recalcMemo(memo);
  ReviewController.markDirty(true);
  ReviewController.emit('item:removed', { itemId, memoId });
  ReviewController.recalcTotals();
  return true;
}

export function recalcMemo(memo) {
  if (!memo) return memo;
  let claimed = 0, allowed = 0;
  (memo.items || []).forEach(it => {
    claimed += Number(it.enteredValue) || 0;
    allowed += Number(it.allowedValue) || 0;
  });
  memo.totals = {
    claimed,
    allowed,
    discounted: Math.max(0, claimed - allowed),
    net: allowed
  };
  if (memo.invoice) {
    memo.invoice.computedValue = claimed;
    memo.invoice.variance = (Number(memo.invoice.enteredValue) || 0) - claimed;
  }
  return memo;
}

export function reapplyRules(memoId) {
  const claim = ReviewController.getClaim();
  if (!claim) return;
  const memo = (claim.memos || []).find(m => m.id === memoId);
  if (!memo) return;
  (memo.items || []).forEach(it => {
    const res = contractRules.apply(it, claim.contract);
    if (res) {
      if (res.allowedValue !== undefined) it.allowedValue = Number(res.allowedValue);
      if (res.ruleApplied) it.ruleApplied = res.ruleApplied;
      if (res.reasonCode && it.source !== 'manual') { it.reasonCode = res.reasonCode; it.reasonText = res.reasonText || it.reasonText; }
      it.recalc();
    }
  });
  recalcMemo(memo);
  ReviewController.markDirty(true);
  ReviewController.emit('items:reapplied', { memoId });
  ReviewController.recalcTotals();
}

export default { addItem, updateItem, removeItem, recalcMemo, reapplyRules };
