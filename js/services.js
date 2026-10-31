function getAllServicesFlat(){
  const out = [];
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => {
    (t.services||[]).forEach(s => { out.push({ code:s.code, name:s.name, category:s.category, tariff:t.name, base:s.basePrice, current:s.currentPrice }); });
  });
  return out;
}
function renderServices(){
  const list = getAllServicesFlat();
  const body = $('#servicesBody'); if(!body) return;
  if(!list.length){ body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--muted)">لا خدمات</td></tr>'; }
  else body.innerHTML = list.map(s => `<tr><td class="mono">${escapeHtml(s.code)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.category||'—')}</td><td>${escapeHtml(s.tariff)}</td><td class="mono">${fmt(s.base||0)}</td><td class="mono">${fmt(s.current||0)}</td></tr>`).join('');
  const kpi = $('#servicesKpi');
  if(kpi){ kpi.innerHTML = `<div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الخدمات</div><div class="kpi-val">${list.length} <small>خدمة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">عبر اللوائح</div></div>`; }
}