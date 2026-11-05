// render-2.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
/* ترشيح المطالبات — منطق خالص (يُختبر آليًا). يغطي الرقم/المريض/الجهة/الوارد/البنود/الرقم القومي. */
function filterClaimsList(list, filter, term){
  const q = String(term || '').trim().toLowerCase();
  return (list || []).filter(c => {
    const archived = c.archived === true || c.archiveStatus === 'read-only';
    if(filter === 'archived'){ if(!archived) return false; }
    else if(archived) return false;
    if(filter === 'pa-required'){ if(!(c.priorApproval && c.priorApproval.required && c.priorApproval.status !== 'approved')) return false; }
    else if(filter && filter !== 'all' && filter !== 'archived' && c.status !== filter) return false;
    if(q){
      if(String(c.id||'').toLowerCase().includes(q) || String(c.patient||'').toLowerCase().includes(q) ||
         String(c.provider||'').toLowerCase().includes(q) || String(c.receivedNumber||'').toLowerCase().includes(q)) return true;
      const lines = (c.invoices||[]).flatMap(inv => (inv.patients||[]).flatMap(p => p.lines||[]));
      if(lines.some(l => String(l.code||'').toLowerCase().includes(q) || String(l.name||'').toLowerCase().includes(q))) return true;
      const nids = (c.invoices||[]).flatMap(inv => (inv.patients||[]).map(p => p.nationalId));
      if(nids.some(nid => String(nid||'').toLowerCase().includes(q))) return true;
      return false;
    }
    return true;
  });
}
/* فرز المطالبات — منطق خالص (يُختبر آليًا). default = ترتيب الإدخال. */
function sortClaimsList(list, mode){
  const a = (list || []).slice();
  if(mode === 'date-desc') a.sort((x,y) => String(y.receivedDate||y.date||'').localeCompare(String(x.receivedDate||x.date||'')));
  else if(mode === 'date-asc') a.sort((x,y) => String(x.receivedDate||x.date||'').localeCompare(String(y.receivedDate||y.date||'')));
  else if(mode === 'billed-desc') a.sort((x,y) => (Number(y.billed)||0) - (Number(x.billed)||0));
  else if(mode === 'billed-asc') a.sort((x,y) => (Number(x.billed)||0) - (Number(y.billed)||0));
  return a;
}
/* عد نشطة/مؤرشفة — منطق خالص (يُختبر آليًا). */
function splitClaimsByArchive(list){
  let active = 0, archived = 0;
  (list || []).forEach(c => { ((c.archived === true || c.archiveStatus === 'read-only') ? archived += 1 : active += 1); });
  return { active, archived };
}
function renderClaims(){
  const _prevSel = new Set($$('#claimsBody .claim-cb:checked:not(:disabled)').map(cb => cb.dataset.id));
  const _tab = (typeof claimsArchiveTab !== 'undefined' ? claimsArchiveTab : 'active');
  const _effFilter = _tab === 'archived' ? 'archived' : (currentFilter === 'archived' ? 'all' : currentFilter);
  let _flt = (typeof filterClaimsList === 'function') ? filterClaimsList(claims, _effFilter, currentSearch) : claims.slice();
  if(_tab === 'archived' && currentFilter && currentFilter !== 'all' && currentFilter !== 'archived'){
    if(currentFilter === 'pa-required') _flt = _flt.filter(c => c.priorApproval && c.priorApproval.required && c.priorApproval.status !== 'approved');
    else _flt = _flt.filter(c => c.status === currentFilter);
  }
  const _mode = (typeof claimsSort !== 'undefined' ? claimsSort : 'default');
  const list = (typeof sortClaimsList === 'function') ? sortClaimsList(_flt, _mode) : _flt;
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
      <td style="width:36px"><input type="checkbox" class="claim-cb" data-id="${escapeHtml(c.id)}" ${c.archived||c.archiveStatus==='read-only'?'disabled title="مؤرشفة"':''}></td>
      <td data-label="رقم / وارد"><span class="clm-id">${escapeHtml(c.id)}</span><div style="font-size:10.5px;color:var(--teal);font-weight:700;margin-top:2px">وارد: ${escapeHtml(c.receivedNumber||'—')}</div><div style="font-size:10px;color:var(--muted);margin-top:2px">${(c.invoices||[]).length} فاتورة</div></td>
      <td data-label="المريض">${escapeHtml(c.patient)}${paBadge}</td>
      <td data-label="الجهة" class="hide-sm">${escapeHtml(c.provider)}</td>
      <td data-label="التواريخ" class="hide-sm" style="font-size:11.5px;line-height:1.6"><div style="color:var(--teal);font-weight:800">وارد: ${escapeHtml(c.receivedDate||'—')}</div><div style="color:var(--muted);font-weight:600">مطالبة: ${escapeHtml(c.date||'—')}</div></td>
      <td data-label="المطالب" class="mono">${fmt(c.billed)}</td>
      <td data-label="المعتمد" class="mono big">${fmt(c.approved)}</td>
      <td data-label="الحالة"><span class="badge ${c.archived||c.archiveStatus==='read-only'?'muted':st.cls}">${c.archived||c.archiveStatus==='read-only'?'مؤرشفة · للعرض فقط':st.label}</span></td>
      <td class="act"><div style="display:flex;gap:5px;flex-wrap:nowrap;align-items:center"><button class="btn-xs view" data-view="${escapeHtml(c.id)}">👁</button>${c.archived||c.archiveStatus==='read-only'?'<span class="badge muted">مقفلة</span>':`<button class="btn-xs" data-review="${escapeHtml(c.id)}">مراجعة</button><button class="btn-xs" data-add-memo="${escapeHtml(c.id)}" title="إضافة مذكرة خصم">+مذكرة</button><button class="btn-xs danger" data-delete-claim="${escapeHtml(c.id)}">×</button>`}<button class="btn-xs tl" data-timeline="${escapeHtml(c.id)}">📅</button></div></td>
    </tr>`;
  }).join('');
  $$('#claimsBody .claim-cb').forEach(cb => { if(_prevSel.has(cb.dataset.id)) cb.checked = true; });
  updateClaimsBulkBar();
  const _archTab = $('#claimsArchiveTabs');
  if(_archTab){
    const _sp = (typeof splitClaimsByArchive === 'function') ? splitClaimsByArchive((typeof claims !== 'undefined' ? claims : [])) : { active:0, archived:0 };
    _archTab.innerHTML = `<button class="tf-tab ${_tab === 'active' ? 'active' : ''}" data-carchtab="active">النشطة (${_sp.active})</button><button class="tf-tab ${_tab === 'archived' ? 'active' : ''}" data-carchtab="archived">الأرشيف (${_sp.archived})</button>`;
  }
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
          <div style="display:flex;gap:10px;font-size:11px;font-weight:700;padding:6px 8px;background:#e4ecf4;border-radius:6px;margin-top:6px;flex-wrap:wrap">
            <span>إجمالي: <b>${fmtC(p._subtotal)}</b></span>
            ${p._capAmt?`<span style="color:var(--bad)">سقف: ${fmtC(p._capAmt)}</span>`:''}
            ${p._copayAmt?`<span style="color:var(--warn)">تحمل: ${fmtC(p._copayAmt)}</span>`:''}
            <span style="color:var(--ok)">المعتمد: ${fmtC(p._final)}</span>
          </div>
        </div>`;
      }).join('');
      return `<div class="view-invoice">
        <div class="view-invoice-head">
          <div><b>${escapeHtml(t.label||'غير محدد')}</b> <span style="color:var(--muted);font-size:11.5px">· ${escapeHtml(inv.number||inv.id||'—')} · ${escapeHtml(inv.date||'')}</span></div>
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
          ${c.archived||c.archiveStatus==='read-only'?'<span class="badge muted">مؤرشفة · للعرض فقط</span>':`<button class="btn-sm" data-view-action="review" data-id="${escapeHtml(c.id)}">مراجعة</button>
          <button class="btn-xs danger" data-view-action="delete-claim" data-id="${escapeHtml(c.id)}">حذف</button>`}
        </div>
      </div>
      <div class="view-grid">
        <div class="view-card"><div class="view-card-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15"/></svg><h4>بيانات</h4></div>
          <div class="view-card-body">
            <div class="view-row"><span class="k">رقم</span><span class="v mono">${escapeHtml(c.id)}</span></div>
            <div class="view-row"><span class="k">وارد</span><span class="v mono" style="color:var(--teal)">${escapeHtml(c.receivedNumber||'—')}</span></div>
            <div class="view-row"><span class="k">وارد في</span><span class="v mono">${escapeHtml(c.receivedDate||'—')}</span></div>
            <div class="view-row"><span class="k">تاريخ</span><span class="v mono">${escapeHtml(c.date||'—')}</span></div>
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
