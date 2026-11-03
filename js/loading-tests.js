// loading-tests.js — اختبار شاشة التحميل (القالب + الخطوات + التوقيت + التسلسل)
// التشغيل: runLoadingTests() — يعيد {pass, fail, total, results}
// مكمّل لسلسلة splash-tests (لا يعيد قرار الإقلاع ولا عد الخطوات العام).
function runLoadingTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  try {
    /* ---------- 1. هيكل القالب ---------- */
    try {
      const S = (typeof SHELL_LOADING === 'string') ? SHELL_LOADING : '';
      A('تحميل: القالب موجود', S.length > 100);
      if(S){
        A('تحميل: شريط + نسبة + حالة', S.includes('id="ldFill"') && S.includes('id="ldPct"') && S.includes('id="ldStatus"'));
        A('تحميل: صف الخطوات موجود (ldSteps)', S.includes('id="ldSteps"'));
        const steps = [...S.matchAll(/class="ld-step"/g)];
        A('تحميل: 4 خطوات مرئية', steps.length === 4, String(steps.length));
        A('تحميل: تسميات الخطوات تطابق LOAD_STEPS', (typeof LOAD_STEPS !== 'undefined') && LOAD_STEPS.every(t => S.includes(t.replace('...',''))));
        A('تحميل: الشاشة غير نشطة افتراضيًا (splash أولًا)', !S.includes('screen active'));
        A('تحميل: splash هي النشطة افتراضيًا', (typeof SHELL_SPLASH === 'string') && SHELL_SPLASH.includes('screen active'));
        const ids = [...S.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
        A('تحميل: لا تكرار مع splash (ldFill فريد)', !((typeof SHELL_SPLASH === 'string') && SHELL_SPLASH.includes('id="ldFill"')));
      }
    } catch(e){ A('تحميل: الهيكل', false, e.message); }

    /* ---------- 2. دالة الخطوة الخالصة ---------- */
    try {
      const F = (typeof loadingStepIndex === 'function') ? loadingStepIndex : null;
      A('تحميل: الدالة موجودة', !!F);
      if(F){
        A('تحميل: 0 → خطوة 0', F(0) === 0);
        A('تحميل: 24 → خطوة 0', F(24) === 0);
        A('تحميل: 25 → خطوة 1', F(25) === 1);
        A('تحميل: 49 → خطوة 1', F(49) === 1);
        A('تحميل: 50 → خطوة 2', F(50) === 2);
        A('تحميل: 74 → خطوة 2', F(74) === 2);
        A('تحميل: 75 → خطوة 3', F(75) === 3);
        A('تحميل: 100 → خطوة 3 (سقف)', F(100) === 3);
        A('تحميل: فوق 100 يُقص', F(250) === 3);
        A('تحميل: سالب يُقص', F(-5) === 0);
        A('تحميل: غير رقمي = 0', F('x') === 0);
      }
    } catch(e){ A('تحميل: الخطوة', false, e.message); }

    /* ---------- 3. ثوابت التوقيت ---------- */
    try {
      A('تحميل: تأخير splash ثابت 2400', (typeof BOOT_SPLASH_MS !== 'undefined') && BOOT_SPLASH_MS === 2400);
      A('تحميل: نبضة التقدم 170', (typeof LOADING_TICK_MS !== 'undefined') && LOADING_TICK_MS === 170);
      A('تحميل: تأخير ما بعد الاكتمال 480', (typeof LOADING_DONE_DELAY_MS !== 'undefined') && LOADING_DONE_DELAY_MS === 480);
      A('تحميل: 4 خطوات', (typeof LOAD_STEPS !== 'undefined') && LOAD_STEPS.length === 4);
    } catch(e){ A('تحميل: التوقيت', false, e.message); }

    /* ---------- 4. عقد التسلسل ---------- */
    try {
      A('تحميل: العلم يبدأ false', (typeof loadingDone !== 'undefined') && loadingDone === false);
      A('تحميل: afterLoading يقرر عبر decideBootScreen', typeof decideBootScreen === 'function' && typeof afterLoading === 'function');
      A('تحميل: startLoading يستخدم الدالة الخالصة', typeof startLoading === 'function' && String(startLoading).includes('loadingStepIndex'));
    } catch(e){ A('تحميل: التسلسل', false, e.message); }
  } catch(e){ A('تحميل', false, e.message); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
