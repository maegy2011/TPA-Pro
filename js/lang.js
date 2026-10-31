function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if(val && val !== key){ el.textContent = val; }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if(val && val !== key){ el.setAttribute('placeholder', val); }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key);
    if(val && val !== key){ el.innerHTML = val; }
  });
}
function applyNavTranslations(){
  const map = {
    dashboard:'nav.dashboard', claims:'nav.claims', intake:'nav.intake',
    sessions:'nav.sessions', providers:'nav.providers', contracts:'nav.contracts',
    tariffs:'nav.tariffs', search:'nav.search', 'deduction-rules':'nav.deduction',
    reports:'nav.reports', trash:'nav.trash', settings:'nav.settings', help:'nav.help'
  };
  document.querySelectorAll('.nav-item').forEach(btn => {
    const page = btn.dataset.page;
    const key = map[page];
    if(!key) return;
    const label = btn.querySelector('.nav-label');
    const sub = btn.querySelector('.nav-sub');
    if(label) label.textContent = t(key);
    if(sub) sub.textContent = t(key+'.sub');
  });
  document.querySelectorAll('.nav-section-title').forEach((el,i) => {
    const keys = ['nav.main','nav.basic','nav.tools','nav.system'];
    if(keys[i]) el.textContent = t(keys[i]);
  });
}
function applyTopbarTranslations(){
  const sb = document.getElementById('smartBackBtn'); if(sb) sb.title = t('topbar.back');
  const ts = document.getElementById('tbSearchBtn'); if(ts) ts.title = t('topbar.search');
  const tb = document.getElementById('tbBackupBtn'); if(tb) tb.title = t('topbar.backup');
  const tu = document.getElementById('tbUserBtn'); if(tu) tu.title = t('topbar.settings');
  const pill = document.querySelector('.pill'); if(pill) pill.textContent = t('topbar.connected');
}
function applyPageTitleTranslations(){
  if(!currentPage) return;
  const el = document.getElementById('pageTitle');
  const sub = document.getElementById('pageDesc');
  const k = 'page.'+currentPage;
  const kt = t(k);
  if(el && kt && kt !== k) el.textContent = kt;
  const ks = t(k+'.sub');
  if(sub && ks && ks !== k+'.sub') sub.textContent = ks;
}
function applyAllTranslations(){
  applyNavTranslations();
  applyTopbarTranslations();
  applyPageTitleTranslations();
  applyTranslations();
}
// override setLang to also update nav/topbar/page
const _origSetLang = setLang;
setLang = function(lang){
  _origSetLang(lang);
  applyAllTranslations();
  if(lang === 'ar'){ if(typeof restoreDOM === 'function') restoreDOM(document.body); if(typeof renderAll === 'function') renderAll(); }
  else { if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body); }
  // update splash/loading/lock text (best effort)
  const spSub = document.querySelector('.sp-sub'); if(spSub) spSub.textContent = t('splash.sub');
  const spBadge = document.querySelector('.sp-badge'); if(spBadge) spBadge.textContent = 'v1.0';
  const ldHead = document.querySelector('.ld-head h2'); if(ldHead) ldHead.textContent = t('splash.title');
  const ldP = document.querySelector('.ld-head p'); if(ldP) ldP.textContent = t('loading');
  const lockH = document.querySelector('#lock h1'); if(lockH) lockH.textContent = t('auth.title');
  const lockHint = document.querySelector('#lock .hint'); if(lockHint) lockHint.textContent = t('auth.password');
  const lockBtn = document.querySelector('#lock .btn-primary'); if(lockBtn) lockBtn.lastChild && (lockBtn.lastChild.textContent = ' '+t('auth.login'));
};
