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
  bindLineSmartForm();

  // تبويبات المراجعة
  const rvTabs = document.querySelector('#reviewModal .rv-tabs');
  if (rvTabs && !rvTabs.dataset.bound) {
    rvTabs.dataset.bound = '1';
    rvTabs.addEventListener('click', e => {
      const btn = e.target.closest('[data-rv-tab]'); if(!btn) return;
      const tab = btn.dataset.rvTab;
      $$('.rv-tab').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      $$('.rv-tab-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById('rvTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (panel) panel.style.display = '';
      if (tab === 'exceptions') renderExceptions();
      if (tab === 'final') {
        if (typeof renderFinalSummary === 'function') renderFinalSummary();
      }
    });
  }

  // binding exceptions
  const excBox = document.getElementById('rvExceptions');
  if (excBox && !excBox.dataset.bound) {
    excBox.dataset.bound = '1';
    excBox.addEventListener('click', e => {
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
      const noteInput = excBox.querySelector(`[data-exc-note="${key}"]`);
      const note = noteInput ? noteInput.value.trim() : '';
      const act = btn.dataset.excAct;
      markSessionDirty();
      if (act === 'approve') {
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
        ln._decision = 'manual-rejected';
        ln._overrideMode = 'manual';
        ln._manualValue = 0;
        ln.approved = 0;
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
      } else if (act === 'reduce') {
        const reduceWrap = excBox.querySelector(`[data-exc-reduce="${key}"]`);
        if (reduceWrap) reduceWrap.style.display = '';
        const valInput = excBox.querySelector(`[data-exc-reduce-val="${key}"]`);
        if (!valInput) return;
        const v = Number(valInput.value);
        if (isNaN(v) || v < 0) { showWarning('تنبيه','أدخل مبلغًا صالحًا'); return; }
        if (v > (ln._contractCovered ? (ln.lineBaseAfterContract||ln.lineBase||0) : 0)) { showWarning('تنبيه','المبلغ يتجاوز المعتمد'); return; }
        if (v < (ln._contractCovered ? (ln.lineBaseAfterContract||ln.lineBase||0) : 0) && !note) { showWarning('تنبيه','الملاحظة إلزامية للتخفيض'); return; }
        ln._decision = 'manual-reduced';
        ln._overrideMode = 'manual';
        ln._manualValue = v;
        ln.approved = v;
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
      } else if (act === 'pa') {
        ln._decision = 'pa-pending';
        ln._overrideMode = 'auto';
        ln._decidedBy = 'reviewer';
        ln._decidedAt = new Date().toISOString();
        ln._decisionReason = (ln._checksFailed||[])[0] || '';
        ln._decisionNote = note;
      }
      // recalc
      workingInvoices.forEach(inv2 => (inv2.patients||[]).forEach(p => computePatient(p, activeClaim, inv2.date, inv2)));
      recalcReview();
      renderExceptions();
      renderActiveInvoice();
    });
  }

  const finBtn = document.getElementById('finalizeReviewBtn');
  if (finBtn && !finBtn.dataset.bound) {
    finBtn.dataset.bound = '1';
    finBtn.addEventListener('click', () => {
      // validation
      const excs = typeof collectExceptions === 'function' ? collectExceptions() : [];
      const paPending = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+(p.lines||[]).filter(l=>l._decision==='pa-pending').length,0),0);
      const billed = activeClaim ? (Number(activeClaim.billed)||0) : 0;
      let entered = 0;
      (workingInvoices||[]).forEach(inv => (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => { entered += (Number(l.qty)||0)*(Number(l.billedUnit)||0); })));
      const mismatch = Math.abs(billed - entered) > 1;
      const missingDocs = (workingInvoices||[]).reduce((s,inv)=>s+DOC_ITEMS.filter(d=>!inv.documents||!inv.documents[d.key]).length,0);
      const finalReason = document.getElementById('rvFinalReason') ? document.getElementById('rvFinalReason').value : '';
      const decision = (document.querySelector('input[name="rvDecision"]:checked')||{}).value || 'partial';
      const needsReason = (decision !== 'approved');
      const missing = [];
      if (excs.length) missing.push(`${excs.length} بند غير معالج`);
      if (paPending) missing.push(`${paPending} بند بانتظار PA`);
      if (mismatch) missing.push('الإجمالي غير مُطابق');
      if (missingDocs) missing.push(`${missingDocs} مستند ناقص`);
      if (needsReason && !finalReason) missing.push('سبب الاستقطاع العام');

      if (missing.length) {
        const msg = 'لا يمكن إتمام التوقيع — ' + missing.length + ' نقص:\n\n• ' + missing.join('\n• ') + '\n\n[العودة للمعالجة]   [تجاوز وتوقيع مع توثيق]';
        const ok = confirm(msg + '\n\nتجاوز وتوقيع؟');
        if (!ok) return;
        const overrideReason = prompt('سبب التجاوز (إلزامي):');
        if (!overrideReason || !overrideReason.trim()) { showWarning('تنبيه','سبب التجاوز إلزامي'); return; }
        if (!activeClaim._overrideChecklist) activeClaim._overrideChecklist = [];
        activeClaim._overrideChecklist.push({ by: 'reviewer', at: new Date().toISOString(), reason: overrideReason.trim(), missing: missing.slice() });
      }

      // signature dialog
      const approved = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+(p._final||0),0),0);
      const ded = billed - approved;
      const sig = confirm(`توقيع المراجعة\n\nالمطالبة: ${activeClaim.id}\nالمطالب: ${fmt(billed)}\nالمعتمد: ${fmt(approved)}\nالاستقطاع: ${fmt(ded)}\nالقرار: ${decision}\nالسبب: ${finalReason||'—'}\n\nأقر بأنني راجعت هذه المطالبة.`);
      if (!sig) return;

      // apply decision to claim
      activeClaim._signedOff = true;
      activeClaim._reviewedBy = 'reviewer';
      activeClaim._reviewedAt = new Date().toISOString();
      activeClaim._locked = true;
      activeClaim._decision = decision;
      activeClaim.reason = finalReason || activeClaim.reason || '';
      activeClaim.notes = (document.getElementById('rvFinalNotes') ? document.getElementById('rvFinalNotes').value.trim() : '') || activeClaim.notes || '';

      // sync rvReason select
      const rvReason = document.getElementById('rvReason');
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
