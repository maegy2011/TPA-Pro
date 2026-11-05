// claims-view-2.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function applyMaxLabsRule(pat){
  markSessionDirty();
  const max = REVIEW_RULES.maxLabsPerVisit;
  const idxs = [];
  (pat.lines||[]).forEach((l,i) => { if(REVIEW_RULES.labCategories.includes(l.category)) idxs.push(i); });
  if(idxs.length <= max){ showWarning('لا حاجة', `عدد التحاليل ${idxs.length} ≤ ${max}.`); return; }
  const excess = idxs.length - max;
  // الاحتفاظ بأعلى التحاليل تكلفة وخصم الأقل تكلفة عند تجاوز الحد.
  const sorted = idxs.slice().sort((a,b) =>
    ((Number(pat.lines[a].qty)||0)*(Number(pat.lines[a].billedUnit)||0)) -
    ((Number(pat.lines[b].qty)||0)*(Number(pat.lines[b].billedUnit)||0))
  );
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
  const missing = []; // مستندات مذكرة الخصم حُذفت؛ يكتفى بمستندات المريض
  if(missing.length){ showWarning('مستندات ناقصة', missing.join('<br>')+'<br><br>متابعة؟', () => { if(!activeClaim._overrideChecklist) activeClaim._overrideChecklist=[]; activeClaim._overrideChecklist.push({ by:'reviewer', at:new Date().toISOString(), reason:'missing-docs', missing:missing.slice() }); finalizeReview(); }); return; }
  if(activeClaim.priorApproval && activeClaim.priorApproval.required && activeClaim.priorApproval.status !== 'approved'){ showWarning('موافقة ناقصة','متابعة؟', () => { if(!activeClaim._overrideChecklist) activeClaim._overrideChecklist=[]; activeClaim._overrideChecklist.push({ by:'reviewer', at:new Date().toISOString(), reason:'prior-approval', missing:['pa'] }); finalizeReview(); }); return; }
  finalizeReview();
}
/* ---------- مسودات المراجعة: نسخ عمل متعددة + اعتماد واحدة ---------- */
const REVIEW_DRAFTS_MAX = 10;
function _draftTotals(invoices){
  let billed = 0, approved = 0;
  (invoices||[]).forEach(inv => (inv.patients||[]).forEach(p => {
    billed += (p.lines||[]).reduce((s,l) => s + (Number(l.qty)||0)*(Number(l.billedUnit)||0), 0);
    approved += Number(p._final||0);
  }));
  return { billed: Math.round(billed), approved: Math.round(approved) };
}
function saveReviewDraft(label){
  if(!activeClaim || !Array.isArray(workingInvoices)){
    if(typeof showWarning === 'function') showWarning('لا توجد مراجعة نشطة', 'افتح مطالبة للمراجعة أولًا ثم احفظ المسودة.');
    else if(typeof showToast === 'function') showToast('⚠ لا توجد مراجعة نشطة');
    return;
  }
  try {
  if(!Array.isArray(activeClaim._reviewDrafts)) activeClaim._reviewDrafts = [];
  workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => { if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv); }));
  const t = _draftTotals(workingInvoices);
  const reviewer = (typeof appSettings !== 'undefined' && appSettings.reviewer && appSettings.reviewer.name) || 'المراجع';
  activeClaim._reviewDrafts.push({
    id: 'DRF-' + Date.now().toString(36),
    at: new Date().toISOString(), actor: String(reviewer).slice(0,120),
    label: String(label || '').slice(0,120),
    billed: t.billed, approved: t.approved,
    reason: ((document.getElementById('rvPageReason')||document.getElementById('rvReason')||{}).value)||'',
    notes: ((document.getElementById('rvPageNotes')||document.getElementById('rvNotes')||{}).value||'').trim(),
    invoices: JSON.parse(JSON.stringify(workingInvoices))
  });
  while(activeClaim._reviewDrafts.length > REVIEW_DRAFTS_MAX) activeClaim._reviewDrafts.shift();
  if(typeof appendClaimAuditEvent === 'function') appendClaimAuditEvent(activeClaim, { action:'review.draft-saved', details:{ draft: activeClaim._reviewDrafts[activeClaim._reviewDrafts.length-1].id, label: String(label||''), billed: t.billed, approved: t.approved } });
  if(typeof persistData === 'function'){
    let _ok = persistData(true);
    if(!_ok && activeClaim._reviewDrafts.length > 1){ activeClaim._reviewDrafts.shift(); _ok = persistData(true); }
    if(_ok){ if(typeof notifyPersistOk === 'function') notifyPersistOk(); }
    else { activeClaim._reviewDrafts.pop(); if(typeof notifyPersistFailed === 'function') notifyPersistFailed(true); return; }
  }
  if(typeof renderReviewDrafts === 'function') renderReviewDrafts();
  if(typeof showSuccess === 'function') showSuccess('مسودة محفوظة', `المعتمد في هذه المسودة: ${fmt(t.approved)}`);
  } catch(err){
    try { console.error('saveReviewDraft failed', err); } catch(e){}
    if(typeof showWarning === 'function') showWarning('تعذّر حفظ المسودة', String((err?.message) || err));
    else if(typeof showToast === 'function') showToast('⚠ تعذّر حفظ المسودة');
  }
}
function restoreReviewDraft(id){
  if(!activeClaim) return;
  const d = (activeClaim._reviewDrafts||[]).find(x => x.id === id); if(!d) return;
  const apply = () => {
    workingInvoices = JSON.parse(JSON.stringify(d.invoices));
    rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
    workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => { if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv); }));
    const rr = document.getElementById('rvPageReason')||document.getElementById('rvReason'); if(rr && d.reason !== undefined) rr.value = d.reason;
    const nn = document.getElementById('rvPageNotes')||document.getElementById('rvNotes'); if(nn && d.notes !== undefined) nn.value = d.notes;
    markSessionDirty(); renderActiveInvoice(); recalcReview();
    if(typeof appendClaimAuditEvent === 'function') appendClaimAuditEvent(activeClaim, { action:'review.draft-restored', details:{ draft: id, label: d.label||'' } });
    if(typeof persistData === 'function' && !persistData(true)){ if(typeof notifyPersistFailed === 'function') notifyPersistFailed(true); }
    if(typeof showSuccess === 'function') showSuccess('تم', 'حُمّلت المسودة في مساحة العمل — راجع ثم احفظ أو اعتمد');
  };
  if(typeof isSessionDirty === 'function' && isSessionDirty()){ showWarning('مساحة العمل متغيرة', 'يوجد تعديلات غير محفوظة ستُستبدل بالمسودة. متابعة؟', apply); return; }
  apply();
}
function deleteReviewDraft(id){
  if(!activeClaim) return;
  showDelete('حذف المسودة', 'سيتم حذف هذه المسودة نهائيًا.', () => {
    activeClaim._reviewDrafts = (activeClaim._reviewDrafts||[]).filter(x => x.id !== id);
    if(typeof appendClaimAuditEvent === 'function') appendClaimAuditEvent(activeClaim, { action:'review.draft-deleted', details:{ draft: id } });
    if(typeof persistData === 'function' && !persistData(true)){ if(typeof notifyPersistFailed === 'function') notifyPersistFailed(true); }
    if(typeof renderReviewDrafts === 'function') renderReviewDrafts();
  });
}
function renderReviewDrafts(){
  const box = document.getElementById('rvDraftsBox'); if(!box) return;
  const drafts = (activeClaim && Array.isArray(activeClaim._reviewDrafts)) ? [...activeClaim._reviewDrafts].reverse() : [];
  const cnt = document.getElementById('rvDraftsCount'); if(cnt) cnt.textContent = String(drafts.length);
  if(!drafts.length){ box.innerHTML = '<div style="font-size:11px;color:var(--muted)">لا مسودات بعد — احفظ نسخة قبل التجربة.</div>'; return; }
  box.innerHTML = drafts.map(d => `
    <div class="rv-draft-row" style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:6px;padding:6px 8px;font-size:12px">
      <div style="flex:1;min-width:0">
        <b>${escapeHtml(d.label || 'مسودة بلا اسم')}</b>
        <span style="color:var(--muted)"> · ${escapeHtml((d.at||'').slice(0,16).replace('T',' '))} · ${escapeHtml(d.actor||'')}</span>
        <div style="color:var(--muted)">المطالب: ${fmt(d.billed||0)} · المعتمد: ${fmt(d.approved||0)}</div>
      </div>
      <button type="button" class="rv-ov-btn" data-restore-draft="${escapeHtml(d.id)}" title="استعادة في مساحة العمل">⤺</button>
      <button type="button" class="rv-ov-btn reset" data-delete-draft="${escapeHtml(d.id)}" title="حذف">✕</button>
    </div>`).join('');
}
function finalizeReview(){
  if(!activeClaim) return;
  let pendingCount = 0;
  if (typeof validateReviewForSign === 'function') {
    const v = validateReviewForSign();
    pendingCount = (v.pendingN||0) + (v.paN||0);
    if (pendingCount > 0) { showWarning('استثناءات معلّقة', `بقي ${pendingCount} استثناء في المطالبة. انتقل إلى كل مريض وعالج استثناءاته قبل الحفظ.`); return; }
  } else if (typeof collectExceptions === 'function') {
    (workingInvoices||[]).forEach(inv => (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => {
      if(l._decision === 'needs-attention' || l._decision === 'pa-pending') pendingCount++;
    })));
    if (pendingCount > 0) { showWarning('استثناءات معلّقة', `بقي ${pendingCount} استثناء في المطالبة. انتقل إلى كل مريض وعالج استثناءاته قبل الحفظ.`); return; }
  }
  // بوابة السبب الإلزامي تعمل دائمًا — لا تعتمد على وجود collectExceptions.
  const _noCapNote = [];
  (workingInvoices||[]).forEach(inv => (inv.patients||[]).forEach((p, pi) => {
    if(p._capMode === 'manual' && Number(p._manualCapAmount||0) !== Number(p._autoCapAmt||0) && !(p._capNote||'').trim()) _noCapNote.push(`مريض ${pi+1}: سقف يدوي بلا سبب`);
    if(p._copayMode === 'manual' && Number(p._manualCopayAmount||0) !== Number(p._autoCopayAmt||0) && !(p._copayNote||'').trim()) _noCapNote.push(`مريض ${pi+1}: تحمل يدوي بلا سبب`);
  }));
  if(_noCapNote.length){ showWarning('سبب إلزامي', _noCapNote.join('<br>')+'<br><br>سجّل السبب بجانب حقل السقف/التحمل اليدوي.'); return; }
  const cid = activeClaim.id;
  // أرشفة تلقائية: النسخة المعتمدة السابقة تُحفظ كمسودة قبل الكتابة فوقها — لا يضيع تاريخ.
  if(activeClaim.reviewedDate && Array.isArray(activeClaim.invoices) && activeClaim.invoices.length){
    if(!Array.isArray(activeClaim._reviewDrafts)) activeClaim._reviewDrafts = [];
    const _pt = _draftTotals(activeClaim.invoices);
    activeClaim._reviewDrafts.push({ id:'DRF-'+Date.now().toString(36), at:new Date().toISOString(),
      actor: ((typeof appSettings !== 'undefined' && appSettings.reviewer && appSettings.reviewer.name)||'المراجع'),
      label:'نسخة معتمدة سابقة (أرشيف تلقائي)', billed:_pt.billed, approved:_pt.approved,
      reason: activeClaim.reason||'', notes: activeClaim.notes||'',
      invoices: JSON.parse(JSON.stringify(activeClaim.invoices)) });
    while(activeClaim._reviewDrafts.length > REVIEW_DRAFTS_MAX) activeClaim._reviewDrafts.shift();
  }
  activeClaim.invoices = JSON.parse(JSON.stringify(workingInvoices));
  activeClaim.invoices.forEach((inv, _ii) => { if(!inv.legalSerial && typeof nextLegalSerial === 'function') inv.legalSerial = nextLegalSerial(inv, _ii); });
  activeClaim._recalcUnlock = true;
  activeClaim.invoices.forEach(inv => (inv.patients||[]).forEach(p => computePatient(p, activeClaim, inv.date, inv)));
  activeClaim.reason = $('#rvReason').value;
  activeClaim.notes = $('#rvNotes').value.trim();
  if(activeClaim.priorApproval && activeClaim.priorApproval.required){
    activeClaim.priorApproval.status = $('#paStatus').value;
    activeClaim.priorApproval.refNumber = $('#paRefNumber').value.trim();
    activeClaim.priorApproval.date = $('#paDate').value;
  }
  recalcClaim(activeClaim);
  delete activeClaim._recalcUnlock;
  // مطالبات الوارد تُنشأ بحالة new ولا شيء يقلبها pending — الختم عند أول حفظ مراجعة من أي حالة مفتوحة.
  if(['new','pending'].includes(activeClaim.status)) activeClaim.reviewedDate = daysFromNow(0);
  if(activeClaim.approved <= 0) activeClaim.status = 'rejected';
  else if(activeClaim.approved >= activeClaim.billed) activeClaim.status = 'approved';
  else activeClaim.status = 'partial';
  if (typeof appendClaimAuditEvent === 'function') {
    appendClaimAuditEvent(activeClaim, {
      action: activeClaim._signedOff ? 'review.signed-off' : 'review.saved',
      details: {
        decision: activeClaim._decision || activeClaim.status,
        status: activeClaim.status,
        submittedBilled: Number.isFinite(Number(activeClaim.submittedBilled)) ? Number(activeClaim.submittedBilled) : null,
        billed: Number(activeClaim.billed) || 0,
        approved: Number(activeClaim.approved) || 0,
        overrideCount: Array.isArray(activeClaim._overrideChecklist) ? activeClaim._overrideChecklist.length : 0,
        reason: String(activeClaim.reason || '').slice(0,500)
      }
    });
  }
  workSessions = workSessions.filter(x => x.claimId !== activeClaim.id);
  persistSessions();
  if (typeof persistData === 'function'){
    const _ok = persistData(true);
    if(_ok){ if(typeof notifyPersistOk === 'function') notifyPersistOk(); }
    else if(typeof notifyPersistFailed === 'function') notifyPersistFailed(true);
  }
  try { if(typeof fsWriteClaim === 'function' && typeof FS_STORE !== 'undefined' && FS_STORE.dirHandle){ Promise.resolve(fsWriteClaim(activeClaim)).catch(() => { if(typeof showToast === 'function') showToast('⚠ تعذرت كتابة ملف القرص'); }); } } catch(e){}
  clearSessionDirty();
  closeReview({ discard:true });
  renderAll();
  if(currentTimelineClaimId === cid) renderTimeline();
  showSuccess('تم','تم حفظ المراجعة');
  // Phase 4: انتقال للجلسة التالية
  const next = workSessions.find(s => s.status === 'paused');
  if (next) {
    setTimeout(() => {
      if (confirm(`هناك ${workSessions.length} جلسة موقوفة. فتح التالية (${next.claimId})؟`)) {
        resumeSession(next.id);
      }
    }, 400);
  }
}
