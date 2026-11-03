// review-bind.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
/* تبديل مستند مريض — منطق خالص (يُختبر آليًا). لا يرمي أبدًا؛ يعيد {ok,msg}. */
function togglePatientDoc(invIdx, patIdx, key, checked){
  try {
    if(typeof workingInvoices === 'undefined' || !Array.isArray(workingInvoices)) return { ok:false, msg:'لا توجد مساحة مراجعة نشطة' };
    const inv = workingInvoices[Number(invIdx)];
    if(!inv) return { ok:false, msg:'المذكرة غير موجودة — حدّث الصفحة وأعد فتح المراجعة' };
    const pi = Number(patIdx);
    const pat = inv.patients && inv.patients[pi];
    if(!pat) return { ok:false, msg:'المريض غير موجود في هذه المذكرة' };
    if(!key) return { ok:false, msg:'مفتاح المستند مفقود' };
    if(!pat.documents) pat.documents = {};
    pat.documents[key] = !!checked;
    return { ok:true, msg:'' };
  } catch(e){ return { ok:false, msg:String((e && e.message) || e) }; }
}
/* تبديل مستند مذكرة — منطق خالص (يُختبر آليًا). */
function toggleInvoiceDoc(invIdx, key, checked){
  try {
    if(typeof workingInvoices === 'undefined' || !Array.isArray(workingInvoices)) return { ok:false, msg:'لا توجد مساحة مراجعة نشطة' };
    const inv = workingInvoices[Number(invIdx)];
    if(!inv) return { ok:false, msg:'المذكرة غير موجودة — حدّث الصفحة وأعد فتح المراجعة' };
    if(!key) return { ok:false, msg:'مفتاح المستند مفقود' };
    if(!inv.documents) inv.documents = {};
    inv.documents[key] = !!checked;
    return { ok:true, msg:'' };
  } catch(e){ return { ok:false, msg:String((e && e.message) || e) }; }
}
function bindReviewModal(){
  $$('[data-close]').forEach(el => el.addEventListener('click', () => closeReview()));
  const pa = document.getElementById('paStatus') || document.getElementById('rvPagePaStatus');
  if(pa) pa.addEventListener('change', updatePAWarning);
  const sr = document.getElementById('saveReview') || document.getElementById('rvPageSave');
  if(sr) sr.addEventListener('click', saveReview);
  const sd = document.getElementById('rvPageSaveDraft');
  if(sd && !sd.dataset.bound){ sd.dataset.bound='1'; sd.addEventListener('click', () => { const li = document.getElementById('rvDraftLabel'); saveReviewDraft(li ? li.value.trim() : ''); if(li) li.value=''; }); }
  const dbox = document.getElementById('rvDraftsBox');
  if(dbox && !dbox.dataset.bound){ dbox.dataset.bound='1'; dbox.addEventListener('click', (e) => {
    const rs = e.target.closest('[data-restore-draft]'); if(rs){ restoreReviewDraft(rs.dataset.restoreDraft); return; }
    const dl = e.target.closest('[data-delete-draft]'); if(dl){ deleteReviewDraft(dl.dataset.deleteDraft); return; }
  }); }
  const sb = document.getElementById('rvPageBack');
  if(sb && !sb.dataset.bound) { sb.dataset.bound='1'; sb.addEventListener('click', () => closeReview()); }
  const st = document.getElementById('rvPageViewTimelineBtn');
  if(st && !st.dataset.bound) { st.dataset.bound='1'; st.addEventListener('click', () => { const id = (document.getElementById('rvPageId')||{}).value || (document.getElementById('rvId')||{}).value; if(!id) return; try{ closeReview(); }catch(e){} openTimeline(id); }); }

  // نوع المطالبة
  $$('.rv-type-btn').forEach(btn => btn.addEventListener('click', () => {
    if(!activeClaim) return;
    activeClaim.type = btn.dataset.claimType;
    $$('.rv-type-btn').forEach(b => b.classList.toggle('active', b === btn));
    workingInvoices.forEach(inv => { inv.claimType = btn.dataset.claimType; });
    markSessionDirty(); renderActiveInvoice(); recalcReview();
  }));

  // تبويبات الفواتير
  $('#rvInvoiceTabs').addEventListener('click', e => {
    if(e.target.closest('[data-add-invoice]')){ openInvoiceEditor(); return; }
    const tab = e.target.closest('[data-inv-idx]'); if(!tab) return;
    rvActiveInvoiceIdx = Number(tab.dataset.invIdx); rvActivePatientIdx = 0; renderReviewInvoices();
    if(typeof updateCurrentReviewProgressPoint === 'function' && activeClaim) updateCurrentReviewProgressPoint(activeClaim.id, rvActiveInvoiceIdx, rvActivePatientIdx, 0);
  });
  const pageInvoiceTabs = document.getElementById('rvPageInvoiceTabs');
  if(pageInvoiceTabs && !pageInvoiceTabs.dataset.bound){
    pageInvoiceTabs.dataset.bound = '1';
    pageInvoiceTabs.addEventListener('click', e => {
      if(e.target.closest('[data-add-invoice]')){ openInvoiceEditor(); return; }
      const tab = e.target.closest('[data-inv-idx]'); if(!tab) return;
      rvActiveInvoiceIdx = Number(tab.dataset.invIdx); rvActivePatientIdx = 0; renderReviewInvoices();
      if(typeof updateCurrentReviewProgressPoint === 'function' && activeClaim) updateCurrentReviewProgressPoint(activeClaim.id, rvActiveInvoiceIdx, rvActivePatientIdx, 0);
    });
  }

  // لوحة الفاتورة
  function _invoicePanelClick(e){
    const _pc0 = e.target.closest('[data-pat-idx]');
    if(_pc0) rvActivePatientIdx = Number(_pc0.dataset.patIdx);
    if(e.target.closest('[data-add-invoice]')){ openInvoiceEditor(); return; }
    if(e.target.closest('[data-add-patient]')){ openPatientEditor(rvActiveInvoiceIdx); return; }
    if(e.target.closest('[data-legal-print]')){ if(typeof printLegalIssuance === 'function' && typeof activeClaim !== 'undefined' && activeClaim) printLegalIssuance(activeClaim.id); return; }
    if(e.target.closest('[data-run-tests]')){ if(e._testsRunning) return; e._testsRunning = true; Promise.resolve().then(async () => { try { const r = (typeof runEngineTests==='function') ? runEngineTests() : null; const ri = (typeof runIntegrationTests==='function') ? runIntegrationTests() : null; const rm = (typeof runReviewModelTests==='function') ? runReviewModelTests() : null; const rs = (typeof runSplashTests==='function') ? await runSplashTests() : null; const ro = (typeof runOnboardingTests==='function') ? await runOnboardingTests() : null; const rl = (typeof runLoadingTests==='function') ? runLoadingTests() : null; const rpv = (typeof runProvidersTests==='function') ? runProvidersTests() : null; const rpm = (typeof runProvidersManageTests==='function') ? runProvidersManageTests() : null; const rct = (typeof runContractsTests==='function') ? runContractsTests() : null; const rcm = (typeof runContractsManageTests==='function') ? runContractsManageTests() : null; const rtf = (typeof runTariffsTests==='function') ? runTariffsTests() : null; const rtm = (typeof runTariffsManageTests==='function') ? runTariffsManageTests() : null; const rib = (typeof runInboxTests==='function') ? runInboxTests() : null; const rss = (typeof runSessionsTests==='function') ? runSessionsTests() : null; const rsv = (typeof runServicesTests==='function') ? runServicesTests() : null; const rsm = (typeof runServicesManageTests==='function') ? runServicesManageTests() : null; const rlc = (typeof runLifecycleTests==='function') ? runLifecycleTests() : null; const rmx = (typeof runMixedInvoicesTests==='function') ? runMixedInvoicesTests() : null; const rtn = (typeof runTenPatientsTests==='function') ? runTenPatientsTests() : null; const rln = (typeof runLearnTests==='function') ? runLearnTests() : null; const rrl = (typeof runRulesEngineTests==='function') ? runRulesEngineTests() : null; const rcl = (typeof runClaimsTests==='function') ? runClaimsTests() : null; const rrv = (typeof runReviewScreenTests==='function') ? runReviewScreenTests() : null; const _f = (r?r.fail:0)+(ri?ri.fail:0)+(rm?rm.fail:0)+(rs?rs.fail:0)+(ro?ro.fail:0)+(rl?rl.fail:0)+(rpv?rpv.fail:0)+(rpm?rpm.fail:0)+(rct?rct.fail:0)+(rcm?rcm.fail:0)+(rtf?rtf.fail:0)+(rtm?rtm.fail:0)+(rib?rib.fail:0)+(rss?rss.fail:0)+(rsv?rsv.fail:0)+(rsm?rsm.fail:0)+(rlc?rlc.fail:0)+(rmx?rmx.fail:0)+(rtn?rtn.fail:0)+(rln?rln.fail:0)+(rrl?rrl.fail:0)+(rcl?rcl.fail:0)+(rrv?rrv.fail:0); if(typeof showSuccess==='function') showSuccess('الاختبارات', `محرك ${(r?r.pass:0)}/${(r?r.total:0)} · تكامل ${(ri?ri.pass:0)}/${(ri?ri.total:0)} · نموذج ${(rm?rm.pass:0)}/${(rm?rm.total:0)} · بداية ${(rs?rs.pass:0)}/${(rs?rs.total:0)} · أول مرة ${(ro?ro.pass:0)}/${(ro?ro.total:0)} · تحميل ${(rl?rl.pass:0)}/${(rl?rl.total:0)} · جهات ${(rpv?rpv.pass:0)}/${(rpv?rpv.total:0)}+${(rpm?rpm.pass:0)}/${(rpm?rpm.total:0)} · عقود ${(rct?rct.pass:0)}/${(rct?rct.total:0)}+${(rcm?rcm.pass:0)}/${(rcm?rcm.total:0)} · لوائح ${(rtf?rtf.pass:0)}/${(rtf?rtf.total:0)}+${(rtm?rtm.pass:0)}/${(rtm?rtm.total:0)} · وارد ${(rib?rib.pass:0)}/${(rib?rib.total:0)} · جلسات ${(rss?rss.pass:0)}/${(rss?rss.total:0)} · خدمات ${(rsv?rsv.pass:0)}/${(rsv?rsv.total:0)}+${(rsm?rsm.pass:0)}/${(rsm?rsm.total:0)}+دورة ${(rlc?rlc.pass:0)}/${(rlc?rlc.total:0)}+مختلط ${(rmx?rmx.pass:0)}/${(rmx?rmx.total:0)}+عشرية ${(rtn?rtn.pass:0)}/${(rtn?rtn.total:0)}+تعلم ${(rln?rln.pass:0)}/${(rln?rln.total:0)}+محرك-قواعد ${(rrl?rrl.pass:0)}/${(rrl?rrl.total:0)} · مطالبات ${(rcl?rcl.pass:0)}/${(rcl?rcl.total:0)} · شاشة مراجعة ${(rrv?rrv.pass:0)}/${(rrv?rrv.total:0)}${_f?` — ${_f} فاشل`:''}`); } catch(err){ if(typeof showWarning==='function') showWarning('الاختبارات', String((err&&err.message)||err)); } }); return; }
    if(e.target.closest('[data-add-line]')){ const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv||!inv.patients||!inv.patients.length){ showWarning('تنبيه','أضف مريضاً أولاً'); return; } openLineEditor(rvActivePatientIdx); return; }
    if(e.target.closest('[data-approve-clean]')){
      const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
      let n = 0;
      (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => {
        if(!(l._checksFailed||[]).length && l._decision !== 'manual-approved'){ l._decision='manual-approved'; l._overrideMode='manual'; l._decidedBy='reviewer'; l._decidedAt=new Date().toISOString(); l._decisionNote='اعتماد جماعي نظيف'; try { if(typeof appendClaimAuditEvent==='function' && typeof activeClaim!=='undefined' && activeClaim) appendClaimAuditEvent(activeClaim,{action:'review.manual-decision',details:{line:l.code||'',decision:'approve-clean',by:'reviewer'}}); } catch(e){} n++; }
      }));
      try { if(typeof markSessionDirty==='function') markSessionDirty(); } catch(e){}
      if(typeof renderActiveInvoice==='function') renderActiveInvoice();
      if(typeof recalcReview==='function') recalcReview();
      if(typeof showSuccess==='function') showSuccess('اعتماد نظيف', `${n} بند`);
      return;
    }
    if(e.target.closest('[data-inv-collapse]')){ _collapsedInvIdx = (_collapsedInvIdx===rvActiveInvoiceIdx ? -1 : rvActiveInvoiceIdx); if(typeof renderActiveInvoice === 'function') renderActiveInvoice(); return; }
    if(e.target.closest('[data-pat-collapse]')){ _patCollapsedAll = !_patCollapsedAll; if(typeof renderActiveInvoice === 'function') renderActiveInvoice(); return; }
    if(e.target.closest('[data-edit-invoice]')){ openInvoiceEditor(rvActiveInvoiceIdx); return; }
    if(e.target.closest('[data-delete-invoice]')){ const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return; showDelete('حذف الفاتورة', `سيتم حذف "${inv.number||inv.id}".`, () => { markSessionDirty(); workingInvoices.splice(rvActiveInvoiceIdx,1); rvActiveInvoiceIdx = Math.max(0, rvActiveInvoiceIdx-1); rvActivePatientIdx = 0; renderReviewInvoices(); }); return; }
    if(e.target.closest('[data-edit-patient]')){ openPatientEditor(rvActiveInvoiceIdx, rvActivePatientIdx); return; }
    const patTab = e.target.closest('[data-pat-idx]'); if(patTab){ rvActivePatientIdx = Number(patTab.dataset.patIdx); renderActiveInvoice(); if(typeof renderExceptions==='function') renderExceptions(); if(typeof renderFinalSummary==='function') renderFinalSummary(); if(typeof updateCurrentReviewProgressPoint === 'function' && activeClaim) updateCurrentReviewProgressPoint(activeClaim.id, rvActiveInvoiceIdx, rvActivePatientIdx, 0); return; }
    const editL = e.target.closest('[data-edit-line]'); if(editL){ openLineEditor(rvActivePatientIdx, Number(editL.dataset.editLine)); return; }
    const delL = e.target.closest('[data-del-line]'); if(delL){ const inv = workingInvoices[rvActiveInvoiceIdx]; const pat = inv&&inv.patients?inv.patients[rvActivePatientIdx]:null; if(!pat) return; const idx = Number(delL.dataset.delLine); showDelete('حذف البند','سيتم حذف هذا البند.', () => { markSessionDirty(); pat.lines.splice(idx,1); renderActiveInvoice(); recalcReview(); }); return; }

    const inv = workingInvoices[rvActiveInvoiceIdx];
    const pat = inv && inv.patients ? inv.patients[rvActivePatientIdx] : null;
    if(!pat) return;

    // تجاوزات المريض
    if(e.target.closest('[data-revert-cap]')){ markSessionDirty(); pat._capMode='reverted'; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-reset-cap]')){ markSessionDirty(); pat._capMode='auto'; pat._manualCapAmount=null; pat._capNote=''; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-manual-cap-toggle]')){ markSessionDirty(); pat._capMode='manual'; pat._manualCapAmount = pat._capAmt||0; if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('manual-cap', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal: pat._subtotal||0, value: pat._manualCapAmount, auto: pat._capAmt||0, note: (pat._capNote||'') }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); } renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-revert-copay]')){ markSessionDirty(); pat._copayMode='reverted'; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-reset-copay]')){ markSessionDirty(); pat._copayMode='auto'; pat._manualCopayAmount=null; pat._copayNote=''; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-manual-copay-toggle]')){ markSessionDirty(); pat._copayMode='manual'; pat._manualCopayAmount = pat._copayAmt||0; if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('manual-copay', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal: pat._subtotal||0, value: pat._manualCopayAmount, auto: pat._copayAmt||0, note: (pat._copayNote||'') }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); } renderActiveInvoice(); recalcReview(); return; }

    // تجاوزات البند
    const rvl = e.target.closest('[data-revert-line]'); if(rvl){ markSessionDirty(); pat.lines[Number(rvl.dataset.revertLine)]._overrideMode='reverted'; renderActiveInvoice(); recalcReview(); return; }
    const rsl = e.target.closest('[data-reset-line]'); if(rsl){ markSessionDirty(); const l = pat.lines[Number(rsl.dataset.resetLine)]; l._overrideMode='auto'; l._manualValue=null; l._maxlabsForced = false; renderActiveInvoice(); recalcReview(); return; }

    // إعادة تطبيق
    if(e.target.closest('[data-reapply-all]')){
      markSessionDirty();
      workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => {
        p.lines.forEach(l => { if(l._overrideMode!=='manual' && l._overrideMode!=='reverted' && !l._maxlabsForced) l._overrideMode='auto'; });
        if(p._capMode!=='manual' && p._capMode!=='reverted') p._capMode='auto';
        if(p._copayMode!=='manual' && p._copayMode!=='reverted') p._copayMode='auto';
        computePatient(p, activeClaim, inv.date, inv);
      }));
      renderActiveInvoice(); recalcReview(); showSuccess('تم','تم إعادة التطبيق'); return;
    }

    const rb = e.target.closest('[data-rule]'); if(rb){ applyReviewRule(rb.dataset.rule); return; }
  }
  const _ip = document.getElementById('rvInvoicePanel');
  if(_ip && !_ip.dataset.bound){ _ip.dataset.bound='1'; _ip.addEventListener('click', _invoicePanelClick); }
  const _ipp = document.getElementById('rvPageInvoicePanel');
  if(_ipp && !_ipp.dataset.bound){ _ipp.dataset.bound='1'; _ipp.addEventListener('click', _invoicePanelClick); }
  function _invoicePanelChange(e){
    const internalCheck = e.target.closest('[data-internal-review]');
    if(internalCheck){ const inv=workingInvoices[rvActiveInvoiceIdx]; if(!inv)return; if(!inv.internalReview)inv.internalReview={}; inv.internalReview[internalCheck.dataset.internalReview]=internalCheck.checked; markSessionDirty(); if(typeof recalcReview==='function') recalcReview(); if(typeof renderExceptions==='function') renderExceptions(); return; }
    if(e.target.matches('[data-internal-review-note]')){ const inv=workingInvoices[rvActiveInvoiceIdx]; if(!inv)return; if(!inv.internalReview)inv.internalReview={}; inv.internalReview.note=e.target.value; markSessionDirty(); return; }
    if(e.target.matches('[data-manual-cap-note]')){ const inv=workingInvoices[rvActiveInvoiceIdx]; if(!inv)return; const p=inv.patients[rvActivePatientIdx]; if(!p)return; p._capNote=e.target.value; markSessionDirty(); if(typeof learnRuleFromReviewer === 'function' && p._capMode==='manual') learnRuleFromReviewer('manual-cap', { claim:(typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal:p._subtotal||0, value:p._manualCapAmount, auto:p._capAmt||0, note:p._capNote||'' }); return; }
    if(e.target.matches('[data-manual-copay-note]')){ const inv=workingInvoices[rvActiveInvoiceIdx]; if(!inv)return; const p=inv.patients[rvActivePatientIdx]; if(!p)return; p._copayNote=e.target.value; markSessionDirty(); if(typeof learnRuleFromReviewer === 'function' && p._copayMode==='manual') learnRuleFromReviewer('manual-copay', { claim:(typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal:p._subtotal||0, value:p._manualCopayAmount, auto:p._copayAmt||0, note:p._copayNote||'' }); return; }
    const doc = e.target.closest('[data-doc]'); if(doc){
      const _dr = (typeof toggleInvoiceDoc === 'function') ? toggleInvoiceDoc(rvActiveInvoiceIdx, doc.dataset.doc, doc.checked) : { ok:false, msg:'غير متاح' };
      if(!_dr.ok){ if(typeof showWarning === 'function') showWarning('تعذّر تحديد المستند', _dr.msg || 'تعذّر حفظ التحديد'); else if(typeof showToast === 'function') showToast('⚠ تعذّر تحديد المستند'); return; }
      try {
        const _lbl = doc.closest('.rv-doc');
        if(_lbl){ _lbl.classList.toggle('ok', !!doc.checked); _lbl.classList.toggle('miss', !doc.checked); }
      } catch(e){}
      markSessionDirty();
      return;
    }
    const pdoc = e.target.closest('[data-pat-doc]'); if(pdoc){
      const _dr = (typeof togglePatientDoc === 'function') ? togglePatientDoc(rvActiveInvoiceIdx, pdoc.dataset.patIdx, pdoc.dataset.patDoc, pdoc.checked) : { ok:false, msg:'غير متاح' };
      if(!_dr.ok){ if(typeof showWarning === 'function') showWarning('تعذّر تحديد المستند', _dr.msg || 'تعذّر حفظ التحديد'); else if(typeof showToast === 'function') showToast('⚠ تعذّر تحديد المستند'); return; }
      try {
        const _lbl = pdoc.closest('.rv-doc');
        if(_lbl){ _lbl.classList.toggle('ok', !!pdoc.checked); _lbl.classList.toggle('miss', !pdoc.checked); }
      } catch(e){}
      markSessionDirty();
      return;
    }
  }
  const _ipc = document.getElementById('rvInvoicePanel');
  if(_ipc && !_ipc.dataset.changeBound){ _ipc.dataset.changeBound='1'; _ipc.addEventListener('change', _invoicePanelChange); }
  const _ipcp = document.getElementById('rvPageInvoicePanel');
  if(_ipcp && !_ipcp.dataset.changeBound){ _ipcp.dataset.changeBound='1'; _ipcp.addEventListener('change', _invoicePanelChange); }

  // تعديل القيم يدوياً
  function _invoicePanelInput(e){
    const _pcIn = e.target.closest('[data-pat-idx]');
    const _patIdxIn = _pcIn ? Number(_pcIn.dataset.patIdx) : rvActivePatientIdx;
    if(e.target.classList.contains('rv-manual-input') && e.target.dataset.manualCap !== undefined){
      const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
      const p = inv.patients[_patIdxIn]; if(!p) return;
      rvActivePatientIdx = _patIdxIn; p._capMode='manual'; p._manualCapAmount = Math.max(0, Number(e.target.value)||0); if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('manual-cap', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal: p._subtotal||0, value: p._manualCapAmount, auto: p._capAmt||0, note: (p._capNote||'') }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); } recalcReview(); return;
    }
    if(e.target.classList.contains('rv-manual-input') && e.target.dataset.manualCopay !== undefined){
      const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
      const p = inv.patients[_patIdxIn]; if(!p) return;
      rvActivePatientIdx = _patIdxIn; p._copayMode='manual'; p._manualCopayAmount = Math.max(0, Number(e.target.value)||0); if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('manual-copay', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), subtotal: p._subtotal||0, value: p._manualCopayAmount, auto: p._copayAmt||0, note: (p._copayNote||'') }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); } recalcReview(); return;
    }
    if(!e.target.classList.contains('rv-line-approved')) return;
    const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
    const pat = inv.patients[_patIdxIn]; if(!pat) return;
    rvActivePatientIdx = _patIdxIn;
    const i = Number(e.target.dataset.lineIdx); const line = pat.lines[i]; if(!line) return;
    const billed = line.qty*line.billedUnit;
    let v = Number(e.target.value); if(isNaN(v)||v<0) v = 0; if(v>billed){ v = billed; e.target.value = v; }
    line.approved = v; line._overrideMode='manual'; line._manualValue = v; line._maxlabsForced = false;
    const row = e.target.closest('tr'); const diffCell = row.querySelector('.rv-diff');
    if(diffCell){ const d = billed-v; diffCell.textContent = fmt(d); diffCell.style.color = d>0?'var(--bad)':'var(--muted)'; }
    row.classList.toggle('rejected', v===0);
    recalcReview();
  }
  const _ipi = document.getElementById('rvInvoicePanel');
  if(_ipi && !_ipi.dataset.inputBound){ _ipi.dataset.inputBound='1'; _ipi.addEventListener('input', _invoicePanelInput); }
  const _ipip = document.getElementById('rvPageInvoicePanel');
  if(_ipip && !_ipip.dataset.inputBound){ _ipip.dataset.inputBound='1'; _ipip.addEventListener('input', _invoicePanelInput); }

  // ربط النوافذ الفرعية
  $$('[data-close-invoice]').forEach(el => el.addEventListener('click', closeInvoiceEditor));
  $('#invType').addEventListener('change', toggleInpatientFields);
  $('#saveInvoiceBtn').addEventListener('click', () => saveInvoiceEditor(false));
  $$('[data-close-patient]').forEach(el => el.addEventListener('click', closePatientEditor));
  $('#savePatientBtn').addEventListener('click', savePatientEditor);
  $$('[data-close-line]').forEach(el => el.addEventListener('click', closeLineEditor));
  $('#saveLineBtn').addEventListener('click', saveLineEditor);
  $('#rvViewTimelineBtn').addEventListener('click', () => { const id = $('#rvId').value; if(!id) return; closeReview(); openTimeline(id); });
  bindLineSmartForm();

  // تبويبات المراجعة
  const rvTabsAll = document.querySelectorAll('#reviewModal .rv-tabs, #page-review .rv-tabs, #page-review .rv-invoice-review-block .rv-tabs');
  rvTabsAll.forEach(rvTabs => {
    if (rvTabs.dataset.bound) return;
    rvTabs.dataset.bound = '1';
    rvTabs.addEventListener('click', e => {
      const btn = e.target.closest('[data-rv-tab]'); if(!btn) return;
      const tab = btn.dataset.rvTab;
      const scope = rvTabs.closest('.rv-invoice-review-block') || rvTabs.closest('#page-review') || document;
      scope.querySelectorAll('.rv-tab').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      scope.querySelectorAll('.rv-tab-panel').forEach(p => p.style.display = 'none');
      let panel = scope.querySelector('#rvTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if(!panel) panel = scope.querySelector('#rvPageTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (panel) panel.style.display = '';
      if (tab === 'exceptions') renderExceptions();
      if (tab === 'final') {
        if (typeof renderFinalSummary === 'function') renderFinalSummary();
      }
    });
  });

  // binding exceptions — تفويض واحد على مستوى المستند يخدم السطحين (صفحة/مودال).
  if (!document.body.dataset.excBound) {
    document.body.dataset.excBound = '1';
    document.addEventListener('click', e => {
      const reopen = e.target.closest('[data-exc-reopen]');
      if (reopen) {
        const key = reopen.dataset.excReopen;
        const [ii, pi, li] = key.split('-').map(Number);
        const inv = workingInvoices[ii]; const pat = inv && inv.patients ? inv.patients[pi] : null; const ln = pat && pat.lines ? pat.lines[li] : null;
        if (!ln) return;
        markSessionDirty();
        delete ln._decidedBy; delete ln._decidedAt; delete ln._decisionNote; delete ln._manualValue;
        ln._decision = 'needs-attention';
        ln._overrideMode = 'auto';
        ln._suggestedAction = ln._suggestedAction || { type: 'review', reason: (ln._checksFailed||[])[0] };
        workingInvoices.forEach(inv2 => (inv2.patients||[]).forEach(p => computePatient(p, activeClaim, inv2.date, inv2)));
        recalcReview();
        renderExceptions();
        renderActiveInvoice();
        return;
      }
      const btn = e.target.closest('[data-exc-act]'); if(!btn) return;
      const key = btn.dataset.excKey;
      const [ii, pi, li] = key.split('-').map(Number);
      const inv = workingInvoices[ii]; const pat = inv && inv.patients ? inv.patients[pi] : null; const ln = pat && pat.lines ? pat.lines[li] : null;
      if (!ln) return;
      const _scopeBox = (btn && btn.closest && (btn.closest('#rvExceptions') || btn.closest('#rvPageExceptions'))) || document;
      const noteInput = _scopeBox.querySelector(`[data-exc-note="${key}"]`);
      const note = noteInput ? noteInput.value.trim() : '';
      const act = btn.dataset.excAct;
      const _conflictCodes = ['cap-conflict','copay-conflict','rule-overlap','rule-cycle','rule-requires-missing'];
      const _hasConflictQ = (ln._checksFailed||[]).some(r => _conflictCodes.includes(r));
      if(_hasConflictQ && (act === 'approve' || act === 'reduce' || act === 'reject') && !note){ showWarning('تنبيه','هذا البند معلق بسؤال (تعارض) — سجّل سبب الحسم في الملاحظة'); return; }
      markSessionDirty();
      if (act === 'approve') {
        try { if(typeof appendClaimAuditEvent==='function' && typeof activeClaim!=='undefined' && activeClaim) appendClaimAuditEvent(activeClaim,{action:'review.manual-decision',details:{line:ln.code||'',decision:'approve',note:note||'',by:'reviewer'}}); } catch(e){}
        ln._decision = 'manual-approved';
        ln._overrideMode = 'manual';
        ln._manualValue = ln._contractCovered ? (ln.lineBaseAfterContract !== undefined ? ln.lineBaseAfterContract : ln.lineBase) : 0;
        ln.approved = ln._manualValue;
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
      } else if (act === 'reject') {
        if (!note) { showWarning('تنبيه','الملاحظة إلزامية للرفض'); return; }
        try { if(typeof appendClaimAuditEvent==='function' && typeof activeClaim!=='undefined' && activeClaim) appendClaimAuditEvent(activeClaim,{action:'review.manual-decision',details:{line:ln.code||'',decision:'reject',note:note||'',by:'reviewer'}}); } catch(e){}
        ln._decision = 'manual-rejected';
        ln._overrideMode = 'manual';
        ln._manualValue = 0;
        ln.approved = 0;
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
        if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('line-reject', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), line: ln, note }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); }
      } else if (act === 'reduce') {
        const reduceWrap = _scopeBox.querySelector(`[data-exc-reduce="${key}"]`);
        if (reduceWrap) reduceWrap.style.display = '';
        const valInput = _scopeBox.querySelector(`[data-exc-reduce-val="${key}"]`);
        if (!valInput) return;
        const v = Number(valInput.value);
        if (isNaN(v) || v < 0) { showWarning('تنبيه','أدخل مبلغًا صالحًا'); return; }
        if (v > (ln._contractCovered ? (ln.lineBaseAfterContract||ln.lineBase||0) : 0)) { showWarning('تنبيه','المبلغ يتجاوز المعتمد'); return; }
        if (v < (ln._contractCovered ? (ln.lineBaseAfterContract||ln.lineBase||0) : 0) && !note) { showWarning('تنبيه','الملاحظة إلزامية للتخفيض'); return; }
        try { if(typeof appendClaimAuditEvent==='function' && typeof activeClaim!=='undefined' && activeClaim) appendClaimAuditEvent(activeClaim,{action:'review.manual-decision',details:{line:ln.code||'',decision:'reduce',value:v,note:note||'',by:'reviewer'}}); } catch(e){}
        ln._decision = 'manual-reduced';
        ln._overrideMode = 'manual';
        ln._manualValue = v;
        ln.approved = v;
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
        if(typeof learnRuleFromReviewer === 'function'){ const _lr = learnRuleFromReviewer('line-reduce', { claim: (typeof activeClaim !== 'undefined' ? activeClaim : null), line: ln, base: (ln._contractCovered ? (ln.lineBaseAfterContract||ln.lineBase||0) : 0), value: v, note }); if(_lr && _lr !== 'exists' && _lr !== 'updated' && typeof offerApplyLearnedRule === 'function') offerApplyLearnedRule(_lr); }
      } else if (act === 'pa') {
        ln._decision = 'pa-pending';
        ln._overrideMode = 'auto';
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
      }
      // قرار المراجع الصريح يحسم سؤال التعارض — تُرفع الأعلام عن هذا البند ويُسجَّل قراره.
      if(act === 'approve' || act === 'reduce' || act === 'reject'){
        ['cap-conflict','copay-conflict','rule-overlap','rule-cycle','rule-requires-missing'].forEach(c => {
          if((ln._checksFailed||[]).includes(c)){ ln._checksFailed = ln._checksFailed.filter(x => x !== c); }
        });
        const _stillQ = (ln._checksFailed||[]).some(r => ['cap-conflict','copay-conflict','rule-overlap','rule-cycle','rule-requires-missing'].includes(r));
        if(!_stillQ) ln._conflictForced = false;
      }
      // recalc
      workingInvoices.forEach(inv2 => (inv2.patients||[]).forEach(p => computePatient(p, activeClaim, inv2.date, inv2)));
      recalcReview();
      renderExceptions();
      renderActiveInvoice();
    });
  }

  // gating finalize button on checklist checkboxes
  const finalPanel = document.getElementById('rvTabFinal');
  if (finalPanel && !finalPanel.dataset.checkBound) {
    finalPanel.dataset.checkBound = '1';
    finalPanel.addEventListener('change', e => {
      if (!e.target.classList.contains('final-check')) return;
      const checks = finalPanel.querySelectorAll('.final-check');
      const all = Array.from(checks).every(c => c.checked);
      const btn = document.getElementById('finalizeReviewBtn');
      if (btn) btn.disabled = !all;
    });
  }

  const fh = document.getElementById('rvPageFinalizeHeaderBtn');
  if (fh && !fh.dataset.bound) { fh.dataset.bound='1'; fh.addEventListener('click', () => { const b = document.getElementById('rvPageFinalizeBtn') || document.getElementById('finalizeReviewBtn'); if(b) b.click(); }); }
  const finBtn = document.getElementById('finalizeReviewBtn') || document.getElementById('rvPageFinalizeBtn');
  if (finBtn && !finBtn.dataset.bound) {
    finBtn.dataset.bound = '1';
    finBtn.addEventListener('click', () => {
      // validation — بوابة مشتركة واحدة مع الحفظ (validateReviewForSign).
      const v = (typeof validateReviewForSign === 'function') ? validateReviewForSign() : { missing:[] };
      const { missingDocs, finalReason, decision } = v;
      const missing = v.missing || [];

      if (missing.length) {
        const msg = 'لا يمكن إتمام التوقيع — ' + missing.length + ' نقص:\n\n• ' + missing.join('\n• ') + '\n\n[العودة للمعالجة]   [تجاوز وتوقيع مع توثيق]';
        const ok = confirm(msg + '\n\nتجاوز وتوقيع؟');
        if (!ok) return;
        const overrideReason = prompt('سبب التجاوز (إلزامي):');
        if (!overrideReason || !overrideReason.trim()) { showWarning('تنبيه','سبب التجاوز إلزامي'); return; }
        if (!activeClaim._overrideChecklist) activeClaim._overrideChecklist = [];
        activeClaim._overrideChecklist.push({ by: (appSettings && appSettings.reviewer && appSettings.reviewer.name) || 'المراجع', at: new Date().toISOString(), reason: overrideReason.trim(), missing: missing.slice() });
      }

      // signature dialog
      const approved = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+(p._final||0),0),0);
      const billed = (v && typeof v.billed === 'number') ? v.billed : (activeClaim ? (Number(activeClaim.billed)||0) : 0);
      const ded = billed - approved;
      const sig = confirm(`توقيع المراجعة\n\nالمطالبة: ${activeClaim.id}\nالمطالب: ${fmt(billed)}\nالمعتمد: ${fmt(approved)}\nالاستقطاع: ${fmt(ded)}\nالقرار: ${decision}\nالسبب: ${finalReason||'—'}\n\nأقر بأنني راجعت هذه المطالبة.`);
      if (!sig) return;

      // apply decision to claim
      activeClaim._signedOff = true;
      activeClaim._reviewedBy = (appSettings && appSettings.reviewer && appSettings.reviewer.name) || 'المراجع';
      activeClaim._reviewedAt = new Date().toISOString();
      activeClaim._locked = true;
      activeClaim._decision = decision;
      activeClaim.reason = finalReason || activeClaim.reason || '';
      activeClaim.notes = ((document.getElementById('rvFinalNotes')||document.getElementById('rvPageFinalNotes')) ? ((document.getElementById('rvFinalNotes')||document.getElementById('rvPageFinalNotes')).value.trim()) : '') || activeClaim.notes || '';

      // sync rvReason select
      const rvReason = document.getElementById('rvReason') || document.getElementById('rvPageReason');
      if (rvReason && finalReason) rvReason.value = finalReason;

      saveReview();
    });
  }

  // تتبع التعديلات الحقيقية
  const rvModal = $('#reviewModal');
  if(rvModal){
    rvModal.addEventListener('input', markSessionDirty);
    rvModal.addEventListener('change', markSessionDirty);
  }
}
