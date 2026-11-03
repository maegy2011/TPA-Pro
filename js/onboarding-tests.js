// onboarding-tests.js — اختبار شاشة التشغيل لأول مرة (الإعداد + القوة + الملف + التخطي)
// التشغيل: await runOnboardingTests() — يعيد {pass, fail, total, results}
// مكمّل لسلسلة splash-tests (لا يعيد فحص validate الأساسي ولا قرار الإقلاع العام).
async function runOnboardingTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  try {
    /* ---------- 1. هيكل الشاشة ---------- */
    try {
      const S = (typeof SHELL_ONBOARDING === 'string') ? SHELL_ONBOARDING : '';
      A('أول مرة: خطوة 1 ظاهرة و2 مخفية', S.includes('id="onbStep1"') && S.includes('id="onbStep2"') && S.includes('display:none'));
      A('أول مرة: نقطتا تقدم', (S.match(/onb-dot/g) || []).length >= 2);
      A('أول مرة: زر لغة EN', S.includes('id="onbLangBtn"'));
      A('أول مرة: استيراد يقبل JSON فقط', S.includes('accept=".json'));
      const eyes = [...S.matchAll(/data-target="([^"]+)"/g)].map(m => m[1]);
      A('أول مرة: أزرار العين تستهدف حقولًا موجودة', eyes.length >= 2 && eyes.every(t => S.includes(`id="${t}"`)), eyes.join(','));
      A('أول مرة: شروط كلمة المرور مذكورة', S.includes('6 أحرف') && S.includes('حرف ورقم'));
      A('أول مرة: زرا استيراد/تخطي', S.includes('id="onbImportBtn"') && S.includes('id="onbSkipBtn"'));
    } catch(e){ A('أول مرة: الهيكل', false, e.message); }

    /* ---------- 2. مقياس القوة ---------- */
    try {
      const P = (typeof passwordStrengthScore === 'function') ? passwordStrengthScore : null;
      A('أول مرة: دالة القوة موجودة', !!P);
      if(P){
        A('أول مرة: فارغة = 0', P('') === 0);
        A('أول مرة: قصيرة = 1', P('ab') === 1);
        A('أول مرة: 6 أحرف بلا رقم = 2', P('abcdef') === 2);
        A('أول مرة: 10 أحرف بلا رقم = 3', P('abcdefghij') === 3);
        A('أول مرة: أحرف+رقم (6) = 4', P('a1b2c3') === 4);
        A('أول مرة: الرمز لا يتجاوز 4', P('a1b2c3!@#') === 4);
        A('أول مرة: عربية+رقم = 4', P('مراجع123') === 4);
      }
    } catch(e){ A('أول مرة: القوة', false, e.message); }

    /* ---------- 3. حدود الفحص ---------- */
    try {
      const V = (typeof validateOnboardingInput === 'function') ? validateOnboardingInput : null;
      if(V){
        A('أول مرة: مسافات الاسم تُشذب (مرفوض)', !V({ name:'   ', brand:'X', pwd:'a1b2c3', conf:'a1b2c3' }).ok);
        A('أول مرة: حد 6 بالضبط مقبول', V({ name:'م', brand:'X', pwd:'a1b2c3', conf:'a1b2c3' }).ok === true);
        A('أول مرة: 5 مرفوضة', !V({ name:'م', brand:'X', pwd:'a1b2c', conf:'a1b2c' }).ok);
        A('أول مرة: أرقام عربية مشرقية مرفوضة (ASCII فقط)', !V({ name:'م', brand:'X', pwd:'مراجع١٢٣', conf:'مراجع١٢٣' }).ok);
        A('أول مرة: رمز وحده بلا حرف مرفوض', !V({ name:'م', brand:'X', pwd:'123456', conf:'123456' }).ok);
      } else { A('أول مرة: الفحص موجود', false, 'missing'); }
    } catch(e){ A('أول مرة: الحدود', false, e.message); }

    /* ---------- 4. تطبيق الملف ---------- */
    try {
      const F = (typeof applyOnboardingProfile === 'function') ? applyOnboardingProfile : null;
      A('أول مرة: دالة الملف موجودة', !!F);
      if(F){
        const s = { reviewer:{}, company:{} };
        F(s, { name:'  أحمد  ', role:'', cn:'', brand:'TPA' });
        A('أول مرة: الاسم يُشذب', s.reviewer.name === 'أحمد');
        A('أول مرة: الدور الافتراضي', s.reviewer.role === 'مراجع مالي معتمد');
        A('أول مرة: الشركة الافتراضية TPA', s.company.name === 'TPA');
        A('أول مرة: الشعار يُحفظ', s.company.brand === 'TPA');
        A('أول مرة: السطر التعريفي يُملأ', (s.company.tagline || '').includes('المراجعة المالية'));
      }
    } catch(e){ A('أول مرة: الملف', false, e.message); }

    /* ---------- 5. عقد التخطي/الإقلاع ---------- */
    try {
      const D = (typeof decideBootScreen === 'function') ? decideBootScreen : null;
      if(D){
        try { localStorage.setItem('tpa_onboarding_done','1'); localStorage.setItem('tpa_pro_auth','LEGACY'); } catch(e){}
        const r = D();
        let legacy = null;
        try { legacy = localStorage.getItem('tpa_pro_auth'); } catch(e){}
        A('أول مرة: إعداد مكتمل → قفل', r === 'lock');
        A('أول مرة: رمز الجلسة القديم يُمسح من التخزين الدائم', legacy !== 'LEGACY');
        try { localStorage.removeItem('tpa_onboarding_done'); } catch(e){}
      } else { A('أول مرة: قرار الإقلاع موجود', false, 'missing'); }
      const S2 = (typeof SHELL_ONBOARDING === 'string') ? SHELL_ONBOARDING : '';
      A('أول مرة: التخطي لا يتجاوز القفل (نص الزر)', S2.includes('متابعة إلى تسجيل الدخول'));
    } catch(e){ A('أول مرة: التخطي', false, e.message); }
  } catch(e){ A('أول مرة', false, e.message); }
  const pass = R.filter(r=>r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
