// tariffs-tests.js — اختبار شاشة اللوائح المالية (القالب + النسخ + الزيادة + الترشيح + الأرشفة)
// التشغيل: runTariffsTests() — يعيد {pass, fail, total, results}
function runTariffsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['tariffs','contracts','providers'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__tfKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__tfKeep'); } catch(e){} }); try { delete g['__tfKeep']; } catch(e){} };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_TARIFFS === 'string') ? PAGE_TARIFFS : '';
      A('لوائح: القالب موجود', S.length > 200);
      if(S){
        A('لوائح: بحث + استيراد + إضافة', S.includes('id="tariffSearch"') && S.includes('id="importTariffExcelBtn"') && S.includes('id="addTariffBtn"'));
        ['all','general','private','supplementary'].forEach(f => A(`لوائح: فلتر ${f}`, S.includes(`data-tfilter="${f}"`)));
        ['رقم','الاسم','النوع','الربط','الحالة'].forEach(h => A(`لوائح: عمود ${h}`, S.includes(h)));
        A('لوائح: مؤشرات + جدول', S.includes('id="tariffKpi"') && S.includes('id="tariffsBody"'));
      }
    } catch(e){ A('لوائح: الهيكل', false, e.message); }

    /* ---------- 2. هيكل المودال ---------- */
    try {
      const M = (typeof MODAL_TARIFF === 'string') ? MODAL_TARIFF : '';
      A('لوائح: المودال موجود', M.length > 200, String(M.length));
      if(M){
        ['tfName','tfType','tfStatus','tfEffective','tfExpiry','tfNumber','tfDescription','tfServicesChecklist','tfSelectVisible','tfClearVisible'].forEach(id => A(`لوائح: حقل ${id}`, M.includes(`id="${id}"`)));
        A('لوائح: 3 أنواع', M.includes('value="general"') && M.includes('value="private"') && M.includes('value="supplementary"'));
        A('لوائح: الرقم readonly', M.includes('id="tfNumber" readonly'));
      }
    } catch(e){ A('لوائح: المودال', false, e.message); }

    /* ---------- 3. نسخة السعر بالتاريخ ---------- */
    try {
      const t = { id:'T1', status:'active', effectiveDate:'2025-01-01', expiryDate:'2025-12-31',
        priceVersions:[{ effectiveDate:'2025-01-01', expiryDate:'2025-06-30', services:[{ code:'X', currentPrice:100 }] }],
        services:[{ code:'X', currentPrice:120 }] };
      A('لوائح: نصف أول = 100', getTariffVersionForDate(t, '2025-03-01').services[0].currentPrice === 100);
      A('لوائح: نصف ثان = 120', getTariffVersionForDate(t, '2025-09-01').services[0].currentPrice === 120);
      A('لوائح: قبل السريان = null', getTariffVersionForDate(t, '2024-01-01') === null);
      A('لوائح: بعد الانتهاء = null', getTariffVersionForDate(t, '2026-01-01') === null);
      A('لوائح: بلا نسخ = الحالية', getTariffVersionForDate({ effectiveDate:'2025-01-01', services:[{ code:'X', currentPrice:50 }] }, '2026-01-01').services[0].currentPrice === 50);
      A('لوائح: فارغة = null', getTariffVersionForDate(null, '2025-01-01') === null);
    } catch(e){ A('لوائح: النسخ', false, e.message); }

    /* ---------- 4. الزيادة المركبة ---------- */
    try {
      A('لوائح: 10%+10% = 1.21', Math.abs(getContractIncreaseFactor({ increaseHistory:[{ date:'2025-01-01', rate:10 },{ date:'2026-01-01', rate:10 }] }, '2026-06-01') - 1.21) < 0.0001);
      A('لوائح: قبل التاريخ = 1', getContractIncreaseFactor({ increaseHistory:[{ date:'2025-01-01', rate:10 }] }, '2024-01-01') === 1);
      A('لوائح: بلا تاريخ = 1', getContractIncreaseFactor({}, '2026-01-01') === 1);
    } catch(e){ A('لوائح: الزيادة', false, e.message); }

    /* ---------- 5. الحالة والترشيح والفحص ---------- */
    try {
      const st = (typeof effectiveTariffStatus === 'function') ? effectiveTariffStatus : null;
      if(st){
        A('لوائح: معطلة', st({ status:'disabled', effectiveDate:'2025-01-01' }) === 'disabled');
        A('لوائح: قادمة', st({ status:'active', effectiveDate:'2099-01-01' }) === 'upcoming');
        A('لوائح: منتهية', st({ status:'active', effectiveDate:'2025-01-01', expiryDate:'2025-06-01' }) === 'expired');
        A('لوائح: نشطة', st({ status:'active', effectiveDate:'2025-01-01' }) === 'active');
      } else { A('لوائح: دالة الحالة', false, 'missing'); }
      const F = (typeof filterTariffsList === 'function') ? filterTariffsList : null;
      if(F){
        const L = [{ id:'TAR-1', name:'لائحة عامة', type:'general' },{ id:'TAR-2', name:'خاصة النيل', type:'private' }];
        A('لوائح: الكل', F(L, 'all', '').length === 2);
        A('لوائح: فلتر النوع', F(L, 'private', '').length === 1);
        A('لوائح: بحث بالرقم', F(L, 'all', 'tar-1').length === 1);
        A('لوائح: بحث بالاسم', F(L, 'all', 'النيل').length === 1);
      } else { A('لوائح: دالة الترشيح', false, 'missing'); }
      const V = (typeof validateTariffInput === 'function') ? validateTariffInput : null;
      if(V){
        A('لوائح: بلا اسم', V({ effectiveDate:'2025-01-01' }).msg === 'أدخل الاسم');
        A('لوائح: بلا سريان', V({ name:'ل' }).msg === 'أدخل السريان');
        A('لوائح: انتهاء قبل السريان', V({ name:'ل', effectiveDate:'2025-06-01', expiryDate:'2025-01-01' }).msg === 'الانتهاء قبل السريان');
        A('لوائح: صالحة', V({ name:'ل', effectiveDate:'2025-01-01' }).ok === true);
      } else { A('لوائح: دالة الفحص', false, 'missing'); }
    } catch(e){ A('لوائح: الحالة/الترشيح', false, e.message); }

    /* ---------- 6. بوابة النسخة والفرق ---------- */
    try {
      const G = (typeof checkTariffNewVersion === 'function') ? checkTariffNewVersion : null;
      const D = (typeof diffTariffServices === 'function') ? diffTariffServices : null;
      if(G){
        A('لوائح: بلا تغيير = عبور', G({ effectiveDate:'2025-01-01' }, false, false, '2025-01-01').ok === true);
        A('لوائح: تاريخ أقدم مرفوض', !G({ effectiveDate:'2025-06-01' }, true, false, '2025-06-01').ok);
        A('لوائح: تاريخ أحدث مقبول', G({ effectiveDate:'2025-01-01' }, true, false, '2025-06-01').ok === true);
      } else { A('لوائح: البوابة', false, 'missing'); }
      if(D){
        const ch = D([{ code:'A', currentPrice:100 },{ code:'B', currentPrice:50 }], [{ code:'A', currentPrice:120 },{ code:'C', currentPrice:30 }]);
        A('لوائح: تحديث + حذف + إضافة', ch.length === 3 && ch.some(c => c.action === 'update' && c.code === 'A') && ch.some(c => c.action === 'delete' && c.code === 'B') && ch.some(c => c.action === 'add' && c.code === 'C'));
        A('لوائح: متماثل = بلا فرق', D([{ code:'A', currentPrice:100 }], [{ code:'A', currentPrice:100 }]).length === 0);
      } else { A('لوائح: الفرق', false, 'missing'); }
    } catch(e){ A('لوائح: النسخة/الفرق', false, e.message); }

    /* ---------- 7. الأرشفة والتجديد التلقائي ---------- */
    try {
      const t = { id:'T1', status:'active', effectiveDate:'2025-01-01', services:[{ code:'A', currentPrice:100 }], priceVersions:[], changeLog:[] };
      archiveTariffVersion(t, '2026-01-01', 'tariff-edit', [{ code:'A', action:'update' }]);
      A('لوائح: الأرشفة تدفع نسخة', t.priceVersions.length === 1 && t.priceVersions[0].expiryDate === '2025-12-31' && t.effectiveDate === '2026-01-01');
      let threw = false;
      try { archiveTariffVersion({ effectiveDate:'2026-01-01', services:[] }, '2025-01-01', 'x', []); } catch(e){ threw = true; }
      A('لوائح: تاريخ أقدم يرمي', threw === true);
      tariffs = [{ id:'T9', status:'active', effectiveDate:'2025-01-01', expiryDate:'2025-12-31', services:[], changeLog:[] }];
      const today = new Date().toISOString().slice(0,10);
      if(tariffs[0].expiryDate <= today && typeof autoRenewTariffs === 'function'){
        autoRenewTariffs();
        A('لوائح: التجديد التلقائي يمدد', tariffs[0].expiryDate > '2025-12-31' && tariffs[0].changeLog.some(c => c.action === 'auto-renew'));
      } else { A('لوائح: التجديد (لائحة غير منتهية اليوم — تُخطى)', true, 'skipped'); }
      tariffs = [];
    } catch(e){ A('لوائح: الأرشفة', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
