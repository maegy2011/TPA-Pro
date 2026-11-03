// services.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let servicesSearchTerm = '', servicesFilter = 'all', servicesSort = 'name', servicesSortDir = 'asc';
let servicesAdv = { code:'', name:'', category:'', tariff:'', min:'', max:'' };
let servicesAdvOpen = false;
let servicesValidityFilter = 'all';
let editingServiceForm = {tariffId:null,index:null};
let servicesTariffFilter = 'all';

function getAllServicesFlat(){
  const out = [];
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => {
    (t.services||[]).forEach((s, idx) => { out.push({ code:s.code, name:s.name, nameEn:s.nameEn||'', category:s.category, tariff:t.name, tariffId:t.id, index:idx, base:s.basePrice, current:s.currentPrice, covered:!!s.covered, effectiveDate:t.effectiveDate||'', expiryDate:t.expiryDate||'', versionCount:1+(Array.isArray(t.priceVersions)?t.priceVersions.length:0) }); });
  });
  return out;
}

/* ترشيح الخدمات المسطحة — منطق خالص (يُختبر آليًا). */
function filterServicesFlat(list, o){
  o = o || {};
  let out = (list || []).slice();
  if(o.tariffId && o.tariffId !== 'all') out = out.filter(s => s.tariffId === o.tariffId);
  if(o.validity && o.validity !== 'all'){
    const today = o.today || new Date().toISOString().slice(0,10);
    if(o.validity === 'current') out = out.filter(s => (!s.effectiveDate || s.effectiveDate <= today) && (!s.expiryDate || today <= s.expiryDate));
    if(o.validity === 'expired') out = out.filter(s => !!s.expiryDate && s.expiryDate < today);
    if(o.validity === 'future') out = out.filter(s => !!s.effectiveDate && s.effectiveDate > today);
  }
  if(o.term){
    const q = String(o.term).trim().toLowerCase();
    out = out.filter(s => (s.code||'').toLowerCase().includes(q) || (s.name||'').toLowerCase().includes(q) || (s.nameEn||'').toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q) || (s.tariff||'').toLowerCase().includes(q));
  }
  if(o.covered === 'covered') out = out.filter(s => s.covered);
  if(o.covered === 'uncovered') out = out.filter(s => !s.covered);
  const adv = o.adv || {};
  if(adv.code){ const q = String(adv.code).toLowerCase(); out = out.filter(s => (s.code||'').toLowerCase().includes(q)); }
  if(adv.name){ const q = String(adv.name).toLowerCase(); out = out.filter(s => (s.name||'').toLowerCase().includes(q) || (s.nameEn||'').toLowerCase().includes(q)); }
  if(adv.category){ const q = String(adv.category).toLowerCase(); out = out.filter(s => (s.category||'').toLowerCase().includes(q)); }
  if(adv.tariff){ const q = String(adv.tariff).toLowerCase(); out = out.filter(s => (s.tariff||'').toLowerCase().includes(q)); }
  if(adv.min){ const n = Number(adv.min); out = out.filter(s => (s.base||0) >= n); }
  if(adv.max){ const n = Number(adv.max); out = out.filter(s => (s.base||0) <= n); }
  return out;
}
/* فرز الخدمات — منطق خالص (يُختبر آليًا). */
function sortServicesFlat(list, key, dir){
  const d = (dir === 'desc') ? -1 : 1;
  return (list || []).slice().sort((a,b) => {
    let va, vb;
    if(key === 'code'){ va = a.code||''; vb = b.code||''; }
    else if(key === 'base'){ va = a.base||0; vb = b.base||0; }
    else if(key === 'current'){ va = a.current||0; vb = b.current||0; }
    else if(key === 'tariff'){ va = a.tariff||''; vb = b.tariff||''; }
    else if(key === 'category'){ va = a.category||''; vb = b.category||''; }
    else { va = a.name||''; vb = b.name||''; }
    if(typeof va === 'string') return va.localeCompare(vb) * d;
    return (va - vb) * d;
  });
}
/* فحص نموذج الخدمة — منطق خالص (يُختبر آليًا). */
function validateServiceForm(d){
  d = d || {};
  if(!d.tariff) return { ok:false, msg:'اختر اللائحة' };
  if(!String(d.code||'').trim()) return { ok:false, msg:'أدخل الكود' };
  if(!String(d.name||'').trim()) return { ok:false, msg:'أدخل الاسم' };
  if(!(Number(d.basePrice) > 0)) return { ok:false, msg:'أدخل سعراً أساسياً صحيحاً' };
  if(!d.effectiveDate) return { ok:false, msg:'حدد تاريخ السريان' };
  if(d.editingIndex !== null && d.editingIndex !== undefined && d.editingTariffId !== d.tariffId) return { ok:false, msg:'نقل الخدمة بين اللوائح غير متاح من شاشة التعديل؛ أضفها للائحة الجديدة ثم احذف القديمة بتاريخ سريان مستقل' };
  if((d.editingIndex === null || d.editingIndex === undefined) && (d.services||[]).some(x => String(x.code).toLowerCase() === String(d.code).toLowerCase())) return { ok:false, msg:'الكود مستخدم بالفعل في هذه اللائحة' };
  if(d.tariffEffectiveDate && d.effectiveDate <= d.tariffEffectiveDate) return { ok:false, msg:'يجب أن يكون بعد تاريخ سريان النسخة الحالية حتى لا تتغير الأسعار التاريخية' };
  return { ok:true, msg:'' };
}
/* أثر الخدمة — منطق خالص (يُختبر آليًا): العقود المرتبطة عبر اللائحة + المطالبات المستخدمة للكود. */
function serviceImpact(code, opts){
  opts = opts || {};
  const _tars = opts.tariffs || (((typeof tariffs !== 'undefined') && tariffs) ? tariffs : []) || [];
  const _ctrs = opts.contracts || (((typeof contracts !== 'undefined') && contracts) ? contracts : []) || [];
  const _clms = opts.claims || (((typeof claims !== 'undefined') && claims) ? claims : []) || [];
  const key = String(code || '').trim().toLowerCase();
  if(!key) return { code:'', tariffIds:[], contracts:[], claimsCount:0, recentClaims:[], oldPrice:null, newPrice:(opts.newPrice !== undefined ? opts.newPrice : null), diff:null };
  const tIds = _tars.filter(t => (t.services || []).some(s => String(s.code || '').toLowerCase() === key)).map(t => t.id);
  const linked = _ctrs.filter(c => tIds.includes(c.tariffId)).map(c => ({ id:c.id, providerId:c.providerId || '', tariffId:c.tariffId || '' }));
  let old = null;
  _tars.forEach(t => (t.services || []).forEach(s => { if(String(s.code || '').toLowerCase() === key && old === null) old = Number(s.currentPrice || s.basePrice || 0) || 0; }));
  const used = [];
  _clms.forEach(c => (c.invoices || []).forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => {
    if(String(l.code || '').toLowerCase() === key) used.push(c.id);
  }))));
  const uniq = [...new Set(used)];
  const np = (opts.newPrice !== undefined && opts.newPrice !== null && opts.newPrice !== '') ? Number(opts.newPrice) : null;
  const diff = (np !== null && Number.isFinite(np) && old !== null) ? np - old : null;
  return { code:String(code).trim(), tariffIds:tIds, contracts:linked, claimsCount:uniq.length, recentClaims:uniq.slice(-10), oldPrice:old, newPrice:np, diff };
}
/* العقود المرتبطة بلائحة — منطق خالص. */
function serviceLinkedContracts(tariffId, contractsList){
  const cs = contractsList || (function(){ try { return (typeof contracts !== 'undefined') ? contracts : []; } catch(e){ return []; } })() || [];
  return cs.filter(c => c.tariffId === tariffId).map(c => c.id);
}
/* تعارض الأسعار عام/خاص لنفس الكود — منطق خالص (يُختبر آليًا). */
function detectServicePriceConflicts(tariffsList){
  const ts = tariffsList || (function(){ try { return (typeof tariffs !== 'undefined') ? tariffs : []; } catch(e){ return []; } })() || [];
  const by = {};
  ts.forEach(t => (t.services || []).forEach(s => {
    const k = String(s.code || '').trim().toLowerCase(); if(!k) return;
    (by[k] = by[k] || []).push({ tariffId:t.id, tariff:t.name || t.id, type:t.type || '', price:Number(s.currentPrice || s.basePrice || 0) || 0 });
  }));
  return Object.keys(by).filter(k => {
    const prices = [...new Set(by[k].map(e => e.price))];
    return by[k].length > 1 && prices.length > 1;
  }).map(k => ({ code:k, entries:by[k] }));
}
/* اقتراح خدمات بتاريخ الإجراء — منطق خالص (يُختبر آليًا). */
function suggestServicesForDate(term, date, tariff){
  if(!tariff) return [];
  const list = (typeof getTariffServicesForDate === 'function') ? getTariffServicesForDate(tariff, date) : (tariff.services || []);
  const q = String(term || '').trim().toLowerCase();
  const out = (list || []).filter(s => !q || String(s.code || '').toLowerCase().includes(q) || String(s.name || '').toLowerCase().includes(q) || String(s.nameEn || '').toLowerCase().includes(q));
  return out.slice(0, 20).map(s => ({ code:s.code, name:s.name, price:Number(s.currentPrice || s.basePrice || 0) || 0 }));
}
/* فرق الاستيراد قبل الاعتماد — منطق خالص (يُختبر آليًا). */
function diffImportRows(incoming, tariff){
  const cur = {};
  (tariff && tariff.services || []).forEach(s => { cur[String(s.code || '').toLowerCase()] = Number(s.currentPrice || s.basePrice || 0) || 0; });
  return (incoming || []).map(s => {
    const k = String(s.code || '').toLowerCase();
    const has = Object.prototype.hasOwnProperty.call(cur, k);
    const np = Number(s.currentPrice || s.basePrice || 0) || 0;
    const op = has ? cur[k] : null;
    const pct = (has && op) ? ((np - op) / op * 100) : null;
    return { code:s.code, name:s.name, action:has ? 'update' : 'add', oldPrice:op, newPrice:np, pct };
  });
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
  if(typeof filterServicesFlat === 'function') list = filterServicesFlat(list, { tariffId:servicesTariffFilter, validity:servicesValidityFilter, term:servicesSearchTerm, covered:servicesFilter, adv:servicesAdv });
  if(typeof sortServicesFlat === 'function') list = sortServicesFlat(list, servicesSort, servicesSortDir);

  const body = $('#servicesBody'); if(!body) return;
  if(!list.length){ body.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:36px;color:var(--muted)">لا خدمات</td></tr>'; }
  else body.innerHTML = list.map(s => `<tr>
    <td class="mono">${escapeHtml(s.code)}</td>
    <td>${escapeHtml(s.name)}${s.nameEn?`<div style="font-size:11px;color:var(--muted);direction:ltr;text-align:right">${escapeHtml(s.nameEn)}</div>`:''}</td>
    <td>${escapeHtml(s.category||'—')}</td>
    <td><a href="#" data-goto-tariff="${escapeHtml(s.tariffId)}" style="color:var(--link,#2563EB)">${escapeHtml(s.tariff)}</a></td>
    <td class="mono">${escapeHtml(s.effectiveDate||'—')}</td>
    <td class="mono">${escapeHtml(s.expiryDate||'مفتوح')}</td>
    <td class="mono">${s.versionCount}</td>
    <td class="mono">${fmt(s.base||0)}</td>
    <td class="mono">${fmt(s.current||0)}</td>
    <td>${s.covered?'<span class="badge ok sm">مغطاة</span>':'<span class="badge bad sm">غير مغطاة</span>'}</td>
    <td class="act"><div style="display:flex;gap:5px;align-items:center"><button class="btn-xs" data-edit-service="${s.tariffId}|${s.index}">تعديل</button><button class="btn-xs danger" data-del-service="${s.tariffId}|${s.index}">حذف</button></div></td>
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
  const tariffSelect=$('#sfTariff'); if(tariffSelect) tariffSelect.disabled=!!svc;
  const eff=$('#servicesEffectiveDate'); if(eff && (!eff.value || (t.effectiveDate && eff.value<=t.effectiveDate))){ eff.value=tariffDatePlusOne(t.effectiveDate||new Date().toISOString().slice(0,10)); }
  $('#sfCode').value = svc? svc.code : '';
  $('#sfCategory').value = svc? svc.category : 'استشارة';
  $('#sfName').value = svc? svc.name : '';
  $('#sfNameEn').value = svc? (svc.nameEn||'') : '';
  $('#sfBasePrice').value = svc? svc.basePrice : '';
  $('#sfCurrentPrice').value = svc? svc.currentPrice : '';
  $('#sfCovered').checked = svc? !!svc.covered : true;
  $('#sfRequiresPriorApproval').checked = svc? !!svc.requiresPriorApproval : false;
  const panel = $('#serviceFormPanel'); if(panel) panel.style.display = 'block';
}
function renderServiceImpact(){
  const box = $('#sfImpact'); if(!box) return;
  if(typeof serviceImpact !== 'function') return;
  const code = ($('#sfCode') || {}).value || '';
  const np = ($('#sfCurrentPrice') || {}).value || ($('#sfBasePrice') || {}).value || '';
  if(!String(code).trim()){ box.innerHTML = ''; return; }
  const im = serviceImpact(code, { newPrice: np });
  const parts = [];
  parts.push(`اللوائح: <b>${im.tariffIds.length}</b> · العقود المرتبطة: <b>${im.contracts.length}</b> · مطالبات تستخدم الكود: <b>${im.claimsCount}</b>`);
  if(im.oldPrice !== null) parts.push(`السعر الحالي: <b>${fmt(im.oldPrice)}</b>`);
  if(im.diff !== null && im.diff !== 0) parts.push(`الفرق: <b style="color:${im.diff > 0 ? 'var(--bad)' : 'var(--ok)'}">${im.diff > 0 ? '+' : ''}${fmt(im.diff)}</b>`);
  if(im.recentClaims.length) parts.push(`آخر مطالبات: <span class="mono">${im.recentClaims.slice(-5).map(escapeHtml).join('، ')}</span>`);
  const cf = (typeof detectServicePriceConflicts === 'function') ? detectServicePriceConflicts().filter(c => c.code === String(code).trim().toLowerCase()) : [];
  if(cf.length) parts.push(`<span style="color:var(--bad)">⚠ تعارض سعري بين اللوائح (${cf[0].entries.map(e => escapeHtml(e.tariff) + ': ' + fmt(e.price)).join(' ≠ ')})</span>`);
  box.innerHTML = parts.join('<br>');
}
function hideServiceFormPanel(){ const panel = $('#serviceFormPanel'); if(panel) panel.style.display = 'none'; editingServiceForm = {tariffId:null,index:null}; }
function saveServiceForm(){
  const tid=$('#sfTariff').value, t=tariffs.find(x=>x.id===tid); if(!t){showWarning('تنبيه','اختر اللائحة');return;}
  if(!t.services)t.services=[];
  const code=$('#sfCode').value.trim(),name=$('#sfName').value.trim(),cat=$('#sfCategory').value;
  const bp=Number($('#sfBasePrice').value)||0,cp=Number($('#sfCurrentPrice').value)||0,eff=$('#servicesEffectiveDate').value;
  const _sv = (typeof validateServiceForm === 'function') ? validateServiceForm({ tariffId:tid, tariff:t, code, name, basePrice:bp, effectiveDate:eff, tariffEffectiveDate:t.effectiveDate, editingIndex:editingServiceForm.index, editingTariffId:editingServiceForm.tariffId, services:t.services }) : { ok:true };
  if(!_sv.ok){ showWarning(_sv.msg === 'يجب أن يكون بعد تاريخ سريان النسخة الحالية حتى لا تتغير الأسعار التاريخية' ? 'تاريخ السريان' : 'تنبيه', _sv.msg); return; }
  const nameEn=$('#sfNameEn')?.value.trim()||'';const data={code,name,...(nameEn?{nameEn}:{}),category:cat,basePrice:bp,currentPrice:cp||bp,covered:$('#sfCovered').checked,requiresPriorApproval:$('#sfRequiresPriorApproval').checked};
  const idx=editingServiceForm.index;
  if(idx!==null && editingServiceForm.tariffId!==tid){showWarning('تنبيه','نقل الخدمة بين اللوائح غير متاح من شاشة التعديل؛ أضفها للائحة الجديدة ثم احذف القديمة بتاريخ سريان مستقل');return;}
  const at=idx!==null?idx:t.services.findIndex(x=>String(x.code).toLowerCase()===code.toLowerCase());
  if(idx===null && at>=0){showWarning('تنبيه','الكود مستخدم بالفعل في هذه اللائحة');return;}
  if(t.effectiveDate && eff<=t.effectiveDate){showWarning('تاريخ السريان','يجب أن يكون بعد تاريخ سريان النسخة الحالية حتى لا تتغير الأسعار التاريخية');return;}
  const before=at>=0?{...t.services[at]}:null, action=before?'service-update':'service-add';
  const snapshot={services:JSON.parse(JSON.stringify(t.services)),priceVersions:JSON.parse(JSON.stringify(t.priceVersions||[])),changeLog:JSON.parse(JSON.stringify(t.changeLog||[])),effectiveDate:t.effectiveDate};
  archiveTariffVersion(t,eff,action,[{code,action:before?'update':'add',before,after:{...data}}]);
  if(before)t.services[at]=data;else t.services.push(data);
  const saved=typeof persistData==='function'?persistData(true):true;
  if(saved===false){t.services=snapshot.services;t.priceVersions=snapshot.priceVersions;t.changeLog=snapshot.changeLog;t.effectiveDate=snapshot.effectiveDate;showWarning('خطأ','تعذر الحفظ؛ تم التراجع عن التعديل');return;}
  hideServiceFormPanel();renderServices();renderTariffs();renderTariffChangeHistory();showSuccess('تم','تم حفظ الخدمة بتاريخ سريان مستقل');
}

function editServiceAt(tid, idx){
  const t = tariffs.find(x=>x.id===tid); if(!t || !t.services) return;
  if(typeof openServiceModal === 'function'){ openServiceModal(idx, t.id); }
}

function deleteServiceAt(tid,idx){
  const t=tariffs.find(x=>x.id===tid); if(!t||!t.services||!t.services[idx])return;
  const svc=t.services[idx],eff=$('#servicesEffectiveDate')?.value||'';
  if(!eff){showWarning('حدد السريان','أدخل تاريخ سريان الحذف');return;}
  if(t.effectiveDate&&eff<=t.effectiveDate){showWarning('تاريخ السريان','يجب أن يكون بعد تاريخ سريان النسخة الحالية');return;}
  showDelete('حذف الخدمة',`سيتم إيقاف الخدمة "${svc.name}" اعتبارًا من ${eff} مع الاحتفاظ بسعرها السابق في التاريخ.`,()=>{
    const snapshot={services:JSON.parse(JSON.stringify(t.services)),priceVersions:JSON.parse(JSON.stringify(t.priceVersions||[])),changeLog:JSON.parse(JSON.stringify(t.changeLog||[])),effectiveDate:t.effectiveDate};
    archiveTariffVersion(t,eff,'service-delete',[{code:svc.code,action:'delete',before:{...svc},after:null}]);t.services.splice(idx,1);
    const saved=typeof persistData==='function'?persistData(true):true;
    if(saved===false){t.services=snapshot.services;t.priceVersions=snapshot.priceVersions;t.changeLog=snapshot.changeLog;t.effectiveDate=snapshot.effectiveDate;showWarning('خطأ','تعذر الحفظ؛ تم التراجع عن الحذف');return;}
    renderServices();renderTariffs();renderTariffChangeHistory();showSuccess('تم','تم الحذف بتاريخ سريان مع حفظ التاريخ');
  });
}


// Parse RFC-4180-style CSV, including quoted commas, quotes and embedded newlines.
function parseServicesCSV(text, limits = {}){
  const maxChars = limits.maxChars || 5 * 1024 * 1024;
  const maxRows = limits.maxRows || 10000;
  const maxColumns = limits.maxColumns || 32;
  const source = String(text == null ? '' : text).replace(/^\uFEFF/, '');
  if(source.length > maxChars) throw new Error('حجم الملف أكبر من الحد المسموح (5MB)');
  if(!source.trim()) throw new Error('الملف فارغ');
  const rows=[]; let row=[], cell='', quoted=false, afterQuote=false;
  for(let i=0;i<source.length;i++){
    const ch=source[i];
    if(quoted){
      if(ch==='"'){
        if(source[i+1]==='"'){ cell+='"'; i++; }
        else { quoted=false; afterQuote=true; }
      } else cell+=ch;
      continue;
    }
    if(afterQuote && ch!==',' && ch!=='\r' && ch!=='\n' && ch!==' ' && ch!=='\t') throw new Error('تنسيق CSV غير صالح: نص بعد إغلاق علامات الاقتباس');
    if(ch==='"'){
      if(cell.length || afterQuote) throw new Error('تنسيق CSV غير صالح: علامة اقتباس في موضع غير صحيح');
      quoted=true; continue;
    }
    if(ch===','){ row.push(cell); cell=''; afterQuote=false; if(row.length>=maxColumns) throw new Error('عدد أعمدة CSV يتجاوز الحد المسموح'); continue; }
    if(ch==='\r' || ch==='\n'){
      if(ch==='\r' && source[i+1]==='\n') i++;
      row.push(cell); cell=''; afterQuote=false;
      if(row.some(v=>v.trim()!=='')){ rows.push(row); if(rows.length>maxRows+1) throw new Error('عدد صفوف CSV يتجاوز 10000 صف'); }
      row=[]; continue;
    }
    if(!afterQuote || (ch!==' ' && ch!=='\t')) cell+=ch;
  }
  if(quoted) throw new Error('تنسيق CSV غير صالح: علامات اقتباس غير مغلقة');
  row.push(cell); if(row.some(v=>v.trim()!=='')) rows.push(row);
  if(rows.length>maxRows+1) throw new Error('عدد صفوف CSV يتجاوز 10000 صف');
  if(!rows.length) throw new Error('الملف لا يحتوي على بيانات');
  const width=rows[0].length;
  if(width>maxColumns) throw new Error('عدد أعمدة CSV يتجاوز الحد المسموح');
  if(rows.some(r=>r.length!==width)) throw new Error('عدد الأعمدة غير متطابق بين صفوف CSV');
  return rows;
}

async function parseServicesXLSX(file){
  if(typeof DecompressionStream==='undefined') throw new Error('متصفحك لا يدعم قراءة XLSX محليًا؛ احفظ الملف بصيغة CSV أو حدّث المتصفح');
  const buffer=await file.arrayBuffer(), view=new DataView(buffer), bytes=new Uint8Array(buffer);
  let eocd=-1;
  for(let i=Math.max(0,bytes.length-65558);i<=bytes.length-22;i++) if(view.getUint32(i,true)===0x06054b50) eocd=i;
  if(eocd<0) throw new Error('ملف Excel غير صالح أو ليس XLSX');
  const count=view.getUint16(eocd+10,true), cdOffset=view.getUint32(eocd+16,true);
  if(count>5000) throw new Error('ملف XLSX يحتوي على عدد كبير من المكونات');
  const entries=new Map(); let pos=cdOffset;
  for(let i=0;i<count;i++){
    if(view.getUint32(pos,true)!==0x02014b50) throw new Error('بنية ملف XLSX غير صالحة');
    const method=view.getUint16(pos+10,true), compSize=view.getUint32(pos+20,true), nameLen=view.getUint16(pos+28,true), extraLen=view.getUint16(pos+30,true), commentLen=view.getUint16(pos+32,true), localOffset=view.getUint32(pos+42,true);
    const name=new TextDecoder().decode(bytes.slice(pos+46,pos+46+nameLen));
    entries.set(name,{method,compSize,localOffset}); pos+=46+nameLen+extraLen+commentLen;
  }
  async function readEntry(name){
    const e=entries.get(name); if(!e) return null;
    const o=e.localOffset; if(view.getUint32(o,true)!==0x04034b50) throw new Error('مدخل XLSX غير صالح');
    const n=view.getUint16(o+26,true), x=view.getUint16(o+28,true), start=o+30+n+x;
    if(e.compSize>10*1024*1024 || start+e.compSize>bytes.length) throw new Error('مكوّن داخل XLSX يتجاوز الحجم المسموح أو تالف');
    const compressed=bytes.slice(start,start+e.compSize);
    if(e.method===0) return new TextDecoder().decode(compressed);
    if(e.method!==8) throw new Error('طريقة ضغط غير مدعومة داخل XLSX');
    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader=stream.getReader(), chunks=[]; let total=0;
    while(true){const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>20*1024*1024){await reader.cancel();throw new Error('مكوّن Excel بعد فك الضغط أكبر من 20MB');}chunks.push(part.value);}
    const output=new Uint8Array(total);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder().decode(output);
  }
  const wb=await readEntry('xl/workbook.xml'); if(!wb) throw new Error('ملف Excel لا يحتوي على مصنف صالح');
  const rel=await readEntry('xl/_rels/workbook.xml.rels'); if(!rel) throw new Error('تعذر قراءة علاقات أوراق Excel');
  const parser=new DOMParser(), wbDoc=parser.parseFromString(wb,'application/xml'), relDoc=parser.parseFromString(rel,'application/xml');
  if(wbDoc.getElementsByTagName('parsererror').length||relDoc.getElementsByTagName('parsererror').length) throw new Error('ملف Excel يحتوي على XML غير صالح');
  const sheet=wbDoc.getElementsByTagName('sheet')[0]; if(!sheet) throw new Error('لا توجد ورقة عمل في الملف');
  const rid=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  const relationship=[...relDoc.getElementsByTagName('Relationship')].find(x=>x.getAttribute('Id')===rid);
  if(!relationship) throw new Error('تعذر تحديد ورقة العمل الأولى');
  let target=relationship.getAttribute('Target')||''; target=target.replace(/^\//,''); if(!target.startsWith('xl/')) target='xl/'+target;
  const sheetXml=await readEntry(target); if(!sheetXml) throw new Error('ورقة العمل الأولى غير موجودة');
  const sheetDoc=parser.parseFromString(sheetXml,'application/xml'); if(sheetDoc.getElementsByTagName('parsererror').length) throw new Error('بيانات ورقة Excel غير صالحة');
  const ssXml=await readEntry('xl/sharedStrings.xml');
  const shared=ssXml ? [...parser.parseFromString(ssXml,'application/xml').getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join('')) : [];
  const rows=[];
  for(const rowNode of [...sheetDoc.getElementsByTagName('row')]){
    const row=[];
    for(const cell of [...rowNode.getElementsByTagName('c')]){
      const ref=cell.getAttribute('r')||''; const letters=(ref.match(/[A-Z]+/i)||['A'])[0].toUpperCase();
      let col=0; for(const ch of letters) col=col*26+(ch.charCodeAt(0)-64); col=Math.max(0,col-1);
      const type=cell.getAttribute('t'); let value='';
      if(type==='inlineStr') value=[...cell.getElementsByTagName('t')].map(t=>t.textContent).join('');
      else { const v=cell.getElementsByTagName('v')[0]; value=v?v.textContent:''; if(type==='s') value=shared[Number(value)]??''; }
      row[col]=value;
    }
    rows.push(row.map(v=>v===undefined?'':String(v)));
    if(rows.length>10001) throw new Error('ملف Excel يتجاوز 10000 صف');
  }
  if(!rows.length) throw new Error('ورقة Excel فارغة');
  const width=Math.max(...rows.map(r=>r.length));
  if(width>32) throw new Error('ملف Excel يتجاوز 32 عمودًا');
  return rows;
}
let tariffImportRows=null, tariffImportMapping=null, tariffImportHeaderRow=0;
function normalizeImportHeader(v){return String(v||'').toLowerCase().replace(/[\s_\-ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/[ة]/g,'ه').trim();}
function detectTariffImportLayout(rows){
  const aliases={price:['السعر','سعر','price','baseprice','سعراللائحه','السعرالاساسي'],currentPrice:['السعرالحالي','السعرالفعلي','سعرالتعاقد','السعرالمتفقعليه','currentprice','currentprice'],arabicName:['اسمالتحليل','اسمالخدمه','اسمالخدمه','اسم','arabicname','namear'],englishName:['englishname','اسمبالانجليزي','الاسمالانجليزي','نوعالتحليل'],category:['المجمع','المجموعه','الفئه','التصنيف','category','group'],code:['الكود','كود','كودالخدمه','code','م','رقم']};
  let best={row:0,score:-1};
  for(let r=0;r<Math.min(rows.length,30);r++){
    const cells=(rows[r]||[]).map(normalizeImportHeader); let score=0;
    for(const names of Object.values(aliases)) if(cells.some(c=>names.includes(c))) score++;
    if(score>best.score) best={row:r,score};
  }
  const header=(rows[best.row]||[]).map(normalizeImportHeader), mapping={price:-1,currentPrice:-1,arabicName:-1,englishName:-1,category:-1,code:-1};
  for(const key of Object.keys(aliases)){
    const matches=[]; header.forEach((h,i)=>{if(aliases[key].includes(h))matches.push(i);});
    if(matches.length) mapping[key]=matches[0];
  }
  // Some real-world sheets use misleading/duplicated headings; infer language by sample values.
  const samples=[]; for(let c=0;c<Math.max(...rows.slice(best.row+1,best.row+15).map(r=>r.length),0);c++){
    const vals=rows.slice(best.row+1,best.row+25).map(r=>String((r||[])[c]||'').trim()).filter(Boolean);
    const numeric=vals.filter(v=>/^[-+]?\d+(?:[.,]\d+)?$/.test(v.replace(/[,٬]/g,''))).length;
    const arabic=vals.filter(v=>/[\u0600-\u06FF]/.test(v)).length;
    const latin=vals.filter(v=>/[A-Za-z]/.test(v)).length;
    samples.push({c,vals,numeric,arabic,latin});
  }
  if(mapping.price<0){const x=samples.filter(x=>x.numeric>=2).sort((a,b)=>b.numeric-a.numeric)[0];if(x)mapping.price=x.c;}
  if(mapping.arabicName<0 || mapping.arabicName===mapping.category){const x=samples.filter(x=>x.arabic>=2&&x.c!==mapping.category&&x.c!==mapping.price).sort((a,b)=>b.arabic-a.arabic)[0];if(x)mapping.arabicName=x.c;}
  if(mapping.englishName<0 || mapping.englishName===mapping.arabicName){const x=samples.filter(x=>x.latin>=2&&x.c!==mapping.arabicName&&x.c!==mapping.price).sort((a,b)=>b.latin-a.latin)[0];if(x)mapping.englishName=x.c;}
  if(mapping.category<0){const x=samples.filter(x=>x.arabic>=1&&x.c!==mapping.arabicName&&x.c!==mapping.price).sort((a,b)=>b.arabic-a.arabic)[0];if(x)mapping.category=x.c;}
  // Prefer actual cell language/cardinality over misleading or duplicated headings.
  const arabicCol=samples.filter(x=>x.arabic>=2&&x.c!==mapping.price).sort((a,b)=>b.arabic-a.arabic)[0];
  if(arabicCol) mapping.arabicName=arabicCol.c;
  const englishCols=samples.filter(x=>x.latin>=2&&x.c!==mapping.price&&x.c!==mapping.arabicName).sort((a,b)=>new Set(b.vals).size-new Set(a.vals).size);
  if(englishCols.length) mapping.englishName=englishCols[0].c;
  // Repeated low-cardinality text (e.g. Hematology) is a group/category column.
  const categoryCol=samples.filter(x=>x.c!==mapping.price&&x.c!==mapping.arabicName&&x.c!==mapping.englishName&&x.numeric===0&&x.vals.length>=2).sort((a,b)=>new Set(a.vals).size-new Set(b.vals).size)[0];
  if(categoryCol) mapping.category=categoryCol.c;
  // A standalone ordinal column is a valid code source; do not mistake it for a price.
  if(mapping.code<0){const x=samples.find(x=>x.c!==mapping.price&&x.c!==mapping.arabicName&&x.c!==mapping.englishName&&x.c!==mapping.category&&x.numeric>=3);if(x)mapping.code=x.c;}
  if(mapping.currentPrice<0){const x=samples.filter(x=>x.c!==mapping.price&&x.c!==mapping.code&&x.numeric>=2).sort((a,b)=>b.numeric-a.numeric)[0];if(x)mapping.currentPrice=x.c;}
  return {headerRow:best.row,mapping,score:best.score};
}
function buildTariffImportRows(rows,mapping,headerRow){
  const result=[['code','name','category','basePrice','currentPrice','covered','requiresPriorApproval','nameEn']];let group='أخرى',serial=0;const usedCodes=new Set();
  const get=(r,k)=>mapping[k]>=0?String((r||[])[mapping[k]]??'').trim():'';
  for(let i=headerRow+1;i<rows.length;i++){
    const row=rows[i]||[], ar=get(row,'arabicName'), en=get(row,'englishName'), priceRaw=get(row,'price'), currentRaw=get(row,'currentPrice'), cat=get(row,'category'), codeRaw=get(row,'code');
    const hasPrice=priceRaw!==''&&Number.isFinite(Number(priceRaw.replace(/[٬,،\s]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
    if(cat && !ar && !en && !hasPrice){group=cat;continue;}
    if(!ar&&!en&&!hasPrice)continue;
    if(!hasPrice)continue;
    const name=ar||en; if(!name)continue;
    serial++; const category=cat||group;let code=codeRaw||`IMP-${String(serial).padStart(5,'0')}`;if(usedCodes.has(code.toLowerCase())){const prefix=category.replace(/[^A-Za-z0-9]+/g,'').slice(0,8).toUpperCase()||'IMP';code=`${prefix}-${code}`;let suffix=2;while(usedCodes.has(code.toLowerCase()))code=`${prefix}-${codeRaw||serial}-${suffix++}`;}usedCodes.add(code.toLowerCase());
    const price=priceRaw;
    result.push([code, ar||en, category, price, currentRaw||price, '', '', en]);
  }
  return result;
}
function excelImportColumnLabel(index){let n=index+1,label='';while(n){const rem=(n-1)%26;label=String.fromCharCode(65+rem)+label;n=Math.floor((n-1)/26);}return label;}
function renderTariffImportMapping(rows,layout){
  tariffImportRows=rows;tariffImportMapping={...layout.mapping};tariffImportHeaderRow=layout.headerRow;
  const panel=$('#tariffImportMappingPanel');if(!panel)return;
  const width=Math.max(...rows.map(r=>r.length));const options='<option value="-1">— بدون ربط —</option>'+Array.from({length:width},(_,i)=>`<option value="${i}">عمود ${excelImportColumnLabel(i)} — ${escapeHtml(String((rows[layout.headerRow]||[])[i]||'بدون عنوان'))}</option>`).join('');
  const fields=[['price','السعر الأساسي *'],['currentPrice','السعر الحالي / التعاقد (اختياري)'],['arabicName','اسم الخدمة بالعربية'],['englishName','الاسم الإنجليزي'],['category','المجموعة / التصنيف'],['code','الكود / الرقم (اختياري)']];
  panel.innerHTML=`<div class="panel" style="padding:12px;margin-top:12px"><b>خريطة ربط الأعمدة</b><p class="hint">تم اكتشاف صف العناوين ${layout.headerRow+1}. راجع الربط قبل الاستيراد. الكود غير الموجود يُنشأ تلقائيًا، وصفوف المجموعات تُستخدم كتصنيف للخدمات التالية.</p><div class="form-grid">${fields.map(([key,label])=>`<div class="fg"><label>${label}</label><select data-import-map="${key}">${options}</select></div>`).join('')}</div><div id="tariffImportPreview" style="overflow:auto;margin-top:10px"></div></div>`;
  fields.forEach(([key])=>{const el=panel.querySelector(`[data-import-map="${key}"]`);el.value=String(tariffImportMapping[key]);el.addEventListener('change',()=>{tariffImportMapping[key]=Number(el.value);renderTariffImportPreview();});});
  panel.style.display='block';renderTariffImportPreview();
}
function renderTariffImportPreview(){
  const box=$('#tariffImportPreview');if(!box||!tariffImportRows)return;
  const mapped=buildTariffImportRows(tariffImportRows,tariffImportMapping,tariffImportHeaderRow).slice(1,6);
  const _t = (typeof tariffs !== 'undefined') ? tariffs.find(t => t.id === ($('#servicesTariffFilter') || {}).value) : null;
  const _rows = mapped.map(r => ({ code:r[0], name:r[1], basePrice:Number(String(r[3]).replace(/[,٬،\s]/g,'')) || 0, currentPrice:Number(String(r[4]).replace(/[,٬،\s]/g,'')) || 0 }));
  const _diff = (typeof diffImportRows === 'function' && _t) ? diffImportRows(_rows, _t) : [];
  const _nAdd = _diff.filter(d => d.action === 'add').length, _nUpd = _diff.filter(d => d.action === 'update').length;
  box.innerHTML=`<div class="hint">معاينة أول ${mapped.length} خدمات مكتشفة${_diff.length ? ` — <b>${_nAdd}</b> جديدة · <b>${_nUpd}</b> تحديث` : ''}</div><table class="data-table" style="min-width:640px"><thead><tr><th>الكود</th><th>الخدمة</th><th>الحالة</th><th>القديم</th><th>الجديد</th><th>الفرق%</th></tr></thead><tbody>${(_diff.length ? _diff.slice(0,5) : _rows.slice(0,5).map(r => ({ code:r.code, name:r.name, action:'add', oldPrice:null, newPrice:r.currentPrice, pct:null }))).map(d=>`<tr><td class="mono">${escapeHtml(d.code)}</td><td>${escapeHtml(d.name)}</td><td>${d.action === 'add' ? '<span class="badge ok sm">جديدة</span>' : '<span class="badge warn sm">تحديث</span>'}</td><td class="mono">${d.oldPrice === null ? '—' : fmt(d.oldPrice)}</td><td class="mono">${fmt(d.newPrice)}</td><td class="mono">${d.pct === null ? '—' : (d.pct > 0 ? '+' : '') + d.pct.toFixed(1) + '%'}</td></tr>`).join('')}</tbody></table>`;
}
function importServicesRows(rows, options={}){
  try{
    if(!Array.isArray(rows)||rows.length<2) throw new Error('الملف لا يحتوي على صفوف خدمات');
    const header=rows[0].map(h=>String(h||'').trim().toLowerCase());
    const idx=(names)=>{ for(const n of names){ const i=header.indexOf(n); if(i>=0) return i; } return -1; };
    const iCode=idx(['code','الكود','كود','كود الخدمة','service code']), iName=idx(['name','اسم الخدمة','اسم','service','الخدمة']), iNameEn=idx(['nameen','english name','الاسم الانجليزي','اسم بالانجليزي']);
    const iCat=idx(['category','الفئة','فئة']), iBase=idx(['baseprice','base price','السعر الأساسي','السعر الاساسي','سعر اللائحة','الأساسي','base']);
    const iCur=idx(['currentprice','current price','السعر الحالي','الحالي','سعر الخدمة','current','السعر']);
    const iCov=idx(['covered','مغطى','التغطية']), iPA=idx(['requirespriorapproval','requires pa','موافقة مسبقة','يتطلب موافقة']);
    if(iCode<0||iName<0||iBase<0) throw new Error('الأعمدة المطلوبة: الكود، اسم الخدمة، السعر الأساسي');
    let tariff=options.createTariff ? null : tariffs.find(t=>t.id===options.tariffId); if(!options.createTariff && !tariff) throw new Error('اختر اللائحة المراد تحديثها');
    const eff=String(options.effectiveDate||(options.createTariff&&options.createTariff.effectiveDate)||'').slice(0,10); if(!eff) throw new Error('حدد تاريخ سريان التحديث');
    if(tariff && tariff.effectiveDate && eff<=tariff.effectiveDate) throw new Error('يجب أن يكون تاريخ السريان بعد تاريخ النسخة الحالية لحفظ الأسعار التاريخية');
    const seen=new Set(), incoming=[];
    const val=(r,i)=>i<0?'':String(r[i]??'').trim();
    const num=(raw)=>Number(String(raw).replace(/[٬,،\s]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    for(let r=1;r<rows.length;r++){
      const row=rows[r]||[]; if(!row.some(x=>String(x||'').trim())) continue;
      const code=val(row,iCode), name=val(row,iName), baseText=val(row,iBase), currentText=val(row,iCur);
      if(!code||!name) throw new Error(`الكود أو اسم الخدمة مفقود في الصف ${r+1}`);
      const key=code.toLowerCase(); if(seen.has(key)) throw new Error(`الكود ${code} مكرر في الملف (صف ${r+1})`); seen.add(key);
      const base=num(baseText), current=currentText?num(currentText):base;
      if(!Number.isFinite(base)||base<=0||!Number.isFinite(current)||current<0) throw new Error(`السعر غير صالح في الصف ${r+1}`);
      const cov=val(row,iCov).toLowerCase(), pa=val(row,iPA).toLowerCase();
      incoming.push({code,name,...(iNameEn>=0&&val(row,iNameEn)?{nameEn:val(row,iNameEn)}:{}),category:val(row,iCat)||'أخرى',basePrice:base,currentPrice:current,covered:!(['false','0','no','لا','غير مغطى','غير مغطاة'].includes(cov)),requiresPriorApproval:['true','1','yes','نعم','مطلوب'].includes(pa)});
    }
    if(!incoming.length) throw new Error('لا توجد خدمات صالحة للاستيراد');
    if(options.createTariff){
      const nm=String(options.createTariff.name||'').trim(); if(!nm) throw new Error('أدخل اسم اللائحة الجديدة');
      if(tariffs.some(t=>t.name.toLowerCase()===nm.toLowerCase())) throw new Error('اسم اللائحة مستخدم بالفعل');
      tariff={id:nextTariffNumber(eff),name:nm,type:options.createTariff.type||'general',description:'مستوردة من Excel',effectiveDate:eff,expiryDate:'',status:'active',basePriceLevel:100,services:[],priceVersions:[],changeLog:[]};
    }
    const oldServices=JSON.parse(JSON.stringify(tariff.services||[]));
    const nextServices=oldServices.map(x=>({...x})); const changes=[];
    incoming.forEach(s=>{ const at=nextServices.findIndex(x=>String(x.code).toLowerCase()===s.code.toLowerCase());
      if(at>=0){ const before=nextServices[at]; if(JSON.stringify(before)!==JSON.stringify(s)){ changes.push({code:s.code,action:'update',before:{...before},after:{...s}}); nextServices[at]=s; } }
      else { changes.push({code:s.code,action:'add',before:null,after:{...s}}); nextServices.push(s); }
    });
    if(!changes.length) throw new Error('الملف مطابق للأسعار الحالية؛ لا توجد تغييرات لتطبيقها');
    const snapshot={services:oldServices,priceVersions:JSON.parse(JSON.stringify(tariff.priceVersions||[])),changeLog:JSON.parse(JSON.stringify(tariff.changeLog||[])),effectiveDate:tariff.effectiveDate};
    if(options.createTariff){ tariff.services=nextServices; tariff.changeLog.push({at:new Date().toISOString(),effectiveDate:eff,action:'excel-create',actor:(appSettings.reviewer&&appSettings.reviewer.name)||'المستخدم',changes}); tariffs.push(tariff); }
    else { archiveTariffVersion(tariff,eff,'excel-import',changes); tariff.services=nextServices; }
    const saved=typeof persistData==='function'?persistData(true):true;
    if(saved===false){ if(options.createTariff) tariffs=tariffs.filter(t=>t.id!==tariff.id); else {tariff.services=snapshot.services; tariff.priceVersions=snapshot.priceVersions; tariff.changeLog=snapshot.changeLog; tariff.effectiveDate=snapshot.effectiveDate;} throw new Error('تعذر الحفظ؛ تم التراجع عن الاستيراد'); }
    try { renderServices(); if(typeof renderTariffs==='function') renderTariffs(); renderTariffChangeHistory(); } catch(uiErr){ console.warn('Tariff import committed; UI refresh will retry on navigation',uiErr); }
    showSuccess('تم الاستيراد',`تم تحديث ${changes.length} خدمة اعتبارًا من ${eff}`);
    return {ok:true,count:changes.length};
  }catch(err){ showWarning('تعذر الاستيراد',err&&err.message?err.message:'ملف غير صالح'); return {ok:false,error:err&&err.message?err.message:'Import failed'}; }
}
function importServicesCSV(text, options={}){ try { return importServicesRows(parseServicesCSV(text),options); } catch(err){ showWarning('تعذر الاستيراد',err&&err.message?err.message:'CSV غير صالح'); return {ok:false,error:err.message}; } }
async function importServicesFile(file, options={}){
  if(!file) return; if(file.size>10*1024*1024) { showWarning('تعذر الاستيراد','حجم الملف أكبر من 10MB'); return; }
  try{
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='xlsx'){ const rows=await parseServicesXLSX(file); return importServicesRows(rows,options); }
    if(ext==='csv'||ext==='txt'){ const text=await file.text(); return importServicesCSV(text,options); }
    throw new Error('الصيغ المدعومة: XLSX وCSV. صيغة XLS القديمة غير مدعومة');
  }catch(err){ showWarning('تعذر الاستيراد',err&&err.message?err.message:'تعذرت قراءة الملف'); return {ok:false,error:err.message}; }
}
function openTariffImportModal(){
  const target=$('#tariffImportTarget'); if(!target)return;
  target.innerHTML='<option value="new">إنشاء لائحة جديدة من الملف</option>'+tariffs.map(t=>`<option value="${escapeHtml(t.id)}">تحديث: ${escapeHtml(t.name)} (${escapeHtml(t.id)})</option>`).join('');
  $('#tariffImportEffective').value=tariffDatePlusOne(new Date().toISOString().slice(0,10));
  $('#tariffImportName').value=''; $('#tariffImportType').value='general'; $('#tariffImportFile').value=''; $('#tariffImportNewFields').style.display='block'; $('#confirmTariffImport').textContent='بدء الاستيراد';
  const panel=$('#tariffImportMappingPanel');if(panel){panel.style.display='none';panel.innerHTML='';}tariffImportRows=null;tariffImportMapping=null;
  target.onchange=()=>{ $('#tariffImportNewFields').style.display=target.value==='new'?'block':'none'; const t=tariffs.find(x=>x.id===target.value); if(t){$('#tariffImportEffective').value=tariffDatePlusOne(t.effectiveDate||new Date().toISOString().slice(0,10));} };
  const file=$('#tariffImportFile');file.onchange=async()=>{const f=file.files&&file.files[0];if(!f)return;try{const ext=(f.name.split('.').pop()||'').toLowerCase();const rows=ext==='xlsx'?await parseServicesXLSX(f):parseServicesCSV(await f.text());const layout=detectTariffImportLayout(rows);renderTariffImportMapping(rows,layout);$('#confirmTariffImport').textContent='اعتماد الخريطة والاستيراد';}catch(err){showWarning('تعذر تحليل الملف',err.message||'تعذر قراءة الأعمدة');}};
  $('#tariffImportModal').classList.add('open');
}
async function confirmTariffImport(){
  const file=$('#tariffImportFile').files&&$('#tariffImportFile').files[0]; if(!file){showWarning('اختر ملفًا','حدد ملف Excel أو CSV أولًا');return;}
  const target=$('#tariffImportTarget').value, eff=$('#tariffImportEffective').value;
  if(!eff){showWarning('حدد السريان','أدخل تاريخ السريان');return;}
  if(!tariffImportRows||!tariffImportMapping){showWarning('راجع خريطة الأعمدة','اختر الملف وانتظر ظهور معاينة الربط');return;}
  if(tariffImportMapping.price<0||tariffImportMapping.arabicName<0&&tariffImportMapping.englishName<0){showWarning('خريطة غير مكتملة','يجب ربط عمود السعر وعمود اسم الخدمة على الأقل');return;}
  const rows=buildTariffImportRows(tariffImportRows,tariffImportMapping,tariffImportHeaderRow);
  if(rows.length<2){showWarning('لا توجد خدمات','لم يتم اكتشاف صفوف خدمات بأسعار صالحة');return;}
  const opts=target==='new'?{createTariff:{name:$('#tariffImportName').value.trim(),type:$('#tariffImportType').value,effectiveDate:eff},effectiveDate:eff}:{tariffId:target,effectiveDate:eff};
  const result=importServicesRows(rows,opts); if(result&&result.ok){$('#tariffImportModal').classList.remove('open');renderAll();tariffImportRows=null;tariffImportMapping=null;}
}
function renderTariffChangeHistory(){
  const box=$('#tariffChangeHistory'); if(!box) return;
  const entries=[]; (tariffs||[]).forEach(t=>(t.changeLog||[]).forEach(x=>entries.push({...x,tariffId:t.id,tariffName:t.name})));
  entries.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  if(!entries.length){ box.innerHTML='<div style="padding:12px;color:var(--muted)">لا توجد تغييرات مسجلة حتى الآن</div>'; return; }
  box.innerHTML=entries.map(e=>`<div class="panel" style="padding:10px;margin:8px 0"><b>${escapeHtml(e.tariffName)} (${escapeHtml(e.tariffId)})</b><div style="font-size:12px;color:var(--muted)">${escapeHtml(e.action)} · سريان ${escapeHtml(e.effectiveDate||'—')} · ${escapeHtml(e.actor||'—')} · ${escapeHtml(e.at||'')}</div><div style="font-size:12px;margin-top:5px">${(e.changes||[]).map(c=>`${escapeHtml(c.action)}: ${escapeHtml(c.code)}`).join('، ')}</div></div>`).join('');
}

function bindServicesControls(){
  const effectiveInput=$('#servicesEffectiveDate'); if(effectiveInput && !effectiveInput.value){ effectiveInput.value=tariffDatePlusOne(new Date().toISOString().slice(0,10)); }
  const s = $('#servicesSearch'); if(s && !s.dataset.bound){ s.dataset.bound='1'; s.addEventListener('input', e => { servicesSearchTerm = e.target.value.trim(); renderServices(); }); }
  const tf = $('#servicesTariffFilter'); if(tf && !tf.dataset.bound){ tf.dataset.bound='1'; tf.addEventListener('change', e => { servicesTariffFilter = e.target.value; renderServices(); }); }
  const sort = $('#servicesSort'); if(sort && !sort.dataset.bound){ sort.dataset.bound='1'; sort.addEventListener('change', e => { servicesSort = e.target.value; renderServices(); }); }
  const dir = $('#servicesSortDir'); if(dir && !dir.dataset.bound){ dir.dataset.bound='1'; dir.addEventListener('change', e => { servicesSortDir = e.target.value; renderServices(); }); }
  const validity=$('#servicesValidityFilter'); if(validity&&!validity.dataset.bound){validity.dataset.bound='1';validity.addEventListener('change',e=>{servicesValidityFilter=e.target.value;renderServices();});}
  const chips = $('#servicesFilterChips'); if(chips && !chips.dataset.bound){ chips.dataset.bound='1'; chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if(!c) return; $$('#servicesFilterChips .chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); servicesFilter = c.dataset.sfilter; renderServices(); }); }
  const toggle = $('#servicesAdvToggle'); if(toggle && !toggle.dataset.bound){ toggle.dataset.bound='1'; toggle.addEventListener('click', () => { servicesAdvOpen = !servicesAdvOpen; const p = $('#servicesAdvPanel'); if(p) p.style.display = servicesAdvOpen ? 'block' : 'none'; }); }
  const apply = $('#servicesAdvApply'); if(apply && !apply.dataset.bound){ apply.dataset.bound='1'; apply.addEventListener('click', () => { servicesAdv.code = $('#advCode').value.trim(); servicesAdv.name = $('#advName').value.trim(); servicesAdv.category = $('#advCategory').value.trim(); servicesAdv.tariff = $('#advTariff').value.trim(); servicesAdv.min = $('#advMinPrice').value.trim(); servicesAdv.max = $('#advMaxPrice').value.trim(); renderServices(); }); }
  const reset = $('#servicesAdvReset'); if(reset && !reset.dataset.bound){ reset.dataset.bound='1'; reset.addEventListener('click', () => { servicesAdv = {code:'',name:'',category:'',tariff:'',min:'',max:''}; ['advCode','advName','advCategory','advTariff','advMinPrice','advMaxPrice'].forEach(id=>{const el=$('#'+id); if(el) el.value='';}); renderServices(); }); }
  const impBtn = $('#servicesImportBtn'); const impFile = $('#servicesImportFile');
  if(impBtn && impFile && !impBtn.dataset.bound){ impBtn.dataset.bound='1'; impBtn.addEventListener('click', () => { if(!$('#servicesTariffFilter').value || $('#servicesTariffFilter').value==='all'){ showWarning('اختر لائحة','حدد اللائحة المستهدفة قبل الاستيراد'); return; } if(!$('#servicesEffectiveDate').value){ showWarning('حدد السريان','أدخل تاريخ سريان التحديث'); return; } impFile.click(); }); impFile.addEventListener('change', async e => { const f=e.target.files&&e.target.files[0]; if(f) await importServicesFile(f,{tariffId:$('#servicesTariffFilter').value,effectiveDate:$('#servicesEffectiveDate').value}); e.target.value=''; }); }
  const historyBtn=$('#servicesHistoryBtn'); if(historyBtn&&!historyBtn.dataset.bound){historyBtn.dataset.bound='1';historyBtn.addEventListener('click',()=>{const box=$('#tariffChangeHistory');if(box){box.style.display=box.style.display==='none'?'block':'none';renderTariffChangeHistory();}});}
  const addBtn = $('#servicesAddBtn'); if(addBtn && !addBtn.dataset.bound){ addBtn.dataset.bound='1'; addBtn.addEventListener('click', () => showServiceFormPanel()); }
  ['sfCode','sfCurrentPrice','sfBasePrice'].forEach(id => { const el = $('#'+id); if(el && !el.dataset.impactBound){ el.dataset.impactBound='1'; el.addEventListener('input', () => renderServiceImpact()); } });
  try { if(!showServiceFormPanel._impactHook){ showServiceFormPanel._impactHook = true; const _orig = showServiceFormPanel; showServiceFormPanel = function(t, i){ const r = _orig(t, i); try { renderServiceImpact(); } catch(e){} return r; }; } } catch(e){}
  const sfSave = $('#sfSaveBtn'); if(sfSave && !sfSave.dataset.bound){ sfSave.dataset.bound='1'; sfSave.addEventListener('click', () => saveServiceForm()); }
  const sfCancel = $('#sfCancelBtn'); if(sfCancel && !sfCancel.dataset.bound){ sfCancel.dataset.bound='1'; sfCancel.addEventListener('click', () => hideServiceFormPanel()); }
  const body = $('#servicesBody'); if(body && !body.dataset.bound){ body.dataset.bound='1'; body.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-service]'); if(ed){ const [tid, idx] = ed.dataset.editService.split('|'); showServiceFormPanel(tid, Number(idx)); return; }
    const del = e.target.closest('[data-del-service]'); if(del){ const [tid, idx] = del.dataset.delService.split('|'); deleteServiceAt(tid, Number(idx)); return; }
    const gt = e.target.closest('[data-goto-tariff]'); if(gt){ e.preventDefault(); try { servicesTariffFilter = gt.dataset.gotoTariff; } catch(e){} try { navigateTo('tariffs'); } catch(e){} return; }
  }); }
}