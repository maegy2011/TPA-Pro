function buildClaimTimeline(claim){
  const events = [];
  if(claim.receivedDate) events.push({ date: claim.receivedDate, type:'received', icon:'inbox', title:'استلام المطالبة', description:`من ${claim.provider} برقم ${claim.receivedNumber||'—'}` });
  (claim.invoices||[]).forEach(inv => {
    const t = INVOICE_TYPES[inv.type] || {label:inv.type};
    const tot = invoiceTotals(inv);
    events.push({ date: inv.date || claim.receivedDate || claim.date, type:'note', icon:'file', title:`فاتورة — ${t.label}`, description:`${(inv.patients||[]).length} مريض · ${allInvoiceLines(inv).length} بند · المطالب ${fmtC(tot.billed)}`, refNumber: inv.number||inv.id });
  });
  if(claim.priorApproval && claim.priorApproval.required){
    const pa = claim.priorApproval;
    if(pa.status === 'approved') events.push({ date: pa.date||claim.receivedDate, type:'pa-approved', icon:'check', title:'الموافقة صادرة', refNumber: pa.refNumber });
    else if(pa.status === 'rejected') events.push({ date: pa.date||claim.receivedDate, type:'pa-rejected', icon:'x', title:'رفض الموافقة', refNumber: pa.refNumber });
    else if(pa.status === 'pending') events.push({ date: pa.date||claim.receivedDate, type:'pa-pending', icon:'clock', title:'قيد الدراسة', refNumber: pa.refNumber });
    else events.push({ date: claim.receivedDate, type:'note', icon:'alert', title:'موافقة غير مطلوبة' });
  }
  if(claim.status !== 'pending'){
    const sm = { approved:{type:'review-approved',icon:'check',title:'اعتماد كامل'}, partial:{type:'review-partial',icon:'file',title:'اعتماد جزئي'}, rejected:{type:'review-rejected',icon:'x',title:'رفض'} };
    const s = sm[claim.status];
    let desc = `المطالب: ${fmtC(claim.billed)} — المعتمد: ${fmtC(claim.approved)}`;
    if(claim.reason) desc += ` — السبب: ${claim.reason}`;
    events.push({ date: claim.reviewedDate||claim.date, type:s.type, icon:s.icon, title:s.title, description:desc });
  } else events.push({ date: claim.reviewedDate||claim.receivedDate||claim.date, type:'review-pending', icon:'clock', title:'قيد المراجعة' });
  if(claim.notes && claim.notes.trim()) events.push({ date: claim.reviewedDate||claim.date, type:'note', icon:'file', title:'ملاحظات', description: claim.notes });
  return events.sort((a,b)=> new Date(a.date) - new Date(b.date));
}
function renderTimeline(){
  if(!currentTimelineClaimId) return;
  const claim = getClaimById(currentTimelineClaimId); if(!claim) return;
  $('#pageSub').textContent = `${claim.patient} • ${claim.provider}`;
  $('#tlHeaderTitle').textContent = `${claim.id} — ${claim.patient}`;
  $('#tlHeaderSub').textContent = claim.provider;
  const st = STATUS[claim.status] || STATUS.pending;
  let paBadge = '<span style="color:var(--muted);font-size:12px">لا تتطلب</span>';
  if(claim.priorApproval && claim.priorApproval.required){ const ps = PA_STATUS[claim.priorApproval.status] || PA_STATUS['not-requested']; paBadge = `<span class="badge ${ps.cls}">${ps.label}</span>`; }
  const daysSince = daysBetween(claim.receivedDate, daysFromNow(0));
  $('#tlSummary').innerHTML = `
    <div class="tl-summary-item"><span>الوارد</span><b style="color:var(--teal)">${claim.receivedNumber||'—'}</b></div>
    <div class="tl-summary-item"><span>تاريخ الوارد</span><b>${claim.receivedDate||'—'}</b></div>
    <div class="tl-summary-item"><span>تاريخ المطالبة</span><b>${claim.date}</b></div>
    <div class="tl-summary-item"><span>الحالة</span><b><span class="badge ${st.cls}">${st.label}</span></b></div>
    <div class="tl-summary-item"><span>الموافقة</span><b>${paBadge}</b></div>
    <div class="tl-summary-item"><span>منذ الاستلام</span><b>${daysSince>=0?daysSince+' يوم':'—'}</b></div>
  `;
  const events = buildClaimTimeline(claim);
  $('#tlCount').textContent = `${events.length} حدث`;
  $('#timelineList').innerHTML = events.map((ev,i) => `
    <div class="tl-event ${ev.type}" style="animation-delay:${i*60}ms">
      <div class="tl-dot ${ev.type}">${timelineIcon(ev.icon)}</div>
      <div class="tl-card">
        <div class="tl-date">${timelineIcon('calendar')} ${ev.date}</div>
        <div class="tl-title">${escapeHtml(ev.title)}</div>
        <div class="tl-desc">${escapeHtml(ev.description||'')}</div>
        ${ev.refNumber?`<div class="tl-ref">مرجع: ${escapeHtml(ev.refNumber)}</div>`:''}
      </div>
    </div>
  `).join('');
}
let srchTerm = '', srchTariffId = 'all', srchFilter = 'all', srchPage = 1, srchPerPage = 12, srchDebounce = null;
function bindSearchControls(){
  $('#srchQuery').addEventListener('input', e => { clearTimeout(srchDebounce); srchDebounce = setTimeout(() => { srchTerm = e.target.value.trim(); srchPage = 1; renderSearch(); }, 220); });
  $('#srchTariff').addEventListener('change', e => { srchTariffId = e.target.value; srchPage = 1; renderSearch(); });
  $('#srchPerPage').addEventListener('change', e => { srchPerPage = parseInt(e.target.value, 10); srchPage = 1; renderSearch(); });
  $('#srchChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#srchChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); srchFilter = chip.dataset.srch; srchPage = 1; renderSearch();
  });
  $('#srchPagination').addEventListener('click', e => {
    const btn = e.target.closest('.page-btn'); if(!btn || btn.disabled) return;
    const p = parseInt(btn.dataset.page, 10); if(!isNaN(p)){ srchPage = p; renderSearch(); window.scrollTo({top:120,behavior:'smooth'}); }
  });
}
function getSearchResults(){
  const results = []; const q = srchTerm.toLowerCase();
  const checkTariff = srchTariffId !== 'all';
  tariffs.forEach(t => {
    if(checkTariff && t.id !== srchTariffId) return;
    (t.services||[]).forEach(s => {
      if(srchFilter === 'covered' && !s.covered) return;
      if(srchFilter === 'pa' && !s.requiresPriorApproval) return;
      if(q && !s.code.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return;
      results.push({ ...s, tariffId:t.id, tariffName:t.name, tariffType:t.type });
    });
  });
  return results;
}
function renderSearch(){
  const sel = $('#srchTariff');
  const prev = sel.value;
  sel.innerHTML = '<option value="all">جميع اللوائح</option>' + tariffs.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)} — ${escapeHtml(TARIFF_TYPES[t.type].label)}</option>`).join('');
  if(prev && [...sel.options].some(o=>o.value===prev)) sel.value = prev;
  const results = getSearchResults();
  const total = results.length;
  const totalPages = Math.ceil(total/srchPerPage) || 1;
  if(srchPage > totalPages) srchPage = totalPages;
  if(srchPage < 1) srchPage = 1;
  const start = (srchPage-1) * srchPerPage;
  const pageResults = results.slice(start, start + srchPerPage);
  const cov = results.filter(r=>r.covered).length;
  const paN = results.filter(r=>r.requiresPriorApproval).length;
  $('#srchStatsBar').innerHTML = `<span>إجمالي: <b>${total}</b></span><span>مغطاة: <b>${cov}</b></span><span>موافقة: <b>${paN}</b></span>`;
  $('#srchCount').textContent = srchTariffId === 'all' ? `${total} خدمة` : `${total} خدمة في اللائحة`;
  if(!pageResults.length){ $('#srchResults').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">لا نتائج</div>'; $('#srchPagination').innerHTML = ''; return; }
  $('#srchResults').innerHTML = pageResults.map(s => {
    const tt = TARIFF_TYPES[s.tariffType];
    return `<div class="service-card">
      <div class="sc-head"><span class="sc-code">${escapeHtml(s.code)}</span>${s.requiresPriorApproval?'<span class="badge pa-req sm">⚠</span>':''}</div>
      <div class="sc-name">${escapeHtml(s.name)}</div>
      <div class="sc-category">${escapeHtml(s.category)}</div>
      <div class="sc-prices"><div class="sc-price-item"><span>أساسي</span><b>${fmt(s.basePrice)}</b></div><div class="sc-price-item current"><span>حالي</span><b>${fmt(s.currentPrice)}</b></div></div>
      <div class="sc-badges">${s.covered?'<span class="badge ok sm">مغطاة</span>':'<span class="badge bad sm">غير مغطاة</span>'}</div>
      <div class="sc-source"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15"/></svg><div style="flex:1;min-width:0"><div style="font-size:10px;margin-bottom:2px">مصدر</div><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.tariffName)}</b></div><span class="badge ${tt.cls} sm">${escapeHtml(tt.label)}</span></div>
    </div>`;
  }).join('');
  if(totalPages > 1){
    const btns = [`<button class="page-btn" data-page="${srchPage-1}" ${srchPage===1?'disabled':''}>‹</button>`];
    const pages = [];
    for(let i=1;i<=totalPages;i++){ if(i===1 || i===totalPages || Math.abs(i-srchPage)<=2) pages.push(i); else if(pages[pages.length-1] !== '...') pages.push('...'); }
    pages.forEach(p => { if(p==='...') btns.push('<span class="page-info">...</span>'); else btns.push(`<button class="page-btn ${p===srchPage?'active':''}" data-page="${p}">${p}</button>`); });
    btns.push(`<button class="page-btn" data-page="${srchPage+1}" ${srchPage===totalPages?'disabled':''}>›</button>`);
    $('#srchPagination').innerHTML = btns.join('');
  } else $('#srchPagination').innerHTML = '';
}
