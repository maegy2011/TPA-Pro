// services-manage-tests.js — اختبار إدارة الخدمات (إضافة/تعديل/حذف/نسخ تاريخية/بوابات الحفظ)
// يدير CRUD الحقيقي عبر archiveTariffVersion مع DOM مزيف يعمل في المتصفح وNode.
// التشغيل: runServicesManageTests() — يعيد {pass, fail, total, results}
function runServicesManageTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['tariffs'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const keepEdit = (typeof editingServiceForm !== 'undefined') ? JSON.parse(JSON.stringify(editingServiceForm)) : null;
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__smKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__smKeep'); } catch(e){} });
    try { if(keepEdit) editingServiceForm = keepEdit; } catch(e){}
    try { delete g['__smKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', addEventListener(){}, click(){}, focus(){} });
  const ids = ['sfTariff','sfCode','sfCategory','sfName','sfNameEn','sfBasePrice','sfCurrentPrice','sfCovered','sfRequiresPriorApproval','servicesEffectiveDate','serviceFormPanel'];
  ids.forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['renderServices','renderTariffs','renderTariffChangeHistory','hideServiceFormPanel'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => {}; } catch(e){} });
  const origPersist = g.persistData;
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete;
  let lastWarn = null, lastOk = null;
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    g.persistData = () => true;
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };

    const setForm = (o) => {
      els['#sfTariff'].value = o.tariffId || 'TG';
      els['#sfCode'].value = o.code !== undefined ? o.code : '';
      els['#sfName'].value = o.name !== undefined ? o.name : '';
      els['#sfCategory'].value = o.category || 'مختبر';
      els['#sfNameEn'].value = o.nameEn || '';
      els['#sfBasePrice'].value = o.base !== undefined ? String(o.base) : '';
      els['#sfCurrentPrice'].value = o.current !== undefined ? String(o.current) : '';
      els['#sfCovered'].checked = o.covered !== undefined ? !!o.covered : true;
      els['#sfRequiresPriorApproval'].checked = !!o.pa;
      els['#servicesEffectiveDate'].value = o.eff || '';
      try { editingServiceForm = { tariffId:o.editTariff || null, index:(o.editIndex !== undefined ? o.editIndex : null) }; } catch(e){}
    };
    const freshTariff = () => ({ id:'TG', type:'general', status:'active', name:'عامة', effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[], services:[{ code:'OLD-1', name:'قديمة', category:'مختبر', basePrice:100, currentPrice:100, covered:true }] });

    /* ---------- 1. الإضافة ---------- */
    try {
      tariffs = [freshTariff()];
      lastWarn = null; lastOk = null;
      setForm({ code:'NEW-1', name:'جديدة', base:200, current:180, eff:'2025-06-01' });
      saveServiceForm();
      const t = tariffs[0];
      A('إدارة: إضافة خدمة', t.services.some(s => s.code === 'NEW-1'));
      A('إدارة: أرشفة نسخة قبل الإضافة', t.priceVersions.length === 1 && t.priceVersions[0].services.some(s => s.code === 'OLD-1'));
      A('إدارة: سجل التغيير service-add', t.changeLog.length === 1 && t.changeLog[0].action === 'service-add');
      A('إدارة: تقدم تاريخ السريان', t.effectiveDate === '2025-06-01');
      A('إدارة: رسالة نجاح', !!lastOk && !lastWarn);
    } catch(e){ A('إدارة: الإضافة', false, e.message); }

    /* ---------- 2. بوابات الإضافة ---------- */
    try {
      tariffs = [freshTariff()];
      setForm({ code:'OLD-1', name:'تكرار', base:100, eff:'2025-06-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: تكرار الكود مرفوض', !!lastWarn && tariffs[0].services.length === 1);
      setForm({ code:'X-2', name:'', base:100, eff:'2025-06-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: الاسم الفارغ مرفوض', !!lastWarn && tariffs[0].services.length === 1);
      setForm({ code:'X-2', name:'س', base:0, eff:'2025-06-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: السعر الصفري مرفوض', !!lastWarn && tariffs[0].services.length === 1);
      setForm({ code:'X-2', name:'س', base:100, eff:'2025-01-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: سريان غير متقدم مرفوض', !!lastWarn && tariffs[0].services.length === 1 && tariffs[0].effectiveDate === '2025-01-01');
      setForm({ code:'', name:'س', base:100, eff:'2025-06-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: الكود الفارغ مرفوض', !!lastWarn && tariffs[0].services.length === 1);
    } catch(e){ A('إدارة: بوابات الإضافة', false, e.message); }

    /* ---------- 3. التعديل ---------- */
    try {
      tariffs = [freshTariff()];
      setForm({ code:'OLD-1', name:'محدثة', base:150, current:140, eff:'2025-06-01', editTariff:'TG', editIndex:0 });
      lastWarn = null; saveServiceForm();
      const t = tariffs[0];
      A('إدارة: تعديل السعر', t.services[0].currentPrice === 140 && t.services[0].name === 'محدثة');
      A('إدارة: سجل التغيير service-update', t.changeLog.some(c => c.action === 'service-update'));
      A('إدارة: النسخة تحفظ السعر القديم', t.priceVersions.length === 1 && t.priceVersions[0].services[0].currentPrice === 100);
      // نقل بين اللوائح مرفوض
      tariffs = [freshTariff(), { id:'TP', type:'private', status:'active', name:'خاصة', effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[], services:[] }];
      setForm({ code:'OLD-1', name:'م', base:150, eff:'2025-06-01', editTariff:'TP', editIndex:0 });
      els['#sfTariff'].value = 'TG';
      lastWarn = null; saveServiceForm();
      A('إدارة: النقل بين اللوائح مرفوض', !!lastWarn && tariffs[1].services.length === 0);
    } catch(e){ A('إدارة: التعديل', false, e.message); }

    /* ---------- 4. الحذف ---------- */
    try {
      tariffs = [freshTariff()];
      els['#servicesEffectiveDate'].value = '';
      lastWarn = null; deleteServiceAt('TG', 0);
      A('إدارة: الحذف بلا سريان مرفوض', !!lastWarn && tariffs[0].services.length === 1);
      els['#servicesEffectiveDate'].value = '2025-01-01';
      lastWarn = null; deleteServiceAt('TG', 0);
      A('إدارة: الحذف بسريان قديم مرفوض', !!lastWarn && tariffs[0].services.length === 1);
      els['#servicesEffectiveDate'].value = '2025-06-01';
      lastWarn = null; lastOk = null; deleteServiceAt('TG', 0);
      A('إدارة: الحذف يحذف الخدمة', tariffs[0].services.length === 0);
      A('إدارة: الحذف يؤرشف النسخة', tariffs[0].priceVersions.length === 1);
      A('إدارة: سجل التغيير service-delete', tariffs[0].changeLog.some(c => c.action === 'service-delete'));
      A('إدارة: رسالة نجاح الحذف', !!lastOk);
    } catch(e){ A('إدارة: الحذف', false, e.message); }

    /* ---------- 5. التراجع عند فشل الحفظ ---------- */
    try {
      tariffs = [freshTariff()];
      g.persistData = () => false;
      setForm({ code:'NEW-9', name:'فشل', base:100, eff:'2025-06-01' });
      lastWarn = null; saveServiceForm();
      A('إدارة: فشل الحفظ يتراجع', tariffs[0].services.length === 1 && tariffs[0].effectiveDate === '2025-01-01');
      A('إدارة: تحذير التراجع', !!lastWarn);
      g.persistData = () => true;
    } catch(e){ A('إدارة: التراجع', false, e.message); }
    /* ---------- النواة الموحدة ---------- */
    try {
      const n1 = normalizeServicePayload({ code:'  X1 ', name:' أشعة ', nameEn:'', category:'', basePrice:100, currentPrice:'', covered:undefined, requiresPriorApproval:undefined });
      A('نواة: التطبيع والقص', n1.code === 'X1' && n1.name === 'أشعة' && n1.currentPrice === 100 && n1.covered === true);
      A('نواة: الاسم الإنجليزي الفارغ يُحذف', !('nameEn' in n1));
      const n2 = normalizeServicePayload({ code:'X2', name:'س', nameEn:'X Ray', category:'أشعة', basePrice:100, currentPrice:120 });
      A('نواة: الاسم الإنجليزي يُحفظ', n2.nameEn === 'X Ray' && n2.currentPrice === 120);
      const t0 = { id:'TG', name:'عامة', effectiveDate:'2025-01-01', services:[{ code:'A-1', name:'أ', category:'مختبر', basePrice:50, currentPrice:50, covered:true }] };
      const bad = (d) => validateServicePayload(Object.assign({ tariffId:'TG', tariff:t0, tariffEffectiveDate:'2025-01-01', editingIndex:null, editingTariffId:'TG', services:t0.services }, d));
      A('نواة: بلا لائحة', bad({ code:'B', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01', tariff:null, tariffId:'' }).ok === false);
      A('نواة: بلا كود', bad({ code:'', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01' }).ok === false);
      A('نواة: بلا اسم', bad({ code:'B', name:'', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01' }).ok === false);
      A('نواة: سعر أساسي صفري', bad({ code:'B', name:'ب', category:'مختبر', basePrice:0, currentPrice:0, effectiveDate:'2025-02-01' }).ok === false);
      A('نواة: سعر حالي سالب', bad({ code:'B', name:'ب', category:'مختبر', basePrice:50, currentPrice:-5, effectiveDate:'2025-02-01' }).ok === false);
      A('نواة: بلا سريان', bad({ code:'B', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'' }).ok === false);
      A('نواة: تكرار الكود (حساسية الحالة)', bad({ code:'a-1', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01' }).msg.includes('مستخدم'));
      A('نواة: السريان قبل النسخة', bad({ code:'B', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-01-01' }).msg.includes('بعد تاريخ'));
      A('نواة: النقل بين اللوائح مرفوض', bad({ code:'B', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01', editingIndex:0, editingTariffId:'TG', tariffId:'OTHER' }).ok === false);
      A('نواة: تعديل نفس الصف مسموح', bad({ code:'A-1', name:'أ2', category:'مختبر', basePrice:60, currentPrice:60, effectiveDate:'2025-02-01', editingIndex:0, editingTariffId:'TG' }).ok === true);
      A('نواة: صالح', bad({ code:'B-2', name:'ب', category:'مختبر', basePrice:50, currentPrice:50, effectiveDate:'2025-02-01' }).ok === true);
      // التطبيق
      const t1 = { id:'TG', name:'عامة', effectiveDate:'2025-01-01', services:[], priceVersions:[], changeLog:[] };
      const p1 = normalizeServicePayload({ code:'N-1', name:'جديدة', category:'مختبر', basePrice:100, currentPrice:120 });
      const ap1 = applyServicePayload(t1, null, p1, '2025-02-01');
      A('نواة: التطبيق إضافة', ap1.ok === true && ap1.action === 'service-add' && t1.services.length === 1);
      A('نواة: الأرشفة سُجلت', t1.changeLog.length === 1 && t1.effectiveDate === '2025-02-01');
      const p2 = normalizeServicePayload({ code:'n-1', name:'محدثة', category:'مختبر', basePrice:100, currentPrice:150 });
      const ap2 = applyServicePayload(t1, null, p2, '2025-03-01');
      A('نواة: التطبيق تحديث بلا تكرار', ap2.ok === true && ap2.action === 'service-update' && t1.services.length === 1 && t1.services[0].currentPrice === 150);
    } catch(e){ A('نواة: الخدمات الموحدة', false, e.message); }
    /* ---------- التخصيص الجماعي للجهات ---------- */
    try {
      const _ps = [{ id:'P1', name:'جهة 1' }, { id:'P2', name:'جهة 2' }, { id:'P3', name:'بلا عقد' }];
      const _cs = [
        { id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', serviceOverrides:{}, changeLog:[] },
        { id:'C1B', providerId:'P1', startDate:'2024-01-01', endDate:'2024-12-31', serviceOverrides:{}, changeLog:[] },
        { id:'C2', providerId:'P2', startDate:'2025-01-01', endDate:'2027-01-01',
          serviceOverrides:{ 'X-1':{ covered:true, discountRate:5, requiresPA:false } }, changeLog:[] }
      ];
      // الأحدث هو المستهدف
      const t = resolveBulkOverrideTargets(['P1','P2','P3'], { code:'X-1', providers:_ps, contracts:_cs });
      A('جماعي: الأحدث مستهدف', t[0].contractId === 'C1', t[0].contractId);
      A('جماعي: الحالي يُقرأ', t[1].current && t[1].current.covered === true && t[1].current.discountRate === 5);
      A('جماعي: بلا عقد يُعلَّم', t[2].hasContract === false && t[2].contractId === null);
      // الفحص
      A('جماعي: بلا خدمة', validateBulkOverride({ code:'', providerIds:['P1'], covered:true, requiresPA:null, targets:t }).ok === false);
      A('جماعي: بلا جهات', validateBulkOverride({ code:'X-1', providerIds:[], covered:true, requiresPA:null, targets:[] }).ok === false);
      A('جماعي: بلا تغيير', validateBulkOverride({ code:'X-1', providerIds:['P1'], covered:null, requiresPA:null, targets:t }).ok === false);
      A('جماعي: الكل بلا عقود', validateBulkOverride({ code:'X-1', providerIds:['P3'], covered:false, requiresPA:null, targets:[t[2]] }).ok === false);
      const v = validateBulkOverride({ code:'X-1', providerIds:['P1','P2','P3'], covered:false, requiresPA:true, targets:t });
      A('جماعي: صالح (2 قابل + 1 متخطى)', v.ok === true && v.applicable === 2 && v.skipped === 1, JSON.stringify({ a:v.applicable, s:v.skipped }));
      // التطبيق
      const cs2 = JSON.parse(JSON.stringify(_cs));
      const r = applyBulkServiceOverride('X-1', { covered:false, requiresPA:true }, t, cs2);
      A('جماعي: طُبق على عقدين', r.applied.length === 2 && r.skipped.length === 1, JSON.stringify({ a:r.applied.length, s:r.skipped.length }));
      const c1 = cs2.find(c => c.id === 'C1');
      A('جماعي: التعطيل سُجل', c1.serviceOverrides['X-1'].covered === false);
      A('جماعي: الموافقة سُجلت', c1.serviceOverrides['X-1'].requiresPA === true);
      const c2 = cs2.find(c => c.id === 'C2');
      A('جماعي: الخصم القديم محفوظ', c2.serviceOverrides['X-1'].discountRate === 5 && c2.serviceOverrides['X-1'].covered === false);
      A('جماعي: حدث تدقيق', (c1._auditTrail||[]).length === 1 && (c2._auditTrail||[]).length === 1 && c1._auditTrail[0].action === 'contract.bulk-service-override');
      // المحرك يحترم التجاوز
      const ctx = { serviceOverrides: c1.serviceOverrides, tariff: { services:[{ code:'X-1', covered:true }] }, contract: c1 };
      A('جماعي: المحرك يرى التعطيل', (typeof isServiceCovered === 'function' ? isServiceCovered(ctx, 'X-1') : null) === false);
    } catch(e){ A('جماعي: التخصيص للجهات', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origQS) document.querySelector = origQS; } catch(e){} try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    try { if(origPersist === undefined) delete g.persistData; else g.persistData = origPersist; } catch(e){}
    try { if(origWarn === undefined) delete g.showWarning; else g.showWarning = origWarn; } catch(e){}
    try { if(origOk === undefined) delete g.showSuccess; else g.showSuccess = origOk; } catch(e){}
    try { if(origDel === undefined) delete g.showDelete; else g.showDelete = origDel; } catch(e){}
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
