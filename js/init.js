const LOAD_STEPS = ['تهيئة محرك المراجعة...','تحميل المطالبات...','تحميل اللوائح...','تجهيز التصدير...'];
let loadingDone = false;
function startLoading(){
  let p = 0;
  const fill = $('#ldFill'), pctEl = $('#ldPct'), statEl = $('#ldStatus'), steps = $$('#ldSteps .ld-step');
  const tick = setInterval(() => {
    p += Math.random()*11+5;
    if(p >= 100) p = 100;
    fill.style.width = p+'%'; pctEl.textContent = Math.floor(p)+'%';
    const idx = Math.min(3, Math.floor(p/25));
    statEl.textContent = LOAD_STEPS[idx];
    steps.forEach((s,i) => { s.classList.remove('now','done'); if(i < idx) s.classList.add('done'); else if(i === idx && p < 100) s.classList.add('now'); else if(i === idx && p >= 100) s.classList.add('done'); });
    if(p >= 100 && !loadingDone){ loadingDone = true; clearInterval(tick); steps.forEach(s => { s.classList.remove('now'); s.classList.add('done'); }); statEl.textContent = 'اكتمل التحميل'; setTimeout(afterLoading, 480); }
  }, 170);
}
function afterLoading(){
  applyAppSettingsToUI();
  if(localStorage.getItem(ONBOARDING_KEY) !== '1'){
    go('onboarding');
    setTimeout(() => { try { if(typeof bindOnboarding === 'function') bindOnboarding(); } catch(e){} const el = document.getElementById('onbReviewerName'); if(el) el.focus(); if(typeof translateDOMMulti === 'function') translateDOMMulti(); }, 350);
    return;
  }
  if(localStorage.getItem(AUTH_KEY) === '1'){ go('app'); initApp(); setTimeout(() => { if(typeof translateDOM === 'function') translateDOM(document.body); }, 100); }
  else { go('lock'); setTimeout(()=>$('#pwd').focus(), 350); }
}
$('#eyeBtn').addEventListener('click', () => { const i = $('#pwd'); i.type = i.type === 'password' ? 'text' : 'password'; });
$('#lockForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = $('#pwd').value.trim(), err = $('#lockErr'), card = $('#lockCard');
  const ok = await verifyPassword(v);
  if(ok){ err.classList.remove('show'); localStorage.setItem(AUTH_KEY,'1'); $('#pwd').value = ''; go('app'); initApp(); }
  else { err.classList.add('show'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); $('#pwd').select(); }
});
$('#pwd').addEventListener('input', () => $('#lockErr').classList.remove('show'));
setTimeout(() => { if(typeof applyAllTranslations === 'function') applyAllTranslations(); if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body); go('loading'); startLoading(); }, 2400);
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('#tbBackupBtn');
  if(!btn) return;
  e.preventDefault();
  if(typeof doExportBackup === 'function') doExportBackup(false);
});
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.onb-lang');
  if(!btn) return;
  setLang(currentLang === 'ar' ? 'en' : 'ar');
  btn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
  if(typeof translateDOMMulti === 'function') translateDOMMulti();
  else if(typeof translateDOM === 'function') translateDOM(document.body);
});
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.onb-eye');
  if(!btn) return;
  const inp = document.getElementById(btn.dataset.target);
  if(!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.setAttribute('aria-label', show ? 'إخفاء' : 'إظهار');
});
window.addEventListener('unhandledrejection', e => { try { console.error('Unhandled rejection:', e.reason && (e.reason.message||e.reason)); } catch(err){} });
