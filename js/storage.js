let _persistTimer = null;
function persistData(immediate){
  if(_persistTimer) clearTimeout(_persistTimer);
  const doIt = () => {
    try {
      const payload = { version: DATA_VERSION, savedAt: new Date().toISOString(),
        data: { providers, contracts, tariffs, batches, claims, trash, deductionRules, paProcedures } };
      localStorage.setItem(DATA_STORE_KEY, JSON.stringify(payload));
    } catch(e){ console.error('persistData failed', e); }
  };
  if(immediate) doIt();
  else _persistTimer = setTimeout(doIt, 250);
}
function loadPersistedData(){
  try {
    const raw = localStorage.getItem(DATA_STORE_KEY);
    if(!raw) return false;
    const p = JSON.parse(raw);
    if(!p || !p.data) return false;
    const d = p.data;
    if(Array.isArray(d.providers)) providers = d.providers;
    if(Array.isArray(d.contracts)) contracts = d.contracts;
    if(Array.isArray(d.tariffs)) tariffs = d.tariffs;
    if(Array.isArray(d.batches)) batches = d.batches;
    if(Array.isArray(d.claims)) claims = d.claims;
    if(Array.isArray(d.trash)) trash = d.trash;
    if(Array.isArray(d.deductionRules)) deductionRules = d.deductionRules;
    if(Array.isArray(d.paProcedures)) paProcedures = d.paProcedures;
    claims.forEach(c => {
      if(!c.invoices) c.invoices = [];
      if(!c.priorApproval) c.priorApproval = {required:false,status:'not-requested',refNumber:'',date:''};
    });
    return true;
  } catch(e){ console.error('loadPersistedData failed', e); return false; }
}
function trackBackup(){ try { localStorage.setItem(LAST_BACKUP_KEY, String(Date.now())); } catch(e){} }
function getLastBackupAgo(){
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if(!raw) return null;
    const ms = Date.now() - parseInt(raw, 10);
    if(ms < 60000) return 'الآن';
    if(ms < 3600000) return `قبل ${Math.floor(ms/60000)} دقيقة`;
    if(ms < 86400000) return `قبل ${Math.floor(ms/3600000)} ساعة`;
    return `قبل ${Math.floor(ms/86400000)} يوم`;
  } catch(e){ return null; }
}
function hasRecentBackup(maxAgeMs){
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if(!raw) return false;
    return (Date.now() - parseInt(raw, 10)) < (maxAgeMs || 86400000);
  } catch(e){ return false; }
}
function downloadJSON(obj, filename){
  const blob = new Blob(['\ufeff', JSON.stringify(obj, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
loadPersistedData();
