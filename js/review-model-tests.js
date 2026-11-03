// review-model-tests.js — اختبار نموذج المراجعة (الحالة + الجلسات + الحفظ)
// التشغيل في المتصفح: runReviewModelTests() — يعيد {pass, fail, total, results}
// ملاحظة: لا يختبر resumeSession الكامل (يُنقّل الصفحة فعلًا) — يُختبر يدويًا.
function runReviewModelTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  // حفظ العموميات (استعادة عبر eval غير مباشر — روابط let لا تُستعاد عبر globalThis)
  const keep = {};
  ['workSessions','activeClaim','workingInvoices','activeSessionId'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const keepIdx = { inv: (typeof rvActiveInvoiceIdx !== 'undefined' ? rvActiveInvoiceIdx : 0), pat: (typeof rvActivePatientIdx !== 'undefined' ? rvActivePatientIdx : 0) };
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__rmtKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__rmtKeep'); } catch(e){} });
    try { rvActiveInvoiceIdx = keepIdx.inv; rvActivePatientIdx = keepIdx.pat; } catch(e){}
    try { delete g['__rmtKeep']; } catch(e){}
  };
  // كتم الحوارات أثناء الاختبار (تُستعاد في finally)
  const dlg = {};
  ['showWarning','showSuccess','showInfo'].forEach(k => { try { dlg[k] = g[k]; g[k] = () => {}; } catch(e){} });
  try {
    /* ---------- 1. مؤشر المراجعة ---------- */
    try {
      workSessions = [];
      const c0 = (typeof RC_cursorForClaim === 'function') ? RC_cursorForClaim('NOPE') : null;
      A('نموذج: مؤشر افتراضي {0,0}', c0 && c0.invoice === 0 && c0.patient === 0);
      if(typeof RC_applyCursor === 'function'){ RC_applyCursor({ invoice:2, patient:3 }); }
      A('نموذج: تطبيق المؤشر', rvActiveInvoiceIdx === 2 && rvActivePatientIdx === 3);
      rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
    } catch(e){ A('نموذج: المؤشر', false, e.message); }

    /* ---------- 2. اللقطة الأصيلة ---------- */
    try {
      const base = { id:'C', patient:'س', approved:100, _final:100, reviewProgress:{ invoiceIdx:5 }, _autoRuleId:'R1', invoices:[] };
      const same = { id:'C', patient:'س', approved:777, _final:0, reviewProgress:{ invoiceIdx:0 }, _autoRuleId:'R9', invoices:[] };
      const diff = { id:'C', patient:'ص', approved:100, _final:100, invoices:[] };
      A('نموذج: المحسوب والمؤشر لا يمنعان الاستئناف', getSessionConflictState({ baseClaimSnapshot:base }, same) === 'current');
      A('نموذج: التغيير الأصيل تعارض', getSessionConflictState({ baseClaimSnapshot:base }, diff) === 'conflict');
      A('نموذج: بلا أساس = unknown', getSessionConflictState({}, same) === 'unknown');
    } catch(e){ A('نموذج: اللقطة', false, e.message); }

    /* ---------- 3. الجلسة: حفظ/تقدم ---------- */
    try {
      workSessions = []; activeSessionId = null;
      activeClaim = { id:'CLM-T', patient:'مريض', type:'employee', date:'2026-03-01', priorApproval:{ required:false, status:'not-requested' }, invoices:[] };
      workingInvoices = [];
      rvActiveInvoiceIdx = 1; rvActivePatientIdx = 2;
      const s = upsertCurrentSession();
      A('نموذج: إنشاء جلسة من الحالة', !!(s && s.claimId === 'CLM-T'));
      A('نموذج: المؤشر في الجلسة لا المطالبة', s.lastSavedPoint && s.lastSavedPoint.invoiceIdx === 1 && !('reviewProgress' in activeClaim));
      const cur = RC_cursorForClaim('CLM-T');
      A('نموذج: قراءة المؤشر من الجلسة', cur.invoice === 1 && cur.patient === 2);
      if(typeof saveReviewProgress === 'function' && typeof getReviewProgress === 'function'){
        saveReviewProgress(activeClaim, { invoiceIdx:3, patientIdx:4, lineIdx:0 });
        const p = getReviewProgress(activeClaim);
        A('نموذج: حفظ/قراءة التقدم', p && p.invoiceIdx === 3 && p.patientIdx === 4);
      }
      if(typeof updateCurrentReviewProgressPoint === 'function'){
        activeSessionId = s.id; s.status = 'active';
        updateCurrentReviewProgressPoint('CLM-T', 5, 6, 0);
        A('نموذج: تحديث نقطة التقدم', s.lastSavedPoint.invoiceIdx === 5 && !('reviewProgress' in activeClaim));
      }
    } catch(e){ A('نموذج: الجلسة', false, e.message); }

    /* ---------- 4. حساب الفاتورة + الإقامة ---------- */
    try {
      const inv = { id:'INV-T', type:'inpatient', invoiceCategory:'internal', admissionDate:'2026-03-01', dischargeDate:'2026-03-05', operationClass:'major',
        patients:[{ id:'P1', name:'مريض', nationalId:'1', lines:[
          { code:'SURG-1', name:'عملية جراحية كبرى', category:'جراحة', qty:1, billedUnit:5000 },
          { code:'ROOM-1', name:'إقامة', category:'إقامة', qty:2, billedUnit:500 }
        ] }] };
      if(typeof normalizeInvoice === 'function') normalizeInvoice(inv, 'employee');
      const r = computeInvoice(inv, { id:'CLM-T', type:'employee', date:'2026-03-01', priorApproval:{ required:false } });
      A('نموذج: إجمالي الفاتورة (6000)', r.billed === 6000, String(r.billed));
      const room = inv.patients[0].lines[1];
      A('نموذج: فرق الإقامة يُعلَّم (4 أيام مقابل 2)', (room._checksFailed||[]).includes('stay-mismatch'), `expected=${room._stayExpected}`);
      const surg = inv.patients[0].lines[0];
      A('نموذج: جراحة بلا تخدير تُعلَّم', (surg._checksFailed||[]).includes('link-anesthesia'));
    } catch(e){ A('نموذج: الفاتورة', false, e.message); }

    /* ---------- 5. ذاكرة المريض ---------- */
    try {
      const pat = { id:'PX', lines:[{ code:'A', name:'بند', qty:1, billedUnit:100 }] };
      const cl = { id:'CX', type:'employee', date:'2026-03-01', priorApproval:{ required:false } };
      computePatient(pat, cl, '2026-03-01', { id:'IX', date:'2026-03-01' });
      computePatient(pat, cl, '2026-03-01', { id:'IX', date:'2026-03-01' });
      A('نموذج: إعادة الحساب بلا تغيير من الذاكرة', pat._cacheHit === true);
      pat.lines.push({ code:'B', name:'بند2', qty:1, billedUnit:50 });
      computePatient(pat, cl, '2026-03-01', { id:'IX', date:'2026-03-01' });
      A('نموذج: تغيير البنود يُبطل الذاكرة', pat._cacheHit === false);
    } catch(e){ A('نموذج: الذاكرة', false, e.message); }

    /* ---------- 6. بوابة الحفظ: معلّق يمنع ---------- */
    try {
      if(typeof finalizeReview === 'function' && typeof validateReviewForSign === 'function'){
        activeClaim = { id:'CLM-F', billed:1000, approved:0, priorApproval:{ required:false }, invoices:[] };
        workingInvoices = [{ id:'I', patients:[{ name:'م', lines:[{ code:'A', qty:1, billedUnit:1000, _decision:'needs-attention', _checksFailed:['duplicate'] }] }] }];
        const v = validateReviewForSign();
        A('نموذج: عدّاد المعلق = 1', (v.pendingN + v.paN) === 1, String(v.pendingN));
        finalizeReview();
        A('نموذج: الحفظ مرفوض والمعلّق قائم', !activeClaim.reviewedDate);
        workingInvoices = [];
      } else { A('نموذج: بوابة الحفظ (تُخطى خارج المتصفح)', true, 'skipped'); }
    } catch(e){ A('نموذج: بوابة الحفظ', false, e.message); }

    /* ---------- 7. مولدات المعرفات ---------- */
    try {
      if(typeof newInvoiceId === 'function' && typeof newPatientId === 'function'){
        workingInvoices = [{ id:'CLM-X-1' }];
        activeClaim = { id:'CLM-X' };
        A('نموذج: معرف مذكرة متسلسل', newInvoiceId() === 'CLM-X-2', newInvoiceId());
        A('نموذج: معرف مريض متسلسل', newPatientId({ id:'INV-1', patients:[] }) === 'INV-1-P1');
        workingInvoices = [];
      } else { A('نموذج: المولدات (تُخطى)', true, 'skipped'); }
    } catch(e){ A('نموذج: المولدات', false, e.message); }
  } finally {
    Object.keys(dlg).forEach(k => { try { g[k] = dlg[k]; } catch(e){} });
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
