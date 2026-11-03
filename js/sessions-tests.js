// sessions-tests.js — اختبار شاشة جلسات العمل (القالب + البحث + الفرز + الفلترة + العبء + الاستئناف)
// التشغيل: runSessionsTests() — يعيد {pass, fail, total, results}
function runSessionsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['workSessions','claims','activeClaim','workingInvoices','activeSessionId'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const keepIdx = { inv:(typeof rvActiveInvoiceIdx !== 'undefined' ? rvActiveInvoiceIdx : 0), pat:(typeof rvActivePatientIdx !== 'undefined' ? rvActivePatientIdx : 0) };
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__ssKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__ssKeep'); } catch(e){} });
    try { rvActiveInvoiceIdx = keepIdx.inv; rvActivePatientIdx = keepIdx.pat; } catch(e){}
    try { delete g['__ssKeep']; } catch(e){}
  };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_SESSIONS === 'string') ? PAGE_SESSIONS : '';
      A('جلسات: القالب موجود', S.length > 200);
      if(S){
        A('جلسات: مؤشرات + بحث + فلاتر + جديد', S.includes('id="sessionsKpi"') && S.includes('id="sessionsSearch"') && S.includes('id="sessionsFilterChips"') && S.includes('id="newSessionBtn"'));
        ['all','active','paused'].forEach(f => A(`جلسات: فلتر ${f}`, S.includes(`data-sfilter="${f}"`)));
        A('جلسات: حاوية القائمة', S.includes('id="sessionsList"'));
      }
    } catch(e){ A('جلسات: الهيكل', false, e.message); }

    /* ---------- 2. البحث والفلترة والفرز ---------- */
    try {
      const F = (typeof filterSessionsList === 'function') ? filterSessionsList : null;
      const Srt = (typeof sortSessionsByActivity === 'function') ? sortSessionsByActivity : null;
      A('جلسات: الدوال الخالصة موجودة', !!(F && Srt));
      if(F && Srt){
        const info = s => ({ patient:s._p || '', provider:s._v || '' });
        const L = [
          { id:'S1', claimId:'CLM-1', status:'active', lastActiveAt:'2026-09-08T10:00:00', _p:'أحمد', _v:'مستشفى النيل' },
          { id:'S2', claimId:'CLM-2', status:'paused', lastActiveAt:'2026-09-09T10:00:00', _p:'منى', _v:'معمل الشمس' },
          { id:'S3', claimId:'CLM-3', status:'paused', lastActiveAt:'2026-09-01T10:00:00', _p:'كريم', _v:'مستشفى النيل' }
        ];
        A('جلسات: فلتر نشطة', F(L, 'active', '', info).length === 1);
        A('جلسات: فلتر موقوفة', F(L, 'paused', '', info).length === 2);
        A('جلسات: بحث برقم المطالبة', F(L, 'all', 'clm-2', info).length === 1);
        A('جلسات: بحث بالمريض', F(L, 'all', 'أحمد', info).length === 1);
        A('جلسات: بحث بالجهة', F(L, 'all', 'النيل', info).length === 2);
        A('جلسات: حالة + بحث', F(L, 'paused', 'النيل', info).length === 1);
        A('جلسات: بلا نتيجة', F(L, 'active', 'zzz', info).length === 0);
        A('جلسات: الأحدث نشاطًا أولًا', Srt(L).map(s => s.id).join(',') === 'S2,S1,S3');
        A('جلسات: الأصل لا يُمس', L[0].id === 'S1');
      }
    } catch(e){ A('جلسات: الترشيح', false, e.message); }

    /* ---------- 3. عبء الجلسة ---------- */
    try {
      const W = (typeof sessionWorkload === 'function') ? sessionWorkload : null;
      A('جلسات: دالة العبء موجودة', !!W);
      if(W){
        const s = { workingInvoices:[{ patients:[
          { lines:[{ qty:2, billedUnit:100, approved:150 },{ qty:1, billedUnit:50, approved:50 }] },
          { lines:[{ qty:1, billedUnit:300, approved:0 }] }
        ] }] };
        const w = W(s);
        A('جلسات: فواتير/مرضى/بنود', w.inv === 1 && w.pat === 2 && w.lines === 3, JSON.stringify({ inv:w.inv, pat:w.pat, lines:w.lines }));
        A('جلسات: مطالب 550 ومعتمد 200', w.billed === 550 && w.appr === 200);
        A('جلسات: نسبة الاستقطاع', Math.abs(w.rate - (350/550*100)) < 0.001, w.rate.toFixed(1));
        const e = W({});
        A('جلسات: فارغة = أصفار', e.inv === 0 && e.billed === 0 && e.rate === 0);
      }
    } catch(e){ A('جلسات: العبء', false, e.message); }

    /* ---------- 4. معلومات المطالبة والحالات ---------- */
    try {
      claims = [{ id:'CLM-1', patient:'أحمد', provider:'مستشفى النيل', billed:1000, approved:700 }];
      const i1 = (typeof getSessionClaimInfo === 'function') ? getSessionClaimInfo({ claimId:'CLM-1', claimSnapshot:{ patient:'قديم' } }) : null;
      A('جلسات: الحية تغلب اللقطة', i1 && i1.patient === 'أحمد' && i1.stale === false);
      const i2 = getSessionClaimInfo({ claimId:'CLM-X', claimSnapshot:{ patient:'لقطة', provider:'جهة', billed:500, approved:100 } });
      A('جلسات: المفقودة stale باللقطة', i2.stale === true && i2.patient === 'لقطة');
      A('جلسات: معرف فريد', (() => { const a = genSessionId(), b = genSessionId(); return a !== b && a.startsWith('SES-'); })());
      A('جلسات: صياغة الوقت', formatTimeAgo(null) === '—' && formatTimeAgo(new Date().toISOString()) === 'الآن');
    } catch(e){ A('جلسات: المعلومات', false, e.message); }

    /* ---------- 5. الالتقاط والاستئناف ---------- */
    try {
      workSessions = []; activeSessionId = null;
      claims = [{ id:'CLM-1', patient:'أحمد', provider:'م', type:'employee', date:'2026-09-01', priorApproval:{ required:false }, invoices:[{ id:'I1', patients:[] }] }];
      activeClaim = JSON.parse(JSON.stringify(claims[0]));
      workingInvoices = [{ id:'I1', patients:[] }];
      rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
      const dlg = {};
      ['showWarning','showSuccess','showToast','showInfo'].forEach(k => { try { dlg[k] = g[k]; g[k] = () => {}; } catch(e){} });
      try {
        const s = upsertCurrentSession();
        A('جلسات: إنشاء جلسة', !!(s && s.claimId === 'CLM-1'));
        A('جلسات: لقطة أساس + مخطط v2', !!(s.baseClaimSnapshot && s.sessionSchemaVersion === 2));
        A('جلسات: نقطة الحفظ في الجلسة', !!(s.lastSavedPoint && typeof s.lastSavedPoint.invoiceIdx === 'number'));
        A('جلسات: المؤشر لا يتسرب للمطالبة', !('reviewProgress' in activeClaim));
        const st = getSessionConflictState(s, claims[0]);
        A('جلسات: بلا تغيير = current', st === 'current');
        const mod = JSON.parse(JSON.stringify(claims[0])); mod.patient = 'مبدل';
        A('جلسات: تغيير = conflict', getSessionConflictState(s, mod) === 'conflict');
        A('جلسات: بلا أساس = unknown', getSessionConflictState({}, mod) === 'unknown');
      } finally { Object.keys(dlg).forEach(k => { try { g[k] = dlg[k]; } catch(e){} }); }
    } catch(e){ A('جلسات: الالتقاط', false, e.message); }

    let lastWarn2 = null;
    /* ---------- 6. دورة الجلسات المتعددة ---------- */
    const shell2 = {};
    ['renderReviewInvoices','_fillReviewPage','renderReviewDrafts','navigateTo','updatePAWarning','renderSessions','updateSessionsBadge'].forEach(k => { try { shell2[k] = g[k]; g[k] = () => {}; } catch(e){} });
    const keepDel = g.showDelete;
    try {
      g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };
      workSessions = []; activeSessionId = null;
      claims = [
        { id:'CLM-A', patient:'أحمد', provider:'م', type:'employee', date:'2026-03-01', priorApproval:{ required:false }, status:'pending', invoices:[] },
        { id:'CLM-B', patient:'منى', provider:'م', type:'employee', date:'2026-03-02', priorApproval:{ required:false }, status:'pending', invoices:[] }
      ];
      // جلسة أولى + استئناف
      activeClaim = JSON.parse(JSON.stringify(claims[0]));
      workingInvoices = []; rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
      const s1 = upsertCurrentSession();
      A('جلسات+: جلسة أولى', !!(s1 && s1.claimId === 'CLM-A'));
      let okR = resumeSession(s1.id);
      A('جلسات+: استئناف يفعّل', okR === true && activeSessionId === s1.id && s1.status === 'active');
      // جلسة ثانية مع بقاء الأولى
      activeClaim = JSON.parse(JSON.stringify(claims[1]));
      workingInvoices = []; rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
      const s2 = upsertCurrentSession();
      A('جلسات+: جلستان متوازيتان', workSessions.length === 2 && s2.id !== s1.id);
      okR = resumeSession(s2.id);
      A('جلسات+: التبديل للثانية', okR === true && activeSessionId === s2.id);
      // التعارض: تعديل المطالبة الحية يمنع الاستئناف
      claims[1].patient = 'مبدلة';
      lastWarn2 = null;
      const gWarn = g.showWarning; g.showWarning = (t, m) => { lastWarn2 = String(t || '') + ': ' + String(m || ''); };
      let okC = false;
      try { okC = resumeSession(s2.id); } finally { g.showWarning = gWarn; }
      A('جلسات+: التعارض يمنع الاستئناف', okC === false && (lastWarn2 || '').includes('تعارض'));
      A('جلسات+: الجلسة النشطة لا تتغير', activeSessionId === s2.id);
      // المفقودة: حذف المطالبة ثم استردادها من اللقطة
      claims[1].patient = 'منى';
      claims = claims.filter(c => c.id !== 'CLM-B');
      A('جلسات+: المطالبة مفقودة', !claims.some(c => c.id === 'CLM-B'));
      okR = resumeSession(s2.id);
      A('جلسات+: الاسترداد من اللقطة', okR === true && claims.some(c => c.id === 'CLM-B'));
      // نقطة التقدم تعيش في الجلسة لا المطالبة
      updateCurrentReviewProgressPoint('CLM-B', 2, 1, 7);
      const s2u = workSessions.find(x => x.id === s2.id);
      A('جلسات+: نقطة الحفظ محدثة', s2u && s2u.lastSavedPoint.invoiceIdx === 2 && s2u.lastSavedPoint.lineIdx === 7);
      A('جلسات+: المؤشر لا يتسرب', !('reviewProgress' in getClaimById('CLM-B')));
      // الاستئناف من آخر نقطة يضبط المؤشرات
      rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0;
      resumeSessionFromLastPoint(s2.id);
      A('جلسات+: القفز لآخر نقطة', rvActiveInvoiceIdx === 2 && rvActivePatientIdx === 1);
      // البطاقة نص خالص يحمل الرقم
      const card = renderSessionCard(s2u);
      A('جلسات+: البطاقة تحمل الرقم والحالة', card.includes('CLM-B') && (card.includes('نشطة') || card.includes('موقوفة')));
      // الحذف: النشطة تصفّر النشاط
      deleteSessionWithDialog(s1.id);
      A('جلسات+: حذف الأولى', workSessions.length === 1 && workSessions[0].id === s2.id);
      deleteSessionWithDialog(s2.id);
      A('جلسات+: حذف النشطة يصفّر', workSessions.length === 0 && activeSessionId === null);
      // المؤقت: بدء/إيقاف بلا رمي
      let timerOk = true;
      try { startSessionTimeTracker({ id:'T', status:'active', elapsedSeconds:0 }); stopSessionTimeTracker(); } catch(e){ timerOk = false; }
      A('جلسات+: المؤقت بدء/إيقاف', timerOk);
    } catch(e){ A('جلسات+: الدورة', false, e.message); }
    finally {
      try { g.showDelete = keepDel; } catch(e){}
      Object.keys(shell2).forEach(k => { try { g[k] = shell2[k]; } catch(e){} });
    }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
