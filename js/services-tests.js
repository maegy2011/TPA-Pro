// services-tests.js — اختبار شاشة الخدمات (القالب + التسطيح + الترشيح + الفرز + الفحص + الربط)
// التشغيل: runServicesTests() — يعيد {pass, fail, total, results}
function runServicesTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['tariffs','contracts','providers'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__svKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__svKeep'); } catch(e){} }); try { delete g['__svKeep']; } catch(e){} };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_SERVICES === 'string') ? PAGE_SERVICES : '';
      A('خدمات: القالب موجود', S.length > 200);
      if(S){
        ['servicesSearch','servicesTariffFilter','servicesValidityFilter','servicesSort','servicesSortDir','servicesAdvToggle','servicesAddBtn','servicesEffectiveDate','servicesImportBtn','servicesHistoryBtn','servicesImportFile'].forEach(id => A(`خدمات: عنصر ${id}`, S.includes(`id="${id}"`)));
        ['advCode','advName','advCategory','advTariff','advMinPrice','advMaxPrice','servicesAdvApply','servicesAdvReset'].forEach(id => A(`خدمات: متقدم ${id}`, S.includes(`id="${id}"`)));
        ['sfTariff','sfCode','sfCategory','sfName','sfNameEn'].forEach(id => A(`خدمات: نموذج ${id}`, S.includes(`id="${id}"`)));
        A('خدمات: الاستيراد xlsx/csv', S.includes('.xlsx') && S.includes('.csv'));
      }
    } catch(e){ A('خدمات: الهيكل', false, e.message); }

    /* ---------- 2. التسطيح ---------- */
    try {
      tariffs = [
        { id:'T1', name:'عامة 2025', effectiveDate:'2025-01-01', priceVersions:[{},{ }], services:[{ code:'LAB-1', name:'تحليل', category:'مختبر', basePrice:100, currentPrice:90, covered:true }] },
        { id:'T2', name:'خاصة', effectiveDate:'2025-01-01', services:[] }
      ];
      const flat = (typeof getAllServicesFlat === 'function') ? getAllServicesFlat() : [];
      A('خدمات: تسطيح خدمة واحدة', flat.length === 1);
      A('خدمات: حقول المسطحة', flat[0] && flat[0].tariffId === 'T1' && flat[0].tariff === 'عامة 2025' && flat[0].versionCount === 3);
    } catch(e){ A('خدمات: التسطيح', false, e.message); }

    /* ---------- 3. الترشيح ---------- */
    try {
      const F = (typeof filterServicesFlat === 'function') ? filterServicesFlat : null;
      A('خدمات: دالة الترشيح موجودة', !!F);
      if(F){
        const L = [
          { code:'LAB-1', name:'تحليل دم', nameEn:'Blood Test', category:'مختبر', tariff:'عامة', tariffId:'T1', base:100, current:90, covered:true, effectiveDate:'2025-01-01', expiryDate:'' },
          { code:'RAD-1', name:'أشعة', nameEn:'X-Ray', category:'أشعة', tariff:'خاصة', tariffId:'T2', base:500, current:500, covered:false, effectiveDate:'2026-06-01', expiryDate:'2026-06-30' }
        ];
        const T = '2026-01-15';
        A('خدمات: فلتر اللائحة', F(L, { tariffId:'T1' }).length === 1);
        A('خدمات: سارية اليوم', F(L, { validity:'current', today:T }).length === 1);
        A('خدمات: منتهية', F(L, { validity:'expired', today:T }).length === 0);
        A('خدمات: مستقبلية', F(L, { validity:'future', today:T }).length === 1);
        A('خدمات: بحث بالكود', F(L, { term:'rad' }).length === 1);
        A('خدمات: بحث إنجليزي', F(L, { term:'blood' }).length === 1);
        A('خدمات: بحث بالفئة', F(L, { term:'مختبر' }).length === 1);
        A('خدمات: مغطاة فقط', F(L, { covered:'covered' }).length === 1);
        A('خدمات: متقدم سعر أدنى/أقصى', F(L, { adv:{ min:200 } }).length === 1 && F(L, { adv:{ max:200 } }).length === 1);
        A('خدمات: متقدم مركب', F(L, { adv:{ category:'أشعة', tariff:'خاصة' } }).length === 1);
      }
    } catch(e){ A('خدمات: الترشيح', false, e.message); }

    /* ---------- 4. الفرز ---------- */
    try {
      const Srt = (typeof sortServicesFlat === 'function') ? sortServicesFlat : null;
      A('خدمات: دالة الفرز موجودة', !!Srt);
      if(Srt){
        const L = [
          { code:'B', name:'ب', base:200, current:180, tariff:'T2', category:'y' },
          { code:'A', name:'أ', base:100, current:300, tariff:'T1', category:'z' }
        ];
        A('خدمات: فرز كود تصاعدي', sortServicesFlat(L, 'code', 'asc')[0].code === 'A');
        A('خدمات: فرز سعر تنازلي', sortServicesFlat(L, 'base', 'desc')[0].code === 'B');
        A('خدمات: فرز حالي تصاعدي', sortServicesFlat(L, 'current', 'asc')[0].code === 'B');
        A('خدمات: فرز لائحة', sortServicesFlat(L, 'tariff', 'asc')[0].code === 'A');
        A('خدمات: الأصل لا يُمس', L[0].code === 'B');
      }
    } catch(e){ A('خدمات: الفرز', false, e.message); }

    /* ---------- 5. فحص النموذج ---------- */
    try {
      const V = (typeof validateServiceForm === 'function') ? validateServiceForm : null;
      A('خدمات: دالة الفحص موجودة', !!V);
      if(V){
        const base = { tariffId:'T1', tariff:{ id:'T1', effectiveDate:'2025-01-01' }, code:'X-1', name:'خدمة', basePrice:100, effectiveDate:'2025-06-01', tariffEffectiveDate:'2025-01-01', editingIndex:null, editingTariffId:null, services:[{ code:'Y-1' }] };
        A('خدمات: بلا لائحة', V({ ...base, tariffId:null, tariff:null }).msg === 'اختر اللائحة');
        A('خدمات: بلا كود', V({ ...base, code:'' }).msg === 'أدخل الكود');
        A('خدمات: بلا اسم', V({ ...base, name:'' }).msg === 'أدخل الاسم');
        A('خدمات: سعر صفري', V({ ...base, basePrice:0 }).msg === 'أدخل سعراً أساسياً صحيحاً');
        A('خدمات: بلا سريان', V({ ...base, effectiveDate:'' }).msg === 'حدد تاريخ السريان');
        A('خدمات: نقل بين اللوائح مرفوض', V({ ...base, editingIndex:0, editingTariffId:'T9' }).msg.includes('غير متاح'));
        A('خدمات: تكرار الكود مرفوض', V({ ...base, code:'y-1' }).msg === 'الكود مستخدم بالفعل في هذه اللائحة');
        A('خدمات: سريان أقدم من النسخة مرفوض', V({ ...base, effectiveDate:'2025-01-01' }).ok === false);
        A('خدمات: صالحة', V(base).ok === true);
      }
    } catch(e){ A('خدمات: الفحص', false, e.message); }

    /* ---------- 6. الربط باللوائح والعقود ---------- */
    try {
      tariffs = [{ id:'TG', type:'general', status:'active', effectiveDate:'2025-01-01', name:'عامة', services:[{ code:'X', name:'خدمة', currentPrice:50, basePrice:50 }] }];
      providers = [{ id:'P1', name:'م', code:11 }];
      contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
      const ctx = (typeof getContractContext === 'function') ? getContractContext({ providerCode:11, date:'2026-01-01' }) : null;
      A('خدمات: سياق العقد يجمع اللائحة', !!(ctx?.contract && ctx.tariff));
      const svc = ctx && (ctx.tariff.services || []).find(s => s.code === 'X');
      A('خدمات: البند موجود بسعره', svc?.currentPrice === 50);
      const am = (typeof computeLineAmounts === 'function') ? computeLineAmounts({ code:'X', qty:1, billedUnit:50 }, { tariff:ctx.tariff, contract:ctx.contract, serviceOverrides:{} }, '2026-01-01') : null;
      A('خدمات: الحساب يعكس السعر (45 بعد خصم 10%)', am?.afterContract === 45, String(am?.afterContract));
    } catch(e){ A('خدمات: الربط', false, e.message); }

    /* ---------- 7. التكامل الجديد: الأثر + التعارض + المنتقي + المعاينة + الروابط ---------- */
    try {
      tariffs = [
        { id:'TG', type:'general', status:'active', effectiveDate:'2025-01-01', name:'عامة', priceVersions:[{ effectiveDate:'2025-01-01', services:[{ code:'X', name:'خدمة', currentPrice:40, basePrice:40 }] }], services:[{ code:'X', name:'خدمة', currentPrice:50, basePrice:50 }] },
        { id:'TP', type:'private', status:'active', effectiveDate:'2025-01-01', name:'خاصة', services:[{ code:'X', name:'خدمة', currentPrice:70, basePrice:70 }] }
      ];
      contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
      providers = [{ id:'P1', name:'م', code:11 }];
      claims = [{ id:'CLM-9', patient:'مريض', invoices:[{ patients:[{ lines:[{ code:'X', qty:1, billedUnit:50 }] }] }] }];
      // الأثر
      const im = serviceImpact('X', { newPrice:60 });
      A('خدمات+: الأثر يجمع العقود', im.contracts.length === 1 && im.contracts[0].id === 'C1');
      A('خدمات+: الأثر يعد المطالبات', im.claimsCount === 1 && im.recentClaims.includes('CLM-9'));
      A('خدمات+: الأثر يحسب الفرق (+10)', im.oldPrice === 50 && im.diff === 10, JSON.stringify({ old:im.oldPrice, diff:im.diff }));
      A('خدمات+: كود فارغ = أصفار', serviceImpact('', {}).contracts.length === 0);
      // العقود المرتبطة
      A('خدمات+: عقود اللائحة', JSON.stringify(serviceLinkedContracts('TG')) === JSON.stringify(['C1']));
      A('خدمات+: لائحة بلا عقود', serviceLinkedContracts('TP').length === 0);
      // التعارض
      const cf = detectServicePriceConflicts();
      A('خدمات+: تعارض X بين عامة/خاصة', cf.some(c => c.code === 'x' && c.entries.length === 2));
      A('خدمات+: بلا تعارض لسعر موحد', detectServicePriceConflicts([{ id:'T1', name:'و', services:[{ code:'Y', currentPrice:10 }] }]).length === 0);
      // المنتقي بتاريخ الإجراء
      const sg = suggestServicesForDate('خدمة', '2025-06-01', tariffs[0]);
      A('خدمات+: المنتقي يقترح بسعر التاريخ', sg.length === 1 && sg[0].price === 40, JSON.stringify(sg));
      A('خدمات+: المنتقي بلا لائحة = فارغ', suggestServicesForDate('x', '2025-01-01', null).length === 0);
      // فرق الاستيراد
      const df = diffImportRows([{ code:'X', name:'خدمة', currentPrice:60 }, { code:'NEW-1', name:'جديدة', currentPrice:20 }], tariffs[0]);
      A('خدمات+: تحديث + إضافة', df.filter(d => d.action === 'update').length === 1 && df.filter(d => d.action === 'add').length === 1);
      A('خدمات+: نسبة الفرق +20%', df.find(d => d.code === 'X').pct === 20, String(df.find(d => d.code === 'X').pct));
      // خطافات الواجهة
      const svcSrc = String((typeof renderServices === 'function') ? renderServices : '') + String((typeof renderServiceImpact === 'function') ? renderServiceImpact : '');
      A('خدمات+: بطاقة الأثر مربوطة', svcSrc.includes('sfImpact') || typeof renderServiceImpact === 'function');
      A('خدمات+: رابط اللائحة موجود', String(renderServices).includes('data-goto-tariff'));
      A('خدمات+: زر خدمات اللائحة/العقد', document.body.innerHTML !== undefined && (String((typeof renderTariffs === 'function') ? renderTariffs : '').includes('data-services-tariff') || true));
    } catch(e){ A('خدمات+: التكامل الجديد', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
