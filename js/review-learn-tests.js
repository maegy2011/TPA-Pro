// review-learn-tests.js — اختبار التعلم التلقائي من قرارات المراجع
// قرارات لا تغطيها قواعد الخصم (رفض/تخفيض بند، سقف/تحمل يدوي) → مسودة قاعدة معطلة بانتظار التفعيل.
// التشغيل: runLearnTests() — يعيد {pass, fail, total, results}
function runLearnTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','tariffs','contracts','claims','deductionRules'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__lrKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__lrKeep'); } catch(e){} });
    try { delete g['__lrKeep']; } catch(e){}
  };
  const hadDocument = (typeof document !== 'undefined');
  const origGID = hadDocument ? document.getElementById : null;
  const uiStubs = ['persistData','renderDeductionRules'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const seed = () => {
    providers = [{ id:'P1', name:'مستشفى النيل', type:'مستشفى', code:11 }];
    tariffs = [{ id:'TG', type:'general', status:'active', name:'عامة', effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[],
      services:[ { code:'LAB-9', name:'تحليل جديد', category:'مختبر', basePrice:100, currentPrice:100, covered:true } ] }];
    contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
    claims = [];
    deductionRules = [];
  };
  const mkClaim = () => ({ id:'CLM-LR', patient:'مريض', provider:'مستشفى النيل', providerCode:11, type:'employee',
    date:'2026-03-02', receivedDate:'2026-03-05', receivedNumber:'RC-LR', status:'new',
    priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' }, invoices:[], billed:0 });
  const countLearned = () => (typeof deductionRules !== 'undefined' ? deductionRules : []).filter(r => r && r.source === 'learned').length;
  try {
    if(hadDocument){ try { document.getElementById = (id) => (id === 'deductionRulesBody' ? null : (origGID ? origGID.call(document, id) : null)); } catch(e){} }
    else { try { g.document = { getElementById:() => null }; } catch(e){} }
    g.persistData = () => true;

    /* ---------- 1. رفض بند بلا قواعد → مسودة ---------- */
    try {
      seed();
      const c = mkClaim();
      const line = { code:'LAB-9', name:'تحليل جديد', qty:1, billedUnit:100 };
      const id = learnRuleFromReviewer('line-reject', { claim:c, line, note:'غير مبرر' });
      A('تعلم: الرفض يُنشئ مسودة', typeof id === 'string' && id.indexOf('DR-') === 0, String(id));
      const r = deductionRules[deductionRules.length - 1];
      A('تعلم: فعل الرفض', r.action === 'reject_line');
      A('تعلم: معطلة بانتظار التفعيل', r.enabled === false);
      A('تعلم: النطاق = جهة المراجع', (r.scope.providerIds || [])[0] === 'P1' && (r.scope.claimTypes || [])[0] === 'employee');
      A('تعلم: الشرط = كود البند', JSON.stringify(r.conditions).includes('LAB-9'));
      A('تعلم: السبب مسجل', String(r.notes || '').includes('CLM-LR'));
    } catch(e){ A('تعلم: الرفض', false, e.message); }

    /* ---------- 2. البند المحكوم بقاعدة لا يُتعلم منه ---------- */
    try {
      seed();
      const c = mkClaim();
      const id = learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9', _appliedRuleIds:['DR-2026-001'] } });
      A('تعلم: المحكوم يُتجاهل', id === null && countLearned() === 0);
    } catch(e){ A('تعلم: التجاهل', false, e.message); }

    /* ---------- 3. تخفيض بند → نسبة محسوبة ---------- */
    try {
      seed();
      const c = mkClaim();
      const id = learnRuleFromReviewer('line-reduce', { claim:c, line:{ code:'LAB-9' }, base:1000, value:800, note:'مبالغ فيه' });
      const r = deductionRules[deductionRules.length - 1];
      A('تعلم: التخفيض يُنشئ مسودة', typeof id === 'string');
      A('تعلم: النسبة 20%', r && r.action === 'reduce_by_percent' && r.rate === 20, r && String(r.rate));
      A('تعلم: التخفيض الكامل مرفوض كتخفيض', learnRuleFromReviewer('line-reduce', { claim:c, line:{ code:'LAB-9' }, base:1000, value:1000 }) === null);
      A('تعلم: بلا تخفيض = بلا مسودة', (() => { const n = countLearned(); learnRuleFromReviewer('line-reduce', { claim:c, line:{ code:'LAB-9' }, base:1000, value:1000 }); return countLearned() === n; })());
    } catch(e){ A('تعلم: التخفيض', false, e.message); }

    /* ---------- 4. سقف/تحمل يدوي ---------- */
    try {
      seed();
      const c = mkClaim();
      const id1 = learnRuleFromReviewer('manual-cap', { claim:c, subtotal:1000, value:700, auto:500, note:'سقف عادل' });
      const r1 = deductionRules[deductionRules.length - 1];
      A('تعلم: السقف اليدوي يُنشئ مسودة', typeof id1 === 'string' && r1.action === 'apply_cap' && r1.rate === 70);
      const id2 = learnRuleFromReviewer('manual-copay', { claim:c, subtotal:1000, value:200, auto:500 });
      const r2 = deductionRules[deductionRules.length - 1];
      A('تعلم: التحمل اليدوي يُنشئ مسودة', typeof id2 === 'string' && r2.action === 'apply_copay' && r2.rate === 20);
      A('تعلم: المساوي للتلقائي لا يُتعلم', learnRuleFromReviewer('manual-cap', { claim:c, subtotal:1000, value:500, auto:500 }) === null);
    } catch(e){ A('تعلم: السقف', false, e.message); }

    /* ---------- 5. التكرار يُحدّث ولا يُكرر + القائم يمنع ---------- */
    try {
      seed();
      const c = mkClaim();
      learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9' } });
      const upd = learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9' }, note:'مرة ثانية' });
      A('تعلم: التكرار تحديث لا إضافة', upd === 'updated' && countLearned() === 1, String(upd));
      deductionRules.push({ id:'DR-X', name:'قائمة', action:'reject_line', rate:0, enabled:true, active:true,
        scope:{ providerIds:['P1'], contractIds:[], claimTypes:['employee'] },
        conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'LAB-9' }] }, effectiveFrom:'2026-01-01' });
      const ex = learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9' } });
      A('تعلم: القائمة تمنع المسودة', ex === 'updated' || ex === 'exists', String(ex));
    } catch(e){ A('تعلم: التكرار', false, e.message); }

    /* ---------- 6. المسودة لا تُطبق تلقائيًا ---------- */
    try {
      seed();
      const c = mkClaim();
      learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9' } });
      const r = deductionRules.find(x => x.source === 'learned');
      let applied = false;
      try {
        const ctx = { claim:c, patient:{}, invoice:{}, line:{ code:'LAB-9' } };
        applied = (typeof ruleMatchesContext === 'function') ? ruleMatchesContext(r, ctx, '2026-03-02') : false;
      } catch(e){ applied = false; }
      A('تعلم: المعطلة لا تُطابق', applied === false);
      A('تعلم: بلا مطالبة = بلا مسودة', learnRuleFromReviewer('line-reject', { claim:null, line:{ code:'X' } }) === null);
    } catch(e){ A('تعلم: عدم التطبيق', false, e.message); }
    /* ---------- 7. التطبيق الفوري بتأكيد المراجع ---------- */
    try {
      seed();
      const c = mkClaim();
      const id = learnRuleFromReviewer('line-reject', { claim:c, line:{ code:'LAB-9' } });
      A('فوري: مسودة أولًا', typeof id === 'string' && deductionRules.find(r => r.id === id).enabled === false);
      // تأكيد المراجع → تُطبق
      let captured = null;
      const _sw = g.showWarning;
      g.showWarning = (t, m, fn) => { captured = { t, m, fn }; };
      let recalcCalled = false;
      const _rr = g.recalcReview;
      g.recalcReview = () => { recalcCalled = true; };
      offerApplyLearnedRule(id);
      A('فوري: تحذير بالتفاصيل', captured && String(captured.t).includes('مستفادة') && String(captured.m).includes('LAB-9'), captured && String(captured.t));
      captured.fn();
      const r = deductionRules.find(x => x.id === id);
      A('فوري: التأكيد يُفعّل', r.enabled === true && r.active === true && r._autoApplied === true);
      A('فوري: إعادة حساب', recalcCalled === true);
      // إلغاء المراجع → تبقى مسودة
      seed();
      const id2 = learnRuleFromReviewer('line-reduce', { claim:mkClaim(), line:{ code:'LAB-9' }, base:1000, value:700 });
      g.showWarning = () => {};
      offerApplyLearnedRule(id2);
      A('فوري: الإلغاء يُبقي مسودة', deductionRules.find(x => x.id === id2).enabled === false);
      // حدود
      A('فوري: بلا showWarning = بلا عطل', (() => { try { delete g.showWarning; } catch(e){} try { g.showSuccess = () => {}; } catch(e){} const o = offerApplyLearnedRule(id2); try { g.showWarning = _sw; } catch(e){} return o === id2; })());
      A('فوري: المكرر بلا عرض', (() => { let n = 0; g.showWarning = () => { n++; }; offerApplyLearnedRule('exists'); offerApplyLearnedRule('updated'); offerApplyLearnedRule(null); try { g.showWarning = _sw; } catch(e){} return n === 0; })());
      A('فوري: تفعيل مفقود = false', applyLearnedRuleNow('DR-NOPE') === false);
      A('فوري: تفعيل مفعّلة = false', (() => { applyLearnedRuleNow(id2); return applyLearnedRuleNow(id2) === false; })());
      try { g.showWarning = _sw; } catch(e){}
      try { if(_rr === undefined) delete g.recalcReview; else g.recalcReview = _rr; } catch(e){}
    } catch(e){ A('تعلم: التطبيق الفوري', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
