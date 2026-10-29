function renderReviewInvoices(){
  if(!workingInvoices.length){
    $('#rvInvoiceTabs').innerHTML = '<button type="button" class="rv-add-tab" data-add-invoice="1">+ إضافة فاتورة</button>';
    $('#rvInvoicePanel').innerHTML = '<div class="rv-empty">لا فواتير</div>';
    recalcReview(); return;
  }
  $('#rvInvoiceTabs').innerHTML = workingInvoices.map((inv,i) => {
    const t = INVOICE_TYPES[inv.type] || {label:inv.type};
    const tot = invoiceTotals(inv);
    return `<button type="button" class="rv-inv-tab ${i===rvActiveInvoiceIdx?'active':''}" data-inv-idx="${i}"><span>${t.label}</span><span class="cnt">${(inv.patients||[]).length} مريض</span><span class="amt">${fmt(tot.billed)}</span></button>`;
  }).join('') + '<button type="button" class="rv-add-tab" data-add-invoice="1">+ فاتورة</button>';
  renderActiveInvoice(); recalcReview();
}
function reviewLineRow(ln, i){
  const billed = ln.qty*ln.billedUnit;
  const hasT = ln.tariffUnit !== null && ln.tariffUnit !== undefined;
  const tt = hasT ? ln.qty*ln.tariffUnit : null;
  const lesser = ln.lineBase !== undefined ? ln.lineBase : (hasT ? Math.min(billed, tt) : billed);
  const appr = Number(ln.approved)||0;
  const diff = billed-appr;
  const mode = ln._overrideMode || 'auto';
  const flags = [];
  if(hasT && ln.billedUnit > ln.tariffUnit) flags.push('أعلى من اللائحة');
  if(hasT && ln.tariffUnit === 0) flags.push('غير مغطاة');
  if(ln.note) flags.push(ln.note);
  let status = '';
  if(ln._maxlabsForced) status = '<span class="rv-auto-badge auto">حد تحاليل</span>';
  else if(ln.paRejected) status = '<span class="rv-auto-badge rejected">مرفوض PA</span>';
  else if(mode === 'manual') status = '<span class="rv-auto-badge manual">يدوي</span>';
  else if(mode === 'reverted') status = '<span class="rv-auto-badge reverted">معاد</span>';
  else if(ln._compositeApplied && ln._compositeApplied.length) status = `<span class="rv-auto-badge auto">🎁 ${escapeHtml(ln._compositeApplied[0].name)}</span>`;
  else if(ln._autoRuleId) status = `<span class="rv-auto-badge auto">${ln._autoRuleRate}%${ln._appliedRuleIds&&ln._appliedRuleIds.length>1?' 🔗':''}</span>`;
  let rowCls = '';
  if(appr === 0) rowCls = 'rejected';
  else if(mode === 'manual') rowCls = 'flagged';
  else if(ln._autoRuleId && ln._autoApproved < ln.lineBase) rowCls = 'flagged';
  const hasAuto = (ln._appliedRuleIds && ln._appliedRuleIds.length > 0) && ln._autoApproved < ln.lineBase;
  const btns = `
    ${mode==='auto' && hasAuto ? `<button type="button" class="rv-ov-btn undo" data-revert-line="${i}">↺</button>` : ''}
    ${mode!=='auto' ? `<button type="button" class="rv-ov-btn reset" data-reset-line="${i}">⟲</button>` : ''}
    <button type="button" class="rv-line-act edit" data-edit-line="${i}">✎</button>
    <button type="button" class="rv-line-act del" data-del-line="${i}">×</button>`;
  const flagsHtml = flags.length ? ' · <span style="color:var(--warn);font-weight:700">' + flags.map(escapeHtml).join(' · ') + '</span>' : '';
  const autoRuleHtml = ln._autoRuleName ? ' · <span style="color:var(--info);font-weight:700">📋 ' + escapeHtml(ln._autoRuleName) + '</span>' : '';
  return `<tr class="${rowCls}">
    <td>${i+1}</td>
    <td><span class="mono" style="color:var(--navy-400);font-weight:700">${escapeHtml(ln.code)}</span></td>
    <td><div style="font-weight:700;font-size:12.5px">${escapeHtml(ln.name)}</div>
        <div style="font-size:10.5px;color:var(--muted);margin-top:1px">${escapeHtml(ln.category)}${flagsHtml}${autoRuleHtml}</div></td>
    <td class="mono">${ln.qty}</td>
    <td class="mono">${fmt(billed)}</td>
    <td class="mono">${hasT?fmt(tt):'—'}</td>
    <td class="mono" style="color:var(--teal);font-weight:800">${fmt(lesser)}</td>
    <td><input type="number" class="rv-line-approved" data-line-idx="${i}" value="${appr}" min="0" max="${billed}"></td>
    <td class="mono rv-diff" style="color:${diff>0?'var(--bad)':'var(--muted)'};font-weight:800">${fmt(diff)}</td>
    <td style="text-align:center">${status}</td>
    <td style="white-space:nowrap"><div style="display:flex;gap:2px">${btns}</div></td>
  </tr>`;
}
function renderActiveInvoice(){
  const inv = workingInvoices[rvActiveInvoiceIdx]; const box = $('#rvInvoicePanel');
  if(!inv){ box.innerHTML = ''; return; }
  if(!inv.patients) inv.patients = [];
  if(rvActivePatientIdx >= inv.patients.length) rvActivePatientIdx = 0;
  const pat = inv.patients[rvActivePatientIdx];
  const t = INVOICE_TYPES[inv.type] || {label:inv.type};
  const tot = invoiceTotals(inv);
  const docs = DOC_ITEMS.map(d => { const on = !!inv.documents[d.key]; return `<label class="rv-doc ${on?'ok':'miss'}"><input type="checkbox" data-doc="${d.key}" ${on?'checked':''}>${d.label}</label>`; }).join('');
  const patTabs = inv.patients.map((p,i) => `<button type="button" class="rv-patient-tab ${i===rvActivePatientIdx?'active':''}" data-pat-idx="${i}"><span>${escapeHtml(p.name)}</span><span class="cnt">${(p.lines||[]).length}</span></button>`).join('') + '<button type="button" class="rv-add-tab" data-add-patient="1">+ مريض</button>';
  const rules = `<div class="rv-rule-bar"><button type="button" class="rv-rule-btn" data-rule="lesser">اعتماد الأقل</button><button type="button" class="rv-rule-btn" data-rule="billed">اعتماد كامل</button><button type="button" class="rv-rule-btn danger" data-rule="reject">رفض الكل</button><button type="button" class="rv-rule-btn warn" data-rule="maxlabs">حد التحاليل (${REVIEW_RULES.maxLabsPerVisit})</button></div>`;
  let patInfo = '', linesHtml = '';
  if(pat){
    computePatient(pat, activeClaim, inv.date, inv);
    const benType = patientBeneficiaryType(pat, activeClaim);
    const rej = (pat.lines||[]).filter(l=>l.paRejected).length;
    const capMode = pat._capMode || 'auto';
    const capLabel = capMode==='manual'?'يدوي':capMode==='reverted'?'معاد':(pat._autoCapRule?'تلقائي':'—');
    const capRow = pat._autoCapRule || capMode !== 'auto' ? `<div class="rv-pat-auto-row ${capMode==='manual'?'manual':(capMode==='reverted'?'reverted':'')}"><span class="lbl">🛡️ سقف (${pat._autoCapRule?pat._autoCapRule.rate+'%':''}) <span class="rv-auto-badge ${capMode==='manual'?'manual':capMode==='reverted'?'reverted':'auto'}">${capLabel}</span></span>${capMode==='manual'?`<input type="number" class="rv-manual-input" data-manual-cap="1" value="${pat._manualCapAmount||0}" min="0" max="${pat._subtotal}">`:`<span class="amt">${pat._capAmt?fmtC(pat._capAmt):'—'}</span><button type="button" class="rv-ov-btn" data-manual-cap-toggle="1" title="يدوي">✎</button>`}${pat._autoCapRule?`<span class="rule-name">${escapeHtml(pat._autoCapRule.name)}</span>`:''}${capMode==='auto'&&pat._autoCapAmt>0?`<button type="button" class="rv-ov-btn undo" data-revert-cap="1">↺</button>`:''}${capMode!=='auto'?`<button type="button" class="rv-ov-btn reset" data-reset-cap="1">⟲</button>`:''}</div>` : '';
    const copayMode = pat._copayMode || 'auto';
    const copayLabel = copayMode==='manual'?'يدوي':copayMode==='reverted'?'معاد':(pat._autoCopayRule?'تلقائي':'—');
    const copayRow = pat._autoCopayRule || copayMode !== 'auto' ? `<div class="rv-pat-auto-row ${copayMode==='manual'?'manual':(copayMode==='reverted'?'reverted':'')}"><span class="lbl">💰 تحمل (${pat._autoCopayRule?pat._autoCopayRule.rate+'%':''}) <span class="rv-auto-badge ${copayMode==='manual'?'manual':copayMode==='reverted'?'reverted':'auto'}">${copayLabel}</span></span>${copayMode==='manual'?`<input type="number" class="rv-manual-input" data-manual-copay="1" value="${pat._manualCopayAmount||0}" min="0" max="${pat._subtotal-pat._capAmt}">`:`<span class="amt">${pat._copayAmt?fmtC(pat._copayAmt):'—'}</span><button type="button" class="rv-ov-btn" data-manual-copay-toggle="1" title="يدوي">✎</button>`}${pat._autoCopayRule?`<span class="rule-name">${escapeHtml(pat._autoCopayRule.name)}</span>`:''}${copayMode==='auto'&&pat._autoCopayAmt>0?`<button type="button" class="rv-ov-btn undo" data-revert-copay="1">↺</button>`:''}${copayMode!=='auto'?`<button type="button" class="rv-ov-btn reset" data-reset-copay="1">⟲</button>`:''}</div>` : '';
    const autoBlock = (capRow||copayRow) ? `<div class="rv-pat-auto ${capMode==='manual'?'has-manual':pat._autoCapAmt>0?'has-auto':''}">${capRow}${copayRow}</div>` : '';
    patInfo = `<div class="rv-patient-info"><div class="rv-pinfo"><span>المريض</span><b>${escapeHtml(pat.name)}</b></div><div class="rv-pinfo"><span>الهوية</span><b>${escapeHtml(pat.nationalId||'—')}</b></div><div class="rv-pinfo"><span>النوع</span><b>${benType==='retiree'?'متقاعد':'عامل'}</b></div></div>
      <div class="rv-patient-calc"><div class="rv-pcalc-item"><span>إجمالي المريض</span><b>${fmtC(pat._subtotal)}</b></div><div class="rv-pcalc-item ded"><span>سقف</span><b>${pat._capAmt?fmtC(pat._capAmt):'—'}</b></div><div class="rv-pcalc-item ded"><span>تحمل</span><b>${pat._copayAmt?fmtC(pat._copayAmt):'—'}</b></div><div class="rv-pcalc-item ok"><span>المعتمد</span><b>${fmtC(pat._final)}</b></div></div>
      ${autoBlock}
      ${rej>0?`<div class="rv-pa-reject-note">⛔ ${rej} بند مرفوض — متقاعد بدون موافقة</div>`:''}`;
    linesHtml = pat.lines.length ? pat.lines.map((ln,i)=>reviewLineRow(ln,i)).join('') : '<tr><td colspan="11" style="text-align:center;padding:18px;color:var(--muted)">لا بنود</td></tr>';
  } else {
    patInfo = '<div class="rv-empty-patient">لا مرضى</div>';
    linesHtml = '<tr><td colspan="11" style="text-align:center;padding:18px;color:var(--muted)">—</td></tr>';
  }
  box.innerHTML = `
    <div class="rv-inv-meta">
      <div class="rv-meta-item"><span>النوع</span><b>${t.label}</b></div>
      <div class="rv-meta-item"><span>رقم</span><b>${escapeHtml(inv.number||inv.id)}</b></div>
      <div class="rv-meta-item"><span>التاريخ</span><b>${inv.date||'—'}</b></div>
      <div class="rv-meta-item"><span>${inv.type==='inpatient'?'الإقامة':'عدد المرضى'}</span><b>${inv.type==='inpatient'?(inv.admissionDate||'—')+' ← '+(inv.dischargeDate||'—'):inv.patients.length}</b></div>
    </div>
    <div class="rv-inv-actions">
      <button type="button" class="rv-act-btn primary" data-add-patient="1">مريض</button>
      <button type="button" class="rv-act-btn primary" data-add-line="1">بند</button>
      ${pat?`<button type="button" class="rv-act-btn ghost" data-edit-patient="1">تعديل المريض</button>`:''}
      <button type="button" class="rv-act-btn ghost" data-edit-invoice="1">تعديل الفاتورة</button>
      <button type="button" class="rv-act-btn danger" data-delete-invoice="1">حذف الفاتورة</button>
    </div>
    <div class="rv-inv-total"><span>مطالب: <b>${fmtC(tot.billed)}</b></span><span>معتمد: <b style="color:var(--ok)">${fmtC(tot.approved)}</b></span><span>استقطاع: <b style="color:var(--bad)">${fmtC(tot.deduction)}</b></span></div>
    <div class="rv-section-title">المستندات</div>
    <div class="rv-docs">${docs}</div>
    <div class="rv-section-title">المرضى</div>
    <div class="rv-patient-tabs">${patTabs}</div>
    ${patInfo}
    <div class="rv-section-title">بنود المريض</div>
    ${rules}
    <div class="rv-lines-wrap"><table class="rv-lines-table"><thead><tr><th>#</th><th>الكود</th><th>البند</th><th>كمية</th><th>فاتورة</th><th>لائحة</th><th>الأقل</th><th>معتمد</th><th>فرق</th><th>حالة</th><th></th></tr></thead><tbody>${linesHtml}</tbody></table></div>
    <div class="rv-reapply-bar"><span>📋 القواعد نشطة</span><button type="button" data-reapply-all="1">⟲ إعادة تطبيق</button></div>`;
}
function recalcReview(){
  let billed = 0, eligible = 0, finalApproved = 0;
  workingInvoices.forEach(inv => (inv.patients||[]).forEach(pat => {
    computePatient(pat, activeClaim, inv.date, inv);
    billed += (pat.lines||[]).reduce((s,l)=>s + (Number(l.qty)||0)*(Number(l.billedUnit)||0), 0);
    eligible += pat._subtotal || 0;
    finalApproved += pat._final || 0;
  }));
  const ded = Math.max(0, billed-finalApproved);
  const rate = billed ? (ded/billed*100) : 0;
  $('#calcBilled').textContent = fmtC(billed);
  $('#calcDed').textContent = fmtC(ded);
  $('#calcRate').textContent = rate.toFixed(1)+'%';
}
function applyReviewRule(rule){
  markSessionDirty();
  const inv = workingInvoices[rvActiveInvoiceIdx]; if(!inv||!inv.patients||!inv.patients.length) return;
  const pat = inv.patients[rvActivePatientIdx]; if(!pat) return;
  if(rule === 'maxlabs'){ applyMaxLabsRule(pat); renderActiveInvoice(); recalcReview(); return; }
  pat.lines.forEach(l => {
    const billed = l.qty*l.billedUnit;
    const hasT = l.tariffUnit !== null && l.tariffUnit !== undefined;
    const tt = hasT ? l.qty*l.tariffUnit : billed;
    if(rule === 'lesser'){ l.approved = Math.min(billed, tt); l._overrideMode='manual'; l._manualValue = l.approved; l.note=''; l._maxlabsForced = false; }
    else if(rule === 'billed'){ l.approved = billed; l._overrideMode='manual'; l._manualValue = billed; l.note=''; l._maxlabsForced = false; }
    else if(rule === 'reject'){ l.approved = 0; l._overrideMode='manual'; l._manualValue = 0; l._maxlabsForced = false; }
  });
  renderActiveInvoice(); recalcReview();
}
