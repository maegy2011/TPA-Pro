function openReview(id){
  const c = getClaimById(id); if(!c) return;
  const existing = findSessionByClaim(id);
  const isAlreadyInThisSession = existing && activeSessionId === existing.id
                              && activeClaim && activeClaim.id === existing.claimId;
  if(existing && !isAlreadyInThisSession){
    if(activeSessionId && activeClaim){ upsertCurrentSession(); activeClaim = null; workingInvoices = []; }
    resumeSession(existing.id); return;
  }
  let baseInvoices = c.invoices || [];
  if (!Array.isArray(baseInvoices)) baseInvoices = [];
  activeClaim = c;
  workingInvoices = JSON.parse(JSON.stringify(baseInvoices));
  rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
  workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => {
    if(p.coverageCapOverride === undefined) p.coverageCapOverride = null;
    if(p.retireeCopayOverride === undefined) p.retireeCopayOverride = null;
    if(p.beneficiaryType === undefined) p.beneficiaryType = c.type || 'employee';
  }));
  $('#rvSub').textContent = `${c.id} • ${c.patient}`;
  const ctxBar = document.getElementById('rvContextBar');
  if (ctxBar) {
    const ctx = getContractContext(c);
    ctxBar.textContent = `مراجعة ${c.id} · ${c.provider} · عقد ${ctx.contract?ctx.contract.id:'—'} · لائحة ${ctx.tariff?ctx.tariff.name:'—'} · إجمالي ${fmt(c.billed||0)}`;
  }
  $('#rvId').value = c.id; $('#rvDate').value = c.date; $('#rvReceivedNumber').value = c.receivedNumber||'—';
  $('#rvReceivedDate').value = c.receivedDate||'—'; $('#rvPatient').value = c.patient; $('#rvProvider').value = c.provider;
  $('#rvReason').value = c.reason||''; $('#rvNotes').value = c.notes||'';
  if(c.priorApproval && c.priorApproval.required){
    (el => { if (el) el.style.display = 'block'; })($('#priorApprovalBox'));
    $('#paStatus').value = c.priorApproval.status || 'not-requested';
    $('#paRefNumber').value = c.priorApproval.refNumber || '';
    $('#paDate').value = c.priorApproval.date || '';
    updatePAWarning();
  } else (el => { if (el) el.style.display = 'none'; })($('#priorApprovalBox'));
  $$('.rv-type-btn').forEach(b => b.classList.toggle('active', b.dataset.claimType === (c.type||'employee')));
  renderReviewInvoices();
  if (typeof renderExceptions === 'function') renderExceptions();
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
