// review-state.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let activeClaim = null;
let workingInvoices = [];
let _sessionDirty = false;
let _reviewAutoSaveTimer = null;
function markSessionDirty(){
  _sessionDirty = true;
  try { const b = document.getElementById('rvPageDirtyBadge'); if(b) b.style.display = ''; } catch(e){}
  try { if(typeof RC !== 'undefined') RC.claimId = (typeof activeClaim !== 'undefined' && activeClaim?.id) || null; } catch(e){}
  // Snapshot the working copy, not the live claim, so interrupted reviews can be resumed safely.
  if(_reviewAutoSaveTimer) clearTimeout(_reviewAutoSaveTimer);
  _reviewAutoSaveTimer = setTimeout(()=>{
    _reviewAutoSaveTimer = null;
    try { if(activeClaim && typeof upsertCurrentSession==='function'){ upsertCurrentSession(); } }
    catch(e){ console.error('Review autosave failed',e); }
  },500);
}
function clearSessionDirty(){ _sessionDirty = false; if(_reviewAutoSaveTimer){clearTimeout(_reviewAutoSaveTimer);_reviewAutoSaveTimer=null;} try { const b = document.getElementById('rvPageDirtyBadge'); if(b) b.style.display = 'none'; } catch(e){} }
let rvActiveInvoiceIdx = 0;
let rvActivePatientIdx = 0;
let rvEditInvoiceIdx = -1;
let rvEditPatientInvoiceIdx = -1;
let rvEditPatientIdx = -1;
let rvEditLineIdx = -1;
let lnApplicableTariffs = [];
let lnSelectedTariffId = null;
let lnDebounceTimer = null;
function newInvoiceId(){
  let m = 0;
  workingInvoices.forEach(inv => { const n = parseInt(String(inv.id).split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); });
  return activeClaim ? (activeClaim.id+'-'+(m+1)) : ('INV-'+Date.now());
}
function newPatientId(inv){
  let m = 0;
  (inv.patients||[]).forEach(p => { const n = parseInt(String(p.id).split('-P').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); });
  return inv.id+'-P'+(m+1);
}
function _hasUnsavedChanges(){ return _sessionDirty === true; }
if(typeof window !== 'undefined' && !window._tpaUnloadGuard){
  window._tpaUnloadGuard = true;
  window.addEventListener('beforeunload', (e) => {
    try { if(typeof _hasUnsavedChanges === 'function' && _hasUnsavedChanges()){ e.preventDefault(); e.returnValue = ''; } } catch(err){}
  });
}
