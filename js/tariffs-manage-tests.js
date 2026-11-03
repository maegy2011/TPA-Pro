// tariffs-manage-tests.js — اختبار إدارة اللوائح المالية (إنشاء/نسخ أسعار/ربط/تعطيل/حذف)
// التشغيل: runTariffsManageTests() — يعيد {pass, fail, total, results}
function runTariffsManageTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['tariffs','contracts','providers','claims','batches','trash','editingTariffId','workingServices','workingLinkedServices'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__tmKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__tmKeep'); } catch(e){} });
    try { delete g['__tmKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, click(){}, focus(){} });
  ['tfName','tfEffective','tfExpiry','tfType','tfDescription','tfStatus','tariffModal','linkContractsList'].forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['renderAll','closeTariffModal','_unlockBodyScroll'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete;
  let lastWarn = null, lastOk = null;
  const seedBase = () => {
    providers = [{ id:'PRV-001', name:'مستشفى النيل', code:1 }];
    contracts = [{ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG-OLD' }];
    tariffs = []; claims = []; batches = []; trash = [];
  };
  const setForm = (o) => {
    els['#tfName'].value = o.name !== undefined ? o.name : '';
    els['#tfEffective'].value = o.eff || '';
    els['#tfExpiry'].value = o.expiry || '';
    els['#tfType'].value = o.type || 'general';
    els['#tfDescription'].value = o.desc || '';
    els['#tfStatus'].value = o.status || 'active';
    try { editingTariffId = (o.editId !== undefined ? o.editId : null); } catch(e){}
    try { workingServices = (o.services || []).map(s => ({...s})); } catch(e){}
    try { workingLinkedServices = o.linked ? [...o.linked] : []; } catch(e){}
  };
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };

    /* ---------- 1. إنشاء لائحة ---------- */
    try {
      seedBase();
      setForm({ name:'عامة 2025', eff:'2025-01-01', type:'general', desc:'الأساسية', services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:100, covered:true }] });
      lastWarn = null; lastOk = null; saveTariff();
      A('لوائح-إدارة: لائحة منشأة', tariffs.length === 1);
      A('لوائح-إدارة: ترقيم TAR', /^TAR-2025-\d{3}$/.test(tariffs[0].id), tariffs[0].id);
      A('لوائح-إدارة: سجل الإنشاء', tariffs[0].changeLog.length === 1 && tariffs[0].changeLog[0].action === 'create');
      A('لوائح-إدارة: الخدمة محفوظة', tariffs[0].services.length === 1 && tariffs[0].services[0].code === 'LAB-1');
      A('لوائح-إدارة: نجاح', !!lastOk && !lastWarn);
    } catch(e){ A('لوائح-إدارة: الإنشاء', false, e.message); }

    /* ---------- 2. بوابات الإنشاء ---------- */
    try {
      seedBase();
      setForm({ name:'', eff:'2025-01-01' });
      lastWarn = null; saveTariff();
      A('لوائح-إدارة: بلا اسم مرفوض', !!lastWarn && tariffs.length === 0);
      setForm({ name:'س', eff:'' });
      lastWarn = null; saveTariff();
      A('لوائح-إدارة: بلا سريان مرفوض', !!lastWarn && tariffs.length === 0);
      setForm({ name:'س', eff:'2025-06-01', expiry:'2025-01-01' });
      lastWarn = null; saveTariff();
      A('لوائح-إدارة: انتهاء قبل السريان مرفوض', !!lastWarn && tariffs.length === 0);
    } catch(e){ A('لوائح-إدارة: البوابات', false, e.message); }

    /* ---------- 3. تعديل الأسعار يؤرشف ---------- */
    try {
      seedBase();
      tariffs.push({ id:'TAR-2025-001', name:'عامة', type:'general', description:'', effectiveDate:'2025-01-01', expiryDate:'', status:'active', linkedProviderIds:[], linkedContractIds:[], linkedServiceNames:[], priceVersions:[], changeLog:[],
        services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:100, covered:true }] });
      setForm({ name:'عامة', eff:'2026-01-01', type:'general', editId:'TAR-2025-001',
        services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:120, covered:true }] });
      lastWarn = null; saveTariff();
      const t = tariffs[0];
      A('لوائح-إدارة: السعر الجديد', t.services[0].currentPrice === 120);
      A('لوائح-إدارة: نسخة مؤرشفة بالسعر القديم', t.priceVersions.length === 1 && t.priceVersions[0].services[0].currentPrice === 100);
      A('لوائح-إدارة: سجل tariff-edit', t.changeLog.some(c => c.action === 'tariff-edit'));
      A('لوائح-إدارة: القديم يُحل بتاريخ الإجراء', getTariffVersionForDate(t, '2025-06-01').services[0].currentPrice === 100);
    } catch(e){ A('لوائح-إدارة: الأرشفة', false, e.message); }

    /* ---------- 4. بوابة السريان عند التعديل ---------- */
    try {
      setForm({ name:'عامة', eff:'2025-01-01', type:'general', editId:'TAR-2025-001',
        services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:130, covered:true }] });
      lastWarn = null; saveTariff();
      A('لوائح-إدارة: سريان غير متقدم مرفوض', !!lastWarn && tariffs[0].services[0].currentPrice === 120);
      // تعديل بيانات فقط (نفس الخدمات) مسموح بنفس التاريخ
      setForm({ name:'عامة محدثة', eff:'2026-01-01', type:'general', editId:'TAR-2025-001',
        services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:120, covered:true }] });
      lastWarn = null; saveTariff();
      A('لوائح-إدارة: تعديل الاسم فقط مسموح', !lastWarn && tariffs[0].name === 'عامة محدثة');
    } catch(e){ A('لوائح-إدارة: البوابة', false, e.message); }

    /* ---------- 5. تعطيل اللائحة يخرجها من المراجعة ---------- */
    try {
      setForm({ name:'عامة محدثة', eff:'2026-01-01', type:'general', status:'disabled', editId:'TAR-2025-001',
        services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:120, covered:true }] });
      saveTariff();
      A('لوائح-إدارة: معطلة', tariffs[0].status === 'disabled');
      A('لوائح-إدارة: خارجة من السياق', !isTariffApplicableForDate(tariffs[0], '2026-06-01'));
    } catch(e){ A('لوائح-إدارة: التعطيل', false, e.message); }

    /* ---------- 6. الحذف للسلة ---------- */
    try {
      trash = [];
      deleteTariffWithDialog('TAR-2025-001');
      A('لوائح-إدارة: حذفت', tariffs.length === 0);
      A('لوائح-إدارة: في السلة', trash.some(t => t.type === 'tariff' && t.name === 'عامة محدثة'));
    } catch(e){ A('لوائح-إدارة: الحذف', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origQS) document.querySelector = origQS; } catch(e){} try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    try { if(origWarn === undefined) delete g.showWarning; else g.showWarning = origWarn; } catch(e){}
    try { if(origOk === undefined) delete g.showSuccess; else g.showSuccess = origOk; } catch(e){}
    try { if(origDel === undefined) delete g.showDelete; else g.showDelete = origDel; } catch(e){}
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
