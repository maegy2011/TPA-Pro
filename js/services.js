let servicesSearchTerm = '', servicesFilter = 'all', servicesSort = 'name', servicesSortDir = 'asc';
let servicesAdv = { code:'', name:'', category:'', tariff:'', min:'', max:'' };
let servicesAdvOpen = false;
let editingServiceForm = {tariffId:null,index:null};
let servicesTariffFilter = 'all';

function getAllServicesFlat(){
  const out = [];
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => {
    (t.services||[]).forEach((s, idx) => { out.push({ code:s.code, name:s.name, category:s.category, tariff:t.name, tariffId:t.id, index:idx, base:s.basePrice, current:s.currentPrice, covered:!!s.covered }); });
  });
  return out;
}

function renderServicesTariffFilter(){
  const sel = $('#servicesTariffFilter'); if(!sel) return;
  const cur = sel.value || 'all';
  sel.innerHTML = '<option value="all">كل اللوائح</option>' + (tariffs||[]).map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
  sel.value = (tariffs||[]).some(t=>t.id===cur) ? cur : 'all';
}

function renderServices(){
  renderServicesTariffFilter();
  let list = getAllServicesFlat();
  if(servicesTariffFilter !== 'all') list = list.filter(s => s.tariffId === servicesTariffFilter);
  if(servicesSearchTerm){
    const q = servicesSearchTerm.toLowerCase();
    list = list.filter(s => (s.code||'').toLowerCase().includes(q) || (s.name||'').toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q) || (s.tariff||'').toLowerCase().includes(q));
  }
  if(servicesFilter === 'covered') list = list.filter(s => s.covered);
  if(servicesFilter === 'uncovered') list = list.filter(s => !s.covered);
  if(servicesAdv.code){ const q=servicesAdv.code.toLowerCase(); list=list.filter(s=>(s.code||'').toLowerCase().includes(q)); }
  if(servicesAdv.name){ const q=servicesAdv.name.toLowerCase(); list=list.filter(s=>(s.name||'').toLowerCase().includes(q)); }
  if(servicesAdv.category){ const q=servicesAdv.category.toLowerCase(); list=list.filter(s=>(s.category||'').toLowerCase().includes(q)); }
  if(servicesAdv.tariff){ const q=servicesAdv.tariff.toLowerCase(); list=list.filter(s=>(s.tariff||'').toLowerCase().includes(q)); }
  if(servicesAdv.min){ const n=Number(servicesAdv.min); list=list.filter(s=>(s.base||0)>=n); }
  if(servicesAdv.max){ const n=Number(servicesAdv.max); list=list.filter(s=>(s.base||0)<=n); }
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
  if(!list.length){ body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">لا خدمات</td></tr>'; }
  else body.innerHTML = list.map(s => `<tr>
    <td class="mono">${escapeHtml(s.code)}</td>
    <td>${escapeHtml(s.name)}</td>
    <td>${escapeHtml(s.category||'—')}</td>
    <td>${escapeHtml(s.tariff)}</td>
    <td class="mono">${fmt(s.base||0)}</td>
    <td class="mono">${fmt(s.current||0)}</td>
    <td>${s.covered?'<span class="badge ok sm">مغطاة</span>':'<span class="badge bad sm">غير مغطاة</span>'}</td>
    <td class="act"><div style="display:flex;gap:3px"><button class="btn-xs" data-edit-service="${s.tariffId}|${s.index}">تعديل</button><button class="btn-xs danger" data-del-service="${s.tariffId}|${s.index}">حذف</button></div></td>
  </tr>`).join('');
  const kpi = $('#servicesKpi');
  if(kpi){ kpi.innerHTML = `<div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الخدمات</div><div class="kpi-val">${list.length} <small>خدمة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">من أصل ${getAllServicesFlat().length}</div></div>`; }
}

function showServiceFormPanel(tariffId, idx){
  if(typeof tariffs === 'undefined') return;
  if(!tariffs.length){
    const t = { id: nextTariffNumber(daysFromNow(0)), name:'خدمات عامة', type:'general', status:'active', effectiveDate:daysFromNow(0), expiryDate:'', basePriceLevel:100, services:[] };
    tariffs.push(t);
  }
  const sel = $('#servicesTariffFilter');
  const tid = tariffId || ((sel && sel.value !== 'all') ? sel.value : tariffs[0].id);
  const t = tariffs.find(x=>x.id===tid) || tariffs[0];
  // populate tariff select
  const ts = $('#sfTariff'); if(ts){ ts.innerHTML = tariffs.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join(''); ts.value = t.id; }
  // reset or load
  const svc = (idx !== null && idx !== undefined && t.services && t.services[idx]) ? t.services[idx] : null;
  editingServiceForm = { tariffId: t.id, index: (svc? idx : null) };
  $('#sfCode').value = svc? svc.code : '';
  $('#sfCategory').value = svc? svc.category : 'استشارة';
  $('#sfName').value = svc? svc.name : '';
  $('#sfBasePrice').value = svc? svc.basePrice : '';
  $('#sfCurrentPrice').value = svc? svc.currentPrice : '';
  $('#sfCovered').checked = svc? !!svc.covered : true;
  $('#sfRequiresPriorApproval').checked = svc? !!svc.requiresPriorApproval : false;
  const panel = $('#serviceFormPanel'); if(panel) panel.style.display = 'block';
}
function hideServiceFormPanel(){ const panel = $('#serviceFormPanel'); if(panel) panel.style.display = 'none'; editingServiceForm = {tariffId:null,index:null}; }
function saveServiceForm(){
  const tid = $('#sfTariff').value;
  const t = tariffs.find(x=>x.id===tid); if(!t){ showWarning('تنبيه','اختر اللائحة'); return; }
  if(!t.services) t.services = [];
  const code = $('#sfCode').value.trim(), name = $('#sfName').value.trim(), cat = $('#sfCategory').value;
  const bp = Number($('#sfBasePrice').value)||0, cp = Number($('#sfCurrentPrice').value)||0;
  if(!code){ showWarning('تنبيه','أدخل الكود'); return; }
  if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  if(bp <= 0){ showWarning('تنبيه','أدخل سعراً'); return; }
  const data = { code, name, category:cat, basePrice:bp, currentPrice:cp||bp, covered:$('#sfCovered').checked, requiresPriorApproval:$('#sfRequiresPriorApproval').checked };
  const idx = editingServiceForm.index;
  if(idx !== null && t.services[idx]){
    // if tariff changed, move? keep simple: update in original tariff
    const origT = tariffs.find(x=>x.id===editingServiceForm.tariffId);
    if(origT && origT !== t){
      // remove from original
      if(origT.services) origT.services.splice(idx,1);
    }
    // update target
    const existingIdx = t.services.findIndex(s=>s.code===code && t.services.indexOf(s)!==idx);
    // just replace if same tariff
    if(editingServiceForm.tariffId === tid && t.services[idx]) { t.services[idx] = data; }
    else { if(t.services.some(s=>s.code===code)){ showWarning('تنبيه','الكود مستخدم'); return; } t.services.push(data); }
    showSuccess('تم','تم');
  } else {
    if(t.services.some(s=>s.code===code)){ showWarning('تنبيه','الكود مستخدم'); return; }
    t.services.push(data); showSuccess('تم','تم');
  }
  if(typeof persistData === 'function') persistData(true);
  hideServiceFormPanel(); renderServices(); renderTariffs();
}

function editServiceAt(tid, idx){
  const t = tariffs.find(x=>x.id===tid); if(!t || !t.services) return;
  if(typeof openServiceModal === 'function'){ openServiceModal(idx, t.id); }
}

function deleteServiceAt(tid, idx){
  const t = tariffs.find(x=>x.id===tid); if(!t || !t.services || !t.services[idx]) return;
  const s = t.services[idx];
  showDelete('حذف الخدمة', `سيتم حذف "${s.name}".`, () => {
    t.services.splice(idx,1);
    if(typeof persistData === 'function') persistData(true);
    renderServices();
    showSuccess('تم','تم الحذف');
  });
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
  const iTariff = idx(['tariff','لائحة']);
  let count = 0;
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    const get = (j) => (j>=0 ? (cols[j]||'').trim() : '');
    const name = get(iName);
    if(!name) continue;
    const tariffName = get(iTariff);
    let tariff = tariffs.find(t => t.name === tariffName) || tariffs[0];
    if(!tariff){
      tariff = { id: nextTariffNumber(daysFromNow(0)), name: tariffName || 'خدمات مستوردة', type:'general', status:'active', effectiveDate:daysFromNow(0), expiryDate:'', basePriceLevel:100, services:[] };
      tariffs.push(tariff);
    }
    if(!tariff.services) tariff.services = [];
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

function bindServicesControls(){
  const s = $('#servicesSearch'); if(s && !s.dataset.bound){ s.dataset.bound='1'; s.addEventListener('input', e => { servicesSearchTerm = e.target.value.trim(); renderServices(); }); }
  const tf = $('#servicesTariffFilter'); if(tf && !tf.dataset.bound){ tf.dataset.bound='1'; tf.addEventListener('change', e => { servicesTariffFilter = e.target.value; renderServices(); }); }
  const sort = $('#servicesSort'); if(sort && !sort.dataset.bound){ sort.dataset.bound='1'; sort.addEventListener('change', e => { servicesSort = e.target.value; renderServices(); }); }
  const dir = $('#servicesSortDir'); if(dir && !dir.dataset.bound){ dir.dataset.bound='1'; dir.addEventListener('change', e => { servicesSortDir = e.target.value; renderServices(); }); }
  const chips = $('#servicesFilterChips'); if(chips && !chips.dataset.bound){ chips.dataset.bound='1'; chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if(!c) return; $$('#servicesFilterChips .chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); servicesFilter = c.dataset.sfilter; renderServices(); }); }
  const toggle = $('#servicesAdvToggle'); if(toggle && !toggle.dataset.bound){ toggle.dataset.bound='1'; toggle.addEventListener('click', () => { servicesAdvOpen = !servicesAdvOpen; const p = $('#servicesAdvPanel'); if(p) p.style.display = servicesAdvOpen ? 'block' : 'none'; }); }
  const apply = $('#servicesAdvApply'); if(apply && !apply.dataset.bound){ apply.dataset.bound='1'; apply.addEventListener('click', () => { servicesAdv.code = $('#advCode').value.trim(); servicesAdv.name = $('#advName').value.trim(); servicesAdv.category = $('#advCategory').value.trim(); servicesAdv.tariff = $('#advTariff').value.trim(); servicesAdv.min = $('#advMinPrice').value.trim(); servicesAdv.max = $('#advMaxPrice').value.trim(); renderServices(); }); }
  const reset = $('#servicesAdvReset'); if(reset && !reset.dataset.bound){ reset.dataset.bound='1'; reset.addEventListener('click', () => { servicesAdv = {code:'',name:'',category:'',tariff:'',min:'',max:''}; ['advCode','advName','advCategory','advTariff','advMinPrice','advMaxPrice'].forEach(id=>{const el=$('#'+id); if(el) el.value='';}); renderServices(); }); }
  const impBtn = $('#servicesImportBtn'); const impFile = $('#servicesImportFile');
  if(impBtn && impFile && !impBtn.dataset.bound){ impBtn.dataset.bound='1'; impBtn.addEventListener('click', () => impFile.click()); impFile.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f){ const r = new FileReader(); r.onload = () => importServicesCSV(String(r.result||'')); r.readAsText(f,'utf-8'); } e.target.value=''; }); }
  const addBtn = $('#servicesAddBtn'); if(addBtn && !addBtn.dataset.bound){ addBtn.dataset.bound='1'; addBtn.addEventListener('click', () => showServiceFormPanel()); }
  const sfSave = $('#sfSaveBtn'); if(sfSave && !sfSave.dataset.bound){ sfSave.dataset.bound='1'; sfSave.addEventListener('click', () => saveServiceForm()); }
  const sfCancel = $('#sfCancelBtn'); if(sfCancel && !sfCancel.dataset.bound){ sfCancel.dataset.bound='1'; sfCancel.addEventListener('click', () => hideServiceFormPanel()); }
  const body = $('#servicesBody'); if(body && !body.dataset.bound){ body.dataset.bound='1'; body.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-service]'); if(ed){ const [tid, idx] = ed.dataset.editService.split('|'); showServiceFormPanel(tid, Number(idx)); return; }
    const del = e.target.closest('[data-del-service]'); if(del){ const [tid, idx] = del.dataset.delService.split('|'); deleteServiceAt(tid, Number(idx)); return; }
  }); }
}