// SignoffController.js
import * as ReviewController from './ReviewController.js';
import * as ValidationController from './ValidationController.js';
import * as audit from '../services/audit.js';

export function canSign() {
  const res = ValidationController.runPreflight();
  return res.canSign || res.ok;
}

export function sign(opts = {}) {
  const claim = ReviewController.getClaim();
  if (!claim) throw new Error('no claim');
  if (claim._locked) throw new Error('المطالبة مقفلة');
  
  const preflight = ValidationController.runPreflight();
  const decision = opts.decision || claim._decision || 'partial';
  const generalReason = opts.generalReason || claim.generalDeductionReason || claim.reason || '';
  
  // التحقق
  if (!preflight.ok) {
    const overridable = preflight.issues.filter(i => i.canOverride);
    const errors = preflight.issues.filter(i => i.level === 'error' && !i.canOverride);
    if (errors.length > 0 && overridable.length === 0) {
      throw new Error('لا يمكن التوقيع: ' + errors.map(e => e.message).join('، '));
    }
    if (overridable.length > 0) {
      const overrideReason = opts.overrideReason || '';
      if (!overrideReason.trim()) throw new Error('سبب التجاوز إلزامي');
      if (!claim._overrideChecklist) claim._overrideChecklist = [];
      claim._overrideChecklist.push({
        by: (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer',
        at: new Date().toISOString(),
        reason: overrideReason.trim(),
        skipped: overridable.map(o => o.code)
      });
      audit.log('override_applied', { claimId: claim.id, skipped: overridable.map(o => o.code), reason: overrideReason.trim() });
    }
  }
  
  if (decision !== 'approve_full' && decision !== 'approved' && !generalReason) {
    throw new Error('سبب الاستقطاع العام إلزامي');
  }
  
  // التوقيع
  claim._signedOff = true;
  claim._reviewedBy = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) || 'reviewer';
  claim._reviewedAt = new Date().toISOString();
  claim._locked = true;
  claim._decision = decision;
  claim.generalDeductionReason = generalReason;
  claim.reason = generalReason || claim.reason || '';
  if (opts.finalNotes) claim.finalNotes = opts.finalNotes;
  if (opts.notes) claim.notes = opts.notes;
  
  ReviewController.recalcTotals();
  ReviewController.markDirty(false);
  audit.log('signed_off', { claimId: claim.id, decision, reviewedBy: claim._reviewedBy, reviewedAt: claim._reviewedAt });
  ReviewController.emit('claim:signed', { claim });
  
  // استدعاء saveReview للتوافق
  if (typeof saveReview === 'function') {
    try { saveReview(); } catch(e) {}
  }
  
  return claim;
}

export function unlock(reason = '') {
  const claim = ReviewController.getClaim();
  if (!claim) return false;
  const canUnlock = (typeof currentUser !== 'undefined' && currentUser && currentUser.permissions && currentUser.permissions.canUnlock);
  if (!canUnlock) throw new Error('غير مصرح بإلغاء القفل');
  claim._locked = false;
  claim._signedOff = false;
  audit.log('unlocked', { claimId: claim.id, reason });
  ReviewController.emit('claim:unlocked', { claim });
  return true;
}

export default { canSign, sign, unlock };
