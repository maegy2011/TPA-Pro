function bindSessionsControls(){
  const s = document.getElementById('sessionsSearch');
  const c = document.getElementById('sessionsFilterChips');
  const n = document.getElementById('newSessionBtn');
  const l = document.getElementById('sessionsList');
  const sw = document.getElementById('rvSessionSwitcher');
  if(s){ let t; s.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { sessionsSearch = e.target.value.trim(); renderSessions(); }, 180); }); }
  if(c){ c.addEventListener('click', e => { const chip = e.target.closest('.chip'); if(!chip) return; $$('#sessionsFilterChips .chip').forEach(x=>x.classList.remove('active')); chip.classList.add('active'); sessionsFilter = chip.dataset.sfilter; renderSessions(); }); }
  if(n){ n.addEventListener('click', () => { navHistory = []; navigateTo('claims', {noPush:true}); showToast('اختر مطالبة واضغط «مراجعة»'); }); }
  if(l){
    l.addEventListener('click', e => {
      const r = e.target.closest('[data-resume-session]');
      if(r){ const ss = workSessions.find(x => x.id === r.dataset.resumeSession); if(ss){ const info = getSessionClaimInfo(ss); if(info.stale){ deleteSessionWithDialog(ss.id); return; } if(activeSessionId && activeSessionId !== ss.id){ upsertCurrentSession(); activeClaim = null; workingInvoices = []; } resumeSession(ss.id); } return; }
      const d = e.target.closest('[data-delete-session]'); if(d) deleteSessionWithDialog(d.dataset.deleteSession);
    });
  }
  if(sw){ sw.addEventListener('change', e => { const sid = e.target.value; if(!sid) return; upsertCurrentSession(); activeClaim = null; workingInvoices = []; $('#reviewModal').classList.remove('open'); _unlockBodyScroll(); rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0; activeSessionId = null; resumeSession(sid); }); }
}
function deleteSessionWithDialog(id){
  const s = workSessions.find(x => x.id === id); if(!s) return;
  const info = getSessionClaimInfo(s);
  showDelete('حذف الجلسة', `"${s.claimId} — ${info.patient}".`, () => {
    workSessions = workSessions.filter(x => x.id !== id);
    if(activeSessionId === id){ activeSessionId = null; $('#reviewModal').classList.remove('open'); _unlockBodyScroll(); activeClaim = null; workingInvoices = []; }
    persistSessions(); updateSessionsBadge(); renderSessions(); showSuccess('تم','تم');
  });
}
// loadSessions() is called from initApp()
