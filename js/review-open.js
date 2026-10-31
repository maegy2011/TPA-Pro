function openReview(id){
  const c = getClaimById(id); if(!c) return;
  const existing = findSessionByClaim(id);
  const isAlreadyInThisSession = existing && activeSessionId === existing.id
                              && activeClaim && activeClaim.id === existing.claimId;
  if(existing && !isAlreadyInThisSession){
    if(activeSessionId && activeClaim){ upsertCurrentSession(); activeClaim = null; workingInvoices = []; }
    resumeSession(existing.id); return;
  }
  let baseInvoices = c.invoices;
  if(!baseInvoices || !baseInvoices.length){
    const lines = [mkLine('GEN-001','بند مطالبة غير مفصل','أخرى',1,Number(c.billed)||0,Number(c.billed)||0,Number(c.approved)||0)];
    baseInvoices = [mkInvoice(c.id+'-1','outpatient',c.date,[mkPatient(c.id+'-P1',c.patient||'—','',lines)])];
  }
  activeClaim = c;
  workingInvoices = JSON.parse(JSON.stringify(baseInvoices));
  rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
  workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => {
    if(p.coverageCapOverride === undefined) p.coverageCapOverride = null;
    if(p.retireeCopayOverride === undefined) p.retireeCopayOverride = null;
    if(p.beneficiaryType === undefined) p.beneficiaryType = c.type || 'employee';
  }));
  $('#rvSub').textContent = `${c.id} • ${c.patient}`;
  $('#rvId').value = c.id; $('#rvDate').value = c.date; $('#rvReceivedNumber').value = c.receivedNumber||'—';
  $('#rvReceivedDate').value = c.receivedDate||'—'; $('#rvPatient').value = c.patient; $('#rvProvider').value = c.provider;
  $('#rvReason').value = c.reason||''; $('#rvNotes').value = c.notes||'';
  if(c.priorApproval && c.priorApproval.required){
    $('#\1')?.style.display = 'block';
    $('#paStatus').value = c.priorApproval.status || 'not-requested';
    $('#paRefNumber').value = c.priorApproval.refNumber || '';
    $('#paDate').value = c.priorApproval.date || '';
    updatePAWarning();
  } else $('#\1')?.style.display = 'none';
  $$('.rv-type-btn').forEach(b => b.classList.toggle('active', b.dataset.claimType === (c.type||'employee')));
  renderReviewInvoices();
  const s = upsertCurrentSession();
  if(s){ s.status = 'active'; activeSessionId = s.id; persistSessions(); }
  clearSessionDirty();
  $('#reviewModal').classList.add('open'); document.body.style.overflow = 'hidden';
  updateSessionsBadge();
}
function closeReview(opts){
  if(!$('#reviewModal').classList.contains('open')) return;
  const discard = !!(opts && opts.discard === true);
  if(!discard && _hasUnsavedChanges()){
    openDialog({
      type:'warning', title:'تعديلات غير محفوظة',
      message:'هل تريد إغلاق المراجعة؟ سيتم حفظ الجلسة مؤقتاً لكن التعديلات لن تُطبَّق على المطالبة حتى تضغط «حفظ».',
      confirmText:'إغلاق', cancelText:'متابعة',
      onConfirm: () => _doCloseReview(false)
    });
    return;
  }
  _doCloseReview(discard);
}
function _doCloseReview(discard){
  if(activeClaim && !discard){
    const s = upsertCurrentSession();
    if(s){ s.status = 'paused'; persistSessions(); }
  }
  activeSessionId = null;
  clearSessionDirty();
  $('#reviewModal').classList.remove('open');
  _unlockBodyScroll();
  activeClaim = null; workingInvoices = [];
  rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
  updateSessionsBadge();
  if(currentPage === 'sessions') renderSessions();
}
