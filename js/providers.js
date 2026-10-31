let providerStatusFilter = 'all', providerSearch = '', editingProviderId = null;
const EGYPT_PROVINCES = ['القاهرة','الجيزة','الإسكندرية','الدقهلية','البحيرة','المنوفية','القليوبية','الشرقية','الغربية','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس','شمال سيناء','جنوب سيناء','بني سويف','الفيوم','المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','مطروح','الوادي الجديد'];
let selectedProvinces = [];
let contractStatusFilter = 'all', contractSearch = '', editingContractId = null;
let tariffFilter = 'all', tariffSearch = '', editingTariffId = null;
let workingServices = [], workingIncreaseHistory = [], editingServiceIndex = null;
function bindProvidersControls(){
  $('#providerSearch').addEventListener('input', e => { providerSearch = e.target.value.trim().toLowerCase(); renderProviders(); });
  $('#providerFilterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#providerFilterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); providerStatusFilter = chip.dataset.pfilter; renderProviders();
  });
  $('#addProviderBtn').addEventListener('click', () => openProviderModal());
  $('#providersBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-provider]'); if(ed){ openProviderModal(ed.dataset.editProvider); return; }
    const op = e.target.closest('[data-open-contract]'); if(op){ navigateTo('contracts'); openContractModal(op.dataset.openContract); return; }
    const del = e.target.closest('[data-delete-provider]'); if(del){ deleteProviderWithDialog(del.dataset.deleteProvider); return; }
  });
  $$('[data-close-provider]').forEach(el => el.addEventListener('click', closeProviderModal));
  $('#saveProvider').addEventListener('click', saveProvider);
  const ps = $('#pvProvinceSearch'); if(ps) ps.addEventListener('input', e => renderProvinceOptions(e.target.value));
  $('#deleteProvider').addEventListener('click', () => { if(editingProviderId) deleteProviderWithDialog(editingProviderId); });
}
function renderProviders(){
  const activeN = providers.filter(p => getEffectiveProviderStatus(p) === 'active').length;
  const expN = providers.filter(p => getEffectiveProviderStatus(p) === 'expiring').length;
  let tc = 0, tb = 0, ta = 0;
  providers.forEach(p => { const s = getProviderStats(p.name); tc+=s.claims; tb+=s.billed; ta+=s.approved; });
  const avg = tb ? ((tb-ta)/tb*100) : 0;
  $('#providerKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الجهات</div><div class="kpi-val">${providers.length} <small>جهة</small></div></div><div class="kpi-ico">${kpiIcon('building')}</div></div><div class="kpi-foot">${activeN} نشط · ${expN} قريب</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">العقود</div><div class="kpi-val">${contracts.length} <small>عقد</small></div></div><div class="kpi-ico">${kpiIcon('contract')}</div></div><div class="kpi-foot">${providers.length} جهة</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">المطالبات</div><div class="kpi-val">${fmt(tb)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('link')}</div></div><div class="kpi-foot">${tc} مطالبة</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">متوسط الاستقطاع</div><div class="kpi-val">${avg.toFixed(1)}<small>%</small></div></div><div class="kpi-ico">${kpiIcon('cut')}</div></div><div class="kpi-foot">عبر الجهات</div></div>`;
  const list = providers.filter(p => {
    if(providerStatusFilter !== 'all' && getEffectiveProviderStatus(p) !== providerStatusFilter) return false;
    if(providerSearch){ const q = providerSearch; return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || (p.contact||'').toLowerCase().includes(q); }
    return true;
  });
  const body = $('#providersBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--muted)">لا جهات</td></tr>'; return; }
  body.innerHTML = list.map(p => {
    const eff = getEffectiveProviderStatus(p), cs = CONTRACT_STATUS[eff] || CONTRACT_STATUS.active;
    const st = getProviderStats(p.name);
    const c = getContractByProvider(p.id);
    return `<tr>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar">${escapeHtml(p.name.charAt(0))}</div><div><div class="prov-name">${escapeHtml(p.name)}</div><div class="prov-city">${escapeHtml(p.city)}</div></div></div></td>
      <td data-label="النوع"><span class="badge ${TYPE_CLASS[p.type]||'info'}">${p.type}</span></td>
      <td data-label="التواصل" class="hide-sm">${escapeHtml(p.contact||'—')}</td>
      <td data-label="العقد"><span class="badge ${cs.cls}">${cs.label}</span>${c?`<div class="ctr-link" data-open-contract="${c.id}">${c.id}</div>`:''}</td>
      <td data-label="المطالبات"><div class="mono">${st.claims} مطالبة</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${fmtC(st.approved)}</div></td>
      <td class="act"><div style="display:flex;gap:3px;flex-wrap:wrap"><button class="btn-xs" data-edit-provider="${p.id}">تعديل</button><button class="btn-xs danger" data-delete-provider="${p.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function renderProvinceOptions(q){
  const box = $('#pvProvinceList'); if(!box) return;
  const term = (q||'').trim().toLowerCase();
  const list = EGYPT_PROVINCES.filter(p => !term || p.toLowerCase().includes(term));
  box.innerHTML = list.map(p => `<label style="display:block;margin:2px 0"><input type="checkbox" value="${escapeHtml(p)}" ${selectedProvinces.includes(p)?'checked':''}> ${escapeHtml(p)}</label>`).join('');
  box.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      if(cb.checked){ if(!selectedProvinces.includes(cb.value)) selectedProvinces.push(cb.value); }
      else selectedProvinces = selectedProvinces.filter(x => x !== cb.value);
    });
  });
}
function openProviderModal(id){
  editingProviderId = id || null; const isEdit = !!id;
  const p = isEdit ? getProviderById(id) : null; if(isEdit && !p) return;
  $('#prvModalTitle').textContent = isEdit ? 'تعديل جهة' : 'إضافة جهة';
  $('#prvModalSub').textContent = isEdit ? p.name : 'بيانات جديدة';
  selectedProvinces = isEdit ? (Array.isArray(p.province) ? [...p.province] : (p.city ? p.city.split('، ').map(x=>x.trim()).filter(Boolean) : [])) : [];
  if(isEdit){
    $('#pvName').value = p.name; $('#pvType').value = p.type;
    $('#pvContact').value = p.contact||''; $('#pvPhone').value = p.phone||'';
    $('#pvEmail').value = p.email||''; $('#pvNotes').value = p.notes||'';
    $('#\1')?.style.display = 'block';
  } else {
    ['pvName','pvContact','pvPhone','pvEmail','pvNotes'].forEach(x => { const el = $('#'+x); if(el) el.value = ''; });
    $('#pvType').value = 'مستشفى'; $('#\1')?.style.display = 'none';
  }
  const s = $('#pvProvinceSearch'); if(s) s.value = '';
  renderProvinceOptions('');
  $('#providerModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeProviderModal(){ if(!$('#providerModal').classList.contains('open')) return; $('#providerModal').classList.remove('open'); _unlockBodyScroll(); editingProviderId = null; }
function saveProvider(){
  const name = $('#pvName').value.trim();
  if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  if(providers.find(p => p.name === name && p.id !== editingProviderId)){ showWarning('تنبيه','الاسم مستخدم'); return; }
  const provinceList = [...selectedProvinces];
  const data = { name, type:$('#pvType').value, province: provinceList, city: provinceList.join('، '), contact:$('#pvContact').value.trim(), phone:$('#pvPhone').value.trim(), email:$('#pvEmail').value.trim(), notes:$('#pvNotes').value.trim() };
  if(editingProviderId){ const p = getProviderById(editingProviderId); if(!p) return; const old = p.name; Object.assign(p, data); if(old !== name) renameProviderClaims(old, name); showSuccess('تم','تم التحديث'); }
  else { const maxN = providers.reduce((m,p)=>{ const n = parseInt(p.id.split('-')[1], 10); return Math.max(m, isNaN(n)?0:n); }, 0); providers.push({ id:'PRV-'+String(maxN+1).padStart(3,'0'), ...data }); showSuccess('تم','تمت الإضافة'); }
  closeProviderModal(); renderAll();
  if(document.getElementById('batchModal')?.classList.contains('open')){ const sel = document.getElementById('btProvider'); if(sel && providers.length){ sel.innerHTML = providers.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.city?' — '+escapeHtml(p.city):''}</option>`).join(''); sel.value = providers[providers.length-1].id; } }
}
function deleteProviderWithDialog(id){
  const p = getProviderById(id); if(!p) return;
  if(providerHasClaims(p.name)){ showWarning('لا يمكن','مرتبطة بمطالبات'); return; }
  const lc = contracts.filter(c => c.providerId === id);
  const lb = batches.filter(b => b.providerId === id);
  showDelete('حذف الجهة', `سيتم نقل "${p.name}" و${lc.length+lb.length} عنصر.`, () => {
    addToTrash('provider','جهة', p.name, p);
    providers = providers.filter(x => x.id !== id);
    lc.forEach(c => addToTrash('contract','عقد', c.id, c));
    contracts = contracts.filter(c => c.providerId !== id);
    lb.forEach(b => addToTrash('batch','دفعة', b.id, b));
    batches = batches.filter(b => b.providerId !== id);
    tariffs.forEach(t => { t.linkedProviderIds = (t.linkedProviderIds||[]).filter(pid => pid !== id); });
    if($('#providerModal').classList.contains('open')) closeProviderModal();
    renderAll(); showSuccess('تم','تم النقل');
  });
}
function bindContractsControls(){
  $('#contractSearch').addEventListener('input', e => { contractSearch = e.target.value.trim().toLowerCase(); renderContracts(); });
  $('#contractFilterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#contractFilterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); contractStatusFilter = chip.dataset.cfilter; renderContracts();
  });
  $('#addContractBtn').addEventListener('click', () => openContractModal());
  $('#contractsBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-contract]'); if(ed) openContractModal(ed.dataset.editContract);
    const del = e.target.closest('[data-delete-contract]'); if(del) deleteContractWithDialog(del.dataset.deleteContract);
  });
  $$('[data-close-contract]').forEach(el => el.addEventListener('click', closeContractModal));
  $('#saveContract').addEventListener('click', saveContract);
  $('#deleteContract').addEventListener('click', () => { if(editingContractId) deleteContractWithDialog(editingContractId); });
}
