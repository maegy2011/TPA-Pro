// render-4.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function renderReports(){
  let base = (typeof getReportsBase === 'function') ? getReportsBase() : claims;
  try {
    const _ps = $('#reportsProvider');
    if(_ps && !_ps.dataset.filled){
      const _names = [...new Set((claims||[]).map(c => c.provider).filter(Boolean))].sort();
      _ps.innerHTML = '<option value="">كل الجهات</option>' + _names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
      _ps.dataset.filled = '1';
    }
  } catch(e){}
  const _activeF = (reportsSearchTerm ? 1 : 0) + (reportsDateFrom ? 1 : 0) + (reportsDateTo ? 1 : 0) + (reportsProviderFilter ? 1 : 0) + (reportsStatusFilter ? 1 : 0);
  $('#reportsSearchInfo').innerHTML = _activeF ? `عرض ${base.length} من ${claims.length} · ${_activeF} فلتر` : '';
  const s = statsFor(base);
  const vTotal = base.reduce((s,c)=> s + (c.violationDeduction||0), 0);
  $('#reportKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">صافي</div><div class="kpi-val">${fmt(s.approved)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('check')}</div></div><div class="kpi-foot">من ${fmtC(s.billed)}</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">نسبة</div><div class="kpi-val">${s.rate.toFixed(1)}<small>%</small></div></div><div class="kpi-ico">${kpiIcon('cut')}</div></div><div class="kpi-foot">متوسط</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">الاستقطاع</div><div class="kpi-val">${fmt(s.deduction)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">فروقات</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">مخالفة</div><div class="kpi-val">${fmt(vTotal)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">سقف + تحمل</div></div>`;
  const total = s.total || 1;
  const statusData = [{label:'معتمدة',n:s.approvedN,color:'#2e7d4f'},{label:'جزئياً',n:s.partialN,color:'#2b5a8a'},{label:'قيد',n:s.pending,color:'#a06a00'},{label:'مرفوضة',n:s.rejectedN,color:'#b33a2b'}];
  $('#statusBars').innerHTML = statusData.map(i => `<div class="bar-row"><div class="bar-top"><span>${i.label}</span><b>${i.n} مطالبة</b></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,i.n/total*100)}%;background:${i.color}"></div></div></div>`).join('');
  $('#summaryList').innerHTML = `
    <div class="info-row"><span class="k">المطالبات</span><span class="v">${s.total}</span></div>
    <div class="info-row"><span class="k">المطالب</span><span class="v">${fmtC(s.billed)}</span></div>
    <div class="info-row"><span class="k">المعتمد</span><span class="v" style="color:var(--ok)">${fmtC(s.approved)}</span></div>
    <div class="info-row"><span class="k">الاستقطاع</span><span class="v" style="color:var(--bad)">${fmtC(s.deduction)}</span></div>
    <div class="info-row"><span class="k">الاعتماد</span><span class="v" style="color:var(--teal)">${(100-s.rate).toFixed(1)}%</span></div>`;
  const rData = reasonsBreakdownFor(base);
  const rBox = $('#reasonBars2');
  if(!rData.length) rBox.innerHTML = '<p style="color:var(--muted);text-align:center;padding:10px">لا استقطاعات</p>';
  else { const max = Math.max(...rData.map(d=>d[1])); rBox.innerHTML = rData.map(([n,v]) => `<div class="bar-row"><div class="bar-top"><span>${escapeHtml(n)}</span><b>${fmtC(v)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,v/max*100)}%"></div></div></div>`).join(''); }
  try {
    const _tp = (typeof reportsTopProviders === 'function') ? reportsTopProviders(base, 5) : [];
    const _tpBox = $('#topProvidersList');
    if(_tpBox) _tpBox.innerHTML = _tp.length ? _tp.map((t,i) => `<div class="info-row"><span class="k">${i+1}. ${escapeHtml(t.provider)} <small style="color:var(--muted)">(${t.claims})</small></span><span class="v" style="color:var(--bad)">${fmtC(t.deduction)}</span></div>`).join('') : '<p style="color:var(--muted);text-align:center;padding:10px">لا استقطاعات</p>';
    const _tr = (typeof reportsMonthlyTrend === 'function') ? reportsMonthlyTrend(base) : [];
    const _trBox = $('#monthlyTrendBars');
    if(_trBox){
      if(!_tr.length) _trBox.innerHTML = '<p style="color:var(--muted);text-align:center;padding:10px">لا بيانات شهرية</p>';
      else { const _mx = Math.max(..._tr.map(r => r.billed), 1); _trBox.innerHTML = _tr.map(r => `<div class="bar-row"><div class="bar-top"><span>${escapeHtml(r.month)} <small style="color:var(--muted)">(${r.claims})</small></span><b>${fmtC(r.deduction)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,r.billed/_mx*100)}%" title="المطالب: ${fmtC(r.billed)} · المعتمد: ${fmtC(r.approved)}"></div></div></div>`).join(''); }
    }
  } catch(e){}
}
