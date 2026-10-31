function kpiIcon(name){
  const svgs = {
    file:'<path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    money:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
    cut:'<circle cx="6.5" cy="6.5" r="2.8"/><circle cx="6.5" cy="17.5" r="2.8"/><path d="M20 4 8.6 15.4M8.6 8.6 20 20"/>',
    check:'<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4 12 14.1l-3-3"/>',
    building:'<path d="M3 21h18M4 21V10l8-6 8 6v11"/><path d="M9 21v-5h6v5"/><path d="M12 4v4M10 6h4"/>',
    contract:'<path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    tariff:'<path d="M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z"/><path d="M12 8v4M12 16h.01"/>',
    inbox:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    shield:'<path d="M12 2 L20 6 V12 C20 17 16 20.5 12 22 C8 20.5 4 17 4 12 V6 Z"/><path d="M9 12l2 2 4-4"/>',
    trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${svgs[name]||''}</svg>`;
}
let dashSearchTerm = '', reportsSearchTerm = '';
let currentFilter = 'all', currentSearch = '';
function renderKPIs(){
  const s = stats();
  const paCount = claims.filter(c => c.priorApproval && c.priorApproval.required && c.priorApproval.status !== 'approved').length;
  const cards = [
    {cls:'', icon:'file', label:t('kpi.totalClaims') || 'إجمالي المطالبات', val:s.total, unit:'مطالبة', foot:`${s.pending} قيد · ${paCount} تحتاج موافقة`},
    {cls:'k2', icon:'money', label:t('kpi.billed') || 'المطالب به', val:fmt(s.billed), unit:'ج.م', foot:'إجمالي'},
    {cls:'k3', icon:'cut', label:t('kpi.deductions') || 'الاستقطاعات', val:fmt(s.deduction), unit:'ج.م', foot:'الفروقات'},
    {cls:'k4', icon:'check', label:t('kpi.approved') || 'المعتمد', val:fmt(s.approved), unit:'ج.م', foot:`${(100-s.rate).toFixed(1)}% اعتماد`}
  ];
  $('#kpiGrid').innerHTML = cards.map(c => `<div class="kpi ${c.cls}"><div class="kpi-top"><div><div class="kpi-label">${c.label}</div><div class="kpi-val">${c.val} <small>${c.unit}</small></div></div><div class="kpi-ico">${kpiIcon(c.icon)}</div></div><div class="kpi-foot">${c.foot}</div></div>`).join('');
}
function renderRecent(){
  let base = claims;
  if(dashSearchTerm){
    const q = dashSearchTerm.toLowerCase();
    base = claims.filter(c => c.id.toLowerCase().includes(q) || c.patient.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || (c.receivedNumber||'').toLowerCase().includes(q));
    $('#dashSearchInfo').textContent = `${base.length} نتيجة`;
  } else $('#dashSearchInfo').textContent = 'آخر 5';
  const display = dashSearchTerm ? base.slice(0,10) : base.slice(0,5);
  if(!display.length){ $('#recentBody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:22px;color:var(--muted)">لا مطالبات بعد. ابدأ باستلام مطالبة وارد.</td></tr>'; return; }
  $('#recentBody').innerHTML = display.map(c => {
    const st = STATUS[c.status] || STATUS.pending;
    return `<tr style="cursor:pointer" data-view="${escapeHtml(c.id)}"><td data-label="رقم"><span class="clm-id">${escapeHtml(c.id)}</span><div style="font-size:10px;color:var(--teal);font-weight:700;margin-top:2px">${escapeHtml(c.receivedNumber||'—')}</div></td><td data-label="المريض">${escapeHtml(c.patient)}</td><td data-label="المطالب" class="mono">${fmt(c.billed)}</td><td data-label="المعتمد" class="mono big">${fmt(c.approved)}</td><td data-label="الحالة"><span class="badge ${st.cls}">${st.label}</span></td></tr>`;
  }).join('');
}
function renderDonut(){
  const s = stats(); const C = 2*Math.PI*66; const pct = Math.min(100,Math.max(0,s.rate)); const arc = C*pct/100;
  setTimeout(() => { $('#donutArc').setAttribute('stroke-dasharray', `${arc} ${C}`); }, 120);
  $('#donutPct').textContent = pct.toFixed(1)+'%';
  const total = s.total || 1;
  const items = [{label:'معتمدة',n:s.approvedN,color:'#059669'},{label:'جزئية',n:s.partialN,color:'#2563EB'},{label:'قيد',n:s.pending,color:'#D97706'},{label:'مرفوضة',n:s.rejectedN,color:'#DC2626'}];
  $('#legendBox').innerHTML = items.map(i => `<div class="legend-row"><span class="sw" style="background:${i.color}"></span><span class="lbl">${i.label}</span><span class="val">${i.n} (${Math.round(i.n/total*100)}%)</span></div>`).join('');
}
function renderReasonBars(sel){
  const data = reasonsBreakdown(); const box = $(sel); if(!box) return;
  if(!data.length){ box.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:10px">لا استقطاعات</p>'; return; }
  const max = Math.max(...data.map(d=>d[1]));
  box.innerHTML = data.map(([n,v]) => `<div class="bar-row"><div class="bar-top"><span>${escapeHtml(n)}</span><b>${fmtC(v)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,v/max*100)}%"></div></div></div>`).join('');
}
function updateClaimsBulkBar(){
  const n = $$('#claimsBody .claim-cb:checked').length;
  const cnt = document.getElementById('claimsBulkCount');
  if(cnt) cnt.textContent = n;
  const bar = document.getElementById('claimsBulkBar');
  if(bar) bar.classList.toggle('show', n > 0);
  const all = $$('#claimsBody .claim-cb');
  const sa = document.getElementById('claimsSelectAll');
  if(sa) sa.checked = n > 0 && n === all.length;
}
function bindClaimsControls(){
  $('#searchInput').addEventListener('input', e => { currentSearch = e.target.value.trim().toLowerCase(); renderClaims(); });
  $('#filterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#filterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); currentFilter = chip.dataset.filter; renderClaims();
  });
  const recentBody = document.getElementById('recentBody');
  if(recentBody) recentBody.addEventListener('click', e => { const vw = e.target.closest('[data-view]'); if(vw){ openView('claim', vw.dataset.view); } });
  $('#claimsBody').addEventListener('click', e => {
    const rv = e.target.closest('[data-review]'); if(rv){ openReview(rv.dataset.review); return; }
    const tl = e.target.closest('[data-timeline]'); if(tl){ openTimeline(tl.dataset.timeline); return; }
    const vw = e.target.closest('[data-view]'); if(vw){ openView('claim', vw.dataset.view); return; }
    const del = e.target.closest('[data-delete-claim]'); if(del){ deleteClaimWithDialog(del.dataset.deleteClaim); return; }
  });
  const updateBulk = updateClaimsBulkBar;
  $('#claimsSelectAll').addEventListener('change', () => { $$('#claimsBody .claim-cb').forEach(cb => { cb.checked = $('#claimsSelectAll').checked; }); updateBulk(); });
  $('#claimsBody').addEventListener('change', e => { if(e.target.classList.contains('claim-cb')) updateBulk(); });
  $('#claimsBulkReview').addEventListener('click', () => {
    const first = $$('#claimsBody .claim-cb:checked')[0];
    if(first) openReview(first.dataset.id);
  });
  $('#claimsBulkDelete').addEventListener('click', () => {
    const ids = $$('#claimsBody .claim-cb:checked').map(cb => cb.dataset.id);
    if(!ids.length) return;
    const linked = ids.filter(id => findSessionByClaim(id)).length;
    showDelete('حذف مطالبات', `سيتم نقل ${ids.length} مطالبة${linked?' و'+linked+' جلسة':''}.`, () => {
      ids.forEach(id => {
        const c = getClaimById(id); if(!c) return;
        const ls = findSessionByClaim(id);
        const toTrash = JSON.parse(JSON.stringify(c));
        if(ls && Array.isArray(ls.workingInvoices) && ls.workingInvoices.length){
          toTrash.invoices = JSON.parse(JSON.stringify(ls.workingInvoices));
          toTrash.invoices.forEach(inv => (inv.patients||[]).forEach(p => computePatient(p, toTrash, inv.date, inv)));
          toTrash.billed = toTrash.invoices.reduce((s,inv) => s + (inv.patients||[]).reduce((a,p) => a + (p._subtotal||0), 0), 0);
          toTrash.approved = toTrash.invoices.reduce((s,inv) => s + (inv.patients||[]).reduce((a,p) => a + (p._final||0), 0), 0);
          if(ls.reviewFormState){
            if(ls.reviewFormState.reason) toTrash.reason = ls.reviewFormState.reason;
            if(ls.reviewFormState.notes) toTrash.notes = ls.reviewFormState.notes;
            if(toTrash.priorApproval && ls.reviewFormState.paStatus){
              toTrash.priorApproval.status = ls.reviewFormState.paStatus;
              toTrash.priorApproval.refNumber = ls.reviewFormState.paRefNumber || '';
              toTrash.priorApproval.date = ls.reviewFormState.paDate || '';
            }
          }
        }
        addToTrash('claim','مطالبة', c.id, toTrash);
        if(ls){
          workSessions = workSessions.filter(x => x.id !== ls.id);
          if(activeSessionId === ls.id){ activeSessionId = null; activeClaim = null; workingInvoices = []; }
        }
      });
      claims = claims.filter(c => !ids.includes(c.id));
      persistSessions(); persistData(true);
      renderAll(); showSuccess('تم', `تم نقل ${ids.length} مطالبة`);
    });
  });
  $('#claimsBulkClear').addEventListener('click', () => { $$('#claimsBody .claim-cb').forEach(cb => { cb.checked = false; }); updateBulk(); });
}
function _resetClaimsBulk(){
  const bar = document.getElementById('claimsBulkBar');
  if(bar) bar.classList.remove('show');
  const cnt = document.getElementById('claimsBulkCount');
  if(cnt) cnt.textContent = '0';
  const sa = document.getElementById('claimsSelectAll');
  if(sa) sa.checked = false;
}
