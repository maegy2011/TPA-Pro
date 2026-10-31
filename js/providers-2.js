function renderContracts(){
  const activeN = contracts.filter(c=>effectiveContractStatus(c)==='active').length;
  const expN = contracts.filter(c=>effectiveContractStatus(c)==='expiring').length;
  const expdN = contracts.filter(c=>effectiveContractStatus(c)==='expired').length;
  let tm = 0, td = 0;
  contracts.forEach(c => { tm += (c.maxCoverage||0); td += (c.discountRate||0); });
  const avg = contracts.length ? td/contracts.length : 0;
  $('#contractKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">العقود</div><div class="kpi-val">${contracts.length} <small>عقد</small></div></div><div class="kpi-ico">${kpiIcon('contract')}</div></div><div class="kpi-foot">${providers.length} جهة</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">السارية</div><div class="kpi-val">${activeN} <small>عقد</small></div></div><div class="kpi-ico">${kpiIcon('check')}</div></div><div class="kpi-foot">${expN} قريب · ${expdN} منتهي</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">التغطية</div><div class="kpi-val">${fmt(tm)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">مجموع</div></div>
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
    if(contractSearch){ const q = contractSearch, p = getProviderById(c.providerId); return c.id.toLowerCase().includes(q) || (p && p.name.toLowerCase().includes(q)); }
    return true;
  });
  const body = $('#contractsBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">لا عقود</td></tr>'; return; }
  body.innerHTML = list.map(c => {
    const eff = effectiveContractStatus(c), cs = CONTRACT_STATUS[eff] || CONTRACT_STATUS.active;
    const p = getProviderById(c.providerId);
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(c.id)}</span></td>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar alt">${escapeHtml((p?p.name:'—').charAt(0))}</div><div><div class="prov-name">${escapeHtml(p?p.name:'—')}</div><div class="prov-city">${escapeHtml(p?p.city:'' )}</div></div></div></td>
      <td data-label="البداية" class="hide-sm mono">${formatDate(c.startDate)}</td>
      <td data-label="النهاية" class="hide-sm mono">${formatDate(c.endDate)}</td>
      <td data-label="المتبقي"><span class="days-cell ${daysRemainingClass(c.endDate)}">${daysRemainingText(c.endDate)}</span></td>
      <td data-label="الخصم" class="mono">${c.discountRate}%</td>
      <td data-label="الحالة"><span class="badge ${cs.cls}">${cs.label}</span></td>
      <td class="act"><div style="display:flex;gap:3px;flex-wrap:wrap"><button class="btn-xs" data-edit-contract="${c.id}">تعديل</button><button class="btn-xs danger" data-delete-contract="${c.id}">×</button></div></td>
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
  $('#ctrModalSub').textContent = isEdit ? c.id : 'بيانات جديدة';
  if(isEdit){
    $('#ctrNumber').value = c.id; $('#ctrStatus').value = c.status||'active';
    $('#ctrStart').value = c.startDate; $('#ctrEnd').value = c.endDate;
    $('#ctrDiscount').value = c.discountRate; $('#ctrPayment').value = c.paymentTerms||'30 يوم';
    $('#ctrMaxCoverage').value = c.maxCoverage||0; $('#ctrServices').value = c.coveredServices||'جميع الخدمات';
    $('#ctrNotes').value = c.notes||''; $('#\1')?.style.display = 'block';
  } else {
    const today = daysFromNow(0);
    $('#ctrStatus').value = 'active'; $('#ctrStart').value = today; $('#ctrEnd').value = daysFromNow(365);
    $('#ctrDiscount').value = 10; $('#ctrPayment').value = '30 يوم'; $('#ctrMaxCoverage').value = 200000;
    $('#ctrServices').value = 'جميع الخدمات'; $('#ctrNotes').value = ''; $('#ctrNumber').value = nextContractNumber(today);
    $('#\1')?.style.display = 'none';
  }
  if(!isEdit) $('#ctrStart').onchange = function(){ $('#ctrNumber').value = nextContractNumber(this.value); };
  else $('#ctrStart').onchange = null;
  $('#contractModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeContractModal(){ if(!$('#contractModal').classList.contains('open')) return; $('#contractModal').classList.remove('open'); _unlockBodyScroll(); editingContractId = null; }
function saveContract(){
  const pid = $('#ctrProvider').value; if(!pid){ showWarning('تنبيه','اختر جهة'); return; }
  const s = $('#ctrStart').value, e = $('#ctrEnd').value;
  if(!s || !e){ showWarning('تنبيه','أدخل التواريخ'); return; }
  if(new Date(e) <= new Date(s)){ showWarning('تنبيه','النهاية بعد البداية'); return; }
  const data = { providerId:pid, startDate:s, endDate:e, discountRate:Math.min(100,Math.max(0,Number($('#ctrDiscount').value)||0)), paymentTerms:$('#ctrPayment').value, maxCoverage:Number($('#ctrMaxCoverage').value)||0, coveredServices:$('#ctrServices').value, autoRenew:true, status:$('#ctrStatus').value||'active', notes:$('#ctrNotes').value.trim() };
  if(editingContractId){ const c = getContractById(editingContractId); if(!c) return; Object.assign(c, data); syncContractToProvider(c); showSuccess('تم','تم التحديث'); }
  else { const nid = nextContractNumber(s); contracts.push({ id:nid, ...data }); syncContractToProvider({ id:nid, ...data }); showSuccess('تم','تمت الإضافة'); }
  closeContractModal(); renderAll();
}
function deleteContractWithDialog(id){
  const c = getContractById(id); if(!c) return;
  showDelete('حذف العقد', `سيتم نقل ${c.id}.`, () => {
    addToTrash('contract','عقد', c.id, c);
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
    $('#\1')?.style.display = tab.dataset.linkTab === 'providers' ? 'flex' : 'none';
    $('#\1')?.style.display = tab.dataset.linkTab === 'contracts' ? 'flex' : 'none';
  }));
  $('#linkProvidersList').addEventListener('change', e => { if(e.target.type === 'checkbox') e.target.closest('.link-item').classList.toggle('checked', e.target.checked); });
  $('#linkContractsList').addEventListener('change', e => { if(e.target.type === 'checkbox') e.target.closest('.link-item').classList.toggle('checked', e.target.checked); });
  $('#tfAdjustType').addEventListener('change', updateAdjustPreview);
  $('#tfAdjustRate').addEventListener('input', updateAdjustPreview);
  $('#tfApplyAll').addEventListener('click', applyAdjustAll);
  $('#tfApplySelected').addEventListener('click', applyAdjustSelected);
  $('#tfResetBase').addEventListener('click', resetAllToBase);
  $('#tfApplyAnnual').addEventListener('click', applyAnnualIncrease);
  $('#tfAddServiceBtn').addEventListener('click', () => openServiceModal(null));
  $('#tfServicesBody').addEventListener('click', e => { const ed = e.target.closest('[data-edit-svc]'); if(ed) openServiceModal(Number(ed.dataset.editSvc)); const del = e.target.closest('[data-del-svc]'); if(del) deleteService(Number(del.dataset.delSvc)); });
  $('#tfServicesBody').addEventListener('change', e => { if(e.target.classList.contains('svc-cb')) updateBulkState(); });
  $('#tfSelectAll').addEventListener('change', e => { $$('#tfServicesBody .svc-cb').forEach(cb => { cb.checked = e.target.checked; }); updateBulkState(); });
  $('#tfBulkDelete').addEventListener('click', bulkDeleteServices);
  $$('[data-close-service]').forEach(el => el.addEventListener('click', closeServiceModal));
  $('#saveService').addEventListener('click', saveService);
  $('#svcSyncBtn').addEventListener('click', () => { const mul = getAdjustMultiplier(); const base = Number($('#svcBasePrice').value)||0; $('#svcCurrentPrice').value = Math.round(base*mul); });
  $$('[data-close-tariff]').forEach(el => el.addEventListener('click', closeTariffModal));
  $('#saveTariff').addEventListener('click', saveTariff);
  $('#deleteTariff').addEventListener('click', () => { if(editingTariffId) deleteTariffWithDialog(editingTariffId); });
}
