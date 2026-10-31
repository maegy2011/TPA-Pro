let editingServiceTariffId = null;
let workingLinkedServices = [];
function renderTariffs(){
  const activeN = tariffs.filter(t=>effectiveTariffStatus(t)==='active').length;
  const generalN = tariffs.filter(t=>t.type==='general').length;
  const privateN = tariffs.filter(t=>t.type==='private').length;
  const suppN = tariffs.filter(t=>t.type==='supplementary').length;
  const totalLinks = tariffs.reduce((s,t)=>s+(t.linkedContractIds||[]).length,0);
  const totalServices = tariffs.reduce((s,t)=>s+(t.services?t.services.length:0),0);
  $('#tariffKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">اللوائح</div><div class="kpi-val">${tariffs.length} <small>لائحة</small></div></div><div class="kpi-ico">${kpiIcon('tariff')}</div></div><div class="kpi-foot">${activeN} نشطة · ${totalServices} خدمة</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">التوزيع</div><div class="kpi-val" style="font-size:15px">عامة ${generalN} · خاصة ${privateN} · مكملة ${suppN}</div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${generalN+privateN+suppN}</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">خدمات</div><div class="kpi-val">${totalServices}</div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">عبر اللوائح</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">الروابط</div><div class="kpi-val">${totalLinks}</div></div><div class="kpi-ico">${kpiIcon('link')}</div></div><div class="kpi-foot">عقود</div></div>`;
  const list = tariffs.filter(t => {
    if(tariffFilter === 'discount'){ if(t.adjustmentType !== 'discount') return false; }
    else if(tariffFilter === 'increase'){ if(t.adjustmentType !== 'increase') return false; }
    else if(tariffFilter !== 'all' && t.type !== tariffFilter) return false;
    if(tariffSearch){ const q = tariffSearch; return t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q); }
    return true;
  });
  const body = $('#tariffsBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--muted)">لا لوائح</td></tr>'; return; }
  body.innerHTML = list.map(t => {
    const eff = effectiveTariffStatus(t), ts = TARIFF_STATUS[eff] || TARIFF_STATUS.active;
    const adj = ADJUST_TYPES[t.adjustmentType] || ADJUST_TYPES.none;
    const adjHtml = t.adjustmentType === 'none' ? '<span style="color:var(--muted);font-size:12px">—</span>' : `<span class="badge ${adj.cls}" style="font-weight:800">${adj.label} ${t.adjustmentRate}%</span>`;
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(t.id)}</span></td>
      <td data-label="الاسم"><div style="font-weight:700;font-size:13px">${escapeHtml(t.name)}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${t.basePriceLevel}% · ${(t.services||[]).length} خدمة</div></td>
      <td data-label="النوع"><span class="badge ${TARIFF_TYPES[t.type].cls}">${TARIFF_TYPES[t.type].label}</span></td>
      <td data-label="التسوية">${adjHtml}</td>
      <td data-label="الربط"><div style="font-size:12px;white-space:nowrap"><span style="color:var(--teal);font-weight:800">${(t.linkedProviderIds||[]).length}</span> جهة · <span style="color:var(--gold);font-weight:800">${(t.linkedContractIds||[]).length}</span> عقد</div></td>
      <td data-label="الحالة"><span class="badge ${ts.cls}">${ts.label}</span></td>
      <td class="act"><div style="display:flex;gap:3px;flex-wrap:wrap"><button class="btn-xs" data-edit-tariff="${t.id}">تحرير</button><button class="btn-xs danger" data-delete-tariff="${t.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function openTariffModal(id){
  editingTariffId = id || null; const isEdit = !!id;
  const t = isEdit ? getTariffById(id) : null; if(isEdit && !t) return;
  $('#tfModalTitle').textContent = isEdit ? 'تحرير اللائحة' : 'إضافة لائحة';
  $('#tfModalSub').textContent = isEdit ? `${t.id} — ${t.name}` : 'بيانات جديدة';
  if(isEdit){
    $('#tfNumber').value = t.id; $('#tfName').value = t.name; $('#tfType').value = t.type; $('#tfStatus').value = t.status||'active';
    $('#tfEffective').value = t.effectiveDate||''; $('#tfExpiry').value = t.expiryDate||'';
    $('#tfPriceLevel').value = t.basePriceLevel; $('#tfDescription').value = t.description||'';
    $('#tfIncreaseRate').value = t.annualIncreaseRate||0;
    $('#tfLastIncrease').value = t.lastIncreaseDate||''; $('#tfApprovedBy').value = t.lastIncreaseApprovedBy||'';
    workingServices = (t.services||[]).map(s => ({...s}));
    workingIncreaseHistory = (t.increaseHistory||[]).map(h => ({...h}));
    workingLinkedServices = [...(t.linkedServiceNames||[])];
    (el => { if (el) el.style.display = 'block'; })($('#deleteTariff'));
  } else {
    const today = daysFromNow(0);
    $('#tfNumber').value = nextTariffNumber(today); $('#tfName').value = ''; $('#tfType').value = 'general'; $('#tfStatus').value = 'active';
    $('#tfEffective').value = today; $('#tfExpiry').value = daysFromNow(365); $('#tfPriceLevel').value = 100; $('#tfDescription').value = '';
    $('#tfIncreaseRate').value = 0; $('#tfLastIncrease').value = ''; $('#tfApprovedBy').value = '';

    workingServices = []; workingIncreaseHistory = []; workingLinkedServices = []; (el => { if (el) el.style.display = 'none'; })($('#deleteTariff'));
  }
  $$('.tf-tab').forEach((tab,i) => tab.classList.toggle('active', i === 0));
  $$('.tf-panel').forEach((p,i) => p.classList.toggle('active', i === 0));
  renderIncreaseHistory(); renderLinkLists(isEdit ? t : null); renderTariffServicesChecklist();
  if(!isEdit) $('#tfEffective').onchange = function(){ $('#tfNumber').value = nextTariffNumber(this.value); };
  else $('#tfEffective').onchange = null;
  $('#tariffModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeTariffModal(){ if(!$('#tariffModal').classList.contains('open')) return; $('#tariffModal').classList.remove('open'); _unlockBodyScroll(); editingTariffId = null; workingServices = []; workingIncreaseHistory = []; }
function renderServicesTable(){
  const body = $('#tfServicesBody'); $('#tfServicesCount').textContent = workingServices.length;
  if(!workingServices.length){ body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:22px;color:var(--muted)">لا خدمات</td></tr>'; updateBulkState(); updateAdjustPreview(); return; }
  body.innerHTML = workingServices.map((s,i) => `<tr>
    <td class="cb-cell"><input type="checkbox" class="svc-cb" data-index="${i}"></td>
    <td><span class="mono" style="color:var(--navy-400);font-weight:700">${s.code}</span></td>
    <td><div style="font-weight:700;font-size:12.5px">${s.name} ${s.requiresPriorApproval?'⚠':''}</div><div style="font-size:11px;color:var(--muted);margin-top:1px">${s.category}</div></td>
    <td class="mono">${fmt(s.basePrice)}</td>
    <td class="mono" style="color:var(--teal);font-weight:800">${fmt(s.currentPrice)}</td>
    <td>${s.covered?'<span class="badge ok sm">مغطاة</span>':'<span class="badge bad sm">غير مغطاة</span>'}</td>
    <td class="act"><div style="display:flex;gap:3px"><button type="button" class="btn-xs" data-edit-svc="${i}">تعديل</button><button type="button" class="btn-xs danger" data-del-svc="${i}">حذف</button></div></td>
  </tr>`).join('');
  updateBulkState(); updateAdjustPreview();
}
function updateBulkState(){
  const cbs = $$('#tfServicesBody .svc-cb'); const checked = cbs.filter(cb=>cb.checked).length;
  $('#tfSelCount').textContent = checked; $('#tfBulkCount').textContent = checked;
  $('#tfApplySelected').disabled = checked === 0;
  $('#tfBulkBar').classList.toggle('show', checked > 0);
  if(cbs.length > 0 && checked === cbs.length) $('#tfSelectAll').checked = true;
  else if(checked === 0) $('#tfSelectAll').checked = false;
}
function getAdjustMultiplier(){ const t = $('#tfAdjustType').value, r = Number($('#tfAdjustRate').value)||0; if(t === 'discount') return 1-r/100; if(t === 'increase') return 1+r/100; return 1; }
function updateAdjustPreview(){
  const t = $('#tfAdjustType').value, r = Number($('#tfAdjustRate').value)||0;
  const label = t==='discount'?`خصم ${r}%`:t==='increase'?`زيادة ${r}%`:'بدون';
  if(!workingServices.length){ $('#tfAdjustPreview').innerHTML = 'لا خدمات'; return; }
  $('#tfAdjustPreview').innerHTML = `<b>${escapeHtml(label)}</b> على <b>${workingServices.length}</b> خدمة`;
}
function applyAdjustAll(){ const t = $('#tfAdjustType').value, r = Number($('#tfAdjustRate').value)||0; if(!workingServices.length){ showWarning('تنبيه','لا خدمات'); return; } if(t!=='none' && (r<=0||r>100)){ showWarning('تنبيه','أدخل نسبة'); return; } const mul = getAdjustMultiplier(); workingServices.forEach(s => { s.currentPrice = Math.round(s.basePrice*mul); }); renderServicesTable(); showSuccess('تم','تم التطبيق'); }
function applyAdjustSelected(){ const t = $('#tfAdjustType').value, r = Number($('#tfAdjustRate').value)||0; const sel = $$('#tfServicesBody .svc-cb:checked'); if(!sel.length){ showWarning('تنبيه','حدد خدمة'); return; } if(t!=='none' && (r<=0||r>100)){ showWarning('تنبيه','أدخل نسبة'); return; } const mul = getAdjustMultiplier(); sel.forEach(cb => { const i = Number(cb.dataset.index); if(workingServices[i]) workingServices[i].currentPrice = Math.round(workingServices[i].basePrice*mul); }); renderServicesTable(); showSuccess('تم',`على ${sel.length} خدمة`); }
function resetAllToBase(){ if(!workingServices.length){ showWarning('تنبيه','لا خدمات'); return; } workingServices.forEach(s => { s.currentPrice = s.basePrice; }); renderServicesTable(); showSuccess('تم','تم'); }
function bulkDeleteServices(){ const sel = $$('#tfServicesBody .svc-cb:checked'); if(!sel.length) return; showDelete('حذف', `سيتم حذف ${sel.length}.`, () => { const idxs = sel.map(cb=>Number(cb.dataset.index)).sort((a,b)=>b-a); idxs.forEach(i=>workingServices.splice(i,1)); renderServicesTable(); showSuccess('تم',`${idxs.length}`); }); }
function deleteService(i){ if(!workingServices[i]) return; const s = workingServices[i]; showDelete('حذف', `سيتم حذف "${s.code}".`, () => { workingServices.splice(i,1); renderServicesTable(); showSuccess('تم','تم'); }); }
function openServiceModal(i, tariffId){
  editingServiceIndex = i;
  editingServiceTariffId = tariffId || editingServiceTariffId;
  // populate tariff selector
  const sel = $('#svcTariff');
  if(sel){
    sel.innerHTML = (tariffs||[]).map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
    if(editingServiceTariffId) sel.value = editingServiceTariffId;
    else if(tariffs && tariffs.length) { editingServiceTariffId = tariffs[0].id; sel.value = tariffs[0].id; }
  }
  const t = tariffs.find(x=>x.id===editingServiceTariffId);
  const svc = (i !== null && t && t.services && t.services[i]) ? t.services[i] : null;
  if(svc){ $('#svcModalTitle').textContent = 'تعديل'; $('#svcModalSub').textContent = svc.code+' — '+svc.name; $('#svcCode').value = svc.code; $('#svcCategory').value = svc.category; $('#svcName').value = svc.name; $('#svcBasePrice').value = svc.basePrice; $('#svcCurrentPrice').value = svc.currentPrice; $('#svcCovered').checked = !!svc.covered; $('#svcRequiresPriorApproval').checked = !!svc.requiresPriorApproval; }
  else { $('#svcModalTitle').textContent = 'إضافة'; $('#svcModalSub').textContent = '—'; $('#svcCode').value = ''; $('#svcCategory').value = 'استشارة'; $('#svcName').value = ''; $('#svcBasePrice').value = ''; $('#svcCurrentPrice').value = ''; $('#svcCovered').checked = true; $('#svcRequiresPriorApproval').checked = false; }
  $('#serviceModal').classList.add('open');
}
function closeServiceModal(){ if(!$('#serviceModal').classList.contains('open')) return; $('#serviceModal').classList.remove('open'); editingServiceIndex = null; }
function saveService(){
  const tid = $('#svcTariff') ? $('#svcTariff').value : editingServiceTariffId;
  const t = tariffs.find(x=>x.id===tid); if(!t){ showWarning('تنبيه','اختر اللائحة'); return; }
  if(!t.services) t.services = [];
  const code = $('#svcCode').value.trim(), name = $('#svcName').value.trim(), cat = $('#svcCategory').value;
  const bp = Number($('#svcBasePrice').value)||0, cp = Number($('#svcCurrentPrice').value)||0;
  if(!code){ showWarning('تنبيه','أدخل الكود'); return; }
  if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  if(bp <= 0){ showWarning('تنبيه','أدخل سعراً'); return; }
  const data = { code, name, category:cat, basePrice:bp, currentPrice:cp||bp, covered:$('#svcCovered').checked, requiresPriorApproval:$('#svcRequiresPriorApproval').checked };
  if(editingServiceIndex !== null && t.services[editingServiceIndex]){ t.services[editingServiceIndex] = data; showSuccess('تم','تم'); }
  else { if(t.services.some(s => s.code === code)){ showWarning('تنبيه','الكود مستخدم'); return; } t.services.push(data); showSuccess('تم','تم'); }
  closeServiceModal(); renderServices(); renderTariffs();
}
function renderIncreaseHistory(){ const box = $('#tfHistoryList'); if(!workingIncreaseHistory.length){ box.innerHTML = '<p style="font-size:12px;color:var(--muted);text-align:center;padding:12px;background:#F8FAFC;border-radius:9px">لا سجل</p>'; return; } box.innerHTML = workingIncreaseHistory.map(h => `<div class="history-item"><div><div class="hi-date">${escapeHtml(h.date)}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${escapeHtml(h.approvedBy)}</div></div><div style="text-align:left"><div class="hi-rate">+${escapeHtml(h.rate)}%</div></div></div>`).join(''); }
function applyAnnualIncrease(){
  const rate = Number($('#tfIncreaseRate').value)||0;
  if(rate <= 0 || rate > 100){ showWarning('تنبيه','أدخل نسبة'); return; }
  const cur = Number($('#tfPriceLevel').value)||100;
  showWarning('تأكيد', `تطبيق ${rate}%؟`, () => {
    workingServices.forEach(s => { s.basePrice = Math.round(s.basePrice*(1+rate/100)); s.currentPrice = Math.round(s.currentPrice*(1+rate/100)); });
    const date = daysFromNow(0), by = $('#tfApprovedBy').value.trim()||'الإدارة';
    workingIncreaseHistory.push({ date, rate, approvedBy:by, fromLevel:cur, toLevel:cur+rate });
    $('#tfPriceLevel').value = cur+rate; $('#tfLastIncrease').value = date;
    renderIncreaseHistory(); renderServicesTable(); showSuccess('تم',`${rate}%`);
  });
}
function renderLinkLists(t){
  const sc = t ? (t.linkedContractIds||[]) : [];
  const box = $('#linkContractsList'); if(box) box.innerHTML = contracts.map(c => { const p = getProviderById(c.providerId); return `<label class="link-item ${sc.includes(c.id)?'checked':''}"><input type="checkbox" value="${escapeHtml(c.id)}" ${sc.includes(c.id)?'checked':''}><div><div class="li-name">${escapeHtml(c.id)}</div><div class="li-sub">${escapeHtml(p?p.name:'—')}</div></div></label>`; }).join('');
}
function getAllServiceNamesDistinct(){
  const set = new Set();
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => (t.services||[]).forEach(s => { if(s && s.name) set.add(s.name); }));
  return [...set];
}
function renderTariffServicesChecklist(q){
  const box = $('#tfServicesChecklist'); if(!box) return;
  const term = (q||'').trim().toLowerCase();
  const list = getAllServiceNamesDistinct().filter(n => !term || n.toLowerCase().includes(term));
  box.innerHTML = list.map(n => `<label style="display:block;margin:2px 0"><input type="checkbox" value="${escapeHtml(n)}" ${workingLinkedServices.includes(n)?'checked':''}> ${escapeHtml(n)}</label>`).join('');
  box.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      if(cb.checked){ if(!workingLinkedServices.includes(cb.value)) workingLinkedServices.push(cb.value); }
      else workingLinkedServices = workingLinkedServices.filter(x => x !== cb.value);
    });
  });
}
function saveTariff(){
  const name = $('#tfName').value.trim(); if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  const eff = $('#tfEffective').value; if(!eff){ showWarning('تنبيه','أدخل السريان'); return; }
  const lp = [];
  const lc = $$('#linkContractsList input:checked').map(i => i.value);
  const data = { name, type:$('#tfType').value, description:$('#tfDescription').value.trim(), effectiveDate:eff, expiryDate:$('#tfExpiry').value||'', status:$('#tfStatus').value||'active', basePriceLevel:Number($('#tfPriceLevel').value)||100, annualIncreaseEnabled:false, annualIncreaseRate:Number($('#tfIncreaseRate').value)||0, lastIncreaseDate:$('#tfLastIncrease').value||'', lastIncreaseApprovedBy:$('#tfApprovedBy').value.trim(), adjustmentType:'none', adjustmentRate:0, linkedProviderIds:lp, linkedContractIds:lc, linkedServiceNames:workingLinkedServices, increaseHistory:workingIncreaseHistory, services:workingServices.map(s=>({...s})) };
  if(editingTariffId){ const t = getTariffById(editingTariffId); if(!t) return; Object.assign(t, data); showSuccess('تم','تم التحديث'); }
  else { const nid = nextTariffNumber(eff); tariffs.push({ id:nid, ...data }); showSuccess('تم','تمت الإضافة'); }
  closeTariffModal(); renderAll();
}
