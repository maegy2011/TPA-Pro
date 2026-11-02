// claims-view.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function _fillCalc(){
  try {
    const billed = $('#calcBilled')||$('#rvPageCalcBilled');
    const ded = $('#calcDed')||$('#rvPageCalcDed');
    const rate = $('#calcRate')||$('#rvPageCalcRate');
    // recalcReview already updates
  } catch(e){}
}
function renderReviewInvoices(){
  const tabs = (currentPage === 'review' ? document.getElementById('rvPageInvoiceTabs') : null) || document.getElementById('rvInvoiceTabs') || document.getElementById('rvPageInvoiceTabs');
  const panel = (currentPage === 'review' ? document.getElementById('rvPageInvoicePanel') : null) || document.getElementById('rvInvoicePanel') || document.getElementById('rvPageInvoicePanel');
  if(!tabs || !panel){
    recalcReview(); return;
  }
  if(!workingInvoices.length){
    tabs.innerHTML = '<button type="button" class="rv-add-tab" data-add-invoice="1">+ إضافة مذكرة خصم</button>';
    panel.innerHTML = '<div class="rv-empty">لا مذكرات خصم</div>';
    recalcReview(); return;
  }
  tabs.innerHTML = workingInvoices.map((inv,i) => {
    const t = INVOICE_TYPES[inv.type] || {label:inv.type};
    const tot = invoiceTotals(inv);
    const name = inv.debitNoteNumber || inv.number || inv.id;
    const ct = inv.claimType === 'retiree' ? 'معاشات' : 'عاملين';
    return `<button type="button" class="rv-inv-tab ${i===rvActiveInvoiceIdx?'active':''}" data-inv-idx="${i}"><span>مذكرة خصم ${escapeHtml(name)} • ${ct}</span><span class="cnt">${(inv.patients||[]).length} مريض</span><span class="amt">${fmt(tot.billed)}</span></button>`;
  }).join('') + '<button type="button" class="rv-add-tab" data-add-invoice="1">+ مذكرة خصم</button>';
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
        <div style="font-size:10.5px;color:var(--muted);margin-top:1px">${escapeHtml(ln.category)}${ln._beneficiaryTypeAtProcedure ? ` · <span style="font-weight:700;color:${ln._beneficiaryTypeAtProcedure==='retiree'?'var(--warn)':'var(--ok)'}">${ln._beneficiaryTypeAtProcedure==='retiree'?'معاش':'عامل'} (${ln._ageAtProcedure===null||ln._ageAtProcedure===undefined?'سن غير محدد':ln._ageAtProcedure+' سنة'})</span>` : ''}${ln._procedureDateUsed ? ` · ${escapeHtml(ln._procedureDateUsed)}` : ''}${flagsHtml}${autoRuleHtml}</div></td>
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
function _renderDeductionReasons(p){
  if(!p.deductionReasons || !p.deductionReasons.length) return '';
  const rows = p.deductionReasons.map(dr => {
    const amt = Number(dr.amount)||0;
    if(amt <= 0) return '';
    const src = dr.source === 'manual' ? 'يدوي' : dr.source === 'rule' ? 'قاعدة' : 'تلقائي';
    const lvl = dr.level === 'patient' ? 'المريض' : dr.level === 'line' ? 'البند' : dr.level;
    return `<tr><td>${escapeHtml(dr.reason||'—')}${dr.note?'<div style="color:var(--muted);font-size:10.5px">'+escapeHtml(dr.note)+'</div>':''}</td><td style="text-align:center">${escapeHtml(src)}</td><td style="text-align:center">${escapeHtml(lvl)}</td><td class="mono" style="text-align:left;color:var(--bad);font-weight:700">${fmtC(amt)}</td></tr>`;
  }).filter(Boolean).join('');
  if(!rows) return '';
  return `<div class="rv-section-title" style="margin-top:10px">أسباب الخصم لكل مبلغ</div><div class="rv-lines-wrap"><table class="rv-lines-table"><thead><tr><th>السبب</th><th>المصدر</th><th>المستوى</th><th>المبلغ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderActiveInvoice(){
  const inv = workingInvoices[rvActiveInvoiceIdx];
  const box = (currentPage === 'review' ? document.getElementById('rvPageInvoicePanel') : null) || document.getElementById('rvInvoicePanel') || document.getElementById('rvPageInvoicePanel');
  if(!box) return;
  if(!inv){ box.innerHTML = ''; return; }
  if(!inv.patients) inv.patients = [];
  if(rvActivePatientIdx >= inv.patients.length) rvActivePatientIdx = 0;
  const t = INVOICE_TYPES[inv.type] || {label:inv.type};
  const tot = invoiceTotals(inv);
  const invDocs = '';
  const rules = `<div class="rv-rule-bar"><button type="button" class="rv-rule-btn" data-rule="lesser">اعتماد الأقل</button><button type="button" class="rv-rule-btn" data-rule="billed">اعتماد كامل</button><button type="button" class="rv-rule-btn danger" data-rule="reject">رفض الكل</button><button type="button" class="rv-rule-btn warn" data-rule="maxlabs">حد التحاليل (${REVIEW_RULES.maxLabsPerVisit})</button></div>`;

  const _isExt = isExternalInvoice(inv);
  const _lineLabel = _isExt ? 'إجراءات المريض' : 'بنود المريض';
  const sections = (inv.patients||[]).map((p, pi) => {
    computePatient(p, activeClaim, inv.date, inv);
    const benType = patientBeneficiaryType(p, activeClaim);
    const rej = (p.lines||[]).filter(l=>l.paRejected).length;
    const capMode = p._capMode || 'auto';
    const capLabel = capMode==='manual'?'يدوي':capMode==='reverted'?'معاد':(p._autoCapRule?'تلقائي':'—');
    const capRow = p._autoCapRule || capMode !== 'auto' ? `<div class="rv-pat-auto-row ${capMode==='manual'?'manual':(capMode==='reverted'?'reverted':'')}"><span class="lbl">🛡️ سقف (${p._autoCapRule?p._autoCapRule.rate+'%':''}) <span class="rv-auto-badge ${capMode==='manual'?'manual':capMode==='reverted'?'reverted':'auto'}">${capLabel}</span></span>${capMode==='manual'?`<input type="number" class="rv-manual-input" data-manual-cap="1" data-pat-idx="${pi}" value="${p._manualCapAmount||0}" min="0" max="${p._subtotal}"><input type="text" class="rv-manual-note" data-manual-cap-note="1" data-pat-idx="${pi}" value="${escapeHtml(p._capNote||'')}" placeholder="سبب السقف اليدوي *">`:`<span class="amt">${p._capAmt?fmtC(p._capAmt):'—'}</span><button type="button" class="rv-ov-btn" data-manual-cap-toggle="1" data-pat-idx="${pi}" title="يدوي">✎</button>`}${p._autoCapRule?`<span class="rule-name">${escapeHtml(p._autoCapRule.name)}</span>`:''}${capMode==='auto'&&p._autoCapAmt>0?`<button type="button" class="rv-ov-btn undo" data-revert-cap="1" data-pat-idx="${pi}">↺</button>`:''}${capMode!=='auto'?`<button type="button" class="rv-ov-btn reset" data-reset-cap="1" data-pat-idx="${pi}">⟲</button>`:''}</div>` : '';
    const copayMode = p._copayMode || 'auto';
    const copayLabel = copayMode==='manual'?'يدوي':copayMode==='reverted'?'معاد':(p._autoCopayRule?'تلقائي':'—');
    const copayRow = p._autoCopayRule || copayMode !== 'auto' ? `<div class="rv-pat-auto-row ${copayMode==='manual'?'manual':(copayMode==='reverted'?'reverted':'')}"><span class="lbl">💰 تحمل (${p._autoCopayRule?p._autoCopayRule.rate+'%':''}) <span class="rv-auto-badge ${copayMode==='manual'?'manual':copayMode==='reverted'?'reverted':'auto'}">${copayLabel}</span></span>${copayMode==='manual'?`<input type="number" class="rv-manual-input" data-manual-copay="1" data-pat-idx="${pi}" value="${p._manualCopayAmount||0}" min="0" max="${p._subtotal-p._capAmt}"><input type="text" class="rv-manual-note" data-manual-copay-note="1" data-pat-idx="${pi}" value="${escapeHtml(p._copayNote||'')}" placeholder="سبب التحمل اليدوي *">`:`<span class="amt">${p._copayAmt?fmtC(p._copayAmt):'—'}</span><button type="button" class="rv-ov-btn" data-manual-copay-toggle="1" data-pat-idx="${pi}" title="يدوي">✎</button>`}${p._autoCopayRule?`<span class="rule-name">${escapeHtml(p._autoCopayRule.name)}</span>`:''}${copayMode==='auto'&&p._autoCopayAmt>0?`<button type="button" class="rv-ov-btn undo" data-revert-copay="1" data-pat-idx="${pi}">↺</button>`:''}${copayMode!=='auto'?`<button type="button" class="rv-ov-btn reset" data-reset-copay="1" data-pat-idx="${pi}">⟲</button>`:''}</div>` : '';
    const autoBlock = (capRow||copayRow) ? `<div class="rv-pat-auto ${capMode==='manual'?'has-manual':p._autoCapAmt>0?'has-auto':''}">${capRow}${copayRow}</div>` : '';
    const patBilled = (p.lines||[]).reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.billedUnit)||0),0);
    const patDed = patBilled - (p._final||0);
    const linesHtml = (p.lines||[]).length ? (p.lines||[]).map((ln,i)=>reviewLineRow(ln,i)).join('') : '<tr><td colspan="11" style="text-align:center;padding:18px;color:var(--muted)">لا بنود</td></tr>';
    const patDocs = p.documents || {};
    const pDocsHtml = DOC_ITEMS.map(d => { const on = !!patDocs[d.key]; return `<label class="rv-doc ${on?'ok':'miss'}"><input type="checkbox" data-pat-doc="${d.key}" data-pat-idx="${pi}" ${on?'checked':''}>${d.label}</label>`; }).join('');
    return `<details class="rv-patient-details ${pi===rvActivePatientIdx?'rv-patient-reviewing':''}" data-pat-idx="${pi}" ${pi===rvActivePatientIdx?'open':''}>
      <summary class="rv-patient-summary">
        <span class="rv-patient-seq" style="margin-inline-end:6px;color:var(--teal);font-weight:800">#${pi+1}</span>
        <span class="rv-patient-name">${escapeHtml(p.name)}</span>
        <span class="rv-patient-totals">
          <span>إجمالي: <b>${fmtC(patBilled)}</b></span>
          <span>مستقطع: <b style="color:var(--bad)">${fmtC(patDed)}</b></span>
          <span>صافي: <b style="color:var(--ok)">${fmtC(p._final)}</b></span>
          <span class="rv-toggle-icon">▾</span>
        </span>
      </summary>
      <div class="rv-patient-body" style="padding:8px 4px">
        <div class="rv-patient-info"><div class="rv-pinfo"><span>المريض</span><b>${escapeHtml(p.name)}</b></div><div class="rv-pinfo"><span>الرقم القومي</span><b>${escapeHtml(p.nationalId||'—')}</b></div><div class="rv-pinfo"><span>نوع العامل / المستفيد</span><b>${benType==='retiree'?'معاش':'عامل خدمة'}</b></div></div>
        <div class="rv-patient-calc"><div class="rv-pcalc-item"><span>إجمالي المريض</span><b>${fmtC(p._subtotal)}</b></div><div class="rv-pcalc-item ded"><span>سقف</span><b>${p._capAmt?fmtC(p._capAmt):'—'}</b></div><div class="rv-pcalc-item ded"><span>تحمل</span><b>${p._copayAmt?fmtC(p._copayAmt):'—'}</b></div><div class="rv-pcalc-item ok"><span>المعتمد</span><b>${fmtC(p._final)}</b></div></div>
        ${autoBlock}
        ${rej>0?`<div class="rv-pa-reject-note">⛔ ${rej} بند مرفوض — متقاعد بدون موافقة</div>`:''}
        <div class="rv-section-title">مستندات المريض</div>
        <div class="rv-docs">${pDocsHtml}</div>
        <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap">
          <button type="button" class="rv-act-btn primary" data-edit-patient="1" data-pat-idx="${pi}">تعديل المريض</button>
          <button type="button" class="rv-act-btn primary" data-add-line="1" data-pat-idx="${pi}">+ بند</button>
        </div>
        <div class="rv-section-title">${_lineLabel}</div>
        ${rules}
        <div class="rv-lines-wrap"><table class="rv-lines-table"><thead><tr><th>#</th><th>الكود</th><th>البند</th><th>كمية</th><th>فاتورة</th><th>لائحة</th><th>الأقل</th><th>معتمد</th><th>فرق</th><th>حالة</th><th></th></tr></thead><tbody data-pat-idx="${pi}">${linesHtml}</tbody></table></div>
        ${_renderDeductionReasons(p)}
      </div>
    </details>`;
  }).join('');

  const totalBilled = (inv.patients||[]).reduce((s,p)=>s+((p.lines||[]).reduce((a,l)=>a+(Number(l.qty)||0)*(Number(l.billedUnit)||0),0)),0);
  const totalNet = (inv.patients||[]).reduce((s,p)=>s+(p._final||0),0);

  const _catLabel = isExternalInvoice(inv) ? 'خارجية' : 'داخلية';
  box.innerHTML = `
    <div class="rv-inv-meta">
      <div class="rv-meta-item"><span>نوع الفاتورة</span><b>${_catLabel}</b></div>
      <div class="rv-meta-item"><span>نوع مذكرة الخصم</span><b>${t.label}</b></div>
      <div class="rv-meta-item"><span>نوع المطالبة</span><b>${inv.claimType === 'retiree' ? 'معاشات' : 'عاملين'}</b></div>
      <div class="rv-meta-item"><span>رقم مذكرة الخصم</span><b>${escapeHtml(inv.debitNoteNumber||inv.number||inv.id)}</b></div>
      <div class="rv-meta-item"><span>رقم الفاتورة المرتبطة</span><b>${escapeHtml(inv.linkedInvoiceNumber||inv.invoiceNumber||'—')}</b></div>
      <div class="rv-meta-item"><span>المريض</span><b>${escapeHtml((inv.patients&&inv.patients[0]&&inv.patients[0].name) || '—')}</b></div>
      <div class="rv-meta-item"><span>الرقم القومي</span><b>${escapeHtml((inv.patients&&inv.patients[0]&&inv.patients[0].nationalId) || '—')}</b></div>
      <div class="rv-meta-item"><span>تاريخ</span><b>${inv.debitNoteDate||inv.date||'—'}</b></div>
      <div class="rv-meta-item"><span>${inv.type==='inpatient'?'الإقامة':'عدد المرضى'}</span><b>${inv.type==='inpatient'?(inv.admissionDate||'—')+' ← '+(inv.dischargeDate||'—'):inv.patients.length}</b></div>
      ${!_isExt ? `<div class="rv-meta-item"><span>تصنيف العملية</span><b>${(typeof OP_CLASS_CAPS !== 'undefined' && inv.operationClass && OP_CLASS_CAPS[inv.operationClass]) ? OP_CLASS_CAPS[inv.operationClass].label : '—'}</b></div><div class="rv-meta-item"><span>الباكج</span><b>${inv.packageType==='closed' ? 'مغلق ('+fmtC(Number(inv.packagePrice)||0)+')' : 'مفتوح'}</b></div>` : ''}
    </div>
    <div class="rv-inv-actions">
      <button type="button" class="rv-act-btn primary" data-add-patient="1">+ مريض</button>
      <button type="button" class="rv-act-btn ghost" data-edit-invoice="1">تعديل مذكرة الخصم</button>
      <button type="button" class="rv-act-btn danger" data-delete-invoice="1">حذف مذكرة الخصم</button>
    </div>
    <div class="rv-inv-total"><span>مطالب: <b>${fmtC(tot.billed)}</b></span><span>معتمد: <b style="color:var(--ok)">${fmtC(tot.approved)}</b></span><span>استقطاع: <b style="color:var(--bad)">${fmtC(tot.deduction)}</b></span></div>
    ${!_isExt ? (() => { const checks=[['surgery','الإجراء الجراحي ونوع العملية'],['surgeon','أتعاب الجراح'],['assistant','أتعاب مساعد الجراح'],['anesthesia','أتعاب التخدير وطبيب التخدير'],['or','استخدام وتجهيز غرفة العمليات'],['implants','الدعامات والمسامير والمستلزمات المزروعة'],['consumables','المستهلكات الطبية'],['admission','مبرر الدخول وقرار الحجز'],['stay','عدد أيام الإقامة ومطابقتها'],['room','فئة الغرفة وسعرها'],['icu','العناية المركزة ومبرراتها'],['nursing','خدمات التمريض'],['meds','الأدوية والجرعات'],['labs','التحاليل والفحوص'],['imaging','الأشعة والتقارير'],['blood','نقل الدم ومشتقاته'],['physio','العلاج الطبيعي والتأهيل'],['discharge','ملخص الخروج وخطة العلاج']]; const _base=new Set(checks.map(c=>c[0])); const saved=inv.internalReview||{}; let extra=[]; try { extra=(typeof getLineTaxonomy==='function'?getLineTaxonomy():[]).filter(t=>t.requiresChecklist&&(t.checklistKey||t.key)&&!_base.has(t.checklistKey||t.key)).map(t=>[(t.checklistKey||t.key),(t.label||t.key)+' (مخصص)']); } catch(e){} const all=checks.concat(extra); return `<details class="rv-internal-review"><summary>قائمة تدقيق الفاتورة الداخلية والعمليات والإقامة</summary><div class="rv-internal-check-grid">${all.map(([k,label])=>`<label><input type="checkbox" data-internal-review="${k}" ${saved[k]===true?'checked':''}> ${label}</label>`).join('')}</div><div class="fg" style="margin-top:8px"><label>ملاحظات المراجع على الفاتورة الداخلية</label><textarea data-internal-review-note rows="2">${escapeHtml(saved.note||'')}</textarea></div></details>`; })() : ''}
    <div class="rv-section-title">المرضى (${(inv.patients||[]).length})</div>
    <div class="rv-patients-accordion">${sections || '<div class="rv-empty">لا مرضى</div>'}</div>
    <div class="rv-patients-footer">
      <span>عدد المرضى: <b>${(inv.patients||[]).length}</b></span>
      <span>إجمالي: <b>${fmtC(totalBilled)}</b></span>
      <span>مستقطع: <b style="color:var(--bad)">${fmtC(totalBilled-totalNet)}</b></span>
      <span>صافي: <b style="color:var(--ok)">${fmtC(totalNet)}</b></span>
    </div>
    ${(() => {
      const _ext = isExternalInvoice(inv);
      const _totalDed = totalBilled - totalNet;
      if (_ext) {
        // تجميع أسباب الخصم المتكررة: سبب واحد + مجموع المبلغ + أرقام مسلسل الحالات.
        const _groups = new Map();
        (inv.patients||[]).forEach((p, pi) => (p.deductionReasons||[]).forEach(d => {
          const amt = Number(d.amount)||0; if(amt <= 0 || !d.reason) return;
          const key = `${d.reason}‖${d.source||''}`;
          if(!_groups.has(key)) _groups.set(key, { reason:d.reason, source:d.source||'', amount:0, cases:[] });
          const g = _groups.get(key); g.amount += amt; if(!g.cases.includes(pi+1)) g.cases.push(pi+1);
        }));
        const _fmtCases = (arr) => arr.length > 1 ? arr.slice(0,-1).join('، ') + ' و' + arr[arr.length-1] : String(arr[0]);
        const _grow = [..._groups.values()].sort((a,b)=>b.amount-a.amount).map(g =>
          `<tr><td>${escapeHtml(g.reason)}<div style="color:var(--muted);font-size:10.5px">الحالات رقم ${_fmtCases(g.cases)}${g.source==='manual'?' · يدوي':g.source==='rule'?' · قاعدة':''}</div></td><td class="mono" style="color:var(--bad);font-weight:700">${fmtC(g.amount)}</td></tr>`
        ).join('');
        return `<div class="rv-section-title">مذكرة الخصم (خارجية — مجمعة بالأسباب)</div>
        <div class="rv-lines-wrap"><table class="rv-lines-table"><thead><tr><th>سبب الخصم (بالحالات)</th><th>المبلغ</th></tr></thead><tbody>
          ${_grow || '<tr><td colspan="2" style="text-align:center;color:var(--muted)">لا خصومات</td></tr>'}
          <tr style="font-weight:800"><td>الإجمالي</td><td class="mono" style="color:var(--bad)">${fmtC(_totalDed)}</td></tr>
        </tbody></table></div>`;
      }
      // internal: per-line discounts
      const _rows = (inv.patients||[]).flatMap(p => (p.lines||[]).map(l => {
        const _ded = (Number(l.qty)||0)*(Number(l.billedUnit)||0) - (Number(l.approved)||0);
        if (_ded <= 0) return '';
        const _r = (l._legalDeduction && l._legalDeduction.title) || l.note || '—';
        return `<tr><td>${escapeHtml(l.code)} — ${escapeHtml(l.name)}</td><td class="mono" style="color:var(--bad);font-weight:700">${fmtC(_ded)}</td><td>${escapeHtml(_r)}</td></tr>`;
      })).filter(Boolean).join('');
      return `<div class="rv-section-title">مذكرة الخصم (داخلية — عدة بنود)</div>
      <div class="rv-lines-wrap"><table class="rv-lines-table"><thead><tr><th>البند</th><th>الخصم</th><th>السبب</th></tr></thead><tbody>
        ${_rows || '<tr><td colspan="3" style="text-align:center;color:var(--muted)">لا خصومات</td></tr>'}
        <tr style="font-weight:800"><td>الإجمالي</td><td class="mono" style="color:var(--bad)">${fmtC(_totalDed)}</td><td></td></tr>
      </tbody></table></div>`;
    })()}
    <div class="rv-reapply-bar"><span>📋 القواعد نشطة</span><button type="button" data-reapply-all="1">⟲ إعادة تطبيق</button></div>`;
  if (typeof renderExceptions === 'function') { clearTimeout(window._excDebounce); window._excDebounce = setTimeout(renderExceptions, 120); }
}

function collectExceptions(){
  // كل بنود المطالبة (كل الفواتير والمرضى) — لا المريض النشط فقط.
  const pending = [], processed = [], pa = [];
  (workingInvoices||[]).forEach((inv, ii) => (inv.patients||[]).forEach((pat, pi) => (pat.lines||[]).forEach((ln, li) => {
    const item = { inv, ii, pat, pi, ln, li };
    const d = ln._decision;
    if (d === 'needs-attention') pending.push(item);
    else if (d === 'pa-pending') pa.push(item);
    else processed.push(item);
  })));
  return { pending, processed, pa };
}
/* بوابة تحقق مشتركة للحفظ والتوقيع — مصدر واحد حتى لا يتباعد المساران. */
function validateReviewForSign(){
  const ce = (typeof collectExceptions === 'function') ? collectExceptions() : { pending:[], processed:[], pa:[] };
  const pendingN = (ce.pending||[]).length, paN = (ce.pa||[]).length;
  const billed = (typeof activeClaim !== 'undefined' && activeClaim) ? (Number(activeClaim.billed)||0) : 0;
  let entered = 0;
  (typeof workingInvoices !== 'undefined' ? workingInvoices||[] : []).forEach(inv => (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => { entered += (Number(l.qty)||0)*(Number(l.billedUnit)||0); })));
  const targetInfo = (typeof getClaimReconciliationTarget === 'function' && typeof activeClaim !== 'undefined')
    ? getClaimReconciliationTarget(activeClaim)
    : { amount: billed, source: 'legacy-billed' };
  const mismatch = Math.abs(targetInfo.amount - entered) > 1;
  const missingDocs = (typeof workingInvoices !== 'undefined' ? workingInvoices||[] : []).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+((typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []).filter(d=>!(p.documents&&p.documents[d.key])).length),0),0);
  const finalReasonEl = document.getElementById('rvFinalReason') || document.getElementById('rvPageFinalReason');
  const finalReason = finalReasonEl ? finalReasonEl.value : '';
  const decision = (document.querySelector('input[name="rvDecision"]:checked')||document.querySelector('input[name="rvPageDecision"]:checked')||{}).value || 'partial';
  const needsReason = (decision !== 'approved');
  const missing = [];
  if (pendingN + paN) missing.push(`${pendingN + paN} بند غير معالج`);
  if (mismatch) missing.push('الإجمالي غير مُطابق');
  if (missingDocs) missing.push(`${missingDocs} مستند ناقص`);
  if (needsReason && !finalReason) missing.push('سبب الاستقطاع العام');
  return { pendingN, paN, billed, entered, targetInfo, mismatch, missingDocs, finalReason, decision, needsReason, missing };
}
function _excFilter(){ return (window._excFilterVal || 'all'); }
function setExcFilter(v){ window._excFilterVal = v; renderExceptions(); }
function renderExceptions(){
  const box = document.getElementById('rvExceptions') || document.getElementById('rvPageExceptions');
  if (!box) return;
  const data = collectExceptions();
  const pending = data.pending || [], processed = data.processed || [], pa = data.pa || [];
  const cnt = document.getElementById('rvExcCount') || document.getElementById('rvPageExcCount');
  const totalPending = pending.length + pa.length;
  if (cnt) cnt.textContent = totalPending;
  const filter = _excFilter();
  const showPending = (filter === 'all' || filter === 'pending');
  const showProcessed = (filter === 'all' || filter === 'processed');
  const showPA = (filter === 'all' || filter === 'pa');

  let html = '';
  html += `<div class="rv-exc-summary">${pending.length} معلّقة · ${pa.length} بانتظار PA · ${processed.length} معالجة</div>`;
  html += `<div class="rv-exc-filter" style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap">
    <button type="button" class="btn-sm ${filter==='all'?'solid':'ghost'}" onclick="setExcFilter('all')">الكل</button>
    <button type="button" class="btn-sm ${filter==='pending'?'solid':'ghost'}" onclick="setExcFilter('pending')">معلّقة (${pending.length})</button>
    <button type="button" class="btn-sm ${filter==='processed'?'solid':'ghost'}" onclick="setExcFilter('processed')">معالجة (${processed.length})</button>
    <button type="button" class="btn-sm ${filter==='pa'?'solid':'ghost'}" onclick="setExcFilter('pa')">بانتظار PA (${pa.length})</button>
  </div>`;

  function cardPending(e){
    const ln = e.ln;
    const reasons = (ln._checksFailed||[]).map(r => reasonLabel(r)).join('، ') || '—';
    const billed = (Number(ln.qty)||0)*(Number(ln.billedUnit)||0);
    const tariffTotal = ln.tariffUnit !== null && ln.tariffUnit !== undefined ? (Number(ln.qty)||0)*Number(ln.tariffUnit) : null;
    const lesser = ln.lineBase !== undefined ? ln.lineBase : (tariffTotal !== null ? Math.min(billed, tariffTotal) : billed);
    const rate = ln._contractRate || 0;
    const after = ln._contractCovered ? Math.round(lesser*(1-rate/100)) : 0;
    const sev = (ln._checksFailed||[]).some(r => isRejectReason(r)) ? 'reject' : 'attention';
    const color = sev === 'reject' ? '#FEF2F2' : '#FFFBEB';
    return `<div class="rv-exc-card" data-exc="${e.ii}-${e.pi}-${e.li}" style="background:${color};border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="font-weight:800;color:var(--navy)">${escapeHtml(ln.code)} · ${escapeHtml(ln.name)}</div>
      <div style="font-size:11.5px;color:var(--muted);margin:4px 0">المريض: ${escapeHtml(e.pat.name)} · فاتورة ${e.inv.id||e.ii+1}</div>
      <div style="font-size:12px;margin:6px 0">فاتورة ${fmt(billed)} · لائحة ${tariffTotal!==null?fmt(tariffTotal):'—'} · الأقل ${fmt(lesser)} · خصم ${rate}% → معتمد مقترح ${fmt(after)}</div>
      <div style="font-size:12px;font-weight:700;color:var(--warn)">⚠ ${escapeHtml(reasons)}</div>
      ${ln._ruleOverlap ? `<div style="font-size:11.5px;color:var(--warn);margin:4px 0">⚖ القواعد: ${escapeHtml((ln._ruleOverlap.rules||[]).join(' × '))} — المطبق مؤقتًا (الأشد): ${fmt(ln._ruleOverlap.applied)} · التراكمي: ${fmt(ln._ruleOverlap.stacked)}</div>` : ''}
      <div style="font-size:11.5px;color:var(--muted);margin:4px 0">الاقتراح: ${escapeHtml(ln._suggestedAction?.type||'review')}</div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button type="button" class="btn-sm" data-exc-act="approve" data-exc-key="${e.ii}-${e.pi}-${e.li}">اعتماد</button>
        <button type="button" class="btn-sm" data-exc-act="reduce" data-exc-key="${e.ii}-${e.pi}-${e.li}">تخفيض</button>
        <button type="button" class="btn-sm danger" data-exc-act="reject" data-exc-key="${e.ii}-${e.pi}-${e.li}">رفض</button>
        ${(ln._checksFailed||[]).some(r=>String(r).startsWith('pa')) ? `<button type="button" class="btn-sm" data-exc-act="pa" data-exc-key="${e.ii}-${e.pi}-${e.li}">طلب موافقة</button>` : ''}
      </div>
      <div class="rv-exc-note-wrap" style="margin-top:8px">
        <input type="text" class="rv-exc-note" data-exc-note="${e.ii}-${e.pi}-${e.li}" placeholder="ملاحظة (إلزامية للرفض/التخفيض)">
      </div>
      <div class="rv-exc-reduce-wrap" style="display:none;margin-top:6px" data-exc-reduce="${e.ii}-${e.pi}-${e.li}">
        <input type="number" class="rv-exc-reduce-val" data-exc-reduce-val="${e.ii}-${e.pi}-${e.li}" min="0" max="${after}" value="${after}" placeholder="مبلغ معتمد">
      </div>
    </div>`;
  }

  function cardProcessed(e){
    const ln = e.ln;
    const billed = (Number(ln.qty)||0)*(Number(ln.billedUnit)||0);
    const status = ln._decision || 'auto-approved';
    const icon = status.includes('reject') ? '⛔' : (status.includes('reduce') ? '🔻' : '✅');
    const color = status.includes('reject') ? '#FEF2F2' : (status.includes('reduce') ? '#FFFBEB' : '#ECFDF5');
    const decided = ln._decidedAt ? new Date(ln._decidedAt).toLocaleString() : 'تلقائي';
    const by = ln._decidedBy || 'المحرك';
    const note = ln._decisionNote || ln.note || '';
    const reasons = (ln._checksFailed||[]).map(r=>reasonLabel(r)).join('، ') || '—';
    return `<div class="rv-exc-card" style="background:${color};border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px;opacity:.85">
      <div style="font-weight:800;color:var(--navy)">${icon} ${escapeHtml(ln.code)} · ${escapeHtml(ln.name)}</div>
      <div style="font-size:11.5px;color:var(--muted);margin:4px 0">المريض: ${escapeHtml(e.pat.name)} · فاتورة ${e.inv.id||e.ii+1} · ${fmt(billed)}</div>
      <div style="font-size:11.5px;color:var(--muted);margin:4px 0">سبب: ${escapeHtml(reasons)}</div>
      ${note?`<div style="font-size:11.5px;margin:4px 0">ملاحظة: ${escapeHtml(note)}</div>`:''}
      <div style="font-size:10.5px;color:var(--muted);margin:4px 0">بواسطة: ${escapeHtml(by)} · ${escapeHtml(decided)}</div>
      <div style="margin-top:6px"><button type="button" class="btn-sm ghost" data-exc-reopen="${e.ii}-${e.pi}-${e.li}">إعادة فتح</button></div>
    </div>`;
  }

  function cardPA(e){
    const ln = e.ln;
    const billed = (Number(ln.qty)||0)*(Number(ln.billedUnit)||0);
    return `<div class="rv-exc-card" style="background:#EFF6FF;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="font-weight:800;color:var(--navy)">⏳ ${escapeHtml(ln.code)} · ${escapeHtml(ln.name)}</div>
      <div style="font-size:11.5px;color:var(--muted);margin:4px 0">المريض: ${escapeHtml(e.pat.name)} · فاتورة ${e.inv.id||e.ii+1} · ${fmt(billed)}</div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button type="button" class="btn-sm" data-exc-act="approve" data-exc-key="${e.ii}-${e.pi}-${e.li}">الموافقة صادرة</button>
        <button type="button" class="btn-sm danger" data-exc-act="reject" data-exc-key="${e.ii}-${e.pi}-${e.li}">رفض</button>
      </div>
    </div>`;
  }

  if (showPending && pending.length) {
    html += `<div class="rv-exc-section-title">معلّقة (${pending.length})</div>` + pending.map(cardPending).join('');
  } else if (showPending) {
    html += `<div class="rv-empty" style="padding:12px;color:var(--ok);font-weight:700">✅ لا استثناءات معلّقة</div>`;
  }
  if (showProcessed && processed.length) {
    html += `<div class="rv-exc-section-title">معالجة (${processed.length})</div>` + processed.map(cardProcessed).join('');
  }
  if (showPA && pa.length) {
    html += `<div class="rv-exc-section-title">بانتظار PA (${pa.length})</div>` + pa.map(cardPA).join('');
  }

  if (!pending.length && !processed.length && !pa.length) {
    html = '<div class="rv-empty" style="text-align:center;padding:24px;color:var(--muted)">لا بنود بعد — أضف مذكرة خصم أولًا</div>';
  }

  box.innerHTML = html;
  const btn = document.getElementById('finalizeReviewBtn');
  if (btn) btn.disabled = (pending.length + pa.length) > 0;
}
function renderFinalSummary(){
  // numbers
  const nb = document.getElementById('rvFinalNumbers') || document.getElementById('rvPageFinalNumbers');
  if (nb) {
    let billed = 0, approved = 0;
    (workingInvoices||[]).forEach(inv => (inv.patients||[]).forEach(p => {
      if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv);
      billed += (p.lines||[]).reduce((a,l)=>a+(Number(l.qty)||0)*(Number(l.billedUnit)||0),0);
      approved += (p._final||0);
    }));
    const ded = billed - approved;
    nb.innerHTML = `<div class="calc-box"><div class="calc-item"><span>المطالب به (إجمالي المطالبة)</span><b>${fmt(billed)}</b></div><div class="calc-item ded"><span>الاستقطاع</span><b>${fmt(ded)}</b></div><div class="calc-item rate"><span>النسبة</span><b>${billed?Math.round(ded/billed*100):0}%</b></div><div class="calc-item ok"><span>المعتمد</span><b>${fmt(approved)}</b></div></div>`;
  }
  // reasons breakdown - per patient with all deduction reasons
  const rb = document.getElementById('rvFinalReasons') || document.getElementById('rvPageFinalReasons');
  if (rb) {
    let html = '<div class="rv-section-title">أسباب الخصم — كل المرضى (كل مبلغ له سبب)</div>';
    // ملخص مجمع للفواتير الخارجية: سبب واحد + المبلغ + أرقام الحالات.
    try {
      const _eg = new Map();
      (workingInvoices||[]).forEach(inv => { if(!(typeof isExternalInvoice === 'function' ? isExternalInvoice(inv) : true)) return;
        (inv.patients||[]).forEach((p, pi) => (p.deductionReasons||[]).forEach(d => {
          const amt = Number(d.amount)||0; if(amt <= 0 || !d.reason) return;
          const key = `${d.reason}‖${d.source||''}`;
          if(!_eg.has(key)) _eg.set(key, { reason:d.reason, source:d.source||'', amount:0, cases:[] });
          const g = _eg.get(key); g.amount += amt;
          const _tag = `${inv.debitNoteNumber||inv.number||inv.id}#${pi+1}`; if(!g.cases.includes(_tag)) g.cases.push(_tag);
        }));
      });
      if(_eg.size){
        const _fmtC = (arr) => arr.length > 1 ? arr.slice(0,-1).join('، ') + ' و' + arr[arr.length-1] : String(arr[0]);
        html += '<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px;background:#F8FAFC">';
        html += '<div style="font-weight:800;margin-bottom:6px">المجمع الخارجي (سبب واحد + الحالات)</div>';
        html += '<table style="width:100%;font-size:11.5px;border-collapse:collapse"><thead><tr style="background:#fff"><th style="text-align:right;padding:6px;border:1px solid var(--line)">السبب</th><th style="text-align:left;padding:6px;border:1px solid var(--line)">المبلغ</th></tr></thead><tbody>';
        [..._eg.values()].sort((a,b)=>b.amount-a.amount).forEach(g => {
          html += `<tr><td style="padding:6px;border:1px solid var(--line)">${escapeHtml(g.reason)}<div style="color:var(--muted);font-size:10.5px">الحالات: ${escapeHtml(_fmtC(g.cases))}</div></td><td style="text-align:left;padding:6px;border:1px solid var(--line);color:var(--bad);font-weight:700" class="mono">${fmtC(g.amount)}</td></tr>`;
        });
        html += '</tbody></table></div>';
      }
    } catch(e){}
    (workingInvoices||[]).forEach((inv, ii) => (inv.patients||[]).forEach((p, pi) => {
        if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv);
        const drs = p.deductionReasons || [];
        if(!drs.length) return;
        const pBilled = (p.lines||[]).reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.billedUnit)||0),0);
        const pDed = drs.reduce((s,d)=>s+(Number(d.amount)||0),0);
        html += `<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px;background:#fff">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div><b>${escapeHtml(p.name)}</b> <span style="color:var(--muted);font-size:11px">مذكرة خصم ${escapeHtml(inv.debitNoteNumber||inv.number||inv.id)} | فاتورة مرتبطة ${escapeHtml(inv.linkedInvoiceNumber||inv.invoiceNumber||'—')}</span></div><div style="font-size:12px">مطالب: <b>${fmtC(pBilled)}</b> · مستقطع: <b style="color:var(--bad)">${fmtC(pDed)}</b> · معتمد: <b style="color:var(--ok)">${fmtC(p._final||0)}</b></div></div>`;
        html += `<table style="width:100%;font-size:11.5px;border-collapse:collapse"><thead><tr style="background:#F8FAFC"><th style="text-align:right;padding:6px;border:1px solid var(--line)">السبب</th><th style="text-align:center;padding:6px;border:1px solid var(--line)">المصدر</th><th style="text-align:center;padding:6px;border:1px solid var(--line)">المستوى</th><th style="text-align:center;padding:6px;border:1px solid var(--line)">مرجع</th><th style="text-align:left;padding:6px;border:1px solid var(--line)">المبلغ</th></tr></thead><tbody>`;
        drs.forEach(dr => {
          const amt = Number(dr.amount)||0;
          if(amt <= 0) return;
          const src = dr.source === 'manual' ? 'يدوي' : dr.source === 'rule' ? 'قاعدة' : 'تلقائي';
          const lvl = dr.level === 'patient' ? 'المريض' : dr.level === 'line' ? 'البند' : dr.level;
          const ref = dr.ref && (dr.ref.lineCode || dr.ref.ruleId) ? (dr.ref.lineCode || dr.ref.ruleId) : '—';
          html += `<tr><td style="padding:6px;border:1px solid var(--line)">${escapeHtml(dr.reason||'—')} ${dr.note?'<div style="color:var(--muted);font-size:10.5px">'+escapeHtml(dr.note)+'</div>':''}</td><td style="text-align:center;padding:6px;border:1px solid var(--line)">${escapeHtml(src)}</td><td style="text-align:center;padding:6px;border:1px solid var(--line)">${escapeHtml(lvl)}</td><td style="text-align:center;padding:6px;border:1px solid var(--line);font-family:monospace">${escapeHtml(ref)}</td><td style="text-align:left;padding:6px;border:1px solid var(--line);color:var(--bad);font-weight:700" class="mono">${fmtC(amt)}</td></tr>`;
        });
        html += `</tbody></table></div>`;
    }));
    if(html.indexOf('<table') === -1) html += '<div style="font-size:12px;color:var(--muted)">لا توجد استقطاعات مسجلة</div>';
    rb.innerHTML = html;
  }
  // checklist
  const cb = document.getElementById('rvFinalChecklist') || document.getElementById('rvPageFinalChecklist');
  if (cb) {
    const _ce = typeof collectExceptions === 'function' ? collectExceptions() : {pending:[],processed:[],pa:[]};
    const excs = (_ce.pending||[]).concat(_ce.pa||[]);
    const billed = activeClaim ? (Number(activeClaim.billed)||0) : 0;
    let entered = 0;
    (workingInvoices||[]).forEach(inv => (inv.patients||[]).forEach(p => { if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv); (p.lines||[]).forEach(l => { entered += (Number(l.qty)||0)*(Number(l.billedUnit)||0); }); }));
    const mismatch = Math.abs(billed - entered) > 1;
    const paPending = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+(p.lines||[]).filter(l=>l._decision==='pa-pending').length,0),0);
    const missingDocsInv = 0;
    const missingDocsPat = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>a+DOC_ITEMS.filter(d=>!(p.documents&&p.documents[d.key])).length,0),0);
    const missingDocs = missingDocsInv + missingDocsPat;
    const items = [
      { key:'match', ok: !mismatch, text: `الإجمالي مُطابق (${fmt(billed)} = ${fmt(entered)})` },
      { key:'exc', ok: excs.length === 0, text: `كل الاستثناءات معالجة (${excs.length} متبقٍ)` },
      { key:'pa', ok: paPending === 0, text: `لا توجد بنود بانتظار موافقة PA (${paPending})` },
      { key:'docs', ok: missingDocs === 0, text: `المستندات مكتملة (${missingDocs} ناقصة)` },
    ];
    cb.innerHTML = '<div class="rv-section-title">قائمة التحقق الإلزامية</div>' + items.map(it => `<label style="display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;cursor:pointer"><input type="checkbox" class="final-check" data-final-check="${it.key}" ${it.ok?'checked':''} ${it.ok?'':'disabled'}> <span style="color:${it.ok?'var(--text,#111)':'var(--bad,#dc2626)'}">${escapeHtml(it.text)}</span></label>`).join('');
    // gate finalize button
    const finBtn = document.getElementById('finalizeReviewBtn') || document.getElementById('rvPageFinalizeBtn');
    if (finBtn) {
      const allChecked = items.every(it => it.ok);
      finBtn.disabled = !allChecked;
    }
  }
  // default decision
  const approved = (workingInvoices||[]).reduce((s,inv)=>s+(inv.patients||[]).reduce((a,p)=>{ if(typeof computePatient === 'function') computePatient(p, activeClaim, inv.date, inv); return a+(p._final||0); },0),0);
  const billed2 = activeClaim ? (Number(activeClaim.billed)||0) : 0;
  let def = 'partial';
  if (approved === 0) def = 'rejected';
  else if (approved >= billed2 && billed2 > 0) def = 'approved';
  const r = document.querySelector(`input[name="rvDecision"][value="${def}"]`) || document.querySelector(`input[name="rvPageDecision"][value="${def}"]`);
  if (r) r.checked = true;
}
function recalcReview(){
  if(typeof clearValidationCache === 'function') clearValidationCache();
  let billed = 0, eligible = 0, finalApproved = 0;
  workingInvoices.forEach(inv => { (inv.patients||[]).forEach(pat => {
    computePatient(pat, activeClaim, inv.date, inv);
    billed += (pat.lines||[]).reduce((s,l)=>s + (Number(l.qty)||0)*(Number(l.billedUnit)||0), 0);
    eligible += pat._subtotal || 0;
    finalApproved += pat._final || 0;
  });
  if(typeof validateInpatientInvoice === 'function') validateInpatientInvoice(inv); });
  if(typeof validateCrossInvoiceDup === 'function') validateCrossInvoiceDup();
  const ded = Math.max(0, billed-finalApproved);
  const rate = billed ? (ded/billed*100) : 0;
  const b1 = document.getElementById('calcBilled') || document.getElementById('rvPageCalcBilled');
  const d1 = document.getElementById('calcDed') || document.getElementById('rvPageCalcDed');
  const r1 = document.getElementById('calcRate') || document.getElementById('rvPageCalcRate');
  if(b1) b1.textContent = fmtC(billed);
  if(d1) d1.textContent = fmtC(ded);
  if(r1) r1.textContent = rate.toFixed(1)+'%';
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
