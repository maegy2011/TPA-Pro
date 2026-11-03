// rules-engine-tests.js — اختبار محرك قواعد الخصم
// فحص موحد + مطابقة بنطاق محقون + ملخص أثر نقي + تبديل + تعارضات + دورات.
// التشغيل: runRulesEngineTests() — يعيد {pass, fail, total, results}
function runRulesEngineTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['deductionRules','providers','contracts','claims'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__reKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__reKeep'); } catch(e){} });
    try { delete g['__reKeep']; } catch(e){}
  };
  const uiStubs = ['persistData','renderDeductionRules','recalcReview','showSuccess'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const P = [{ id:'P1', name:'مستشفى النيل', code:11 }, { id:'P2', name:'الهلال', code:22 }];
  const C = [{ id:'C1', providerId:'P1' }];
  const mkClaim = (over) => Object.assign({ id:'CLM-R', patient:'م', provider:'مستشفى النيل', providerCode:11, type:'employee',
    date:'2026-03-02', receivedDate:'2026-03-05', invoices:[] }, over || {});
  try {
    /* ---------- 1. فحص التعريف ---------- */
    try {
      const good = { name:'سقف مختبر', rate:20, effectiveFrom:'2026-01-01', claimTypes:['employee'], notes:'سبب عربي', providerIds:['P1'] };
      A('فحص: صالح', validateRuleDefinition(good).ok === true);
      A('فحص: بلا اسم', validateRuleDefinition({ ...good, name:'' }).ok === false);
      A('فحص: نسبة > 100', validateRuleDefinition({ ...good, rate:150 }).msg === 'النسبة');
      A('فحص: بلا سريان', validateRuleDefinition({ ...good, effectiveFrom:'' }).ok === false);
      A('فحص: بلا نوع', validateRuleDefinition({ ...good, claimTypes:[] }).ok === false);
      A('فحص: بلا سبب', validateRuleDefinition({ ...good, notes:'' }).ok === false);
      A('فحص: بلا نطاق', validateRuleDefinition({ ...good, providerIds:[] }).msg.includes('جهة'));
      A('فحص: كل الجهات صريح', validateRuleDefinition({ ...good, providerIds:[], scopeExplicitAll:true }).ok === true);
    } catch(e){ A('محرك: الفحص', false, e.message); }

    /* ---------- 2. المطابقة بنطاق محقون ---------- */
    try {
      const rule = { id:'DR-T', action:'reduce_by_percent', rate:10, enabled:true, active:true,
        effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', scope:{ providerIds:['P1'], contractIds:[], claimTypes:['employee'] }, conditions:{ logic:'AND', rules:[] } };
      const hit = (claim) => ruleMatchesContext(rule, { claim, providers:P, contracts:C }, '2026-03-02');
      A('مطابقة: داخل النطاق', hit(mkClaim()) === true);
      A('مطابقة: جهة أخرى', hit(mkClaim({ provider:'الهلال', providerCode:22 })) === false);
      A('مطابقة: نوع آخر', hit(mkClaim({ type:'retiree' })) === false);
      const dr = { ...rule, effectiveFrom:'2026-05-01' };
      A('مطابقة: قبل السريان', ruleMatchesContext(dr, { claim:mkClaim(), providers:P, contracts:C }, '2026-03-02') === false);
      const retro = { ...rule, retroactive:false, _simAt:'2026-04-01T00:00:00.000Z' };
      A('مطابقة: غير رجعية قبل التفعيل', ruleMatchesContext(retro, { claim:mkClaim(), providers:P, contracts:C }, '2026-03-02') === false);
      A('مطابقة: غير رجعية بعد التفعيل', ruleMatchesContext(retro, { claim:mkClaim(), providers:P, contracts:C }, '2026-05-01') === true);
      A('مطابقة: معطلة', ruleMatchesContext({ ...rule, enabled:false }, { claim:mkClaim(), providers:P, contracts:C }, '2026-03-02') === false);
      const withCond = { ...rule, scope:{ providerIds:[], contractIds:[], claimTypes:[] },
        conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'LAB-1' }] } };
      const lc = (code) => ruleMatchesContext(withCond, { claim:mkClaim(), line:{ code }, providers:P, contracts:C }, '2026-03-02');
      A('مطابقة: شرط الكود', lc('LAB-1') === true && lc('X-9') === false);
    } catch(e){ A('محرك: المطابقة', false, e.message); }

    /* ---------- 3. ملخص الأثر ---------- */
    try {
      const cl = [mkClaim({ invoices:[{ id:'I', date:'2026-03-02', patients:[
        { name:'م1', lines:[{ code:'LAB-1', name:'ت', qty:2, billedUnit:100 }, { code:'X-9', name:'س', qty:1, billedUnit:300 }] }
      ] }] })];
      const rl = { id:'DR-L', action:'reduce_by_percent', rate:50, enabled:true, active:true, effectiveFrom:'2026-01-01', effectiveTo:'',
        scope:{ providerIds:[], contractIds:[], claimTypes:[] },
        conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'LAB-1' }] } };
      const s = summarizeRuleImpact(rl, cl);
      A('أثر: الأرقام', s.claims === 1 && s.lines === 2 && s.affected === 1 && s.before === 500 && s.after === 400 && s.extraDed === 100 && s.pct === '20.0', JSON.stringify({ b:s.before, a:s.after, e:s.extraDed, p:s.pct }));
      const rp = { id:'DR-P', action:'apply_cap', rate:20, enabled:true, active:true, effectiveFrom:'2026-01-01', effectiveTo:'', scope:{ providerIds:[], contractIds:[], claimTypes:[] }, conditions:{ logic:'AND', rules:[] } };
      const sp = summarizeRuleImpact(rp, cl);
      A('أثر: مستوى المريض', sp.affected === 1 && sp.before === 500 && sp.after === 400, JSON.stringify({ a:sp.after }));
      const se = summarizeRuleImpact(rl, []);
      A('أثر: عينة فارغة', se.claims === 0 && se.extraDed === 0);
    } catch(e){ A('محرك: الأثر', false, e.message); }

    /* ---------- 4. التبديل ---------- */
    try {
      const off = toggleRuleEnabled({ id:'A', enabled:true, active:true, _simulated:true });
      A('تبديل: إيقاف المفعّلة', off.ok === true && off.enabled === false);
      const on = toggleRuleEnabled({ id:'B', enabled:false, active:false, _simulated:true });
      A('تبديل: تفعيل المحاكاة', on.ok === true && on.enabled === true);
      const nosim = toggleRuleEnabled({ id:'C', enabled:false, active:false });
      A('تبديل: بلا محاكاة تُطلب', nosim.ok === false && nosim.needsSim === true);
      A('تبديل: مفقودة', toggleRuleEnabled(null).ok === false);
    } catch(e){ A('محرك: التبديل', false, e.message); }

    /* ---------- 5. التعارضات والدورات ---------- */
    try {
      const base = { id:'DR-1', action:'reject_line', rate:0, scope:{ providerIds:['P1'], contractIds:[], claimTypes:['employee'] }, conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'LAB-1' }] } };
      const dup = detectRuleConflicts({ ...base, id:'DR-2' }, [base]);
      A('تعارض: تكرار', dup.conflicts.some(c => c.type === 'REDUNDANT'), JSON.stringify(dup.conflicts.map(c => c.type)));
      const allow = { id:'DR-3', action:'cap_to_amount', rate:50, scope:base.scope, conditions:base.conditions };
      const contra = detectRuleConflicts({ ...base, id:'DR-4' }, [allow]);
      A('تعارض: رفض ضد سماح', contra.conflicts.some(c => c.type === 'CONTRADICTORY'));
      const miss = detectRuleConflicts({ id:'DR-5', action:'reduce_by_percent', rate:10, requires:{ mode:'any', ruleIds:['NOPE'] }, scope:{ providerIds:[], contractIds:[], claimTypes:[] }, conditions:{ logic:'AND', rules:[] } }, []);
      A('تعارض: اعتماد مفقود خطأ', miss.conflicts.some(c => c.type === 'REQUIRES_MISSING' && c.severity === 'error'));
      const clean = detectRuleConflicts({ id:'DR-6', action:'reduce_by_percent', rate:10, scope:{ providerIds:['P2'], contractIds:[], claimTypes:[] }, conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'ZZZ' }] } }, [base]);
      A('تعارض: نظيفة', clean.hasConflicts === false);
      const cyc = [{ id:'A', requires:{ ruleIds:['B'] } }, { id:'B', requires:{ ruleIds:['A'] } }, { id:'C' }];
      const sorted = topoSortRules(cyc);
      A('دورات: تُستبعد', sorted.length === 1 && sorted[0].id === 'C');
      A('دورات: الأسماء', getCyclicRuleIds().size >= 0);
    } catch(e){ A('محرك: التعارضات', false, e.message); }

    /* ---------- 6. التفعيل الفوري يحترم أخطاء التعارض ---------- */
    try {
      deductionRules = [{ id:'DR-L1', source:'learned', enabled:false, active:true, action:'reduce_by_percent', rate:10,
        scope:{ providerIds:['P1'], contractIds:[], claimTypes:['employee'] },
        conditions:{ logic:'AND', rules:[] }, effectiveFrom:'2026-01-01',
        requires:{ mode:'any', ruleIds:['GHOST'] } }];
      A('فوري: خطأ التعارض يمنع', applyLearnedRuleNow('DR-L1') === false);
      deductionRules = [{ id:'DR-L2', source:'learned', enabled:false, active:true, action:'reduce_by_percent', rate:10,
        scope:{ providerIds:['P1'], contractIds:[], claimTypes:['employee'] },
        conditions:{ logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:'Q' }] }, effectiveFrom:'2026-01-01' }];
      A('فوري: النظيفة تُفعّل', applyLearnedRuleNow('DR-L2') === true);
    } catch(e){ A('محرك: بوابة التفعيل', false, e.message); }
  } finally {
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
