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
function applyServiceToLine(svc){
  $('#lnCode').value = svc.code; $('#lnName').value = svc.name; $('#lnCategory').value = svc.category;
  const b = $('#lnBilledUnit'); if(!b.value) b.value = svc.currentPrice;
  $('#lnTariffUnit').value = svc.currentPrice; lnSelectedTariffId = svc.tariffId;
  $('#lnSuggest').innerHTML = '';
  const t = tariffs.find(x => x.id === svc.tariffId);
  const src = $('#lnSourceResult'); src.classList.add('show');
  src.innerHTML = `✅ من: <b>${escapeHtml(t?t.name:svc.tariffName)}</b> · كود <b>${escapeHtml(svc.code)}</b>`;
  b.focus(); b.select();
}
function bindLineAutocomplete(){
  const codeInp = $('#lnCode'), nameInp = $('#lnName'), suggest = $('#lnSuggest');
  const run = val => {
    if(!val || val.length < 1){ suggest.innerHTML = ''; return; }
    const results = searchTariffServices(val, lnApplicableTariffs);
    if(!results.length){ suggest.innerHTML = '<div class="ln-sug-empty">لا نتائج</div>'; return; }
    suggest.innerHTML = `<div class="ln-suggest-list">${results.map((s,i)=>`<div class="ln-sug-item" data-sug-idx="${i}"><span class="s-code">${escapeHtml(s.code)}</span><div class="s-info"><div class="s-name">${escapeHtml(s.name)}${s.requiresPriorApproval?' ⚠':''}</div><div class="s-cat">${escapeHtml(s.category)} · ${escapeHtml(s.tariffName)}</div></div><div class="s-price">${fmt(s.currentPrice)}<small>ر.س</small></div></div>`).join('')}</div>`;
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
function openLineEditor(patIdx, lineIdx){
  const inv = workingInvoices[rvActiveInvoiceIdx]; const pat = inv&&inv.patients?inv.patients[patIdx]:null; if(!pat) return;
  rvEditLineIdx = (lineIdx === undefined || lineIdx === null) ? -1 : lineIdx;
  const l = rvEditLineIdx >= 0 ? pat.lines[rvEditLineIdx] : null;
  $('#lnModalTitle').textContent = l ? 'تعديل البند' : 'إضافة بند';
  $('#lnModalSub').textContent = `${inv.id} · ${pat.name}`;
  $('#lnCode').value = l ? l.code : ''; $('#lnName').value = l ? l.name : ''; $('#lnCategory').value = l ? l.category : 'مختبر';
  $('#lnQty').value = l ? l.qty : 1; $('#lnBilledUnit').value = l ? l.billedUnit : '';
  $('#lnTariffUnit').value = (l && l.tariffUnit !== null && l.tariffUnit !== undefined) ? l.tariffUnit : '';
  lnApplicableTariffs = getApplicableTariffs(activeClaim?activeClaim.provider:'');
  lnSelectedTariffId = (l && l.tariffId) ? l.tariffId : null;
  renderLineSourceBanner(); $('#lnSuggest').innerHTML = '';
  const src = $('#lnSourceResult'); src.classList.remove('show'); src.innerHTML = '';
  $('#lineModal').classList.add('open'); setTimeout(()=>$('#lnCode').focus(), 120);
}
function saveLineEditor(){
  markSessionDirty();
  const inv = workingInvoices[rvActiveInvoiceIdx]; const pat = inv&&inv.patients?inv.patients[rvActivePatientIdx]:null; if(!pat) return;
  const code = $('#lnCode').value.trim(), name = $('#lnName').value.trim(), cat = $('#lnCategory').value;
  const qty = Math.max(1, Number($('#lnQty').value)||1), bu = Number($('#lnBilledUnit').value)||0;
  const tuRaw = $('#lnTariffUnit').value.trim(); const tu = tuRaw===''?null:Number(tuRaw);
  if(!code){ showWarning('تنبيه','أدخل الكود'); return; }
  if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  if(bu <= 0){ showWarning('تنبيه','أدخل السعر'); return; }
  if(qty > 10000){ showWarning('تنبيه','الكمية كبيرة'); return; }
  if(bu > 10000000){ showWarning('تنبيه','السعر مرتفع'); return; }
  if(tu !== null && tu < 0){ showWarning('تنبيه','سعر اللائحة سالب'); return; }
  const billed = qty*bu; const tt = tu !== null ? qty*tu : null;
  const lesser = tt !== null ? Math.min(billed, tt) : billed;
  const data = { code, name, category:cat, qty, billedUnit:bu, tariffUnit:tu, approved:lesser, note:'', tariffId:lnSelectedTariffId||'' };
  if(rvEditLineIdx >= 0 && pat.lines[rvEditLineIdx]) pat.lines[rvEditLineIdx] = data;
  else { if(!pat.lines) pat.lines = []; pat.lines.push(data); }
  closeLineEditor(); renderActiveInvoice(); recalcReview();
}
function closeLineEditor(){ if(!$('#lineModal').classList.contains('open')) return; $('#lineModal').classList.remove('open'); rvEditLineIdx = -1; }
function updatePAWarning(){
  const status = $('#paStatus').value;
  const box = $('#priorApprovalBox'), w = $('#paWarningText');
  const msgs = { 'not-requested':'⚠️ لم يتم تقديم طلب موافقة.', 'pending':'⏳ طلب قيد الدراسة.', 'rejected':'❌ تم رفض الموافقة.', 'approved':'✅ الموافقة سارية.' };
  w.textContent = msgs[status] || '';
  box.className = 'pa-box ' + (status === 'approved' ? 'ok' : 'warn');
}
