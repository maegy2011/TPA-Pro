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
