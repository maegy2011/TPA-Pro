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
