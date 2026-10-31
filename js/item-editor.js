function getApplicableTariffs(providerName){
  const provider = providers.find(p => p.name === providerName);
  let list = [], fallback = false;
  if(provider){
    const cids = contracts.filter(c => c.providerId === provider.id).map(c => c.id);
    list = tariffs.filter(t => (t.linkedProviderIds||[]).includes(provider.id) || (t.linkedContractIds||[]).some(cid => cids.includes(cid)));
    if(!list.length){ list = tariffs.filter(t => effectiveTariffStatus(t) === 'active'); fallback = true; }
  } else { list = tariffs.filter(t => effectiveTariffStatus(t) === 'active'); fallback = true; }
  const order = { active:0, pending:1, expired:2, cancelled:3 };
  list.sort((a,b) => (order[effectiveTariffStatus(a)]||9) - (order[effectiveTariffStatus(b)]||9));
  Object.defineProperty(list, '_fallback', { value: fallback, enumerable: false });
  return list;
}
function searchTariffServices(query, appl){
  const q = (query||'').trim().toLowerCase();
  if(!q) return [];
  const out = [];
  appl.forEach(t => (t.services||[]).forEach(s => {
    if(!s.code.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return;
    out.push({ ...s, tariffId:t.id, tariffName:t.name, tariffType:t.type });
  }));
  out.sort((a,b) => { const ae = a.code.toLowerCase()===q?0:1, be = b.code.toLowerCase()===q?0:1; if(ae!==be) return ae-be; return a.name.localeCompare(b.name); });
  return out.slice(0, 12);
}
function renderLineSourceBanner(){
  const banner = $('#lnSourceBanner'); if(!banner) return;
  if(lnApplicableTariffs._fallback){
    banner.className = 'ln-source-banner warn';
    banner.innerHTML = `⚠ <b>لا لائحة مرتبطة بالجهة</b> — البحث في كل اللوائح النشطة كبديل.`;
    return;
  }
  const active = lnApplicableTariffs.filter(t => effectiveTariffStatus(t) === 'active');
  const shown = active.length ? active : lnApplicableTariffs;
  if(shown.length){
    banner.className = 'ln-source-banner';
    const names = shown.slice(0,3).map(t=>escapeHtml(t.name)).join(' · ');
    banner.innerHTML = `📋 اللوائح: <b>${names}${shown.length>3?' (+'+(shown.length-3)+')':''}</b>`;
  } else { banner.className = 'ln-source-banner warn'; banner.innerHTML = '⚠ لا لائحة نشطة'; }
}
function applyServiceToLine(svc) {
  const ctx = getContractContext(activeClaim);
  const override = ctx.serviceOverrides?.[svc.code] || {};
  const contractRate = override.discountRate ?? (Number(ctx.contract?.discountRate) || 0);
  const covered = override.covered !== false;

  $('#lnCode').value = svc.code;
  $('#lnName').value = svc.name;
  $('#lnCategory').value = svc.category || 'أخرى';
  $('#lnTariffUnit').value = svc.currentPrice;
  $('#lnBilledUnit').value = svc.currentPrice;
  $('#lnContractDiscount').value = covered ? contractRate : '—';

  lnSelectedTariffId = svc.tariffId || ctx.contract?.tariffId || ctx.tariff?.id || '';

  const banner = $('#lnSourceBanner');
  if (!covered) {
    banner.className = 'ln-source-banner warn';
    banner.innerHTML = '⛔ <b>غير مغطاة بالعقد</b> — سيُرفض البند تلقائيًا';
  } else {
    banner.className = 'ln-source-banner';
    banner.innerHTML = `✅ مغطاة · اللائحة <b>${escapeHtml(ctx.tariff?.name || '—')}</b> · خصم العقد <b>${contractRate}%</b>`;
  }

  updateComputedPreview();
  setTimeout(() => $('#lnBilledUnit').focus(), 50);
}
function bindLineAutocomplete(){
  const codeInp = $('#lnCode'), nameInp = $('#lnName'), suggest = $('#lnSuggest');
  const run = val => {
    if(!val || val.length < 1){ suggest.innerHTML = ''; return; }
    const results = searchTariffServices(val, lnApplicableTariffs);
    if(!results.length){ suggest.innerHTML = '<div class="ln-sug-empty">لا نتائج</div>'; return; }
    suggest.innerHTML = `<div class="ln-suggest-list">${results.map((s,i)=>`<div class="ln-sug-item" data-sug-idx="${i}"><span class="s-code">${escapeHtml(s.code)}</span><div class="s-info"><div class="s-name">${escapeHtml(s.name)}${s.requiresPriorApproval?' ⚠':''}</div><div class="s-cat">${escapeHtml(s.category)} · ${escapeHtml(s.tariffName)}</div></div><div class="s-price">${fmt(s.currentPrice)}<small>ج.م</small></div></div>`).join('')}</div>`;
    suggest.querySelectorAll('[data-sug-idx]').forEach(el => el.addEventListener('click', () => { const s = results[Number(el.dataset.sugIdx)]; if(s) applyServiceToLine(s); }));
  };
  const deb = val => { clearTimeout(lnDebounceTimer); lnDebounceTimer = setTimeout(()=>run(val), 160); };
  [codeInp, nameInp].forEach(inp => {
    inp.addEventListener('input', e => { lnSelectedTariffId = null; deb(e.target.value); });
    inp.addEventListener('focus', e => { if(e.target.value) run(e.target.value); });
    inp.addEventListener('keydown', e => { if(e.key==='Enter'){ const f = suggest.querySelector('[data-sug-idx]'); if(f){ e.preventDefault(); f.click(); } } else if(e.key==='Escape'){ suggest.innerHTML = ''; } });
  });
  codeInp.addEventListener('change', () => { const v = codeInp.value.trim().toLowerCase(); if(!v||lnSelectedTariffId) return; const all = searchTariffServices(v, lnApplicableTariffs); const exact = all.find(s => s.code.toLowerCase()===v); if(exact) applyServiceToLine(exact); });
  document.addEventListener('click', e => { if(!e.target.closest('#lineModal') || e.target.closest('.ln-suggest') || e.target.closest('#lnCode') || e.target.closest('#lnName')) return; suggest.innerHTML = ''; });
}
function openLineEditor(patIdx, lineIdx) {
  if (activeClaim && activeClaim._locked) { showWarning('مقفل','المطالبة موقوفة/موقعة — لا يمكن التعديل'); return; }
  const inv = workingInvoices[rvActiveInvoiceIdx];
  const pat = inv && inv.patients ? inv.patients[patIdx] : null;
  if (!pat) return;

  rvEditLineIdx = (lineIdx === undefined || lineIdx === null) ? -1 : lineIdx;
  const l = rvEditLineIdx >= 0 ? pat.lines[rvEditLineIdx] : null;

  $('#lnModalTitle').textContent = l ? 'تعديل البند' : 'إضافة بند';
  $('#lnModalSub').textContent = `${inv.id} · ${pat.name}`;

  const ctx = getContractContext(activeClaim);
  const services = ctx.tariff?.services || [];

  const sel = $('#lnServiceSelect');
  if (!services.length) {
    sel.innerHTML = '<option value="">— لا خدمات في اللائحة —</option>' +
      '<option value="__manual__">— إدخال يدوي (سيُرفض) —</option>';
  } else {
    sel.innerHTML = '<option value="">— اختر من لائحة العقد —</option>' +
      services.map(s => `<option value="${escapeHtml(s.code)}">${escapeHtml(s.code)} — ${escapeHtml(s.name)} (${fmt(s.currentPrice)} ج.م)</option>`).join('') +
      '<option value="__manual__">— إدخال يدوي (سيُرفض تلقائيًا) —</option>';
  }

  if (l) {
    const inTariff = services.some(s => String(s.code) === String(l.code));
    if (inTariff) {
      sel.value = l.code;
      const svc = services.find(s => String(s.code) === String(l.code));
      applyServiceToLine(svc);
      $('#lnQty').value = l.qty;
      if (l.billedUnit !== null && l.billedUnit !== undefined) $('#lnBilledUnit').value = l.billedUnit;
    } else {
      sel.value = '__manual__';
      $('#lnCode').value = l.code || '';
      $('#lnName').value = l.name || '';
      $('#lnCategory').value = l.category || 'أخرى';
      $('#lnTariffUnit').value = '';
      $('#lnContractDiscount').value = '—';
      toggleManualFields(true);
      $('#lnQty').value = l.qty;
      $('#lnBilledUnit').value = l.billedUnit;
    }
  } else {
    sel.value = '';
    $('#lnCode').value = '';
    $('#lnName').value = '';
    $('#lnCategory').value = '';
    $('#lnTariffUnit').value = '';
    $('#lnContractDiscount').value = '';
    $('#lnQty').value = 1;
    $('#lnBilledUnit').value = '';
    toggleManualFields(false);
  }

  if (!ctx.contract || !ctx.tariff) {
    $('#lnSourceBanner').className = 'ln-source-banner warn';
    $('#lnSourceBanner').innerHTML = '⚠ <b>لا عقد/لائحة مرتبطة بالجهة</b> — اربط العقد بلائحة أولًا، أو استخدم الإدخال اليدوي (سيُرفض).';
  } else {
    $('#lnSourceBanner').className = 'ln-source-banner';
    $('#lnSourceBanner').innerHTML = `📋 <b>${escapeHtml(ctx.contract.id)}</b> · ${escapeHtml(ctx.tariff.name)} · خصم عام ${Number(ctx.contract.discountRate) || 0}%`;
  }

  updateComputedPreview();
  $('#lineModal').classList.add('open');
  setTimeout(() => sel.focus(), 120);
}
function saveLineEditor() {
  if (activeClaim && activeClaim._locked) { showWarning('مقفل','المطالبة موقوفة/موقعة — لا يمكن التعديل'); return; }
  markSessionDirty();
  const inv = workingInvoices[rvActiveInvoiceIdx];
  const pat = inv && inv.patients ? inv.patients[rvActivePatientIdx] : null;
  if (!pat) return;

  const isManual = $('#lnServiceSelect').value === '__manual__';
  const code = $('#lnCode').value.trim();
  const name = $('#lnName').value.trim();
  const cat = $('#lnCategory').value.trim() || 'أخرى';
  const qty = Math.max(1, Number($('#lnQty').value) || 1);
  const bu = Number($('#lnBilledUnit').value) || 0;
  const tuRaw = $('#lnTariffUnit').value.trim();
  const tu = (tuRaw === '' || tuRaw === '—') ? null : Number(tuRaw);

  if (!code) { showWarning('تنبيه', 'أدخل الكود'); return; }
  if (!name) { showWarning('تنبيه', 'أدخل الاسم'); return; }
  if (bu <= 0) { showWarning('تنبيه', 'أدخل السعر'); return; }
  if (qty > 10000) { showWarning('تنبيه', 'الكمية كبيرة'); return; }
  if (bu > 10000000) { showWarning('تنبيه', 'السعر مرتفع'); return; }
  if (tu !== null && tu < 0) { showWarning('تنبيه', 'سعر اللائحة سالب'); return; }

  const ctx = getContractContext(activeClaim);
  const tariffSvc = (ctx.tariff?.services || []).find(s => String(s.code) === String(code)) || null;

  const data = {
    code, name,
    category: cat,
    qty,
    billedUnit: bu,
    tariffUnit: tu,
    tariffId: lnSelectedTariffId || ctx.contract?.tariffId || ctx.tariff?.id || '',
    _manualEntry: isManual,
    _contractRate: 0,
    _contractCovered: true,
    note: '',
    approved: 0,
    _overrideMode: 'auto',
    requiresPriorApproval: !!(tariffSvc && tariffSvc.requiresPriorApproval),
  };

  const validation = validateLine(data, {
    claim: activeClaim,
    patient: pat,
    invoice: inv,
    contract: ctx.contract,
    tariff: ctx.tariff,
    serviceOverrides: ctx.serviceOverrides,
  });

  data._decision = validation.decision;
  data._checksPassed = validation.passed;
  data._checksFailed = validation.failed;
  data._flaggedReasons = [...validation.failed, ...(validation.reductions || [])];
  data._suggestedAction = validation.suggestedAction;
  data._contractRate = validation.contractRate;
  data._contractCovered = validation.covered;
  data.approved = validation.afterContract;

  if (validation.decision === 'auto-rejected') {
    data.approved = 0;
    data._overrideMode = 'manual';
    data._manualValue = 0;
    data.note = reasonLabel(validation.suggestedAction?.reason || 'not-in-tariff');
  } else if (validation.decision === 'auto-reduced') {
    data.note = reasonLabel('tariff-limit');
  } else if (validation.decision === 'needs-attention') {
    data.note = reasonLabel(validation.suggestedAction?.reason || '');
  }

  if (rvEditLineIdx >= 0 && pat.lines[rvEditLineIdx]) {
    pat.lines[rvEditLineIdx] = data;
  } else {
    if (!pat.lines) pat.lines = [];
    pat.lines.push(data);
  }

  closeLineEditor();
  renderActiveInvoice();
  recalcReview();

  if (validation.decision === 'auto-rejected') {
    showToast(`⛔ رُفض البند — ${data.note}`);
  } else if (validation.decision === 'auto-reduced') {
    showToast(`🔻 خُفّض البند — ${data.note}`);
  } else if (validation.decision === 'needs-attention') {
    showToast(`⚠️ يحتاج مراجعة — ${data.note}`);
  }
}
function closeLineEditor(){ if(!$('#lineModal').classList.contains('open')) return; $('#lineModal').classList.remove('open'); rvEditLineIdx = -1; }

function updateComputedPreview() {
  const box = $('#lnComputedPreview');
  if (!box) return;

  const qty = Math.max(0, Number($('#lnQty').value) || 0);
  const billed = qty * (Number($('#lnBilledUnit').value) || 0);
  const isManual = $('#lnServiceSelect').value === '__manual__';

  if (!qty || !billed) {
    box.classList.remove('show');
    box.innerHTML = '';
    return;
  }

  box.classList.add('show');

  if (isManual) {
    box.className = 'ln-source-result show';
    box.style.background = '#FEF2F2';
    box.style.borderColor = '#FECACA';
    box.style.color = '#B91C1C';
    box.innerHTML = `⛔ <b>غير مدرجة في اللائحة</b> — المعتمد: <b>0</b> (رفض تلقائي)`;
    return;
  }

  const ctx = getContractContext(activeClaim);
  const code = $('#lnCode').value.trim();
  const tariffUnit = Number($('#lnTariffUnit').value) || 0;
  const tariffTotal = qty * tariffUnit;
  const lesser = Math.min(billed, tariffTotal);
  const rate = getContractRateForService(ctx, code);
  const covered = isServiceCovered(ctx, code);
  const after = covered ? Math.round(lesser * (1 - rate / 100)) : 0;

  if (!covered) {
    box.className = 'ln-source-result show';
    box.style.background = '#FEF2F2';
    box.style.borderColor = '#FECACA';
    box.style.color = '#B91C1C';
    box.innerHTML = `⛔ <b>غير مغطاة بالعقد</b> — المعتمد: <b>0</b>`;
    return;
  }

  box.className = 'ln-source-result show';
  box.style.background = '';
  box.style.borderColor = '';
  box.style.color = '';

  const exceeds = billed > tariffTotal + 0.01;
  const exceedsBadge = exceeds ? ' · <span style="color:#B45309;font-weight:800">تجاوز اللائحة</span>' : '';

  box.innerHTML = `
    فاتورة <b>${fmt(billed)}</b>
    · لائحة <b>${fmt(tariffTotal)}</b>
    · الأقل <b>${fmt(lesser)}</b>
    · خصم ${rate}%${exceedsBadge}
    → المعتمد <b style="color:#047857;font-size:14px">${fmt(after)}</b>
  `;
}

function toggleManualFields(enabled) {
  ['lnCode', 'lnName', 'lnCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.readOnly = !enabled;
  });
  if (enabled) {
    const tu = $('#lnTariffUnit'); if (tu) tu.value = '';
    const cd = $('#lnContractDiscount'); if (cd) cd.value = '—';
    const banner = $('#lnSourceBanner');
    if (banner) {
      banner.className = 'ln-source-banner warn';
      banner.innerHTML = '⚠ <b>إدخال يدوي</b> — البند غير مدرج في اللائحة وسيُرفض تلقائيًا';
    }
  }
}

function bindLineSmartForm() {
  const sel = $('#lnServiceSelect');
  const qty = $('#lnQty');
  const bu = $('#lnBilledUnit');

  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      const code = sel.value;
      if (code === '__manual__') {
        toggleManualFields(true);
        $('#lnCode').value = '';
        $('#lnName').value = '';
        $('#lnCategory').value = 'أخرى';
        updateComputedPreview();
        setTimeout(() => $('#lnCode').focus(), 50);
        return;
      }
      if (!code) {
        toggleManualFields(false);
        $('#lnCode').value = '';
        $('#lnName').value = '';
        $('#lnCategory').value = '';
        $('#lnTariffUnit').value = '';
        $('#lnContractDiscount').value = '';
        updateComputedPreview();
        return;
      }
      const ctx = getContractContext(activeClaim);
      const svc = (ctx.tariff?.services || []).find(s => String(s.code) === code);
      if (svc) {
        toggleManualFields(false);
        applyServiceToLine(svc);
      }
    });
  }

  if (qty && !qty.dataset.bound) {
    qty.dataset.bound = '1';
    qty.addEventListener('input', updateComputedPreview);
  }
  if (bu && !bu.dataset.bound) {
    bu.dataset.bound = '1';
    bu.addEventListener('input', updateComputedPreview);
  }
}
function updatePAWarning(){
  const status = $('#paStatus').value;
  const box = $('#priorApprovalBox'), w = $('#paWarningText');
  const msgs = { 'not-requested':'⚠️ لم يتم تقديم طلب موافقة.', 'pending':'⏳ طلب قيد الدراسة.', 'rejected':'❌ تم رفض الموافقة.', 'approved':'✅ الموافقة سارية.' };
  w.textContent = msgs[status] || '';
  box.className = 'pa-box ' + (status === 'approved' ? 'ok' : 'warn');
}
