function syncActiveSessionBeforeExport(){
  try { if(activeClaim && document.getElementById('reviewModal') && document.getElementById('reviewModal').classList.contains('open')) upsertCurrentSession(); } catch(e){}
}
function getSessionState(){
  return {
    currentPage,
    viewState: JSON.parse(JSON.stringify(viewState)),
    currentTimelineClaimId,
    filters: { currentFilter, currentSearch, dashSearchTerm, reportsSearchTerm, intakeMonthFilter, intakeStatusFilter, intakeSearch, providerStatusFilter, providerSearch, contractStatusFilter, contractSearch, tariffFilter, tariffSearch, drFilter, drSearch, trashFilter, trashSearch, srchTerm, srchTariffId, srchFilter, srchPage, srchPerPage, sessionsFilter, sessionsSearch },
    activeSessionId: activeSessionId || null,
    capturedAt: new Date().toISOString()
  };
}
function restoreSessionState(state){
  if(!state) return;
  try {
    const f = state.filters || {};
    if(f.currentFilter !== undefined) currentFilter = f.currentFilter;
    if(typeof f.currentSearch === 'string') currentSearch = f.currentSearch;
    if(typeof f.dashSearchTerm === 'string') dashSearchTerm = f.dashSearchTerm;
    if(typeof f.reportsSearchTerm === 'string') reportsSearchTerm = f.reportsSearchTerm;
    if(f.intakeMonthFilter !== undefined) intakeMonthFilter = f.intakeMonthFilter;
    if(f.intakeStatusFilter !== undefined) intakeStatusFilter = f.intakeStatusFilter;
    if(typeof f.intakeSearch === 'string') intakeSearch = f.intakeSearch;
    if(f.providerStatusFilter !== undefined) providerStatusFilter = f.providerStatusFilter;
    if(typeof f.providerSearch === 'string') providerSearch = f.providerSearch;
    if(f.contractStatusFilter !== undefined) contractStatusFilter = f.contractStatusFilter;
    if(typeof f.contractSearch === 'string') contractSearch = f.contractSearch;
    if(f.tariffFilter !== undefined) tariffFilter = f.tariffFilter;
    if(typeof f.tariffSearch === 'string') tariffSearch = f.tariffSearch;
    if(f.drFilter !== undefined) drFilter = f.drFilter;
    if(typeof f.drSearch === 'string') drSearch = f.drSearch;
    if(f.trashFilter !== undefined) trashFilter = f.trashFilter;
    if(typeof f.trashSearch === 'string') trashSearch = f.trashSearch;
    if(typeof f.srchTerm === 'string') srchTerm = f.srchTerm;
    if(f.srchTariffId !== undefined) srchTariffId = f.srchTariffId;
    if(f.srchFilter !== undefined) srchFilter = f.srchFilter;
    if(typeof f.srchPage === 'number') srchPage = f.srchPage;
    if(typeof f.srchPerPage === 'number') srchPerPage = f.srchPerPage;
    if(f.sessionsFilter !== undefined) sessionsFilter = f.sessionsFilter;
    if(typeof f.sessionsSearch === 'string') sessionsSearch = f.sessionsSearch;
    if(state.currentTimelineClaimId) currentTimelineClaimId = state.currentTimelineClaimId;
    if(state.viewState && state.viewState.type) viewState = JSON.parse(JSON.stringify(state.viewState));
    if(state.activeSessionId && workSessions.some(s => s.id === state.activeSessionId)) activeSessionId = state.activeSessionId;
    const syncChips = (sel, attr, val) => { const c = document.querySelector(sel); if(!c) return; c.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('active', ch.dataset[attr] === val)); };
    syncChips('#filterChips','filter',currentFilter); syncChips('#intakeStatusChips','istatus',intakeStatusFilter);
    syncChips('#providerFilterChips','pfilter',providerStatusFilter); syncChips('#contractFilterChips','cfilter',contractStatusFilter);
    syncChips('#tariffFilterChips','tfilter',tariffFilter); syncChips('#drFilterChips','drf',drFilter);
    syncChips('#trashFilterChips','trf',trashFilter); syncChips('#srchChips','srch',srchFilter);
    syncChips('#sessionsFilterChips','sfilter',sessionsFilter);
    const mc = document.querySelector('#monthChips'); if(mc) mc.querySelectorAll('.month-chip').forEach(ch => ch.classList.toggle('active', ch.dataset.month === intakeMonthFilter));
    const setVal = (sel, v) => { const el = document.querySelector(sel); if(el) el.value = v; };
    setVal('#searchInput',currentSearch||''); setVal('#dashSearch',dashSearchTerm||''); setVal('#reportsSearch',reportsSearchTerm||'');
    setVal('#intakeSearch',intakeSearch||''); setVal('#providerSearch',providerSearch||''); setVal('#contractSearch',contractSearch||'');
    setVal('#tariffSearch',tariffSearch||''); setVal('#drSearch',drSearch||''); setVal('#trashSearch',trashSearch||'');
    setVal('#srchQuery',srchTerm||''); setVal('#srchTariff',srchTariffId||'all'); setVal('#srchPerPage',String(srchPerPage));
    setVal('#sessionsSearch',sessionsSearch||'');
    if(state.currentPage === 'view' && viewState.type && viewState.id){ applyPage('view'); renderView(); }
    else if(state.currentPage === 'timeline' && currentTimelineClaimId){ applyPage('timeline'); renderTimeline(); }
    else if(state.currentPage) applyPage(state.currentPage);
    if(typeof renderAll === 'function') renderAll();
    renderSessions(); updateSessionsBadge();
  } catch(e){ console.warn('restoreSessionState', e); }
}
function getBackupData(){
  syncActiveSessionBeforeExport();
  return {
    app:'TPA Pro', version:'1.0', type:'full-backup', exportedAt:new Date().toISOString(),
    settings: { reviewer:{...appSettings.reviewer}, company:{...appSettings.company} },
    sessionsMeta: { totalCount:workSessions.length, activeCount:workSessions.filter(s=>s.status==='active').length, pausedCount:workSessions.filter(s=>s.status==='paused').length, activeSessionId:activeSessionId||null, sessionsFilter, sessionsSearch },
    data: { providers:providers.map(p=>({...p})), contracts:contracts.map(c=>({...c})), tariffs:JSON.parse(JSON.stringify(tariffs)), batches:batches.map(b=>({...b})), claims:JSON.parse(JSON.stringify(claims)), trash:JSON.parse(JSON.stringify(trash)), deductionRules:JSON.parse(JSON.stringify(deductionRules)), paProcedures:paProcedures.map(p=>({...p})), workSessions:JSON.parse(JSON.stringify(workSessions)) },
    session: getSessionState()
  };
}
function getSettingsData(){
  return { app:'TPA Pro', version:'1.0', type:'settings', exportedAt:new Date().toISOString(), settings:{ reviewer:{...appSettings.reviewer}, company:{...appSettings.company}, deductionRules:JSON.parse(JSON.stringify(deductionRules)), paProcedures:paProcedures.map(p=>({...p})) } };
}
function getSessionsData(){
  syncActiveSessionBeforeExport();
  return { app:'TPA Pro', version:'1.0', type:'sessions', exportedAt:new Date().toISOString(), sessionsMeta:{ totalCount:workSessions.length, activeCount:workSessions.filter(s=>s.status==='active').length, pausedCount:workSessions.filter(s=>s.status==='paused').length, activeSessionId:activeSessionId||null }, sessions:JSON.parse(JSON.stringify(workSessions)) };
}
function exportSessions(){
  try {
    const now = new Date(), date = now.toISOString().slice(0,10), time = now.toTimeString().slice(0,5).replace(':','');
    downloadJSON(getSessionsData(), `TPA_Pro_Sessions_${date}_${time}.json`);
    trackBackup();
    showSuccess('تم', `${workSessions.length} جلسة`);
  } catch(err){ showWarning('خطأ', err.message); }
}
function doExportBackup(silent){
  syncActiveSessionBeforeExport();
  try {
    const now = new Date(), date = now.toISOString().slice(0,10), time = now.toTimeString().slice(0,5).replace(':','');
    downloadJSON(getBackupData(), `TPA_Pro_Backup_${date}_${time}.json`);
    trackBackup();
    if(!silent) showSuccess('تم', `${workSessions.length} جلسة`);
    return true;
  } catch(err){ if(!silent) showWarning('خطأ', err.message); return false; }
}
function exportBackup(){ return doExportBackup(false); }
function exportSettings(){
  try { const d = new Date().toISOString().slice(0,10); downloadJSON(getSettingsData(), `TPA_Pro_Settings_${d}.json`); trackBackup(); showSuccess('تم','تم'); }
  catch(err){ showWarning('خطأ', err.message); }
}
function importBackupFile(file){
  if(!file) return;
  if(file.size > 20 * 1024 * 1024){ showWarning('كبير','الحد 20MB'); return; }
  const r = new FileReader();
  r.onload = e => {
    try {
      const p = JSON.parse(e.target.result);
      if(!p || typeof p !== 'object'){ showWarning('غير صالح','ليس JSON'); return; }
      if(p.app !== 'TPA Pro'){ showWarning('غير صالح','ليس من TPA Pro'); return; }
      if(p.type === 'sessions') confirmSessionsImport(p);
      else if(p.type === 'settings') confirmSettingsImport(p);
      else if(p.type === 'full-backup' || p.data) confirmFullImport(p);
      else showWarning('غير معروف','—');
    } catch(err){ showWarning('خطأ', err.message); }
  };
  r.onerror = () => showWarning('خطأ','تعذر');
  r.readAsText(file);
}
