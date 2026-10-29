function renderReports(){
  let base = claims;
  if(reportsSearchTerm){
    const q = reportsSearchTerm.toLowerCase();
    base = claims.filter(c => c.id.toLowerCase().includes(q) || c.patient.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q));
    $('#reportsSearchInfo').innerHTML = `عرض ${base.length} من ${claims.length}`;
  } else $('#reportsSearchInfo').innerHTML = '';
  const s = statsFor(base);
  const vTotal = base.reduce((s,c)=> s + (c.violationDeduction||0), 0);
  $('#reportKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">صافي</div><div class="kpi-val">${fmt(s.approved)} <small>ر.س</small></div></div><div class="kpi-ico">${kpiIcon('check')}</div></div><div class="kpi-foot">من ${fmtC(s.billed)}</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">نسبة</div><div class="kpi-val">${s.rate.toFixed(1)}<small>%</small></div></div><div class="kpi-ico">${kpiIcon('cut')}</div></div><div class="kpi-foot">متوسط</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">الاستقطاع</div><div class="kpi-val">${fmt(s.deduction)} <small>ر.س</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">فروقات</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">مخالفة</div><div class="kpi-val">${fmt(vTotal)} <small>ر.س</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">سقف + تحمل</div></div>`;
  const total = s.total || 1;
  const statusData = [{label:'معتمدة',n:s.approvedN,color:'#059669'},{label:'جزئياً',n:s.partialN,color:'#2563EB'},{label:'قيد',n:s.pending,color:'#D97706'},{label:'مرفوضة',n:s.rejectedN,color:'#DC2626'}];
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
}
