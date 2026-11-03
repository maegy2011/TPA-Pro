// review-screen-tests.js — اختبار شاشة مراجعة المطالبات (الاستثناءات + الترقيم + البوابات + الحفظ)
// التشغيل: runReviewScreenTests() — يعيد {pass, fail, total, results}
// يغطي طبقة العرض؛ منطق الحالة والجلسات في review-model-tests.
function runReviewScreenTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['workSessions','claims','activeClaim','workingInvoices','activeSessionId','providers','contracts','tariffs','batches'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const keepIdx = { inv:(typeof rvActiveInvoiceIdx !== 'undefined' ? rvActiveInvoiceIdx : 0), pat:(typeof rvActivePatientIdx !== 'undefined' ? rvActivePatientIdx : 0) };
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__rvKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__rvKeep'); } catch(e){} });
    try { rvActiveInvoiceIdx = keepIdx.inv; rvActivePatientIdx = keepIdx.pat; } catch(e){}
    try { delete g['__rvKeep']; } catch(e){}
  };
  const dlg = {};
  ['showWarning','showSuccess','showInfo','showToast','showDelete'].forEach(k => { try { dlg[k] = g[k]; } catch(e){} });
  let lastWarn = null;
  try {
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = () => {}; g.showInfo = () => {}; g.showToast = () => {};
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };
    // عزل قشرة الواجهة عن منطق الحفظ (يُختبر recalcClaim والتدقيق حقيقيًا)
    const shell = {};
    ['renderAll','closeReview','renderTimeline','clearSessionDirty','notifyPersistOk','notifyPersistFailed'].forEach(k => { try { shell[k] = g[k]; g[k] = () => {}; } catch(e){} });
    try {
      /* ---------- 1. تصنيف الاستثناءات ---------- */
      try {
        workingInvoices = [{ id:'I1', patients:[
          { name:'أ', lines:[{ code:'A', _decision:'needs-attention' },{ code:'B', _decision:'manual-approved' }] },
          { name:'ب', lines:[{ code:'C', _decision:'pa-pending' },{ code:'D' }] }
        ] }, { id:'I2', patients:[{ name:'ج', lines:[{ code:'E', _decision:'needs-attention' }] }] }];
        const ce = collectExceptions();
        A('مراجعة-شاشة: معلق 2 عبر مذكرتين', ce.pending.length === 2);
        A('مراجعة-شاشة: موافقة 1', ce.pa.length === 1);
        A('مراجعة-شاشة: معالَج 2', ce.processed.length === 2);
        A('مراجعة-شاشة: العنصر يحمل مواضعه', ce.pending[0] && ce.pending[0].ii === 0 && ce.pending[0].pi === 0 && ce.pending[0].li === 0);
        workingInvoices = [];
        A('مراجعة-شاشة: فارغة = أصفار', (() => { const e = collectExceptions(); return e.pending.length === 0 && e.pa.length === 0 && e.processed.length === 0; })());
      } catch(e){ A('مراجعة-شاشة: التصنيف', false, e.message); }

      /* ---------- 2. بوابة التوقيع ---------- */
      try {
        activeClaim = { id:'CLM-V', billed:1000, approved:0, priorApproval:{ required:false }, invoices:[] };
        workingInvoices = [{ id:'I', patients:[{ name:'م', lines:[{ code:'A', qty:1, billedUnit:1000, _decision:'needs-attention', _checksFailed:['duplicate'] }] }] }];
        const v = validateReviewForSign();
        A('مراجعة-شاشة: العداد يجمع معلق + موافقة', (v.pendingN + v.paN) === 1, String(v.pendingN));
        workingInvoices = [{ id:'I', patients:[{ name:'م', lines:[{ code:'A', qty:1, billedUnit:1000, _decision:'manual-approved' }] }] }];
        const v2 = validateReviewForSign();
        A('مراجعة-شاشة: بلا معلق = صفر', (v2.pendingN + v2.paN) === 0);
        workingInvoices = [];
      } catch(e){ A('مراجعة-شاشة: البوابة', false, e.message); }

      /* ---------- 3. عقد الترقيم ---------- */
      try {
        A('مراجعة-شاشة: 50 بند/صفحة', (typeof EXC_PER_PAGE !== 'undefined') && EXC_PER_PAGE === 50);
        A('مراجعة-شاشة: دوال الترقيم موجودة', typeof setExcPage === 'function' && typeof setExcSearch === 'function');
        const total = 125, pages = Math.ceil(total / EXC_PER_PAGE);
        A('مراجعة-شاشة: 125 بند = 3 صفحات', pages === 3);
        A('مراجعة-شاشة: الصفحة تُقص (0..49)', (() => { const a = []; for(let i = 0; i < 125; i++) a.push(i); return a.slice(0 * EXC_PER_PAGE, 0 * EXC_PER_PAGE + EXC_PER_PAGE).length === 50 && a.slice(2 * EXC_PER_PAGE, 2 * EXC_PER_PAGE + EXC_PER_PAGE).length === 25; })());
      } catch(e){ A('مراجعة-شاشة: الترقيم', false, e.message); }

      /* ---------- 4. بوابات الحفظ ---------- */
      try {
        providers = [{ id:'P1', name:'مستشفى النيل', code:11 }];
        contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
        tariffs = [{ id:'TG', type:'general', status:'active', effectiveDate:'2025-01-01', services:[{ code:'A', name:'بند', currentPrice:1000, basePrice:1000 }] }];
        claims = []; workSessions = []; batches = [];
        activeClaim = { id:'CLM-F', patient:'مريض', provider:'مستشفى النيل', providerCode:11, type:'employee', date:'2026-03-01',
          priorApproval:{ required:false, status:'not-requested' }, status:'pending', billed:1000, approved:0, invoices:[] };
        // (أ) معلق يمنع
        workingInvoices = [{ id:'I', date:'2026-03-01', patients:[{ name:'م', lines:[{ code:'A', name:'بند', qty:1, billedUnit:1000, _decision:'needs-attention', _checksFailed:['duplicate'] }] }] }];
        lastWarn = null; finalizeReview();
        A('مراجعة-شاشة: المعلق يمنع الحفظ', !activeClaim.reviewedDate && (lastWarn || '').includes('معلّقة'));
        // (ب) سبب السقف اليدوي يمنع
        workingInvoices = [{ id:'I', date:'2026-03-01', patients:[{ name:'م', _capMode:'manual', _manualCapAmount:100, _autoCapAmt:200, _capNote:'', lines:[{ code:'A', name:'بند', qty:1, billedUnit:1000, approved:900, _decision:'manual-approved' }] }] }];
        lastWarn = null; finalizeReview();
        A('مراجعة-شاشة: سقف يدوي بلا سبب يمنع', !activeClaim.reviewedDate && (lastWarn || '').includes('إلزامي'));
        // (ج) مسار ناجح
        workingInvoices = [{ id:'I', date:'2026-03-01', patients:[{ name:'م', lines:[{ code:'A', name:'بند', qty:1, billedUnit:1000, approved:900, _decision:'manual-approved' }] }] }];
        lastWarn = null; finalizeReview();
        A('مراجعة-شاشة: الحفظ يختم بتاريخ', !!activeClaim.reviewedDate);
        A('مراجعة-شاشة: الحالة جزئية (900<1000)', activeClaim.status === 'partial', activeClaim.status);
        A('مراجعة-شاشة: كل مذكرة برقم قانوني', (activeClaim.invoices || []).every(iv => !!iv.legalSerial));
        // (د) حفظ ثانٍ يؤرشف الأول
        workingInvoices = JSON.parse(JSON.stringify(activeClaim.invoices));
        finalizeReview();
        A('مراجعة-شاشة: إعادة الحفظ تؤرشف نسخة', Array.isArray(activeClaim._reviewDrafts) && activeClaim._reviewDrafts.length >= 1);
        workingInvoices = [];
      } catch(e){ A('مراجعة-شاشة: الحفظ', false, e.message); }
    } finally { Object.keys(shell).forEach(k => { try { g[k] = shell[k]; } catch(e){} }); }
  } finally {
    Object.keys(dlg).forEach(k => { try { g[k] = dlg[k]; } catch(e){} });
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
