function bindReviewModal(){
  $$('[data-close]').forEach(el => el.addEventListener('click', () => closeReview()));
  $('#paStatus').addEventListener('change', updatePAWarning);
  $('#saveReview').addEventListener('click', saveReview);

  // نوع المطالبة
  $$('.rv-type-btn').forEach(btn => btn.addEventListener('click', () => {
    if(!activeClaim) return;
    activeClaim.type = btn.dataset.claimType;
    $$('.rv-type-btn').forEach(b => b.classList.toggle('active', b === btn));
    workingInvoices.forEach(inv => (inv.patients||[]).forEach(p => { p.beneficiaryType = btn.dataset.claimType; }));
    markSessionDirty(); renderActiveInvoice(); recalcReview();
  }));

  // تبويبات الفواتير
  $('#rvInvoiceTabs').addEventListener('click', e => {
    if(e.target.closest('[data-add-invoice]')){ openInvoiceEditor(); return; }
    const tab = e.target.closest('[data-inv-idx]'); if(!tab) return;
    rvActiveInvoiceIdx = Number(tab.dataset.invIdx); rvActivePatientIdx = 0; renderReviewInvoices();
  });

  // لوحة الفاتورة
  $('#rvInvoicePanel').addEventListener('click', e => {
    if(e.target.closest('[data-add-invoice]')){ openInvoiceEditor(); return; }
    if(e.target.closest('[data-add-patient]')){ openPatientEditor(rvActiveInvoiceIdx); return; }
    if(e.target.closest('[data-add-line]')){ const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv||!inv.patients||!inv.patients.length){ showWarning('تنبيه','أضف مريضاً أولاً'); return; } openLineEditor(rvActivePatientIdx); return; }
    if(e.target.closest('[data-edit-invoice]')){ openInvoiceEditor(rvActiveInvoiceIdx); return; }
    if(e.target.closest('[data-delete-invoice]')){ const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return; showDelete('حذف الفاتورة', `سيتم حذف "${inv.number||inv.id}".`, () => { markSessionDirty(); workingInvoices.splice(rvActiveInvoiceIdx,1); rvActiveInvoiceIdx = Math.max(0, rvActiveInvoiceIdx-1); rvActivePatientIdx = 0; renderReviewInvoices(); }); return; }
    if(e.target.closest('[data-edit-patient]')){ openPatientEditor(rvActiveInvoiceIdx, rvActivePatientIdx); return; }
    const patTab = e.target.closest('[data-pat-idx]'); if(patTab){ rvActivePatientIdx = Number(patTab.dataset.patIdx); renderActiveInvoice(); return; }
    const editL = e.target.closest('[data-edit-line]'); if(editL){ openLineEditor(rvActivePatientIdx, Number(editL.dataset.editLine)); return; }
    const delL = e.target.closest('[data-del-line]'); if(delL){ const inv = workingInvoices[rvActiveInvoiceIdx]; const pat = inv&&inv.patients?inv.patients[rvActivePatientIdx]:null; if(!pat) return; const idx = Number(delL.dataset.delLine); showDelete('حذف البند','سيتم حذف هذا البند.', () => { markSessionDirty(); pat.lines.splice(idx,1); renderActiveInvoice(); recalcReview(); }); return; }

    const inv = workingInvoices[rvActiveInvoiceIdx];
    const pat = inv && inv.patients ? inv.patients[rvActivePatientIdx] : null;
    if(!pat) return;

    // تجاوزات المريض
    if(e.target.closest('[data-revert-cap]')){ markSessionDirty(); pat._capMode='reverted'; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-reset-cap]')){ markSessionDirty(); pat._capMode='auto'; pat._manualCapAmount=null; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-manual-cap-toggle]')){ markSessionDirty(); pat._capMode='manual'; pat._manualCapAmount = pat._capAmt||0; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-revert-copay]')){ markSessionDirty(); pat._copayMode='reverted'; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-reset-copay]')){ markSessionDirty(); pat._copayMode='auto'; pat._manualCopayAmount=null; renderActiveInvoice(); recalcReview(); return; }
    if(e.target.closest('[data-manual-copay-toggle]')){ markSessionDirty(); pat._copayMode='manual'; pat._manualCopayAmount = pat._copayAmt||0; renderActiveInvoice(); recalcReview(); return; }

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
  });

  // المستندات
  $('#rvInvoicePanel').addEventListener('change', e => {
    const doc = e.target.closest('[data-doc]'); if(!doc) return;
    const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
    inv.documents[doc.dataset.doc] = doc.checked;
    doc.closest('.rv-doc').classList.toggle('ok', doc.checked);
    doc.closest('.rv-doc').classList.toggle('miss', !doc.checked);
  });

  // تعديل القيم يدوياً
  $('#rvInvoicePanel').addEventListener('input', e => {
    if(e.target.classList.contains('rv-manual-input') && e.target.dataset.manualCap !== undefined){
      const p = workingInvoices[rvActiveInvoiceIdx].patients[rvActivePatientIdx]; if(!p) return;
      p._capMode='manual'; p._manualCapAmount = Math.max(0, Number(e.target.value)||0); recalcReview(); return;
    }
    if(e.target.classList.contains('rv-manual-input') && e.target.dataset.manualCopay !== undefined){
      const p = workingInvoices[rvActiveInvoiceIdx].patients[rvActivePatientIdx]; if(!p) return;
      p._copayMode='manual'; p._manualCopayAmount = Math.max(0, Number(e.target.value)||0); recalcReview(); return;
    }
    if(!e.target.classList.contains('rv-line-approved')) return;
    const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv) return;
    const pat = inv.patients[rvActivePatientIdx]; if(!pat) return;
    const i = Number(e.target.dataset.lineIdx); const line = pat.lines[i]; if(!line) return;
    const billed = line.qty*line.billedUnit;
    let v = Number(e.target.value); if(isNaN(v)||v<0) v = 0; if(v>billed){ v = billed; e.target.value = v; }
    line.approved = v; line._overrideMode='manual'; line._manualValue = v; line._maxlabsForced = false;
    const row = e.target.closest('tr'); const diffCell = row.querySelector('.rv-diff');
    if(diffCell){ const d = billed-v; diffCell.textContent = fmt(d); diffCell.style.color = d>0?'var(--bad)':'var(--muted)'; }
    row.classList.toggle('rejected', v===0);
    recalcReview();
  });

  // ربط النوافذ الفرعية
  $$('[data-close-invoice]').forEach(el => el.addEventListener('click', closeInvoiceEditor));
  $('#invType').addEventListener('change', toggleInpatientFields);
  $('#saveInvoiceBtn').addEventListener('click', () => saveInvoiceEditor(false));
  $$('[data-close-patient]').forEach(el => el.addEventListener('click', closePatientEditor));
  $('#savePatientBtn').addEventListener('click', savePatientEditor);
  $$('[data-close-line]').forEach(el => el.addEventListener('click', closeLineEditor));
  $('#saveLineBtn').addEventListener('click', saveLineEditor);
  $('#rvViewTimelineBtn').addEventListener('click', () => { const id = $('#rvId').value; if(!id) return; closeReview(); openTimeline(id); });
  bindLineAutocomplete();

  // تتبع التعديلات الحقيقية
  const rvModal = $('#reviewModal');
  if(rvModal){
    rvModal.addEventListener('input', markSessionDirty);
    rvModal.addEventListener('change', markSessionDirty);
  }
}
