/* Phase 25 — requested review workflow upgrades */
(function(){
  // Light indicator for the patient currently under review
  const style = document.createElement('style');
  style.textContent = `
    .rv-patient-details.rv-patient-reviewing { box-shadow: 0 0 0 2px var(--teal); border-radius: 6px; background: rgba(43,90,138,0.06); }
    .rv-patient-seq { display:inline-block; min-width:22px; text-align:center; border-radius:6px; background:rgba(43,90,138,0.12); padding:0 4px; font-size:11px; }
  `;
  document.head.appendChild(style);

  function assignPatientNumbers(invoices){
    (invoices||[]).forEach(inv => {
      (inv.patients||[]).forEach((p, pi) => {
        p.patientNumber = pi + 1;
        p.patientSeq = pi + 1;
      });
    });
    return invoices;
  }

  function saveReviewProgress(claim, point){
    if(!claim) return null;
    const p = Object.assign({ updatedAt: new Date().toISOString() }, point || { invoiceIdx: (typeof rvActiveInvoiceIdx!=='undefined'?rvActiveInvoiceIdx:0), patientIdx: (typeof rvActivePatientIdx!=='undefined'?rvActivePatientIdx:0), lineIdx: 0 });
    try {
      if(typeof findSessionByClaim === 'function'){
        const s = findSessionByClaim(claim.id);
        if(s){ s.lastSavedPoint = { invoiceIdx: p.invoiceIdx || 0, patientIdx: p.patientIdx || 0, lineIdx: p.lineIdx || 0, timestamp: p.updatedAt }; if(typeof persistSessions === 'function') persistSessions(); }
      }
    } catch(e){}
    try { if(typeof upsertCurrentSession === 'function') upsertCurrentSession(); } catch(e){}
    return p;
  }

  function getReviewProgress(claim){
    try {
      if(typeof RC_cursorForClaim === 'function' && claim?.id){
        const _c = RC_cursorForClaim(claim.id);
        return { invoiceIdx: _c.invoice, patientIdx: _c.patient, lineIdx: 0 };
      }
    } catch(e){}
    return null;
  }

  function notifyRuleConflict(message){
    try { if(typeof showToast === 'function') showToast('⚠️ ' + (message||'تعارض في القواعد')); } catch(e){}
    try { if(typeof showWarning === 'function') showWarning('تعارض في القواعد', message||''); } catch(e){}
  }

  function recordReviewerRuleChoice(ruleId, choice){
    try {
      const key = 'tpa_rule_learning_v1';
      const store = JSON.parse(localStorage.getItem(key) || '{}');
      if(!store[ruleId]) store[ruleId] = { choices: {} };
      store[ruleId].choices[choice] = (store[ruleId].choices[choice] || 0) + 1;
      store[ruleId].lastChoice = choice;
      store[ruleId].updatedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(store));
    } catch(e){}
  }

  function learnDeductionRule(suggestion){
    try {
      const key = 'tpa_learned_deduction_rules_v1';
      const store = JSON.parse(localStorage.getItem(key) || '[]');
      store.push(Object.assign({ learnedAt: new Date().toISOString() }, suggestion || {}));
      localStorage.setItem(key, JSON.stringify(store));
    } catch(e){}
  }

  function applyDeductionRulesManual(){
    try {
      if(typeof markSessionDirty === 'function') markSessionDirty();
      if (typeof workingInvoices !== 'undefined') {
        workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => {
          if (typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv);
        }));
      }
      if(typeof renderActiveInvoice === 'function') renderActiveInvoice();
      if(typeof recalcReview === 'function') recalcReview();
      if(typeof showSuccess === 'function') showSuccess('تم', 'تم إعادة تطبيق قواعد الخصم');
    } catch(e){}
  }

  // Expose globals
  window.assignPatientNumbers = assignPatientNumbers;
  window.saveReviewProgress = saveReviewProgress;
  window.getReviewProgress = getReviewProgress;
  window.notifyRuleConflict = notifyRuleConflict;
  window.recordReviewerRuleChoice = recordReviewerRuleChoice;
  window.learnDeductionRule = learnDeductionRule;
  window.applyDeductionRulesManual = applyDeductionRulesManual;

  // ملغي (4 نوفمبر 2026 — بأمر محمد): الحقن التلقائي لـ«تحديد الكل» كان يكرر مربعات في كل الشاشات — كل تحديد-كل شرعي موجود يدويًا (claimsSelectAll/trashSelectAll)
})();
document.addEventListener('DOMContentLoaded', function(){
  try { if(typeof tpaAddRetirementSettings === 'function') tpaAddRetirementSettings(); } catch(e){}
});