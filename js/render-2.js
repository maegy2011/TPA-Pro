function renderClaims(){
  const _prevSel = new Set($$('#claimsBody .claim-cb:checked').map(cb => cb.dataset.id));
  const list = claims.filter(c => {
    if(currentFilter === 'pa-required'){ if(!(c.priorApproval && c.priorApproval.required && c.priorApproval.status !== 'approved')) return false; }
    else if(currentFilter !== 'all' && c.status !== currentFilter) return false;
    if(currentSearch){
      const q = currentSearch;
      if(c.id.toLowerCase().includes(q) || c.patient.toLowerCase().includes(q) ||
         c.provider.toLowerCase().includes(q) || (c.receivedNumber||'').toLowerCase().includes(q)) return true;
      const lines = (c.invoices||[]).flatMap(inv => (inv.patients||[]).flatMap(p => p.lines||[]));
      if(lines.some(l => (l.code||'').toLowerCase().includes(q) || (l.name||'').toLowerCase().includes(q))) return true;
      const nids = (c.invoices||[]).flatMap(inv => (inv.patients||[]).map(p => p.nationalId));
      if(nids.some(nid => (nid||'').toLowerCase().includes(q))) return true;
      return false;
    }
    return true;
  });
  const body = $('#claimsBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--muted)">لا مطالبات</td></tr>'; _resetClaimsBulk(); return; }
  body.innerHTML = list.map(c => {
    const st = STATUS[c.status] || STATUS.pending;
    let paBadge = '';
    if(c.priorApproval && c.priorApproval.required){
      if(c.priorApproval.status === 'approved') paBadge = ' <span class="badge pa-approved sm">✓</span>';
      else if(c.priorApproval.status === 'pending') paBadge = ' <span class="badge pa-pending sm">⏳</span>';
      else if(c.priorApproval.status === 'rejected') paBadge = ' <span class="badge pa-rejected sm">✗</span>';
      else paBadge = ' <span class="badge pa-req sm">⚠</span>';
    }
    return `<tr>
      <td style="width:36px"><input type="checkbox" class="claim-cb" data-id="${c.id}"></td>
      <td data-label="رقم / وارد"><span class="clm-id">${c.id}</span><div style="font-size:10.5px;color:var(--teal);font-weight:700;margin-top:2px">وارد: ${escapeHtml(c.receivedNumber||'—')}</div><div style="font-size:10px;color:var(--muted);margin-top:2px">${(c.invoices||[]).length} فاتورة</div></td>
      <td data-label="المريض">${escapeHtml(c.patient)}${paBadge}</td>
      <td data-label="الجهة" class="hide-sm">${escapeHtml(c.provider)}</td>
      <td data-label="التواريخ" class="hide-sm" style="font-size:11.5px;line-height:1.6"><div style="color:var(--teal);font-weight:800">وارد: ${c.receivedDate||'—'}</div><div style="color:var(--muted);font-weight:600">مطالبة: ${c.date}</div></td>
      <td data-label="المطالب" class="mono">${fmt(c.billed)}</td>
      <td data-label="المعتمد" class="mono big">${fmt(c.approved)}</td>
      <td data-label="الحالة"><span class="badge ${st.cls}">${st.label}</span></td>
      <td class="act"><div style="display:flex;gap:3px;flex-wrap:wrap"><button class="btn-xs view" data-view="${c.id}">👁</button><button class="btn-xs" data-review="${c.id}">مراجعة</button><button class="btn-xs tl" data-timeline="${c.id}">📅</button><button class="btn-xs danger" data-delete-claim="${c.id}">×</button></div></td>
    </tr>`;
  }).join('');
  $$('#claimsBody .claim-cb').forEach(cb => { if(_prevSel.has(cb.dataset.id)) cb.checked = true; });
  updateClaimsBulkBar();
}
function openView(type, id){
  if(currentPage === 'view'){
    navHistory.push({ page: 'view', viewType: viewState.type, viewId: viewState.id });
  } else {
    navigateTo('view');
  }
  viewState = { type, id };
  renderView();
}
function renderView(){
  const { type, id } = viewState;
  let html = '';
  if(type === 'claim'){
    const c = JSON.parse(JSON.stringify(getClaimById(id)))
    if(!c){ $('#viewContent').innerHTML = '<div class="panel"><div class="panel-body" style="text-align:center;padding:40px;color:var(--muted)">غير موجود</div></div>'; return; }
    const st = STATUS[c.status] || STATUS.pending;
    const invoicesHtml = (c.invoices||[]).map(inv => {
      const t = INVOICE_TYPES[inv.type] || {label:inv.type};
      const tot = invoiceTotals(inv);
      const patHtml = (inv.patients||[]).map(p => {
        computePatient(p, c, inv.date, inv);
        return `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)">
          <div style="font-size:11.5px;font-weight:800;color:var(--navy);margin-bottom:6px">👤 ${escapeHtml(p.name)}${p.beneficiaryType==='retiree'?' <span class="badge retiree sm">متقاعد</span>':''}</div>
          ${(p.lines||[]).map(l => `<div class="view-line"><span class="mono" style="color:var(--navy-400);font-weight:700;min-width:70px">${escapeHtml(l.code)}</span><span style="flex:1">${escapeHtml(l.name)}</span><span class="mono" style="color:var(--muted)">${l.qty}×</span><span class="mono">${fmt(l.qty*l.billedUnit)}</span><span class="mono" style="color:var(--ok);font-weight:800;min-width:70px;text-align:left">${fmt(Number(l.approved)||0)}</span></div>`).join('')}
          <div style="display:flex;gap:10px;font-size:11px;font-weight:700;padding:6px 8px;background:#EFF6F6;border-radius:7px;margin-top:6px;flex-wrap:wrap">
            <span>إجمالي: <b>${fmtC(p._subtotal)}</b></span>
            ${p._capAmt?`<span style="color:var(--bad)">سقف: ${fmtC(p._capAmt)}</span>`:''}
            ${p._copayAmt?`<span style="color:var(--warn)">تحمل: ${fmtC(p._copayAmt)}</span>`:''}
            <span style="color:var(--ok)">المعتمد: ${fmtC(p._final)}</span>
          </div>
        </div>`;
      }).join('');
      return `<div class="view-invoice">
        <div class="view-invoice-head">
          <div><b>${t.label}</b> <span style="color:var(--muted);font-size:11.5px">· ${inv.number||inv.id} · ${inv.date||''}</span></div>
          <div style="display:flex;gap:10px;font-size:12px;font-weight:700">
            <span style="color:var(--muted)">مطالب: ${fmtC(tot.billed)}</span>
            <span style="color:var(--ok)">معتمد: ${fmtC(tot.approved)}</span>
            <span style="color:var(--bad)">استقطاع: ${fmtC(tot.deduction)}</span>
          </div>
        </div>
        ${patHtml || '<div style="color:var(--muted);font-size:12px">لا مرضى</div>'}
      </div>`;
    }).join('');
    html = `
      <div class="view-header">
        <div><div class="view-title">${escapeHtml(c.patient)}</div><div class="view-sub">${escapeHtml(c.id)} • وارد ${escapeHtml(c.receivedNumber||'—')}</div></div>
        <div class="view-actions">
          <button class="btn-export pdf" data-export="viewClaim" data-format="pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h4M8 17h8"/></svg></button>
          <button class="btn-export print" data-export="viewClaim" data-format="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
          <button class="btn-sm" data-view-action="review" data-id="${c.id}">مراجعة</button>
          <button class="btn-xs danger" data-view-action="delete-claim" data-id="${c.id}">حذف</button>
        </div>
      </div>
      <div class="view-grid">
        <div class="view-card"><div class="view-card-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15"/></svg><h4>بيانات</h4></div>
          <div class="view-card-body">
            <div class="view-row"><span class="k">رقم</span><span class="v mono">${c.id}</span></div>
            <div class="view-row"><span class="k">وارد</span><span class="v mono" style="color:var(--teal)">${c.receivedNumber||'—'}</span></div>
            <div class="view-row"><span class="k">وارد في</span><span class="v mono">${c.receivedDate||'—'}</span></div>
            <div class="view-row"><span class="k">تاريخ</span><span class="v mono">${c.date}</span></div>
            <div class="view-row"><span class="k">الجهة</span><span class="v">${escapeHtml(c.provider)}</span></div>
            <div class="view-row"><span class="k">نوع</span><span class="v">${c.type==='retiree'?'متقاعد':'عامل'}</span></div>
            <div class="view-row"><span class="k">الحالة</span><span class="v"><span class="badge ${st.cls}">${st.label}</span></span></div>
          </div>
        </div>
        <div class="view-card"><div class="view-card-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/></svg><h4>مالية</h4></div>
          <div class="view-card-body">
            <div class="view-row"><span class="k">المطالب</span><span class="v mono" style="color:var(--navy);font-size:15px">${fmtC(c.billed)}</span></div>
            <div class="view-row"><span class="k">المعتمد</span><span class="v mono" style="color:var(--ok);font-size:15px">${fmtC(c.approved)}</span></div>
            <div class="view-row"><span class="k">الاستقطاع</span><span class="v mono" style="color:var(--bad)">${fmtC(c.billed-c.approved)}</span></div>
            <div class="view-row"><span class="k">النسبة</span><span class="v mono">${c.billed ? ((c.billed-c.approved)/c.billed*100).toFixed(1) : '0'}%</span></div>
          </div>
        </div>
      </div>
      <div class="view-card" style="grid-column:1/-1;margin-bottom:18px">
        <div class="view-card-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15"/></svg><h4>الفواتير (${(c.invoices||[]).length})</h4></div>
        <div class="view-card-body">${invoicesHtml || '<div style="color:var(--muted);font-size:12.5px">لا فواتير</div>'}</div>
      </div>
    `;
  } else {
    html = '<div class="panel"><div class="panel-body" style="text-align:center;padding:40px;color:var(--muted)">قيد التطوير</div></div>';
  }
  $('#viewContent').innerHTML = html;
  $$('#viewContent [data-view-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.viewAction, cid = btn.dataset.id;
      if(a === 'review') openReview(cid);
      else if(a === 'delete-claim') deleteClaimWithDialog(cid);
    });
  });
}
let currentTimelineClaimId = null;
function openTimeline(claimId){
  const c = getClaimById(claimId); if(!c){ showWarning('خطأ','غير موجود'); return; }
  currentTimelineClaimId = claimId; navigateTo('timeline'); renderTimeline();
}
function timelineIcon(name){
  const icons = {
    inbox:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    file:'<path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15"/><path d="M14 2v6h6"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
  };
  return `<svg viewBox="0 0 24 24">${icons[name]||''}</svg>`;
}
