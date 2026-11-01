// ExceptionsController.js
import * as ReviewController from './ReviewController.js';

export function decideException(exceptionId, decision, opts = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) return null;
  if (!Array.isArray(claim.exceptions)) claim.exceptions = [];
  const ex = claim.exceptions.find(e => e.id === exceptionId);
  if (!ex) return null;
  
  const note = (opts.note || '').trim();
  if ((decision === 'reject') && !note) {
    throw new Error('الملاحظة إلزامية للرفض');
  }
  if ((decision === 'reduce') && opts.reductionAmount !== undefined) {
    const red = Number(opts.reductionAmount);
    if (isNaN(red) || red < 0) throw new Error('أدخل مبلغًا صالحًا');
    // التحقق من تجاوز المسموح
    if (red > (opts.allowedValue || Infinity) && !note) {
      throw new Error('الملاحظة إلزامية للتخفيض');
    }
    ex.reductionAmount = red;
  }
  if ((decision === 'reduce') && opts.reductionAmount < (opts.allowedValue || 0) && !note) {
    throw new Error('الملاحظة إلزامية للتخفيض');
  }
  
  ex.decision = decision;
  ex.note = note;
  ex.decidedBy = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer';
  ex.decidedAt = new Date().toISOString();
  
  // تطبيق على البند
  if (Array.isArray(claim.memos)) {
    claim.memos.forEach(m => {
      (m.items || []).forEach(it => {
        if (it.id === ex.itemId) {
          if (decision === 'approve_manual') {
            it.status = 'ok';
            it._decision = 'manual-approved';
            it.source = 'manual';
          } else if (decision === 'reject') {
            it.status = 'ok';
            it._decision = 'manual-rejected';
            it.allowedValue = 0;
            it.recalc();
          } else if (decision === 'reduce') {
            it.status = 'ok';
            it._decision = 'manual-reduced';
            if (ex.reductionAmount !== null && ex.reductionAmount !== undefined) {
              it.allowedValue = Number(ex.reductionAmount);
              it.recalc();
            }
            it.source = 'manual';
          } else if (decision === 'request_preapproval') {
            it._decision = 'pa-pending';
            it.status = 'exception';
          } else if (decision === 'reopen') {
            it.decision = null;
            it._decision = 'needs-attention';
            it.status = 'exception';
            it.decidedBy = null;
            it.decidedAt = null;
            it.note = '';
            ReviewController.emit('exception:reopened', { exception: ex });
            ReviewController.markDirty(true);
            ReviewController.recalcTotals();
            return;
          }
        }
      });
    });
  }
  
  ReviewController.markDirty(true);
  ReviewController.emit('exception:decided', { exception: ex });
  ReviewController.recalcTotals();
  return ex;
}

export function reopenException(exceptionId) {
  return decideException(exceptionId, 'reopen');
}

export function getExceptions() {
  const claim = ReviewController.getClaim();
  return (claim && claim.exceptions) ? claim.exceptions : [];
}

export function countUnhandled() {
  return getExceptions().filter(e => !e.decision).length;
}

export default { decideException, reopenException, getExceptions, countUnhandled };
