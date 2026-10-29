function openSidebar(){
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebarOverlay');
  if(sb) sb.classList.add('open');
  if(ov) ov.classList.add('show');
  document.body.classList.add('sidebar-open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar(){
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebarOverlay');
  if(sb) sb.classList.remove('open');
  if(ov) ov.classList.remove('show');
  document.body.classList.remove('sidebar-open');
  _unlockBodyScroll();
}
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; updateInstallBtn(); });
function updateInstallBtn(){ const b = document.getElementById('installAppBtn'); if(b) b.style.display = deferredInstallPrompt ? 'inline-flex' : 'none'; }
function installApp(){ if(!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; updateInstallBtn(); }); }
window.installApp = installApp;
function bindMobile(){
  const hb = document.getElementById('hamburgerBtn');
  const ov = document.getElementById('sidebarOverlay');
  if(hb) hb.addEventListener('click', openSidebar);
  if(ov) ov.addEventListener('click', closeSidebar);
  $$('.nav-item').forEach(b => b.addEventListener('click', () => {
    if(window.innerWidth <= 900) closeSidebar();
  }));
  window.addEventListener('resize', () => { if(window.innerWidth > 900) closeSidebar(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeSidebar(); });
}
