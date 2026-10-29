let activeClaim = null;
let workingInvoices = [];
let _sessionDirty = false;
function markSessionDirty(){ _sessionDirty = true; }
function clearSessionDirty(){ _sessionDirty = false; }
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
