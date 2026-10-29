function applyMaxLabsRule(pat){
  markSessionDirty();
  const max = REVIEW_RULES.maxLabsPerVisit;
  const idxs = [];
  (pat.lines||[]).forEach((l,i) => { if(REVIEW_RULES.labCategories.includes(l.category)) idxs.push(i); });
  if(idxs.length <= max){ showWarning('لا حاجة', `عدد التحاليل ${idxs.length} ≤ ${max}.`); return; }
  const excess = idxs.length - max;
  const sorted = idxs.slice().sort((a,b) => (pat.lines[b].qty*pat.lines[b].billedUnit)-(pat.lines[a].qty*pat.lines[a].billedUnit));
  sorted.slice(0, excess).forEach(i => {
    const l = pat.lines[i];
    l.approved = 0;
    l.note = 'تجاوز حد التحاليل';
    l._maxlabsForced = true;
    l._overrideMode = 'auto';
    l._autoApproved = 0;
    l._autoRuleId = '_maxlabs';
    l._autoRuleName = `حد التحاليل (${max})`;
    l._appliedRuleIds = ['_maxlabs'];
  });
  showSuccess('تم', `تم خصم ${excess} تحليل`);
}
function saveReview(){
  if(!activeClaim) return;
  const missing = [];
  workingInvoices.forEach((inv,i) => { DOC_ITEMS.forEach(d => { if(!inv.documents[d.key]) missing.push(`فاتورة ${i+1}: ${d.label}`); }); });
  if(missing.length){ showWarning('مستندات ناقصة', missing.join('<br>')+'<br><br>متابعة؟', () => finalizeReview()); return; }
  if(activeClaim.priorApproval && activeClaim.priorApproval.required && activeClaim.priorApproval.status !== 'approved'){ showWarning('موافقة ناقصة','متابعة؟', () => finalizeReview()); return; }
  finalizeReview();
}
function finalizeReview(){
  if(!activeClaim) return;
  const cid = activeClaim.id;
  activeClaim.invoices = JSON.parse(JSON.stringify(workingInvoices));
  activeClaim.invoices.forEach(inv => (inv.patients||[]).forEach(p => computePatient(p, activeClaim, inv.date, inv)));
  activeClaim.reason = $('#rvReason').value;
  activeClaim.notes = $('#rvNotes').value.trim();
  if(activeClaim.priorApproval && activeClaim.priorApproval.required){
    activeClaim.priorApproval.status = $('#paStatus').value;
    activeClaim.priorApproval.refNumber = $('#paRefNumber').value.trim();
    activeClaim.priorApproval.date = $('#paDate').value;
  }
  recalcClaim(activeClaim);
  if(activeClaim.status === 'pending') activeClaim.reviewedDate = daysFromNow(0);
  if(activeClaim.approved <= 0) activeClaim.status = 'rejected';
  else if(activeClaim.approved >= activeClaim.billed) activeClaim.status = 'approved';
  else activeClaim.status = 'partial';
  workSessions = workSessions.filter(x => x.claimId !== activeClaim.id);
  persistSessions();
  clearSessionDirty();
  closeReview({ discard:true });
  renderAll();
  if(currentTimelineClaimId === cid) renderTimeline();
  showSuccess('تم','تم حفظ المراجعة');
}
