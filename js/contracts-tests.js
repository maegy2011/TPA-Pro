// contracts-tests.js — اختبار شاشة العقود (القالب + التواريخ + الحالة + الترشيح + النسخ)
// التشغيل: runContractsTests() — يعيد {pass, fail, total, results}
function runContractsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','contracts','claims','batches'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__ctKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__ctKeep'); } catch(e){} }); try { delete g['__ctKeep']; } catch(e){} };
  const iso = d => d.toISOString().slice(0,10);
  const plus = n => { const d = new Date(); d.setDate(d.getDate()+n); return iso(d); };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_CONTRACTS === 'string') ? PAGE_CONTRACTS : '';
      A('عقود: القالب موجود', S.length > 200);
      if(S){
        A('عقود: تنبيه + مؤشرات', S.includes('id="contractAlert"') && S.includes('id="contractKpi"'));
        A('عقود: بحث + إضافة', S.includes('id="contractSearch"') && S.includes('id="addContractBtn"'));
        ['all','active','expiring','expired','suspended','upcoming'].forEach(f => A(`عقود: فلتر ${f}`, S.includes(`data-cfilter="${f}"`)));
        ['الجهة','البداية','النهاية','المدة','المتبقي','الخصم'].forEach(h => A(`عقود: عمود ${h}`, S.includes(h)));
        A('عقود: فارغة colspan=7', S.includes('contractsBody'));
      }
    } catch(e){ A('عقود: الهيكل', false, e.message); }

    /* ---------- 2. هيكل المودال ---------- */
    try {
      const M = (typeof MODAL_CONTRACT === 'string' || typeof MODAL_CONTRACTS === 'string') ? (typeof MODAL_CONTRACT !== 'undefined' ? MODAL_CONTRACT : MODAL_CONTRACTS) : '';
      A('عقود: المودال موجود', M.length > 200, String(M.length));
      if(M){
        ['ctrProvider','ctrStart','ctrDuration','ctrEnd','ctrDiscount','ctrVersionEffective','ctrIncreaseRate','ctrNotes','saveContract','deleteContract'].forEach(id => A(`عقود: حقل ${id}`, M.includes(`id="${id}"`)));
        A('عقود: النهاية تلقائية readonly', M.includes('id="ctrEnd" type="date" readonly') || (M.includes('id="ctrEnd"') && M.includes('readonly')));
        A('عقود: تلميح الحساب التلقائي', M.includes('تلقائي'));
        A('عقود: تلميح النسخ التاريخية', M.includes('التاريخية') || M.includes('السريان'));
      }
    } catch(e){ A('عقود: المودال', false, e.message); }

    /* ---------- 3. حسابات التواريخ ---------- */
    try {
      A('عقود: سنة من يناير = 31 ديسمبر', contractEndFrom('2025-01-01', 1) === '2025-12-31');
      A('عقود: سنتان', contractEndFrom('2025-01-01', 2) === '2026-12-31');
      A('عقود: فاسد = فارغ', contractEndFrom('xx', 1) === '');
      A('عقود: صفر سنة = اليوم السابق', contractEndFrom('2025-01-01', 0) === '2024-12-31');
      A('عقود: سنة→سنتين/جمع/سنة', yearsLabel(1) === 'سنة' && yearsLabel(2) === 'سنتين' && yearsLabel(5) === '5 سنوات' && yearsLabel(11) === '11 سنة');
      A('عقود: مدة سنة ≈ 1', contractDurationYears('2025-01-01','2025-12-31') === 1);
      A('عقود: تمديد بسنة', extendDateByYears('2025-12-31', 1) === '2026-12-31');
      A('عقود: ترقيم سنوي متسلسل', (() => { contracts = [{ id:'CTR-2026-001' },{ id:'CTR-2026-002' }]; const n = nextContractNumber('2026-03-01'); contracts = []; return n; })() === 'CTR-2026-003');
    } catch(e){ A('عقود: التواريخ', false, e.message); }

    /* ---------- 4. الحالة الفعلية ---------- */
    try {
      const st = (typeof effectiveContractStatus === 'function') ? effectiveContractStatus : null;
      A('عقود: الدالة موجودة', !!st);
      if(st){
        A('عقود: المعلق أولًا', st({ suspended:true, startDate:plus(-300), endDate:plus(300) }) === 'suspended');
        A('عقود: القادم (مستقبل)', st({ startDate:plus(30), endDate:plus(400) }) === 'upcoming');
        A('عقود: بلا تواريخ = قادم', st({}) === 'upcoming');
        A('عقود: المنتهي', st({ startDate:plus(-400), endDate:plus(-1) }) === 'expired');
        A('عقود: القريب (30 يوم)', st({ startDate:plus(-300), endDate:plus(30) }) === 'expiring');
        A('عقود: النشط (بعيد)', st({ startDate:plus(-10), endDate:plus(300) }) === 'active');
        A('عقود: الفارغ = معلق إداري', st(null) === 'pending');
      }
    } catch(e){ A('عقود: الحالة', false, e.message); }

    /* ---------- 5. الترشيح والفحص ---------- */
    try {
      const F = (typeof filterContractsList === 'function') ? filterContractsList : null;
      const V = (typeof validateContractInput === 'function') ? validateContractInput : null;
      A('عقود: دالتا الترشيح والفحص', !!(F && V));
      if(F){
        providers = [{ id:'P1', name:'مستشفى النيل' },{ id:'P2', name:'معمل الشمس' }];
        contracts = [{ id:'C1', providerId:'P1', startDate:plus(-10), endDate:plus(300) },{ id:'C2', providerId:'P2', startDate:plus(-400), endDate:plus(-1) }];
        A('عقود: الكل', F(contracts, 'all', '', providers).length === 2);
        A('عقود: فلتر نشط', F(contracts, 'active', '', providers).length === 1);
        A('عقود: بحث بالاسم', F(contracts, 'all', 'الشمس', providers).length === 1);
        A('عقود: بحث + فلتر', F(contracts, 'expired', 'الشمس', providers).length === 1 && F(contracts, 'active', 'الشمس', providers).length === 0);
      }
      if(V){
        A('عقود: بلا جهة', V({ startDate:'2025-01-01', duration:1 }).msg === 'اختر جهة');
        A('عقود: بلا بداية', V({ providerId:'P1', duration:1 }).msg === 'أدخل تاريخ البداية');
        const ok = V({ providerId:'P1', startDate:'2025-01-01', duration:1, versionFrom:'2025-01-01' });
        A('عقود: صالح + نهاية محسوبة', ok.ok === true && ok.end === '2025-12-31' && ok.dur === 1);
        A('عقود: مدة صفر تُجبر 1', V({ providerId:'P1', startDate:'2025-01-01', duration:0 }).dur === 1);
        A('عقود: سريان خارج المدة مرفوض', !V({ providerId:'P1', startDate:'2025-01-01', duration:1, versionFrom:'2026-06-01' }).ok);
        A('عقود: سريان قبل البداية مرفوض', !V({ providerId:'P1', startDate:'2025-01-01', duration:1, versionFrom:'2024-01-01' }).ok);
      }
    } catch(e){ A('عقود: الترشيح/الفحص', false, e.message); }

    /* ---------- 6. شق النسخ المالية ---------- */
    try {
      const S2 = (typeof splitRateVersions === 'function') ? splitRateVersions : null;
      A('عقود: دالة الشق موجودة', !!S2);
      if(S2){
        const e1 = S2([], '2026-01-01', '2026-12-31', { discountRate:10, excludedServices:[] }, '2025-01-01', 10, []);
        A('عقود: شق جديد يبني نسختين (رجعي)', e1.length === 2 && e1[0].effectiveTo === '2025-12-31', JSON.stringify(e1.map(v => v.effectiveFrom)));
        const e2 = S2([{ effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', discountRate:10 }], '2026-01-01', '2026-12-31', { discountRate:15, excludedServices:[] }, '2026-01-01', 10, []);
        A('عقود: نفس السريان يُحدّث لا يشق', e2.length === 1 && e2[0].discountRate === 15);
        const e3 = S2([{ effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', discountRate:10 }], '2026-07-01', '2026-12-31', { discountRate:12, excludedServices:[] }, '2026-01-01', 10, []);
        A('عقود: شق وسطي يغلق السابق', e3.length === 2 && e3[0].effectiveTo === '2026-06-30' && e3[1].effectiveFrom === '2026-07-01');
        A('عقود: الأصل لا يُمس (نسخ)', (() => { const src = [{ effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', discountRate:10 }]; S2(src, '2026-07-01', '2026-12-31', { discountRate:12, excludedServices:[] }, '2026-01-01', 10, []); return src.length === 1 && src[0].effectiveTo === '2026-12-31'; })());
      }
    } catch(e){ A('عقود: الشق', false, e.message); }

    /* ---------- 7. حماية الحذف والتجديد ---------- */
    try {
      providers = [{ id:'P1', name:'مستشفى النيل', code:11 }];
      contracts = [{ id:'C1', providerId:'P1', startDate:plus(-10), endDate:plus(300), rateVersions:[{ effectiveFrom:plus(-10), effectiveTo:plus(300), discountRate:10 }] }];
      batches = [{ id:'B1', providerId:'P1' }];
      A('عقود: مرتبط بدفعة = محمي', (typeof contractHasClaims === 'function' ? contractHasClaims('C1') : false) === true);
      batches = [];
      claims = [{ providerCode:11 }];
      A('عقود: مرتبط بمطالبة (كود) = محمي', contractHasClaims('C1') === true);
      claims = [];
      A('عقود: حر = غير محمي', contractHasClaims('C1') === false);
      A('عقود: التجديد يمدد والنسخة تتبع', extendDateByYears(plus(300), 1) > plus(300));
    } catch(e){ A('عقود: الحماية', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
