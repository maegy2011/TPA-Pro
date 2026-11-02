// review-open.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function _fillReviewPage(c){
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v == null ? '' : v; };
  const sub = document.getElementById('rvPageSub');
  if(sub) sub.textContent = `${c.id} • ${c.patient}`;
  const ctxBar = document.getElementById('rvPageContextBar');
  if (ctxBar) {
    const ctx = getContractContext(c);
    ctxBar.textContent = `مراجعة ${c.id} · ${c.provider} · خصم ${ctx.contract?(ctx.contract.discountRate+'%'):'—'} · لائحة ${ctx.tariff?ctx.tariff.name:'—'} · إجمالي ${fmt(c.billed||0)}`;
  }
  set('rvPageId', c.id); set('rvPageDate', c.date); set('rvPageReceivedNumber', c.receivedNumber||'—');
  set('rvPageReceivedDate', c.receivedDate||'—'); set('rvPagePatient', c.patient); set('rvPageProvider', c.provider);
  set('rvPageReason', c.reason||''); set('rvPageNotes', c.notes||'');
  const pab = document.getElementById('rvPagePriorApprovalBox');
  if(c.priorApproval && c.priorApproval.required){
    if(pab) pab.style.display = 'block';
    set('rvPagePaStatus', c.priorApproval.status || 'not-requested');
    set('rvPagePaRefNumber', c.priorApproval.refNumber || '');
    set('rvPagePaDate', c.priorApproval.date || '');
    if(typeof updatePAWarning === 'function') updatePAWarning();
  } else {
    if(pab) pab.style.display = 'none';
  }
  document.querySelectorAll('#page-review .rv-type-btn').forEach(b => b.classList.toggle('active', b.dataset.claimType === (c.type||'employee')));
}
function openReview(id){
  const c = getClaimById(id); if(!c) return;
  if(c.archived === true || c.archiveStatus === 'read-only'){
    if(typeof showWarning==='function') showWarning('مطالبة مؤرشفة','هذه المطالبة مؤرشفة ونهائية. يمكن عرضها من سجل المطالبة دون تعديل.');
    if(typeof openTimeline==='function') openTimeline(id);
    return;
  }
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
  workingInvoices.forEach(inv => (inv.patients||[]).forEach((p, pi) => {
    if(p.coverageCapOverride === undefined) p.coverageCapOverride = null;
    if(p.retireeCopayOverride === undefined) p.retireeCopayOverride = null;
    if(p.beneficiaryType === undefined) p.beneficiaryType = c.type || 'employee';
    if(!Array.isArray(p.deductionReasons)) p.deductionReasons = [];
    p.patientNumber = pi + 1;
    p.patientSeq = pi + 1;
    const _emptyPatientDocs = { patientId: false, referral: false, medicalReport: false, priorApprovalDoc: false };
    const _looksInheritedFromInvoice = !!(p.documents && inv.documents && JSON.stringify(p.documents) === JSON.stringify(inv.documents));
    if(!p.documents || _looksInheritedFromInvoice) p.documents = { ..._emptyPatientDocs };
  }));
  if(typeof recalcClaim === 'function') recalcClaim(c);
  workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => { if(typeof computePatient === 'function') computePatient(p, c, inv.date, inv); }));
  _fillReviewPage(c);
  if(typeof renderReviewDrafts === 'function') renderReviewDrafts();
  // try modal for backward compat
  try {
    const sub = document.getElementById('rvSub');
    if(sub) sub.textContent = `${c.id} • ${c.patient}`;
    const ctxBar = document.getElementById('rvContextBar');
    if (ctxBar) {
      const ctx = getContractContext(c);
      ctxBar.textContent = `مراجعة ${c.id} · ${c.provider} · خصم ${ctx.contract?(ctx.contract.discountRate+'%'):'—'} · لائحة ${ctx.tariff?ctx.tariff.name:'—'} · إجمالي ${fmt(c.billed||0)}`;
    }
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v == null ? '' : v; };
    set('rvId', c.id); set('rvDate', c.date); set('rvReceivedNumber', c.receivedNumber||'—');
    set('rvReceivedDate', c.receivedDate||'—'); set('rvPatient', c.patient); set('rvProvider', c.provider);
    set('rvReason', c.reason||''); set('rvNotes', c.notes||'');
    const pab = document.getElementById('priorApprovalBox');
    if(c.priorApproval && c.priorApproval.required){
      if(pab) pab.style.display = 'block';
      set('paStatus', c.priorApproval.status || 'not-requested');
      set('paRefNumber', c.priorApproval.refNumber || '');
      set('paDate', c.priorApproval.date || '');
      if(typeof updatePAWarning === 'function') updatePAWarning();
    } else {
      if(pab) pab.style.display = 'none';
    }
    document.querySelectorAll('#reviewModal .rv-type-btn').forEach(b => b.classList.toggle('active', b.dataset.claimType === (c.type||'employee')));
  } catch(e){}
  try {
    if (c.reviewProgress) {
      rvActiveInvoiceIdx = Number(c.reviewProgress.invoiceIdx) || rvActiveInvoiceIdx || 0;
      rvActivePatientIdx = Number(c.reviewProgress.patientIdx) || rvActivePatientIdx || 0;
    }
  } catch(e){}
  if(typeof renderReviewInvoices === 'function') renderReviewInvoices();
  if (typeof renderExceptions === 'function') { clearTimeout(window._excDebounce); window._excDebounce = setTimeout(renderExceptions, 120); }
  const s = upsertCurrentSession();
  if(s){ s.status = 'active'; activeSessionId = s.id; persistSessions(); if(typeof startSessionTimeTracker === 'function') startSessionTimeTracker(s); }
  clearSessionDirty();
  try { navigateTo('review', {noPush:false}); } catch(e){}
  try { renderReviewInvoices(); } catch(e){}
  updateSessionsBadge();
}
function closeReview(opts){
  const isModalOpen = $('#reviewModal') && $('#reviewModal').classList.contains('open');
  if(!isModalOpen && currentPage !== 'review') return;
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
  if(typeof stopSessionTimeTracker === 'function') stopSessionTimeTracker();
  activeSessionId = null;
  clearSessionDirty();
  if($('#reviewModal')) $('#reviewModal').classList.remove('open');
  try { _unlockBodyScroll(); } catch(e){}
  activeClaim = null; workingInvoices = [];
  rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
  updateSessionsBadge();
  if(currentPage === 'sessions') renderSessions();
  try {
    if(currentPage === 'review'){
      if(typeof goBack === 'function') goBack(); else navigateTo('claims',{noPush:true});
    }
  } catch(e){}
}
