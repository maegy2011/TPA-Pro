// reports-tests.js — اختبار ترقية إدارة التقارير
// ترشيح (نص/فترة/جهة/حالة) + أعلى الجهات + الاتجاه الشهري + قاعدة موحدة للعرض والتصدير.
// التشغيل: runReportsTests() — يعيد {pass, fail, total, results}
function runReportsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['claims'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__rpKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__rpKeep'); } catch(e){} });
    try { delete g['__rpKeep']; } catch(e){}
  };
  const C = [
    { id:'CLM-1', patient:'أحمد', provider:'النيل', receivedNumber:'RC-1', date:'2026-01-05', receivedDate:'2026-01-06', status:'approved', billed:1000, approved:800, reason:'سقف' },
    { id:'CLM-2', patient:'منى', provider:'النيل', receivedNumber:'RC-2', date:'2026-02-10', receivedDate:'2026-02-11', status:'pending', billed:2000, approved:2000, reason:'' },
    { id:'CLM-3', patient:'كريم', provider:'الهلال', receivedNumber:'RC-3', date:'2026-02-15', receivedDate:'2026-02-16', status:'rejected', billed:1500, approved:0, reason:'رفض' },
    { id:'CLM-4', patient:'أحمد سامي', provider:'الهلال', receivedNumber:'RC-4', date:'2026-03-01', receivedDate:'2026-03-02', status:'partial', billed:3000, approved:2500, reason:'سقف' }
  ];
  try {
    /* ---------- 1. الترشيح ---------- */
    try {
      A('ترشيح: الكل', filterReportsClaims(C, {}).length === 4);
      A('ترشيح: نص بالمريض', filterReportsClaims(C, { q:'منى' }).length === 1);
      A('ترشيح: نص برقم الوارد', filterReportsClaims(C, { q:'rc-3' }).length === 1);
      A('ترشيح: من تاريخ', filterReportsClaims(C, { from:'2026-02-01' }).length === 3);
      A('ترشيح: إلى تاريخ', filterReportsClaims(C, { to:'2026-01-31' }).length === 1);
      A('ترشيح: فترة', filterReportsClaims(C, { from:'2026-02-01', to:'2026-02-28' }).length === 2);
      A('ترشيح: جهة', filterReportsClaims(C, { provider:'النيل' }).length === 2);
      A('ترشيح: حالة', filterReportsClaims(C, { status:'approved' }).length === 1);
      A('ترشيح: مركب', filterReportsClaims(C, { provider:'الهلال', status:'partial' }).length === 1);
      A('ترشيح: لا يعدّل الأصل', (() => { const n = C.length; filterReportsClaims(C, { q:'أحمد' }); return C.length === n; })());
    } catch(e){ A('تقارير: الترشيح', false, e.message); }
    /* ---------- 2. أعلى الجهات ---------- */
    try {
      const tp = reportsTopProviders(C, 5);
      A('جهات: الترتيب', tp.length === 2 && tp[0].provider === 'الهلال' && tp[0].deduction === 2000, JSON.stringify(tp.map(t => t.deduction)));
      A('جهات: بدون استقطاع تُستبعد', reportsTopProviders([{ provider:'س', billed:100, approved:100 }], 5).length === 0);
      A('جهات: الحد n', reportsTopProviders(C, 1).length === 1);
      A('جهات: فارغة', reportsTopProviders([], 5).length === 0);
    } catch(e){ A('تقارير: الجهات', false, e.message); }
    /* ---------- 3. الاتجاه الشهري ---------- */
    try {
      const tr = reportsMonthlyTrend(C);
      A('شهري: الشهور', tr.length === 3 && tr[0].month === '2026-01');
      A('شهري: فبراير', (() => { const f = tr.find(r => r.month === '2026-02'); return f && f.billed === 3500 && f.deduction === 1500; })(), JSON.stringify(tr));
      A('شهري: بلا تاريخ صالح', reportsMonthlyTrend([{ billed:1, approved:1 }]).length === 0);
      A('شهري: آخر 6 فقط', reportsMonthlyTrend(Array.from({ length:8 }, (_,i) => ({ date:`2026-0${i+1}-05`, billed:100, approved:90 }))).length === 6);
    } catch(e){ A('تقارير: الشهري', false, e.message); }
    /* ---------- 4. القاعدة الموحدة ---------- */
    try {
      A('موحدة: getReportsBase موجودة', typeof getReportsBase === 'function');
      claims = C;
      reportsSearchTerm = ''; reportsDateFrom = ''; reportsDateTo = ''; reportsProviderFilter = ''; reportsStatusFilter = '';
      A('موحدة: بلا فلاتر = الكل', getReportsBase().length === 4);
      reportsProviderFilter = 'النيل';
      A('موحدة: الفلتر يسري', getReportsBase().length === 2);
      reportsSearchTerm = 'كريم'; reportsProviderFilter = '';
      A('موحدة: النص يسري', getReportsBase().length === 1);
      reportsSearchTerm = '';
      A('موحدة: إعادة الضبط', getReportsBase().length === 4);
    } catch(e){ A('تقارير: الموحدة', false, e.message); }
    /* ---------- 5. الإحصاء على المفلتر ---------- */
    try {
      const s = statsFor(filterReportsClaims(C, { provider:'الهلال' }));
      A('إحصاء: مفلتر', s.total === 2 && s.billed === 4500 && s.deduction === 2000, JSON.stringify({ t:s.total, b:s.billed, d:s.deduction }));
    } catch(e){ A('تقارير: الإحصاء', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
