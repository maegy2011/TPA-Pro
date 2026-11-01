// validationRules.js - الشروط الثمانية وما قبلها
const _validators = [];

export function register(fn) {
  if (typeof fn === 'function') _validators.push(fn);
}

export function clear() {
  _validators.length = 0;
}

// فحص مسبق قبل التوقيع
export function runPreflight(claim, workingInvoices) {
  const issues = [];
  const canOverride = [];
  
  if (!claim) return { ok: false, issues, canOverride, summary: [] };
  
  const memos = claim.memos || [];
  
  // 1. كل استثناء له قرار
  const exceptions = claim.exceptions || [];
  const unhandled = exceptions.filter(ex => !ex.decision);
  if (unhandled.length > 0) {
    issues.push({ code: 'EX_UNHANDLED', level: 'error', message: `${unhandled.length} استثناء دون قرار`, canOverride: false });
  }
  
  // 2. لا pa-pending
  let paPending = 0;
  (workingInvoices || []).forEach(inv => {
    (inv.patients || []).forEach(p => {
      (p.lines || []).forEach(l => {
        if (l._decision === 'pa-pending') paPending++;
      });
    });
  });
  // أيضاً فحص في memos/items
  memos.forEach(m => {
    (m.items || []).forEach(it => {
      if (it.status === 'exception') {
        // فحص إذا كان متعلق بالموافقة المسبقة
        if (it.ruleApplied && it.ruleApplied.meta && it.ruleApplied.meta.requiresPreApproval && !it._paResolved) {
          paPending++;
        }
      }
    });
  });
  if (paPending > 0) {
    issues.push({ code: 'PA_PENDING', level: 'error', message: `${paPending} موافقة مسبقة معلّقة`, canOverride: false });
  }
  
  // 3. تطابق الإجمالي
  const billedClaim = Number(claim.billed) || 0;
  let entered = 0;
  (workingInvoices || []).forEach(inv => {
    (inv.patients || []).forEach(p => {
      (p.lines || []).forEach(l => {
        entered += (Number(l.qty) || 0) * (Number(l.billedUnit) || 0);
      });
    });
  });
  if (Math.abs(billedClaim - entered) > 1) {
    issues.push({ code: 'TOTAL_MISMATCH', level: 'error', message: `فرق ${Math.abs(billedClaim - entered)} بين المُدخل والمحسوب`, canOverride: false });
  }
  
  // 4. المستندات المطلوبة
  let missingDocs = 0;
  const DOC_ITEMS = [
    { key: 'invoice', label: 'فاتورة' },
    { key: 'report', label: 'تقرير طبي' },
    { key: 'referral', label: 'إحالة' },
    { key: 'priorApproval', label: 'موافقة مسبقة' }
  ];
  (workingInvoices || []).forEach(inv => {
    DOC_ITEMS.forEach(d => {
      if (!inv.documents || !inv.documents[d.key]) missingDocs++;
    });
    (inv.patients || []).forEach(p => {
      DOC_ITEMS.forEach(d => {
        if (!(p.documents && p.documents[d.key])) missingDocs++;
      });
    });
  });
  if (missingDocs > 0) {
    issues.push({ code: 'MISSING_DOCS', level: 'warning', message: `${missingDocs} مستند ناقص`, canOverride: true });
  }
  
  // 5. سبب الاستقطاع العام إن لزم
  const decisionEl = document.querySelector('input[name="rvDecision"]:checked') || document.querySelector('input[name="rvPageDecision"]:checked');
  const decision = decisionEl ? decisionEl.value : (claim._decision || 'partial');
  const finalReasonEl = document.getElementById('rvFinalReason') || document.getElementById('rvPageFinalReason');
  const finalReason = finalReasonEl ? finalReasonEl.value : (claim.generalDeductionReason || claim.reason || '');
  if (decision !== 'approve_full' && decision !== 'approved' && !finalReason) {
    issues.push({ code: 'GENERAL_REASON', level: 'error', message: 'سبب الاستقطاع العام إلزامي', canOverride: false });
  }
  
  // 6. كل خصم له كود سبب
  let noReason = 0;
  (workingInvoices || []).forEach(inv => {
    (inv.patients || []).forEach(p => {
      (p.lines || []).forEach(l => {
        const billed = (Number(l.qty) || 0) * (Number(l.billedUnit) || 0);
        const approved = Number(l.approved) || 0;
        if (approved < billed && !l._reasonCode && !l.reasonCode) noReason++;
      });
    });
  });
  if (noReason > 0) {
    issues.push({ code: 'NO_REASON', level: 'error', message: `${noReason} بند بخصم دون سبب`, canOverride: false });
  }
  
  // 7. كل مذكرة فيها بند واحد على الأقل
  let emptyMemos = 0;
  memos.forEach(m => {
    if (!m.items || m.items.length === 0) emptyMemos++;
  });
  if (emptyMemos > 0) {
    issues.push({ code: 'EMPTY_MEMO', level: 'error', message: `${emptyMemos} مذكرة فارغة`, canOverride: false });
  }
  
  // 8. لا مذكرة بحالة draft
  let draftMemos = 0;
  memos.forEach(m => {
    if (m.status === 'draft') draftMemos++;
  });
  if (draftMemos > 0) {
    issues.push({ code: 'DRAFT_MEMO', level: 'error', message: `${draftMemos} مذكرة مسودة لم تُعتمد`, canOverride: false });
  }
  
  // custom validators
  _validators.forEach(fn => {
    try {
      const res = fn(claim, workingInvoices);
      if (res) {
        if (Array.isArray(res)) issues.push(...res);
        else issues.push(res);
      }
    } catch(e) {}
  });
  
  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warning');
  const overridable = issues.filter(i => i.canOverride);
  
  return {
    ok: errors.length === 0,
    issues,
    errors,
    warnings,
    overridable,
    canSign: errors.length === 0 || overridable.length === errors.length
  };
}

export default { register, clear, runPreflight };
