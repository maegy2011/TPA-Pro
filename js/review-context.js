// review-context.js — المالك الوحيد لحالة المراجعة الجارية (RC)
// القواعد: (1) المؤشر يعيش في الجلسة لا في المطالبة. (2) مقارنة التضارب على الحقول الأصيلة فقط.
const RC = { claimId: null };
/* مفاتيح _ التي تمثل قرارات/بيانات مراجع (تُحفظ وتُقارن) — عدا ذلك محسوب ويُهمل في المقارنة. */
const RC_DECISION_KEYS = ['_decision','_decidedBy','_overrideMode','_manualValue','_preConflictDecision','_conflictForced','_suggestedAction','_checksPassed','_checksFailed','_flaggedReasons','_legalDeduction','_contractRate','_contractCovered','_capMode','_copayMode','_manualCapAmount','_manualCopayAmount','_capNote','_reviewDrafts','_auditTrail','_overrideChecklist','_locked','_modelVersion'];
function canonicalSnapshot(obj){
  if(Array.isArray(obj)) return obj.map(canonicalSnapshot);
  if(obj && typeof obj === 'object'){
    const out = {};
    for(const k of Object.keys(obj)){
      if(k === 'reviewProgress') continue; // تلوث قديم: مؤشر داخل بيانات المطالبة
      if(k[0] === '_' && !RC_DECISION_KEYS.includes(k)) continue;
      if(k === 'deductionReasons' && Array.isArray(obj[k])){
        out[k] = obj[k].filter(d => d && !d._generatedByCompute && !['auto','rule'].includes(d.source));
        continue;
      }
      out[k] = canonicalSnapshot(obj[k]);
    }
    return out;
  }
  return obj;
}
function RC_getCursor(){
  return {
    invoice: (typeof rvActiveInvoiceIdx !== 'undefined' ? rvActiveInvoiceIdx : 0) || 0,
    patient: (typeof rvActivePatientIdx !== 'undefined' ? rvActivePatientIdx : 0) || 0
  };
}
function RC_applyCursor(cur){
  if(!cur) return;
  try {
    if(typeof rvActiveInvoiceIdx !== 'undefined' && cur.invoice != null) rvActiveInvoiceIdx = Number(cur.invoice) || 0;
    if(typeof rvActivePatientIdx !== 'undefined' && cur.patient != null) rvActivePatientIdx = Number(cur.patient) || 0;
  } catch(e){}
}
/* مؤشر المطالبة من جلستها (لا من جسم المطالبة). */
function RC_cursorForClaim(claimId){
  try {
    if(typeof findSessionByClaim === 'function'){
      const s = findSessionByClaim(claimId);
      if(s){
        if(s.lastSavedPoint) return { invoice: s.lastSavedPoint.invoiceIdx || 0, patient: s.lastSavedPoint.patientIdx || 0 };
        if(s.rvActiveInvoiceIdx != null) return { invoice: s.rvActiveInvoiceIdx || 0, patient: s.rvActivePatientIdx || 0 };
      }
    }
  } catch(e){}
  return { invoice: 0, patient: 0 };
}
