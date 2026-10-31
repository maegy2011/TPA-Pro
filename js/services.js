let servicesSearchTerm = '', servicesFilter = 'all', servicesSort = 'name', servicesSortDir = 'asc';
let servicesAdv = { code:'', name:'', category:'', tariff:'', min:'', max:'' };
let servicesAdvOpen = false;

function getAllServicesFlat(){
  const out = [];
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => {
    (t.services||[]).forEach(s => { out.push({ code:s.code, name:s.name, category:s.category, tariff:t.name, base:s.basePrice, current:s.currentPrice, covered:!!s.covered }); });
  });
  return out;
}

function renderServices(){
  let list = getAllServicesFlat();
  // basic search
  if(servicesSearchTerm){
    const q = servicesSearchTerm.toLowerCase();
    list = list.filter(s => (s.code||'').toLowerCase().includes(q) || (s.name||'').toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q) || (s.tariff||'').toLowerCase().includes(q));
  }
  // filter chips
  if(servicesFilter === 'covered') list = list.filter(s => s.covered);
  if(servicesFilter === 'uncovered') list = list.filter(s => !s.covered);
  // advanced
  if(servicesAdv.code){ const q=servicesAdv.code.toLowerCase(); list=list.filter(s=>(s.code||'').toLowerCase().includes(q)); }
  if(servicesAdv.name){ const q=servicesAdv.name.toLowerCase(); list=list.filter(s=>(s.name||'').toLowerCase().includes(q)); }
  if(servicesAdv.category){ const q=servicesAdv.category.toLowerCase(); list=list.filter(s=>(s.category||'').toLowerCase().includes(q)); }
  if(servicesAdv.tariff){ const q=servicesAdv.tariff.toLowerCase(); list=list.filter(s=>(s.tariff||'').toLowerCase().includes(q)); }
  if(servicesAdv.min){ const n=Number(servicesAdv.min); list=list.filter(s=>(s.base||0)>=n); }
  if(servicesAdv.max){ const n=Number(servicesAdv.max); list=list.filter(s=>(s.base||0)<=n); }
  // sort
  const dir = servicesSortDir === 'desc' ? -1 : 1;
  list.sort((a,b) => {
    let va, vb;
    switch(servicesSort){
      case 'code': va=a.code||''; vb=b.code||''; break;
      case 'base': va=a.base||0; vb=b.base||0; break;
      case 'current': va=a.current||0; vb=b.current||0; break;
      case 'tariff': va=a.tariff||''; vb=b.tariff||''; break;
      case 'category': va=a.category||''; vb=b.category||''; break;
      default: va=a.name||''; vb=b.name||'';
    }
    if(typeof va === 'string') return va.localeCompare(vb)*dir;
    return (va-vb)*dir;
  });

  const body = $('#servicesBody'); if(!body) return;
  if(!list.length){ body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--muted)">لا خدمات</td></tr>'; }
  else body.innerHTML = list.map(s => `<tr><td class="mono">${escapeHtml(s.code)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.category||'—')}</td><td>${escapeHtml(s.tariff)}</td><td class="mono">${fmt(s.base||0)}</td><td class="mono">${fmt(s.current||0)}</td><td>${s.covered?'<span class="badge ok sm">مغطاة</span>':'<span class="badge bad sm">غير مغطاة</span>'}</td></tr>`).join('');
  const kpi = $('#servicesKpi');
  if(kpi){ kpi.innerHTML = `<div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الخدمات</div><div class="kpi-val">${list.length} <small>خدمة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">من أصل ${getAllServicesFlat().length}</div></div>`; }
}

function importServicesCSV(text){
  const lines = String(text||'').trim().split(/\r?\n/).filter(Boolean);
  if(!lines.length) return;
  const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
  const idx = (names) => { for(const n of names){ const i = header.indexOf(n); if(i>=0) return i; } return -1; };
  const iCode = idx(['code','كود']);
  const iName = idx(['name','اسم','service','خدمة']);
  const iCat = idx(['category','فئة']);
  const iBase = idx(['base','أساسي','baseprice']);
  const iCur = idx(['current','حالي','currentprice']);
  const iCov = idx(['covered','تغطية']);
  let tariff = (typeof tariffs !== 'undefined' && tariffs.length) ? tariffs[0] : null;
  if(!tariff){
    tariff = { id: nextTariffNumber(daysFromNow(0)), name:'خدمات مستوردة', type:'general', status:'active', effectiveDate:daysFromNow(0), expiryDate:'', basePriceLevel:100, services:[] };
    tariffs.push(tariff);
  }
  if(!tariff.services) tariff.services = [];
  let count = 0;
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    const get = (j) => (j>=0 ? (cols[j]||'').trim() : '');
    const name = get(iName);
    if(!name) continue;
    const code = get(iCode) || ('SVC-'+(tariff.services.length+1));
    const category = get(iCat) || 'أخرى';
    const base = Number(get(iBase))||0;
    const current = Number(get(iCur))||base;
    const covRaw = get(iCov).toLowerCase();
    const covered = !(covRaw === 'false' || covRaw === '0' || covRaw === 'غير مغطاة' || covRaw === 'no');
    tariff.services.push({ code, name, category, basePrice:base, currentPrice:current, covered, requiresPriorApproval:false });
    count++;
  }
  if(typeof persistData === 'function') persistData(true);
  renderServices();
  if(typeof renderTariffs === 'function') renderTariffs();
  showSuccess('تم', `تم استيراد ${count} خدمة`);
}

function openAdvancedServiceAdd(){
  if(typeof tariffs === 'undefined') return;
  if(!tariffs.length){
    const t = { id: nextTariffNumber(daysFromNow(0)), name:'خدمات عامة', type:'general', status:'active', effectiveDate:daysFromNow(0), expiryDate:'', basePriceLevel:100, services:[] };
    tariffs.push(t);
  }
  const t = tariffs[0];
  if(typeof openTariffModal === 'function'){ openTariffModal(t.id); }
  setTimeout(() => { if(typeof openServiceModal === 'function') openServiceModal(null); }, 400);
}
function bindServicesControls(){
  const s = $('#servicesSearch'); if(s && !s.dataset.bound){ s.dataset.bound='1'; s.addEventListener('input', e => { servicesSearchTerm = e.target.value.trim(); renderServices(); }); }
  const sort = $('#servicesSort'); if(sort && !sort.dataset.bound){ sort.dataset.bound='1'; sort.addEventListener('change', e => { servicesSort = e.target.value; renderServices(); }); }
  const dir = $('#servicesSortDir'); if(dir && !dir.dataset.bound){ dir.dataset.bound='1'; dir.addEventListener('change', e => { servicesSortDir = e.target.value; renderServices(); }); }
  const chips = $('#servicesFilterChips'); if(chips && !chips.dataset.bound){ chips.dataset.bound='1'; chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if(!c) return; $$('#servicesFilterChips .chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); servicesFilter = c.dataset.sfilter; renderServices(); }); }
  const toggle = $('#servicesAdvToggle'); if(toggle && !toggle.dataset.bound){ toggle.dataset.bound='1'; toggle.addEventListener('click', () => { servicesAdvOpen = !servicesAdvOpen; const p = $('#servicesAdvPanel'); if(p) p.style.display = servicesAdvOpen ? 'block' : 'none'; }); }
  const apply = $('#servicesAdvApply'); if(apply && !apply.dataset.bound){ apply.dataset.bound='1'; apply.addEventListener('click', () => { servicesAdv.code = $('#advCode').value.trim(); servicesAdv.name = $('#advName').value.trim(); servicesAdv.category = $('#advCategory').value.trim(); servicesAdv.tariff = $('#advTariff').value.trim(); servicesAdv.min = $('#advMinPrice').value.trim(); servicesAdv.max = $('#advMaxPrice').value.trim(); renderServices(); }); }
  const reset = $('#servicesAdvReset'); if(reset && !reset.dataset.bound){ reset.dataset.bound='1'; reset.addEventListener('click', () => { servicesAdv = {code:'',name:'',category:'',tariff:'',min:'',max:''}; ['advCode','advName','advCategory','advTariff','advMinPrice','advMaxPrice'].forEach(id=>{const el=$('#'+id); if(el) el.value='';}); renderServices(); }); }
  const addBtn = $('#servicesAddBtn'); if(addBtn && !addBtn.dataset.bound){ addBtn.dataset.bound='1'; addBtn.addEventListener('click', () => openAdvancedServiceAdd()); }
  const impBtn = $('#servicesImportBtn'); const impFile = $('#servicesImportFile');
  if(impBtn && impFile && !impBtn.dataset.bound){ impBtn.dataset.bound='1'; impBtn.addEventListener('click', () => impFile.click()); impFile.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f){ const r = new FileReader(); r.onload = () => importServicesCSV(String(r.result||'')); r.readAsText(f,'utf-8'); } e.target.value=''; }); }
}