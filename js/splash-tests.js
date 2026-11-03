// splash-tests.js — اختبار شاشة البداية والإقلاع (قوالب + إعداد + قفل + كلمة مرور)
// التشغيل: await runSplashTests() — يعيد {pass, fail, total, results}
async function runSplashTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const lkeep = {}, skeep = {};
  try {
    /* ---------- 1. سلامة القوالب ---------- */
    try {
      const S = (typeof SHELL_SPLASH === 'string' ? SHELL_SPLASH : '') + (typeof SHELL_LOADING === 'string' ? SHELL_LOADING : '')
        + (typeof SHELL_LOCK === 'string' ? SHELL_LOCK : '') + (typeof SHELL_ONBOARDING === 'string' ? SHELL_ONBOARDING : '')
        + (typeof SHELL_APP === 'string' ? SHELL_APP : '');
      const has = id => S.includes(`id="${id}"`);
      A('بداية: splash نشطة افتراضيًا', S.includes('id="splash"') && S.includes('screen active'));
      A('بداية: عناصر التحميل موجودة', has('ldFill') && has('ldPct') && has('ldStatus'));
      A('بداية: عناصر القفل موجودة', has('lockForm') && has('pwd') && has('lockErr'));
      A('بداية: عناصر الإعداد موجودة', has('onbReviewerName') && has('onbPwd') && has('onbPwdConfirm') && has('onbNextBtn') && has('onbStep1') && has('onbStep2'));
      const ids = [...S.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
      const dup = ids.filter((x,i) => ids.indexOf(x) !== i);
      A('بداية: لا معرفات مكررة عبر الشاشات', dup.length === 0, dup.slice(0,3).join(','));
      ['dashboard','inbox','claims','sessions','providers','contracts','tariffs'].forEach(p => A(`بداية: صفحة ${p} في القائمة`, S.includes(`data-page="${p}"`)));
      A('بداية: خطوات التحميل 4', (typeof LOAD_STEPS !== 'undefined' ? LOAD_STEPS : []).length === 4);
    } catch(e){ A('بداية: القوالب', false, e.message); }

    /* ---------- 2. فحص الإعداد ---------- */
    try {
      const V = (typeof validateOnboardingInput === 'function') ? validateOnboardingInput : null;
      A('إعداد: الدالة موجودة', !!V);
      if(V){
        A('إعداد: بلا اسم مرفوض', !V({ name:'', brand:'X', pwd:'a1b2c3', conf:'a1b2c3' }).ok);
        A('إعداد: بلا علامة مرفوض', !V({ name:'م', brand:'', pwd:'a1b2c3', conf:'a1b2c3' }).ok);
        A('إعداد: قصيرة مرفوضة', !V({ name:'م', brand:'X', pwd:'a1b2', conf:'a1b2' }).ok);
        A('إعداد: بلا رقم مرفوضة', !V({ name:'م', brand:'X', pwd:'abcdef', conf:'abcdef' }).ok);
        A('إعداد: عدم التطابق مرفوض', !V({ name:'م', brand:'X', pwd:'a1b2c3', conf:'a1b2c4' }).ok);
        A('إعداد: صالحة مقبولة', V({ name:'أحمد', brand:'TPA', pwd:'a1b2c3', conf:'a1b2c3' }).ok === true);
      }
    } catch(e){ A('إعداد', false, e.message); }

    /* ---------- 3. قرار الإقلاع ---------- */
    try {
      const D = (typeof decideBootScreen === 'function') ? decideBootScreen : null;
      A('إقلاع: الدالة موجودة', !!D);
      if(D){
        try { Object.keys(localStorage).forEach(k => { try { localStorage.removeItem(k); } catch(e){} }); } catch(e){}
        try { sessionStorage.removeItem('tpa_pro_auth'); } catch(e){}
        A('إقلاع: بلا إعداد → onboarding', D() === 'onboarding');
        try { localStorage.setItem('tpa_onboarding_done','1'); } catch(e){}
        A('إقلاع: إعداد بلا جلسة → lock', D() === 'lock');
        try { sessionStorage.setItem('tpa_pro_auth','1'); } catch(e){}
        A('إقلاع: إعداد + جلسة → app', D() === 'app');
        try { sessionStorage.removeItem('tpa_pro_auth'); localStorage.removeItem('tpa_onboarding_done'); } catch(e){}
      }
    } catch(e){ A('إقلاع', false, e.message); }

    /* ---------- 4. القفل التدريجي ---------- */
    try {
      if(typeof resetAuthenticationFailures === 'function') resetAuthenticationFailures();
      const T0 = 1000000;
      A('قفل: البداية صفر', getAuthenticationLockoutMs(T0) === 0);
      for(let i = 0; i < 5; i++) recordAuthenticationFailure(T0 + i);
      A('قفل: 5 إخفاقات = حظر 30ث', getAuthenticationLockoutMs(T0 + 5) > 0, String(getAuthenticationLockoutMs(T0 + 5)));
      // التصعيد يتطلب إخفاقات بعد انتهاء الحظر (المتتابع أثناء الحظر لا يمدده — مقصود).
      const T1 = T0 + 40000;
      for(let j = 0; j < 5; j++) recordAuthenticationFailure(T1 + j * 31000);
      A('قفل: التصعيد يطيل الحظر (60ث)', getAuthenticationLockoutMs(T1 + 4 * 31000 + 1) > 30000, String(getAuthenticationLockoutMs(T1 + 4 * 31000 + 1)));
      resetAuthenticationFailures();
      A('قفل: التصفير يفتح', getAuthenticationLockoutMs(Date.now()) === 0);
    } catch(e){ A('قفل', false, e.message); }

    /* ---------- 5. كلمة المرور ---------- */
    try {
      if(typeof hashPassword === 'function' && g.crypto && g.crypto.subtle){
        const h = await hashPassword('مراجع123');
        A('مرور: صيغة PBKDF2', h.startsWith('pbkdf2_sha256$310000$'));
        try { localStorage.setItem('tpa_pwd_hash', h); } catch(e){}
        A('مرور: الصحيحة تُقبل', (await verifyPassword('مراجع123')) === true);
        A('مرور: الخاطئة تُرفض', (await verifyPassword('خطأ999')) === false);
        try { localStorage.removeItem('tpa_pwd_hash'); } catch(e){}
      } else { A('مرور: تشفير غير متاح (تُخطى)', true, 'skipped'); }
    } catch(e){ A('مرور', false, e.message); }
  } finally {
    try { Object.keys(lkeep).forEach(k => {}); } catch(e){}
  }
  const pass = R.filter(r=>r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
