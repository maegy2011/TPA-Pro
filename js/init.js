// init.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const LOAD_STEPS = ['تهيئة محرك المراجعة...','تحميل المطالبات...','تحميل اللوائح...','تجهيز التصدير...'];
const BOOT_SPLASH_MS = 2400, LOADING_TICK_MS = 170, LOADING_DONE_DELAY_MS = 480;
/* مؤشر خطوة التحميل من النسبة 0-100 — منطق خالص (يُختبر آليًا). */
function loadingStepIndex(p){
  p = Number(p);
  if(!Number.isFinite(p)) p = 0;
  if(p < 0) p = 0;
  if(p > 100) p = 100;
  return Math.min(3, Math.floor(p/25));
}
let loadingDone = false;
function startLoading(){
  let p = 0;
  const fill = $('#ldFill'), pctEl = $('#ldPct'), statEl = $('#ldStatus'), steps = $$('#ldSteps .ld-step');
  const tick = setInterval(() => {
    p += Math.random()*11+5;
    if(p >= 100) p = 100;
    fill.style.width = p+'%'; pctEl.textContent = Math.floor(p)+'%';
    const idx = (typeof loadingStepIndex === 'function') ? loadingStepIndex(p) : 0;
    statEl.textContent = LOAD_STEPS[idx];
    steps.forEach((s,i) => { s.classList.remove('now','done'); if(i < idx) s.classList.add('done'); else if(i === idx && p < 100) s.classList.add('now'); else if(i === idx && p >= 100) s.classList.add('done'); });
    if(p >= 100 && !loadingDone){ loadingDone = true; clearInterval(tick); steps.forEach(s => { s.classList.remove('now'); s.classList.add('done'); }); statEl.textContent = 'اكتمل التحميل'; setTimeout(afterLoading, LOADING_DONE_DELAY_MS); }
  }, LOADING_TICK_MS);
}
/* قرار شاشة الإقلاع — منطق خالص (يُختبر آليًا): onboarding | app | lock */
function decideBootScreen(){
  let done = '0';
  try { done = localStorage.getItem(ONBOARDING_KEY); } catch(e){ return 'onboarding'; }
  if(done !== '1') return 'onboarding';
  try { localStorage.removeItem(AUTH_KEY); } catch(e){}
  try { if(sessionStorage.getItem(AUTH_KEY) === '1') return 'app'; } catch(e){}
  return 'lock';
}
function afterLoading(){
  applyAppSettingsToUI();
  if(decideBootScreen() === 'onboarding'){
    go('onboarding');
    setTimeout(() => { try { if(typeof bindOnboarding === 'function') bindOnboarding(); } catch(e){} const el = document.getElementById('onbReviewerName'); if(el) el.focus(); if(typeof translateDOMMulti === 'function') translateDOMMulti(); }, 350);
    return;
  }
  // Remove legacy persistent auth tokens; authentication is scoped to this tab session.
  const _screen = decideBootScreen();
  if(_screen === 'app'){ go('app'); initApp(); setTimeout(() => { if(typeof translateDOM === 'function') translateDOM(document.body); }, 100); }
  else { go('lock'); setTimeout(()=>$('#pwd').focus(), 350); }
}
/* رسالة خطأ القفل حسب المتبقي — منطق خالص (يُختبر آليًا). */
function buildLockErrorMessage(remainingMs){
  const r = Number(remainingMs) || 0;
  if(r > 0) return `كلمة المرور غير صحيحة. تم إيقاف المحاولات مؤقتًا ${Math.ceil(r/1000)} ثانية.`;
  return 'كلمة المرور غير صحيحة';
}
/* إتمام الدخول: جلسة التبويب فقط + انتقال — (يُختبر آليًا). */
function completeLogin(){
  try { sessionStorage.setItem(AUTH_KEY,'1'); } catch(e){}
  try { const p = document.getElementById('pwd'); if(p) p.value = ''; } catch(e){}
  if(typeof go === 'function') go('app');
  if(typeof initApp === 'function') initApp();
}
/* الخروج: مسح الرمز من المخزنين + انتقال للقفل — (يُختبر آليًا). */
function performLogout(){
  try { sessionStorage.removeItem(AUTH_KEY); } catch(e){}
  try { localStorage.removeItem(AUTH_KEY); } catch(e){}
  if(typeof go === 'function') go('lock');
}
$('#eyeBtn').addEventListener('click', () => { const i = $('#pwd'); i.type = i.type === 'password' ? 'text' : 'password'; });
let _loginInProgress = false;
$('#lockForm').addEventListener('submit', async e => {
  e.preventDefault();
  if(_loginInProgress) return;
  const v = $('#pwd').value.trim(), err = $('#lockErr'), card = $('#lockCard');
  const wait = getAuthenticationLockoutMs();
  if(wait > 0){ err.textContent = `محاولات كثيرة. حاول بعد ${Math.ceil(wait/1000)} ثانية.`; err.classList.add('show'); return; }
  _loginInProgress = true;
  const submit = $('#lockForm').querySelector('[type="submit"]');
  if(submit) submit.disabled = true;
  try {
    const ok = await verifyPassword(v);
    if(ok){
      resetAuthenticationFailures(); err.classList.remove('show'); completeLogin();
    } else {
      const remaining = recordAuthenticationFailure();
      err.textContent = buildLockErrorMessage(remaining);
      err.classList.add('show'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); $('#pwd').select();
    }
  } finally { _loginInProgress = false; if(submit) submit.disabled = false; }
});
$('#pwd').addEventListener('input', () => $('#lockErr').classList.remove('show'));
setTimeout(() => { if(typeof applyAllTranslations === 'function') applyAllTranslations(); if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body); go('loading'); startLoading(); }, BOOT_SPLASH_MS);
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('#tbBackupBtn');
  if(!btn) return;
  e.preventDefault();
  if(typeof doExportBackup === 'function') doExportBackup(false);
});
// Focus management for modals (accessibility)
(function(){
  let lastFocus = null;
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(node => {
        if(node && node.classList && node.classList.contains && node.classList.contains('modal') && node.classList.contains('open')){
          lastFocus = document.activeElement;
          const first = node.querySelector('input, select, textarea, button');
          if(first) setTimeout(() => first.focus(), 50);
        }
      });
      if(m.type === 'attributes' && m.attributeName === 'class' && m.target && m.target.classList){
        if(m.target.classList.contains('open') && (m.target.classList.contains('modal') || m.target.classList.contains('dialog-overlay'))){
          if(!m.target._focused){ m.target._focused = true; lastFocus = document.activeElement; const first = m.target.querySelector('input, select, textarea, button'); if(first) setTimeout(() => first.focus(), 50); }
        } else if(m.target._focused && !m.target.classList.contains('open')){
          m.target._focused = false;
          if(lastFocus && typeof lastFocus.focus === 'function') setTimeout(() => lastFocus.focus(), 50);
        }
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();
// Topbar scrolled state
(function(){
  const main = document.querySelector('.main') || window;
  const handler = () => {
    const topbar = document.querySelector('.topbar');
    if(!topbar) return;
    const y = (main === window) ? window.scrollY : main.scrollTop;
    topbar.classList.toggle('scrolled', y > 8);
  };
  (main === window ? window : main).addEventListener('scroll', handler, {passive:true});
})();
// Collapsible review sections
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('.rv-section-title');
  if(!t) return;
  t.classList.toggle('collapsed');
});
// Theme toggle (light/dark)
(function(){
  try {
    const saved = localStorage.getItem('tpa_theme');
    if(saved === 'dark') document.documentElement.setAttribute('data-theme','dark');
  } catch(e){}
})();
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('#tbThemeBtn');
  if(!btn) return;
  e.preventDefault();
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  if(dark){ html.removeAttribute('data-theme'); try { localStorage.setItem('tpa_theme','light'); } catch(e){} }
  else { html.setAttribute('data-theme','dark'); try { localStorage.setItem('tpa_theme','dark'); } catch(e){} }
});
document.addEventListener('click', e => {
  if(e.target.closest && e.target.closest('#smartBackBtn')){ if(typeof goBack === 'function') goBack(); }
});
document.addEventListener('touchstart', e => {
  if(e.target.closest && e.target.closest('#smartBackBtn')){ if(typeof goBack === 'function') { e.preventDefault(); goBack(); } }
}, {passive:false});
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('#tbTrashBtn');
  if(!btn) return;
  if(currentPage && currentPage !== 'trash') navHistory.push({ page: currentPage, viewType: viewState.type, viewId: viewState.id });
  if(typeof navigateTo === 'function') navigateTo('trash', {noPush:true});
});
function toggleUserMenu(e){
  const btn = e.target && e.target.closest && e.target.closest('#tbUserBtn');
  if(!btn) return;
  if(e) { e.preventDefault(); e.stopPropagation(); }
  const m = document.getElementById('tbUserMenu');
  if(m) m.style.display = m.style.display === 'none' ? 'flex' : 'none';
}
document.addEventListener('click', toggleUserMenu);
document.addEventListener('touchstart', toggleUserMenu, {passive:false});
document.addEventListener('click', e => {
  const m = document.getElementById('tbUserMenu');
  if(m && !e.target.closest('#tbUserWrap')) m.style.display = 'none';
});
document.addEventListener('click', e => {
  const item = e.target.closest && e.target.closest('.tb-menu-item');
  if(!item) return;
  const action = item.dataset.action;
  const m = document.getElementById('tbUserMenu'); if(m) m.style.display = 'none';
  if(action === 'help' && typeof navigateTo === 'function'){ if(currentPage && currentPage !== 'help') navHistory.push({ page: currentPage, viewType: viewState.type, viewId: viewState.id }); navigateTo('help', {noPush:true}); }
  if(action === 'settings' && typeof navigateTo === 'function'){ if(currentPage && currentPage !== 'settings') navHistory.push({ page: currentPage, viewType: viewState.type, viewId: viewState.id }); navigateTo('settings', {noPush:true}); }
  if(action === 'lang' && typeof setLang === 'function'){ setLang(currentLang === 'ar' ? 'en' : 'ar'); item.textContent = currentLang === 'ar' ? 'اللغة: EN' : 'Language: AR'; if(typeof translateDOMMulti === 'function') translateDOMMulti(); }
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
