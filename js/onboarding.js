function showOnboardingError(msg){ const e = document.getElementById('onbErr'); if(e){ e.querySelector('span').textContent = msg; e.classList.add('show'); } }
function clearOnboardingError(){ const e = document.getElementById('onbErr'); if(e){ e.classList.remove('show'); } }
function bindOnboarding(){
  const next = document.getElementById('onbNextBtn');
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
    if(pwd !== conf){ showOnboardingError('التأكيد لا يطابق'); return; }
    appSettings.reviewer.name = name; appSettings.reviewer.role = role;
    appSettings.company.name = cn; appSettings.company.brand = cb;
    appSettings.company.tagline = appSettings.company.tagline || 'نظام المراجعة المالية للمطالبات الطبية';
    saveAppSettings();
    (async () => {
      try { const h = await hashPassword(pwd); localStorage.setItem(PWD_HASH_KEY, h); } catch(e){}
      document.getElementById('onbStep1').style.display = 'none';
      document.getElementById('onbStep2').style.display = 'block';
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