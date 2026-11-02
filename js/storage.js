let _persistTimer = null;
// Storage state is deliberately fail-closed: malformed persisted data must not
// be silently replaced by demo/default state during the next autosave.
let _dataStorageState = 'uninitialized'; // uninitialized | empty | loaded | corrupt | unsupported
let _allowCorruptStorageReplace = false;
let _dataStorageError = null;
const PERSISTED_ARRAY_KEYS = ['providers','contracts','tariffs','batches','claims','trash','deductionRules','paProcedures'];
function isPersistedRecordArray(value){
  return Array.isArray(value) && value.every(item => item && typeof item === 'object' && !Array.isArray(item));
}
function persistData(immediate){
  if(_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
  const doIt = () => {
    if((_dataStorageState === 'corrupt' || _dataStorageState === 'unsupported') && !_allowCorruptStorageReplace){
      console.error('persistData blocked: stored data requires recovery', _dataStorageError || _dataStorageState);
      return false;
    }
    try {
      const payload = { version: DATA_VERSION, savedAt: new Date().toISOString(),
        data: { providers, contracts, tariffs, batches, claims, trash, deductionRules, paProcedures } };
      localStorage.setItem(DATA_STORE_KEY, JSON.stringify(payload));
      _dataStorageState = 'loaded'; _dataStorageError = null;
      return true;
    } catch(e){ console.error('persistData failed', e); return false; }
  };
  if(immediate) return doIt();
  _persistTimer = setTimeout(() => { _persistTimer = null; doIt(); }, 250);
  return true;
}
function loadPersistedData(){
  let raw;
  try { raw = localStorage.getItem(DATA_STORE_KEY); }
  catch(e){ _dataStorageState = 'corrupt'; _dataStorageError = 'تعذر قراءة التخزين المحلي'; console.error('loadPersistedData read failed', e); return false; }
  if(raw === null){ _dataStorageState = 'empty'; return false; }
  try {
    const p = JSON.parse(raw);
    if(!p || typeof p !== 'object' || !p.data || typeof p.data !== 'object' || Array.isArray(p.data)) throw new Error('بنية ملف البيانات غير صالحة');
    if(Number.isFinite(p.version) && p.version > DATA_VERSION){ _dataStorageState = 'unsupported'; _dataStorageError = `إصدار بيانات أحدث (${p.version})`; return false; }
    const d = p.data;
    // Validate the complete envelope before assigning anything to live state.
    for(const key of PERSISTED_ARRAY_KEYS){
      if(d[key] !== undefined && !isPersistedRecordArray(d[key])) throw new Error(`حقل ${key} ليس قائمة سجلات صالحة`);
    }
    const next = {};
    PERSISTED_ARRAY_KEYS.forEach(key => { next[key] = d[key] === undefined ? null : d[key]; });
    if(next.claims) next.claims.forEach(c => {
      if(!c.invoices) c.invoices = [];
      if(!Array.isArray(c.invoices)) throw new Error('قائمة فواتير مطالبة غير صالحة');
      if(!c.priorApproval) c.priorApproval = {required:false,status:'not-requested',refNumber:'',date:''};
      if(typeof c.priorApproval !== 'object' || Array.isArray(c.priorApproval)) throw new Error('بيانات الموافقة المسبقة غير صالحة');
    });
    // Commit only after every recognized collection has passed validation.
    if(next.providers !== null) providers = next.providers;
    if(next.contracts !== null) contracts = next.contracts;
    if(next.tariffs !== null) tariffs = next.tariffs;
    if(next.batches !== null) batches = next.batches;
    if(next.claims !== null) claims = next.claims;
    if(next.trash !== null) trash = next.trash;
    if(next.deductionRules !== null) deductionRules = next.deductionRules;
    if(next.paProcedures !== null) paProcedures = next.paProcedures;
    _dataStorageState = 'loaded'; _dataStorageError = null;
    return true;
  } catch(e){
    _dataStorageState = 'corrupt'; _dataStorageError = e && e.message ? e.message : 'بيانات تالفة';
    console.error('loadPersistedData rejected stored data; original value preserved', e);
    return false;
  }
}
function getDataStorageHealth(){ return { state:_dataStorageState, error:_dataStorageError }; }
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

// Read-only relationship diagnostics. Legacy/stale sessions are reported, not deleted.
function inspectDataRelationships(data, sessions){
  const source = data || {};
  const issues = [];
  const checkUnique = (rows, label) => {
    if(!Array.isArray(rows)) return;
    const seen = new Set();
    rows.forEach((row, index) => {
      if(!row || typeof row !== 'object') return;
      const id = row.id;
      if(id === undefined || id === null || String(id).trim() === ''){
        issues.push({severity:'warning', code:'missing-id', collection:label, index});
      } else if(seen.has(String(id))){
        issues.push({severity:'error', code:'duplicate-id', collection:label, id:String(id), index});
      } else seen.add(String(id));
    });
  };
  ['providers','contracts','tariffs','batches','claims','deductionRules','paProcedures'].forEach(k => checkUnique(source[k], k));
  const claimRows = Array.isArray(source.claims) ? source.claims : [];
  const claimIds = new Set(claimRows.filter(c=>c && c.id != null).map(c=>String(c.id)));
  const sessionRows = Array.isArray(sessions) ? sessions : (Array.isArray(source.workSessions) ? source.workSessions : []);
  checkUnique(sessionRows, 'workSessions');
  sessionRows.forEach((s, index) => {
    if(!s || typeof s !== 'object') return;
    if(s.claimId === undefined || s.claimId === null || String(s.claimId).trim() === ''){
      issues.push({severity:'error', code:'session-missing-claim-id', collection:'workSessions', index});
      return;
    }
    const claimKey = String(s.claimId);
    if(s.claimSnapshot && s.claimSnapshot.id != null && String(s.claimSnapshot.id) !== claimKey){
      issues.push({severity:'error', code:'session-snapshot-id-mismatch', collection:'workSessions', index, claimId:claimKey, snapshotId:String(s.claimSnapshot.id)});
    } else if(!claimIds.has(claimKey)){
      const recoverable=!!(s.claimSnapshot && String(s.claimSnapshot.id)===claimKey);
      issues.push({severity:'warning', code:'orphan-session', collection:'workSessions', index, claimId:claimKey, recoverableFromSnapshot:recoverable});
    }
  });
  return {ok:!issues.some(x=>x.severity==='error'), issues, counts:{claims:claimRows.length,sessions:sessionRows.length}};
}
