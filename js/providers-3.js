// providers-3.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let editingServiceTariffId = null;
let workingLinkedServices = [];
/* ترشيح اللوائح — منطق خالص (يُختبر آليًا). */
function filterTariffsList(list, typeFilter, term){
  const q = String(term || '').trim().toLowerCase();
  return (list || []).filter(t => {
    if(typeFilter && typeFilter !== 'all' && t.type !== typeFilter) return false;
    if(q) return String(t.id||'').toLowerCase().includes(q) || String(t.name||'').toLowerCase().includes(q);
    return true;
  });
}
/* فحص مدخلات اللائحة — منطق خالص (يُختبر آليًا). */
function validateTariffInput(d){
  d = d || {};
  if(!String(d.name || '').trim()) return { ok:false, msg:'أدخل الاسم' };
  if(!d.effectiveDate) return { ok:false, msg:'أدخل السريان' };
  if(d.expiryDate && d.expiryDate < d.effectiveDate) return { ok:false, msg:'الانتهاء قبل السريان' };
  return { ok:true, msg:'' };
}
/* بوابة النسخة الجديدة عند تعديل الأسعار — منطق خالص (يُختبر آليًا). */
function checkTariffNewVersion(t, servicesChanged, dateChanged, newEff){
  if(!servicesChanged && !dateChanged) return { ok:true, msg:'' };
  if(t && t.effectiveDate && newEff <= t.effectiveDate) return { ok:false, msg:'عند تغيير الأسعار أو تاريخ سريان النسخة يجب أن يكون التاريخ الجديد بعد النسخة الحالية' };
  return { ok:true, msg:'' };
}
/* فرق الخدمات قبل/بعد — منطق خالص (يُختبر آليًا). */
function diffTariffServices(before, after){
  const b = Array.isArray(before) ? before : [], a = Array.isArray(after) ? after : [];
  const oldBy = new Map(b.map(x => [String(x.code), x])), newBy = new Map(a.map(x => [String(x.code), x]));
  const changes = [];
  for(const [code, svc] of oldBy){ const n = newBy.get(code); if(!n) changes.push({ code, action:'delete', before:svc, after:null }); else if(JSON.stringify(svc) !== JSON.stringify(n)) changes.push({ code, action:'update', before:svc, after:n }); }
  for(const [code, svc] of newBy) if(!oldBy.has(code)) changes.push({ code, action:'add', before:null, after:svc });
  return changes;
}
function renderTariffs(){
  if(typeof autoRenewTariffs === 'function') autoRenewTariffs();
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
  const list = (typeof filterTariffsList === 'function') ? filterTariffsList(tariffs, tariffFilter, tariffSearch) : tariffs.slice();
  const body = $('#tariffsBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--muted)">لا لوائح</td></tr>'; return; }
  body.innerHTML = list.map(t => {
    const eff = effectiveTariffStatus(t), ts = TARIFF_STATUS[eff] || TARIFF_STATUS.active;
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(t.id)}</span></td>
      <td data-label="الاسم"><div style="font-weight:700;font-size:13px">${escapeHtml(t.name)}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${(t.services||[]).length} خدمة</div></td>
      <td data-label="النوع"><span class="badge ${TARIFF_TYPES[t.type].cls}">${TARIFF_TYPES[t.type].label}</span></td>
      <td data-label="الربط"><div style="font-size:12px;white-space:nowrap"><span style="color:var(--teal);font-weight:800">${(t.linkedProviderIds||[]).length}</span> جهة · <span style="color:var(--gold);font-weight:800">${(t.linkedContractIds||[]).length}</span> عقد</div></td>
      <td data-label="الحالة"><span class="badge ${ts.cls}">${ts.label}</span></td>
      <td class="act"><div style="display:flex;gap:5px;flex-wrap:nowrap;align-items:center"><button class="btn-xs" data-edit-tariff="${t.id}">تحرير</button><button class="btn-xs danger" data-delete-tariff="${t.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function openTariffModal(id){
  editingTariffId = id || null; const isEdit = !!id;
  const t = isEdit ? getTariffById(id) : null; if(isEdit && !t) return;
  $('#tfModalTitle').textContent = isEdit ? 'تحرير اللائحة' : 'إضافة لائحة';
  $('#tfModalSub').textContent = isEdit ? `${t.id} — ${t.name}` : 'بيانات جديدة';
  if(isEdit){
    $('#tfNumber').value = t.id; $('#tfName').value = t.name; $('#tfType').value = t.type; $('#tfStatus').value = (t.status === 'disabled') ? 'disabled' : 'active';
    $('#tfEffective').value = t.effectiveDate||''; $('#tfExpiry').value = t.expiryDate||'';
    $('#tfDescription').value = t.description||'';
    workingServices = (t.services||[]).map(s => ({...s}));
    workingLinkedServices = [...(t.linkedServiceNames||[])];
    (el => { if (el) el.style.display = 'block'; })($('#deleteTariff'));
  } else {
    const today = daysFromNow(0);
    $('#tfNumber').value = nextTariffNumber(today); $('#tfName').value = ''; $('#tfType').value = 'general'; $('#tfStatus').value = 'active';
    $('#tfEffective').value = today; $('#tfExpiry').value = daysFromNow(365); $('#tfDescription').value = '';

    workingServices = []; workingLinkedServices = []; (el => { if (el) el.style.display = 'none'; })($('#deleteTariff'));
  }
  $$('.tf-tab').forEach((tab,i) => tab.classList.toggle('active', i === 0));
  $$('.tf-panel').forEach((p,i) => p.classList.toggle('active', i === 0));
  renderLinkLists(isEdit ? t : null); renderTariffServicesChecklist();
  if(!isEdit) $('#tfEffective').onchange = function(){ $('#tfNumber').value = nextTariffNumber(this.value); };
  else $('#tfEffective').onchange = null;
  $('#tariffModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeTariffModal(){ if(!$('#tariffModal').classList.contains('open')) return; $('#tariffModal').classList.remove('open'); _unlockBodyScroll(); editingTariffId = null; workingServices = []; }
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
  const svcEff=$('#svcEffectiveDate'); if(svcEff){ svcEff.value=tariffDatePlusOne(t&&t.effectiveDate||new Date().toISOString().slice(0,10)); }
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
  const eff=$('#svcEffectiveDate')?.value||''; if(!eff){showWarning('تنبيه','حدد تاريخ السريان');return;}
  if(t.effectiveDate&&eff<=t.effectiveDate){showWarning('تاريخ السريان','يجب أن يكون بعد تاريخ سريان النسخة الحالية');return;}
  const before=editingServiceIndex!==null&&t.services[editingServiceIndex]?{...t.services[editingServiceIndex]}:null;
  if(t.services.some((s,i)=>s.code===code && i!==editingServiceIndex)){showWarning('تنبيه','الكود مستخدم');return;}
  const snap={services:JSON.parse(JSON.stringify(t.services)),priceVersions:JSON.parse(JSON.stringify(t.priceVersions||[])),changeLog:JSON.parse(JSON.stringify(t.changeLog||[])),effectiveDate:t.effectiveDate};
  archiveTariffVersion(t,eff,before?'service-update':'service-add',[{code,action:before?'update':'add',before,after:{...data}}]);
  if(before)t.services[editingServiceIndex]=data;else t.services.push(data);
  if(typeof persistData==='function'&&persistData(true)===false){t.services=snap.services;t.priceVersions=snap.priceVersions;t.changeLog=snap.changeLog;t.effectiveDate=snap.effectiveDate;showWarning('خطأ','تعذر الحفظ وتم التراجع');return;}
  closeServiceModal(); renderServices(); renderTariffs(); renderTariffChangeHistory(); showSuccess('تم','تم الحفظ مع حفظ تاريخ الأسعار');
}
function renderLinkLists(t){
  const sc = t ? (t.linkedContractIds||[]) : [];
  const box = $('#linkContractsList'); if(box) box.innerHTML = contracts.map(c => { const p = getProviderById(c.providerId); return `<label class="link-item ${sc.includes(c.id)?'checked':''}"><input type="checkbox" value="${escapeHtml(c.id)}" ${sc.includes(c.id)?'checked':''}><div><div class="li-name">${escapeHtml(p?p.name:'—')}</div><div class="li-sub">خصم ${Number(c.discountRate)||0}%</div></div></label>`; }).join('');
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
  const chk = (typeof validateTariffInput === 'function') ? validateTariffInput({ name:$('#tfName').value.trim(), effectiveDate:$('#tfEffective').value, expiryDate:$('#tfExpiry').value }) : { ok:true };
  if(!chk.ok){ showWarning('تنبيه', chk.msg); return; }
  const name = $('#tfName').value.trim();
  const eff = $('#tfEffective').value;
  const lp = [];
  const lc = $$('#linkContractsList input:checked').map(i => i.value);
  const data = { name, type:$('#tfType').value, description:$('#tfDescription').value.trim(), effectiveDate:eff, expiryDate:$('#tfExpiry').value||'', status:$('#tfStatus').value||'active', linkedProviderIds:lp, linkedContractIds:lc, linkedServiceNames:workingLinkedServices, services:workingServices.map(s=>({...s})) };
  if(editingTariffId){
    const t=getTariffById(editingTariffId); if(!t)return;
    const oldServices=JSON.stringify(t.services||[]), newServices=JSON.stringify(data.services||[]);
    const dateChanged=String(t.effectiveDate||'')!==String(eff||'');
    if(oldServices!==newServices || dateChanged){
      const gate = (typeof checkTariffNewVersion === 'function') ? checkTariffNewVersion(t, oldServices!==newServices, dateChanged, eff) : { ok:true };
      if(!gate.ok){ showWarning('تاريخ السريان', gate.msg); return; }
      const changes = (typeof diffTariffServices === 'function') ? diffTariffServices(JSON.parse(oldServices), JSON.parse(newServices)) : [];
      archiveTariffVersion(t,eff,'tariff-edit',changes);
    } else if(!Array.isArray(t.changeLog)) t.changeLog=[];
    Object.assign(t,data); if(oldServices===newServices && !dateChanged){t.changeLog.push({at:new Date().toISOString(),effectiveDate:eff,action:'tariff-metadata-edit',actor:(appSettings.reviewer&&appSettings.reviewer.name)||'المستخدم',changes:[]});}
    showSuccess('تم','تم التحديث مع الاحتفاظ بتاريخ الأسعار');
  }
  else { const nid = nextTariffNumber(eff); tariffs.push({ id:nid, ...data, priceVersions:[], changeLog:[{at:new Date().toISOString(),effectiveDate:eff,action:'create',actor:(appSettings.reviewer&&appSettings.reviewer.name)||'المستخدم',changes:(data.services||[]).map(x=>({code:x.code,action:'add',before:null,after:x}))}] }); showSuccess('تم','تمت الإضافة'); }
  closeTariffModal(); renderAll();
}
