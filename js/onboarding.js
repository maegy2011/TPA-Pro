function showOnboardingError(msg){ const e = document.getElementById('onbErr'); if(e){ e.querySelector('span').textContent = msg; e.classList.add('show'); } }
function clearOnboardingError(){ const e = document.getElementById('onbErr'); if(e){ e.classList.remove('show'); } }
function bindOnboarding(){
  const next = document.getElementById('onbNextBtn');
  // autofocus first field
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
    if(v.length >= 6) score++;
    if(v.length >= 10) score++;
    if(/[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v)) score++;
    if(/[^A-Za-z0-9\u0600-\u06FF]/.test(v)) score++;
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
  if(next) next.addEventListener('click', () => {
    clearOnboardingError();
    const name = (document.getElementById('onbReviewerName')?.value||'').trim();
    const role = (document.getElementById('onbReviewerRole')?.value||'').trim() || 'مراجع مالي معتمد';
    const cn = (document.getElementById('onbCompanyName')?.value||'').trim() || 'TPA';
    const cb = (document.getElementById('onbCompanyBrand')?.value||'').trim() || 'TPA Pro';
    const pwd = document.getElementById('onbPwd')?.value || '';
    const conf = document.getElementById('onbPwdConfirm')?.value || '';
    if(!name){ showOnboardingError('أدخل اسم المراجع'); return; }
    if(!cb){ showOnboardingError('أدخل العلامة التجارية'); return; }
    if(!pwd || pwd.length < 6){ showOnboardingError('كلمة المرور 6 أحرف على الأقل'); return; }
    if(!/[A-Za-z\u0600-\u06FF]/.test(pwd) || !/\d/.test(pwd)){ showOnboardingError('كلمة المرور يجب أن تحتوي على أحرف وأرقام'); return; }
    if(pwd !== conf){ showOnboardingError('التأكيد لا يطابق'); return; }
    appSettings.reviewer.name = name; appSettings.reviewer.role = role;
    appSettings.company.name = cn; appSettings.company.brand = cb;
    appSettings.company.tagline = appSettings.company.tagline || 'نظام المراجعة المالية للمطالبات الطبية';
    saveAppSettings();
    next.disabled = true; next.textContent = '...';
    (async () => {
      try { const h = await hashPassword(pwd); localStorage.setItem(PWD_HASH_KEY, h); } catch(e){}
      try { localStorage.setItem(ONBOARDING_KEY, '1'); localStorage.setItem(AUTH_KEY, '1'); } catch(e){}
      document.getElementById('onbStep1').style.display = 'none';
      document.getElementById('onbStep2').style.display = 'block';
      document.querySelectorAll('.onb-dot').forEach((d,i)=>{ d.classList.toggle('active', i===1); });
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
    localStorage.setItem(ONBOARDING_KEY, '1');
    localStorage.setItem(AUTH_KEY, '1');
    location.reload();
  });
}
// Patch importBackupFile success: after import, complete onboarding
// Wrap applyFullBackup to complete onboarding after a successful import
if(typeof applyFullBackup === 'function'){
  const _origApply = applyFullBackup;
  applyFullBackup = function(parsed, opts){
    const r = _origApply(parsed, opts);
    try { localStorage.setItem(ONBOARDING_KEY, '1'); localStorage.setItem(AUTH_KEY, '1'); } catch(e){}
    setTimeout(() => { try { location.reload(); } catch(e){} }, 800);
    return r;
  };
}
// Bind when DOM ready
setTimeout(() => { try { bindOnboarding(); } catch(e){ console.warn('bindOnboarding', e); } }, 0);