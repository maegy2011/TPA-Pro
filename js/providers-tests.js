// providers-tests.js — اختبار شاشة الجهات الطبية (القالب + الترشيح + الفحص + الأكواد)
// التشغيل: runProvidersTests() — يعيد {pass, fail, total, results}
function runProvidersTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','contracts','claims','batches'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__pvKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__pvKeep'); } catch(e){} }); try { delete g['__pvKeep']; } catch(e){} };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_PROVIDERS === 'string') ? PAGE_PROVIDERS : '';
      A('جهات: القالب موجود', S.length > 200);
      if(S){
        A('جهات: بحث + إضافة + فلاتر', S.includes('id="providerSearch"') && S.includes('id="addProviderBtn"') && S.includes('id="providerFilterChips"'));
        ['all','active','expiring','expired'].forEach(f => A(`جهات: فلتر ${f}`, S.includes(`data-pfilter="${f}"`)));
        A('جهات: مؤشرات + جدول', S.includes('id="providerKpi"') && S.includes('id="providersBody"'));
        ['الجهة','النوع','التواصل','العقد','المطالبات'].forEach(h => A(`جهات: عمود ${h}`, S.includes(h)));
        A('جهات: التواصل مخفي على الصغير', S.includes('hide-sm'));
      }
    } catch(e){ A('جهات: الهيكل', false, e.message); }

    /* ---------- 2. هيكل المودال (بعد التنسيق) ---------- */
    try {
      const M = (typeof MODAL_PROVIDER === 'string') ? MODAL_PROVIDER : '';
      A('جهات: المودال موجود', M.length > 200);
      if(M){
        ['pvName','pvCode','pvType','pvContact','pvPhone','pvEmail','pvNotes','pvProvinceSearch','pvProvinceList','pvSelectVisible','pvClearVisible','saveProvider','deleteProvider'].forEach(id => A(`جهات: حقل ${id}`, M.includes(`id="${id}"`)));
        const contactSec = M.split('التواصل')[1] || '';
        A('جهات: الهاتف داخل قسم التواصل', contactSec.includes('id="pvPhone"'));
        A('جهات: الكود للقراءة فقط (تلقائي)', M.includes('id="pvCode" readonly'));
        A('جهات: الهاتف numeric!,!inputmode', M.includes('inputmode="tel"'));
        A('جهات: زر الحذف مخفي افتراضيًا', M.includes('id="deleteProvider" style="display:none"'));
      }
    } catch(e){ A('جهات: المودال', false, e.message); }

    /* ---------- 3. الترشيح الخالص ---------- */
    try {
      const F = (typeof filterProvidersList === 'function') ? filterProvidersList : null;
      A('جهات: دالة الترشيح موجودة', !!F);
      if(F){
        const L = [{ name:'مستشفى النيل', city:'القاهرة', contact:'أحمد' },{ name:'معمل الشمس', city:'الجيزة', contact:'منى' }];
        const st = p => (p.name.includes('النيل') ? 'active' : 'expired');
        A('جهات: الكل بلا بحث', F(L, 'all', '', st).length === 2);
        A('جهات: فلتر الحالة', F(L, 'active', '', st).length === 1);
        A('جهات: بحث بالاسم', F(L, 'all', 'الشمس', st).length === 1);
        A('جهات: بحث بالمدينة', F(L, 'all', 'القاهرة', st).length === 1);
        A('جهات: بحث بالمسؤول', F(L, 'all', 'منى', st).length === 1);
        A('جهات: بحث + فلتر معًا', F(L, 'expired', 'الشمس', st).length === 1 && F(L, 'active', 'الشمس', st).length === 0);
        A('جهات: بحث بلا نتيجة', F(L, 'all', 'zzz', st).length === 0);
        A('جهات: حساسية العربي (تقريب)', F(L, 'all', 'النيل', st).length === 1);
      }
    } catch(e){ A('جهات: الترشيح', false, e.message); }

    /* ---------- 4. فحص المدخلات ---------- */
    try {
      const V = (typeof validateProviderInput === 'function') ? validateProviderInput : null;
      A('جهات: دالة الفحص موجودة', !!V);
      if(V){
        const L = [{ id:'PRV-001', name:'مستشفى النيل' }];
        A('جهات: بلا اسم مرفوض', !V({ name:'', email:'', phone:'', list:L }).ok);
        A('جهات: مسافات فقط مرفوضة', !V({ name:'   ', email:'', phone:'', list:L }).ok);
        A('جهات: مكرر مرفوض', V({ name:'مستشفى النيل', email:'', phone:'', list:L }).msg === 'الاسم مستخدم');
        A('جهات: نفس الاسم في التعديل مقبول', V({ name:'مستشفى النيل', email:'', phone:'', list:L, excludeId:'PRV-001' }).ok === true);
        A('جهات: بريد فاسد مرفوض', !V({ name:'جديد', email:'bad', phone:'', list:L }).ok);
        A('جهات: بريد فارغ مقبول (اختياري)', V({ name:'جديد', email:'', phone:'', list:L }).ok === true);
        A('جهات: هاتف فاسد مرفوض', !V({ name:'جديد', email:'', phone:'12', list:L }).ok);
        A('جهات: هاتف صالح مقبول', V({ name:'جديد', email:'a@b.co', phone:'01012345678', list:L }).ok === true);
      }
    } catch(e){ A('جهات: الفحص', false, e.message); }

    /* ---------- 5. الأكواد والربط ---------- */
    try {
      providers = [{ id:'PRV-001', name:'مستشفى النيل', code:5 },{ id:'PRV-002', name:'معمل الشمس' }];
      claims = [{ provider:'مستشفى النيل', billed:1000, approved:800 }];
      if(typeof ensureProviderCodes === 'function') ensureProviderCodes();
      const sun = providers.find(p => p.id === 'PRV-002');
      A('جهات: ترحيل الكود (6)', sun && sun.code === 6, String(sun && sun.code));
      A('جهات: الربط بالاسم بعد الترحيل', claims[0].providerCode === 5);
      A('جهات: التالي = الأقصى + 1', (typeof nextProviderCode === 'function' ? nextProviderCode() : 0) === 7);
      A('جهات: لها مطالبات (بالاسم)', providerHasClaims('مستشفى النيل') === true);
      A('جهات: بلا مطالبات', providerHasClaims('جهة وهمية') === false);
      contracts = [];
      A('جهات: بلا عقد = قادمة', (typeof getEffectiveProviderStatus === 'function' ? getEffectiveProviderStatus(providers[0]) : '') === 'upcoming');
      const st0 = getProviderStats('مستشفى النيل');
      A('جهات: إحصائية (خصم 20%)', st0.claims === 1 && st0.billed === 1000 && st0.deduction === 200 && Math.abs(st0.rate - 20) < 0.001, JSON.stringify(st0));
    } catch(e){ A('جهات: الأكواد', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
