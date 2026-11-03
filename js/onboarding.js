// onboarding.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
/* فحص مدخلات الإعداد الأول — منطق خالص بلا DOM (يُختبر آليًا). */
function validateOnboardingInput(d){
  d = d || {};
  const name = String(d.name || '').trim();
  const brand = String(d.brand || '').trim();
  const pwd = String(d.pwd || ''), conf = String(d.conf || '');
  if(!name) return { ok:false, msg:'أدخل اسم المراجع' };
  if(!brand) return { ok:false, msg:'أدخل العلامة التجارية' };
  if(!pwd || pwd.length < 6) return { ok:false, msg:'كلمة المرور 6 أحرف على الأقل' };
  if(!/[A-Za-z\u0600-\u06FF]/.test(pwd) || !/\d/.test(pwd)) return { ok:false, msg:'كلمة المرور يجب أن تحتوي على أحرف وأرقام' };
  if(pwd !== conf) return { ok:false, msg:'التأكيد لا يطابق' };
  return { ok:true, msg:'' };
}
function showOnboardingError(msg){ const e = document.getElementById('onbErr'); if(e){ e.querySelector('span').textContent = msg; e.classList.add('show'); } }
function clearOnboardingError(){ const e = document.getElementById('onbErr'); if(e){ e.classList.remove('show'); } }
function bindOnboarding(){
  const root = document.getElementById('onboarding');
  if(root && root.dataset.bound === '1') return;
  if(root) root.dataset.bound = '1';
  const next = document.getElementById('onbNextBtn');
  const langBtn = document.getElementById('onbLangBtn');
  if(langBtn){ langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR'; langBtn.addEventListener('click', () => { const newLang = currentLang === 'ar' ? 'en' : 'ar'; setLang(newLang); langBtn.textContent = newLang === 'ar' ? 'EN' : 'AR'; if(typeof applyAllTranslations === 'function') applyAllTranslations(); if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body); }); }
  setTimeout(() => { document.getElementById('onbReviewerName')?.focus(); }, 50);
  // eye toggles
  document.querySelectorAll('.onb-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if(!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'إخفاء' : 'إظهار');
    });
  });
  // strength meter
  const pwdIn = document.getElementById('onbPwd');
  const bar = document.getElementById('onbPwdBar');
  if(pwdIn && bar){ pwdIn.addEventListener('input', () => {
    const v = pwdIn.value;
    let score = 0;
    if(v.length > 0) score = 1;
    if(v.length >= 6) score = 2;
    if(v.length >= 10) score = 3;
    if(/[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v)) score = Math.max(score, 3);
    if(v.length >= 6 && /[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v)) score = 4;
    if(/[^A-Za-z0-9\u0600-\u06FF]/.test(v)) score = Math.min(4, score+1);
    bar.style.width = (score*25)+'%';
    bar.className = 'pw-bar s'+score;
  }); }
  // submit on Enter
  ['onbReviewerName','onbReviewerRole','onbCompanyName','onbCompanyBrand','onbPwd','onbPwdConfirm'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); next?.click(); } });
  });
  const confIn = document.getElementById('onbPwdConfirm');
  if(confIn){ confIn.addEventListener('input', () => {
    if(confIn.value && confIn.value !== pwdIn.value){ showOnboardingError('التأكيد لا يطابق'); } else { clearOnboardingError(); }
  }); }
  if(next) next.addEventListener('click', () => {
    clearOnboardingError();
    const name = (document.getElementById('onbReviewerName')?.value||'').trim();
    const role = (document.getElementById('onbReviewerRole')?.value||'').trim() || 'مراجع مالي معتمد';
    const cn = (document.getElementById('onbCompanyName')?.value||'').trim() || 'TPA';
    const cb = (document.getElementById('onbCompanyBrand')?.value||'').trim() || 'TPA Pro';
    const pwd = document.getElementById('onbPwd')?.value || '';
    const conf = document.getElementById('onbPwdConfirm')?.value || '';
    const chk = (typeof validateOnboardingInput === 'function') ? validateOnboardingInput({ name, brand:cb, pwd, conf }) : { ok:true };
    if(!chk.ok){ showOnboardingError(chk.msg); return; }
    appSettings.reviewer.name = name; appSettings.reviewer.role = role;
    appSettings.company.name = cn; appSettings.company.brand = cb;
    appSettings.company.tagline = appSettings.company.tagline || 'نظام المراجعة المالية للمطالبات الطبية';
    saveAppSettings();
    next.disabled = true; next.textContent = '...';
    (async () => {
      try {
        const h = await hashPassword(pwd);
        localStorage.setItem(PWD_HASH_KEY, h);
        if(localStorage.getItem(PWD_HASH_KEY) !== h) throw new Error('تعذر حفظ كلمة المرور');
        localStorage.setItem(ONBOARDING_KEY, '1');
        sessionStorage.removeItem(AUTH_KEY); localStorage.removeItem(AUTH_KEY);
        document.getElementById('onbStep1').style.display = 'none';
        document.getElementById('onbStep2').style.display = 'block';
        document.querySelectorAll('.onb-dot').forEach((d,i)=>{ d.classList.toggle('active', i===1); });
      } catch(e) {
        showOnboardingError(e && e.message ? e.message : 'تعذر إعداد كلمة المرور بأمان. تحقق من التخزين واتصال آمن ثم أعد المحاولة.');
        next.disabled = false; next.textContent = 'متابعة';
      }
    })();
  });
  const impBtn = document.getElementById('onbImportBtn');
  const fileIn = document.getElementById('onbImportFile');
  if(impBtn && fileIn){ impBtn.addEventListener('click', () => fileIn.click()); }
  if(fileIn){ fileIn.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if(f){ importBackupFile(f); }
    e.target.value = '';
  }); }
  const skip = document.getElementById('onbSkipBtn');
  if(skip) skip.addEventListener('click', () => {
    // Password and onboarding flag were saved in step 1; continue to authentication without a reload.
    try { localStorage.setItem(ONBOARDING_KEY, '1'); sessionStorage.removeItem(AUTH_KEY); localStorage.removeItem(AUTH_KEY); } catch(e) { showOnboardingError('تعذر إكمال الإعداد بسبب مشكلة في التخزين.'); return; }
    const screen = document.getElementById('onboarding'); if(screen) screen.classList.remove('active');
    if(typeof go === 'function') go('lock');
    setTimeout(() => document.getElementById('pwd')?.focus(), 80);
  });
}
// Patch importBackupFile success: after import, complete onboarding
// Wrap applyFullBackup to complete onboarding after a successful import
if(typeof applyFullBackup === 'function'){
  const _origApply = applyFullBackup;
  applyFullBackup = function(parsed, opts){
    const r = _origApply(parsed, opts);
    try { localStorage.setItem(ONBOARDING_KEY, '1'); sessionStorage.removeItem(AUTH_KEY); localStorage.removeItem(AUTH_KEY); } catch(e){}
    setTimeout(() => { try { location.reload(); } catch(e){} }, 800);
    return r;
  };
}
// delegated language toggle (works even if bindOnboarding ran before DOM ready)
document.addEventListener('click', e => {
  const btn = e.target && e.target.closest && e.target.closest('#onbLangBtn');
  if(!btn) return;
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  setLang(newLang);
  btn.textContent = newLang === 'ar' ? 'EN' : 'AR';
  if(typeof applyAllTranslations === 'function') applyAllTranslations();
  if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body);
});
// Bind when DOM ready
setTimeout(() => { try { bindOnboarding(); } catch(e){ console.warn('bindOnboarding', e); } }, 0);