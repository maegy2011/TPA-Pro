// providers-2.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let selectedExcludedServices = [];
function getAllServiceNames(){
  const set = new Set();
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => (t.services||[]).forEach(s => { if(s && s.name) set.add(s.name); }));
  if(!set.size){ ['جميع الخدمات','الخدمات الأساسية','الطوارئ','العلاج الطبيعي'].forEach(x => set.add(x)); }
  return [...set];
}
function renderContractServicesOptions(q){
  const box = $('#ctrServicesList'); if(!box) return;
  const term = (q||'').trim().toLowerCase();
  const list = getAllServiceNames().filter(s => !term || s.toLowerCase().includes(term));
  box.innerHTML = list.map(s => `<label style="display:block;margin:2px 0"><input type="checkbox" value="${escapeHtml(s)}" ${selectedExcludedServices.includes(s)?'checked':''}> ${escapeHtml(s)}</label>`).join('');
  box.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      if(cb.checked){ if(!selectedExcludedServices.includes(cb.value)) selectedExcludedServices.push(cb.value); }
      else selectedExcludedServices = selectedExcludedServices.filter(x => x !== cb.value);
    });
  });
}
function renderContracts(){
  const activeN = contracts.filter(c=>effectiveContractStatus(c)==='active').length;
  const expN = contracts.filter(c=>effectiveContractStatus(c)==='expiring').length;
  const expdN = contracts.filter(c=>effectiveContractStatus(c)==='expired').length;
  let tm = 0, td = 0;
  contracts.forEach(c => { td += (c.discountRate||0); });
  const avg = contracts.length ? td/contracts.length : 0;
  $('#contractKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">العقود</div><div class="kpi-val">${contracts.length} <small>عقد</small></div></div><div class="kpi-ico">${kpiIcon('contract')}</div></div><div class="kpi-foot">${providers.length} جهة</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">السارية</div><div class="kpi-val">${activeN} <small>عقد</small></div></div><div class="kpi-ico">${kpiIcon('check')}</div></div><div class="kpi-foot">${expN} قريب · ${expdN} منتهي</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">متوسط الخصم</div><div class="kpi-val">${avg.toFixed(1)}<small>%</small></div></div><div class="kpi-ico">${kpiIcon('cut')}</div></div><div class="kpi-foot">عبر العقود</div></div>`;
  const urgent = contracts.filter(c => ['expiring','expired'].includes(effectiveContractStatus(c)));
  const al = $('#contractAlert');
  if(urgent.length){
    al.classList.add('show');
    const en = urgent.filter(c=>effectiveContractStatus(c)==='expiring').length;
    const xn = urgent.filter(c=>effectiveContractStatus(c)==='expired').length;
    const parts = []; if(en) parts.push(`${en} تنتهي خلال 60 يوم`); if(xn) parts.push(`${xn} منتهي`);
    $('#contractAlertText').textContent = `لديك ${parts.join(' و ')}.`;
  } else al.classList.remove('show');
  const list = contracts.filter(c => {
    if(contractStatusFilter !== 'all' && effectiveContractStatus(c) !== contractStatusFilter) return false;
    if(contractSearch){ const q = contractSearch, p = getProviderById(c.providerId); return (p && p.name.toLowerCase().includes(q)); }
    return true;
  });
  const body = $('#contractsBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--muted)">لا عقود</td></tr>'; return; }
  body.innerHTML = list.map(c => {
    const p = getProviderById(c.providerId);
    const eff = effectiveContractStatus(c);
    const renewBtn = (eff === 'expiring' || eff === 'expired') ? `<button class="btn-xs" data-renew-contract="${c.id}">تجديد</button>` : '';
    return `<tr>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar alt">${escapeHtml((p?p.name:'—').charAt(0))}</div><div><div class="prov-name">${escapeHtml(p?p.name:'—')}</div><div class="prov-city">${escapeHtml(p?p.city:'' )}</div></div></div></td>
      <td data-label="البداية" class="hide-sm mono">${formatDate(c.startDate)}</td>
      <td data-label="النهاية" class="hide-sm mono">${formatDate(c.endDate)}</td>
      <td data-label="المدة" class="mono">${yearsLabel(c.durationYears || contractDurationYears(c.startDate, c.endDate))}</td>
      <td data-label="المتبقي"><span class="days-cell ${daysRemainingClass(c.endDate)}">${daysRemainingText(c.endDate)}</span></td>
      <td data-label="الخصم" class="mono">${c.discountRate}%<div style="font-size:10px;color:var(--muted)">${Array.isArray(c.rateVersions)?c.rateVersions.length:0} نسخ تاريخية</div></td>
      <td class="act"><div style="display:flex;gap:5px;flex-wrap:nowrap;align-items:center">${renewBtn}<button class="btn-xs" data-edit-contract="${c.id}">تعديل</button><button class="btn-xs danger" data-delete-contract="${c.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function openContractModal(id){
  editingContractId = id || null; const isEdit = !!id;
  const c = isEdit ? getContractById(id) : null; if(isEdit && !c) return;
  if(isEdit){ $('#ctrProvider').innerHTML = `<option value="${escapeHtml(c.providerId)}">${escapeHtml((getProviderById(c.providerId)||{}).name||'—')}</option>`; $('#ctrProvider').disabled = true; }
  else {
    const used = contracts.map(x => x.providerId);
    const avail = providers.filter(p => !used.includes(p.id));
    if(!avail.length){ showWarning('تنبيه','جميع الجهات لديها عقود'); return; }
    $('#ctrProvider').disabled = false;
    $('#ctrProvider').innerHTML = avail.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  }
  $('#ctrModalTitle').textContent = isEdit ? 'تعديل العقد' : 'إضافة عقد';
  $('#ctrModalSub').textContent = isEdit ? ((getProviderById(c.providerId)||{}).name||'—') : 'بيانات جديدة';
  if(isEdit){
    $('#ctrStart').value = c.startDate; $('#ctrDuration').value = c.durationYears || contractDurationYears(c.startDate, c.endDate); $('#ctrEnd').value = c.endDate;
    $('#ctrDiscount').value = c.discountRate; $('#ctrVersionEffective').value = daysFromNow(0);
    selectedExcludedServices = Array.isArray(c.excludedServices) ? [...c.excludedServices] : (c.coveredServices ? String(c.coveredServices).split('، ').map(x=>x.trim()).filter(Boolean) : []);
    $('#ctrNotes').value = c.notes||''; (el => { if (el) el.style.display = 'block'; })($('#deleteContract'));
  } else {
    const today = daysFromNow(0);
    selectedExcludedServices = [];
    $('#ctrStart').value = today; $('#ctrDuration').value = 1; $('#ctrEnd').value = contractEndFrom(today, 1);
    $('#ctrDiscount').value = 10; $('#ctrVersionEffective').value = today;
    $('#ctrNotes').value = '';
    (el => { if (el) el.style.display = 'none'; })($('#deleteContract'));
  }
  const hist = $('#ctrRateHistory');
  if(hist){ const versions=(c&&Array.isArray(c.rateVersions)?c.rateVersions:[]).slice().sort((a,b)=>String(a.effectiveFrom||'').localeCompare(String(b.effectiveFrom||''))); hist.innerHTML=versions.length?versions.map(v=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)"><span>${escapeHtml(v.effectiveFrom||'—')} إلى ${escapeHtml(v.effectiveTo||'مفتوح')}</span><b>${Number(v.discountRate)||0}%</b></div>`).join(''):'لا توجد نسخ تاريخية بعد'; }
  const ss = $('#ctrServicesSearch'); if(ss) ss.value = '';
  renderContractServicesOptions('');
  $('#ctrStart').oninput = updateContractEnd; $('#ctrDuration').oninput = updateContractEnd;
  updateContractEnd();
  $('#contractModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeContractModal(){ if(!$('#contractModal').classList.contains('open')) return; $('#contractModal').classList.remove('open'); _unlockBodyScroll(); editingContractId = null; }
function updateContractEnd(){
  const s = $('#ctrStart')?.value || '', d = Math.max(1, Math.round(Number($('#ctrDuration')?.value)||1));
  const e = $('#ctrEnd'); if(e) e.value = contractEndFrom(s, d);
}
function saveContract(){
  const pid = $('#ctrProvider').value; if(!pid){ showWarning('تنبيه','اختر جهة'); return; }
  const s = $('#ctrStart').value;
  if(!s){ showWarning('تنبيه','أدخل تاريخ البداية'); return; }
  const dur = Math.max(1, Math.round(Number($('#ctrDuration').value)||1));
  const e = contractEndFrom(s, dur);
  if(!e){ showWarning('تنبيه','تعذر حساب النهاية'); return; }
  const versionFrom = $('#ctrVersionEffective').value || s;
  if(versionFrom < s || versionFrom > e){ showWarning('تاريخ السريان','تاريخ سريان النسخة يجب أن يقع داخل مدة العقد'); return; }
  const data = { providerId:pid, startDate:s, endDate:e, durationYears:dur, discountRate:Math.min(100,Math.max(0,Number($('#ctrDiscount').value)||0)), excludedServices:[...selectedExcludedServices], notes:$('#ctrNotes').value.trim() };
  if(editingContractId){
    const c = getContractById(editingContractId); if(!c) return;
    c.rateVersions = Array.isArray(c.rateVersions) ? c.rateVersions : [];
    const current = c.rateVersions.find(v=>v.effectiveFrom===versionFrom);
    if(current){ Object.assign(current,{effectiveTo:e,discountRate:data.discountRate,excludedServices:data.excludedServices}); }
    else {
      const previous = c.rateVersions.filter(v=>v.effectiveTo==='' || v.effectiveTo>=versionFrom).sort((a,b)=>String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)))[0];
      if(previous && previous.effectiveFrom < versionFrom){
        const d=new Date(versionFrom+'T12:00:00'); d.setDate(d.getDate()-1);
        previous.effectiveTo=d.toISOString().slice(0,10);
      } else if(!previous && c.startDate < versionFrom){
        const d=new Date(versionFrom+'T12:00:00'); d.setDate(d.getDate()-1);
        c.rateVersions.push({effectiveFrom:c.startDate,effectiveTo:d.toISOString().slice(0,10),discountRate:c.discountRate,excludedServices:Array.isArray(c.excludedServices)?[...c.excludedServices]:(c.coveredServices||'')});
      }
      c.rateVersions.push({effectiveFrom:versionFrom,effectiveTo:e,discountRate:data.discountRate,excludedServices:data.excludedServices});
    }
    // Keep the master contract's original start date so previous versions remain selectable.
    Object.assign(c,{...data,startDate:c.startDate||s,endDate:e});
    syncContractToProvider(c); showSuccess('تم','تم حفظ نسخة مالية بتاريخ سريان مستقل مع الاحتفاظ بالتاريخ السابق');
  }
  else { const nid = nextContractNumber(s); contracts.push({ id:nid, ...data }); syncContractToProvider({ id:nid, ...data }); showSuccess('تم','تمت الإضافة'); }
  closeContractModal(); renderAll();
}
function renewContractWithDialog(id){
  const c = getContractById(id); if(!c) return;
  const pname = (getProviderById(c.providerId)||{}).name || 'الجهة';
  const dur = c.durationYears || contractDurationYears(c.startDate, c.endDate) || 1;
  const newEnd = extendDateByYears(c.endDate, dur);
  showWarning('تجديد العقد', `تمديد عقد "${pname}" ${yearsLabel(dur)} حتى ${formatDate(newEnd)}؟`, () => {
    const oldEnd = c.endDate;
    c.endDate = newEnd;
    (c.rateVersions||[]).forEach(v => { if(v.effectiveTo === oldEnd) v.effectiveTo = newEnd; });
    syncContractToProvider(c);
    renderAll(); showSuccess('تم', `تم التجديد حتى ${formatDate(newEnd)}`);
  });
}
function deleteContractWithDialog(id){
  const c = getContractById(id); if(!c) return;
  const pname = (getProviderById(c.providerId)||{}).name || 'العقد';
  showDelete('حذف العقد', `سيتم نقل عقد "${pname}".`, () => {
    addToTrash('contract','عقد', pname, c);
    contracts = contracts.filter(x => x.id !== id);
    tariffs.forEach(t => { t.linkedContractIds = (t.linkedContractIds||[]).filter(cid => cid !== id); });
    if($('#contractModal').classList.contains('open')) closeContractModal();
    renderAll(); showSuccess('تم','تم النقل');
  });
}
function bindTariffsControls(){
  $('#tariffSearch').addEventListener('input', e => { tariffSearch = e.target.value.trim().toLowerCase(); renderTariffs(); });
  $('#tariffFilterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#tariffFilterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); tariffFilter = chip.dataset.tfilter; renderTariffs();
  });
  $('#addTariffBtn').addEventListener('click', () => openTariffModal());
  const importTariffBtn=$('#importTariffExcelBtn'); if(importTariffBtn&&!importTariffBtn.dataset.bound){importTariffBtn.dataset.bound='1';importTariffBtn.addEventListener('click',openTariffImportModal);}
  $$('[data-close-tariff-import]').forEach(el=>el.addEventListener('click',()=>$('#tariffImportModal').classList.remove('open')));
  const confirmImport=$('#confirmTariffImport'); if(confirmImport&&!confirmImport.dataset.bound){confirmImport.dataset.bound='1';confirmImport.addEventListener('click',confirmTariffImport);}
  $('#tariffsBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-tariff]'); if(ed) openTariffModal(ed.dataset.editTariff);
    const del = e.target.closest('[data-delete-tariff]'); if(del) deleteTariffWithDialog(del.dataset.deleteTariff);
  });
  $$('.tf-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tf-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.tf-panel').forEach(p => p.classList.toggle('active', p.dataset.tfPanel === tab.dataset.tfTab));
  }));
  $$('.link-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.link-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    (el => { if (el) el.style.display = tab.dataset.linkTab === 'providers' ? 'flex' : 'none'; })($('#linkProvidersList'));
    (el => { if (el) el.style.display = tab.dataset.linkTab === 'contracts' ? 'flex' : 'none'; })($('#linkContractsList'));
  }));
  const lpl = $('#linkProvidersList'); if(lpl) lpl.addEventListener('change', e => { if(e.target.type === 'checkbox') e.target.closest('.link-item').classList.toggle('checked', e.target.checked); });
  const lcl = $('#linkContractsList'); if(lcl) lcl.addEventListener('change', e => { if(e.target.type === 'checkbox') e.target.closest('.link-item').classList.toggle('checked', e.target.checked); });
  const tss = $('#tfServicesSearch'); if(tss && !tss.dataset.bound){ tss.dataset.bound='1'; tss.addEventListener('input', e => renderTariffServicesChecklist(e.target.value)); }
  $('#tfApplyAnnual').addEventListener('click', applyAnnualIncrease);


  $$('[data-close-tariff]').forEach(el => el.addEventListener('click', closeTariffModal));
  $('#saveTariff').addEventListener('click', saveTariff);
  $('#deleteTariff').addEventListener('click', () => { if(editingTariffId) deleteTariffWithDialog(editingTariffId); });
}
