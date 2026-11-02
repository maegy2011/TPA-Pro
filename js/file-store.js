// file-store.js — تخزين ملفات القرص (File System Access API) — يعمل جنبًا إلى جنب مع localStorage.
// بلا سيرفر: كل مطالبة ملف حقيقي CLM-45.json + نسخة .bak + أرشفة يومية + بصمة إجماليات.
const FS_STORE = { dirHandle: null, status: 'disconnected', lastError: '', _restoreTried: false };
function fsSupported(){ return typeof window.showDirectoryPicker === 'function'; }
function _idbReq(req){
  return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
}
async function _fsIdb(){
  const db = await _idbReq(indexedDB.open('tpa_fs', 1));
  if(!db.objectStoreNames.contains('handles')){ db.close(); const d2 = await _idbReq(indexedDB.open('tpa_fs', 2)); }
  return db;
}
async function _fsSaveHandle(h){
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('tpa_fs', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('handles'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = db.transaction('handles', 'readwrite');
  await _idbReq(tx.objectStore('handles').put(h, 'root'));
  db.close();
}
async function _fsLoadHandle(){
  try {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('tpa_fs', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('handles'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    const tx = db.transaction('handles', 'readonly');
    const h = await _idbReq(tx.objectStore('handles').get('root'));
    db.close();
    return h || null;
  } catch(e){ return null; }
}
function claimFingerprint(claim){
  let billed = 0;
  (claim.invoices||[]).forEach(inv => (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => { billed += (Number(l.qty)||0)*(Number(l.billedUnit)||0); })));
  return { billed: Math.round(billed*100)/100, approved: Number(claim.approved)||0 };
}
async function fsConnect(){
  if(!fsSupported()){ if(typeof showWarning==='function') showWarning('غير مدعوم','متصفحك لا يدعم الوصول للملفات — استخدم Chrome أو Edge.'); return; }
  try {
    const h = await window.showDirectoryPicker({ mode: 'readwrite' });
    const perm = await h.requestPermission({ mode: 'readwrite' });
    if(perm !== 'granted') throw new Error('permission');
    FS_STORE.dirHandle = h; FS_STORE.status = 'connected'; FS_STORE.lastError = '';
    await _fsSaveHandle(h);
    try {
      const names = []; for await (const e of h.values()) names.push(e.name);
      if(!names.includes('مطالبات')) await h.getDirectoryHandle('مطالبات', { create: true });
      if(!names.includes('أرشيف')) await h.getDirectoryHandle('أرشيف', { create: true });
    } catch(e){}
    if(typeof showSuccess==='function') showSuccess('تم', 'تم ربط مجلد القرص — الحفظ يكتب ملفًا حقيقيًا مع نسخة .bak');
  } catch(e){
    if(e && e.name === 'AbortError') return;
    FS_STORE.lastError = 'تعذر الربط'; if(typeof showWarning==='function') showWarning('تعذر الربط','اختر مجلدًا صالحًا بصلاحية كتابة.');
  }
  if(typeof renderFileStore==='function') renderFileStore();
}
async function fsRestoreSilent(){
  if(FS_STORE._restoreTried || FS_STORE.dirHandle) return;
  FS_STORE._restoreTried = true;
  try {
    const h = await _fsLoadHandle(); if(!h) return;
    const q = await h.queryPermission({ mode: 'readwrite' });
    if(q === 'granted'){ FS_STORE.dirHandle = h; FS_STORE.status = 'connected'; }
    else FS_STORE.status = 'needs-regrant';
  } catch(e){}
  if(typeof renderFileStore==='function') renderFileStore();
}
async function _fsClaimsDir(create){
  if(!FS_STORE.dirHandle) throw new Error('no-dir');
  const p = await FS_STORE.dirHandle.requestPermission({ mode: 'readwrite' });
  if(p !== 'granted') throw new Error('permission');
  return FS_STORE.dirHandle.getDirectoryHandle('مطالبات', { create: !!create });
}
async function fsWriteClaim(claim){
  if(!FS_STORE.dirHandle || !claim || !claim.id) return false;
  const dir = await _fsClaimsDir(true);
  const name = claim.id + '.json';
  try {
    const old = await dir.getFileHandle(name);
    const f = await (await old.getFile()).text();
    const bak = await dir.getFileHandle(name + '.bak', { create: true });
    const w0 = await bak.createWritable(); await w0.write(f); await w0.close();
  } catch(e){}
  const env = { app: 'TPA-Pro', version: 1, savedAt: new Date().toISOString(), fingerprint: claimFingerprint(claim), claim };
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable(); await w.write(JSON.stringify(env)); await w.close();
  return true;
}
function fsVerifyEnvelope(env){
  if(!env || !env.claim) return { ok: false, msg: 'ملف غير صالح' };
  const fp = env.fingerprint || {};
  const real = claimFingerprint(env.claim);
  if(Math.abs((fp.billed||0) - real.billed) > 1) return { ok: true, warn: 'البصمة لا تطابق — الملف غُيّر خارجيًا. راجع الإجماليات قبل الاعتماد.' };
  return { ok: true };
}
async function fsImportFile(file){
  const txt = await file.text();
  const env = JSON.parse(txt);
  const v = fsVerifyEnvelope(env);
  if(!v.ok){ if(typeof showWarning==='function') showWarning('ملف مرفوض', v.msg); return; }
  const doApply = () => {
    const i = claims.findIndex(c => c.id === env.claim.id);
    if(i >= 0) claims[i] = env.claim; else claims.push(env.claim);
    if(typeof persistData==='function') persistData(true);
    if(typeof renderClaims==='function') renderClaims();
    if(typeof showSuccess==='function') showSuccess('تم', v.warn ? ('استُورد مع تنبيه: ' + v.warn) : 'استُوردت المطالبة مع بصمة سليمة');
  };
  if(v.warn){ if(typeof showWarning==='function') showWarning('تنبيه بصمة', v.warn + '<br><br>متابعة الاستيراد؟', doApply); else doApply(); }
  else doApply();
}
async function fsRescanFolder(){
  if(!FS_STORE.dirHandle){ if(typeof showWarning==='function') showWarning('لا مجلد','اربط مجلد القرص أولًا.'); return; }
  const dir = await _fsClaimsDir(false).catch(() => null);
  if(!dir){ if(typeof showWarning==='function') showWarning('لا مجلد','مجلد المطالبات غير موجود بعد.'); return; }
  let added = 0, skipped = 0;
  for await (const e of dir.values()){
    if(e.kind !== 'file' || !e.name.endsWith('.json') || e.name.endsWith('.bak')) continue;
    try {
      const env = JSON.parse(await (await e.getFile()).text());
      if(!env || !env.claim || !env.claim.id){ skipped++; continue; }
      if(typeof getClaimById==='function' && getClaimById(env.claim.id)){ skipped++; continue; }
      claims.push(env.claim); added++;
    } catch(err){ skipped++; }
  }
  if(added && typeof persistData==='function') persistData(true);
  if(typeof renderClaims==='function') renderClaims();
  if(typeof showSuccess==='function') showSuccess('فحص المجلد', `أُضيفت ${added} مطالبة — تُجوهل ${skipped} (موجودة أو تالفة)`);
}
async function fsArchiveDay(){
  if(!FS_STORE.dirHandle){ if(typeof showWarning==='function') showWarning('لا مجلد','اربط مجلد القرص أولًا.'); return; }
  const day = new Date().toISOString().slice(0,10);
  const arch = await FS_STORE.dirHandle.getDirectoryHandle('أرشيف', { create: true });
  const dest = await arch.getDirectoryHandle(day, { create: true });
  const src = await _fsClaimsDir(false).catch(() => null);
  if(!src){ if(typeof showWarning==='function') showWarning('لا مطالبات','لا يوجد مجلد مطالبات بعد.'); return; }
  let n = 0;
  for await (const e of src.values()){
    if(e.kind !== 'file' || !e.name.endsWith('.json') || e.name.endsWith('.bak')) continue;
    const txt = await (await e.getFile()).text();
    const fh = await dest.getFileHandle(e.name, { create: true });
    const w = await fh.createWritable(); await w.write(txt); await w.close(); n++;
  }
  if(typeof showSuccess==='function') showSuccess('أرشفة اليوم', `نُسخت ${n} مطالبة إلى أرشيف/${day}`);
}
/* ---------- واجهة الإعدادات ---------- */
function renderFileStore(){
  const box = document.getElementById('fileStoreBox'); if(!box) return;
  fsRestoreSilent();
  const st = !fsSupported() ? 'غير مدعوم في هذا المتصفح'
    : FS_STORE.status === 'connected' ? 'متصل — الحفظ يكتب ملفًا حقيقيًا'
    : FS_STORE.status === 'needs-regrant' ? 'يحتاج إعادة منح الإذن' : 'غير مربوط';
  box.innerHTML = `<div class="info-row"><div style="flex:1"><div class="k">حالة الربط: ${escapeHtml(st)}</div>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">مجلد يحوي: مطالبات/ + أرشيف/ — كل حفظ ينسخ .bak ويبصم الإجماليات.</div></div>
    <div style="display:flex;gap:4px;flex:0 0 auto;flex-wrap:wrap"><button class="btn-sm solid" id="fsConnectBtn">ربط مجلد</button>
    <button class="btn-sm ghost" id="fsRescanBtn">فحص المجلد</button>
    <button class="btn-sm ghost" id="fsArchiveBtn">أرشفة اليوم</button>
    <button class="btn-sm ghost" id="fsImportBtn">استيراد ملف</button>
    <input type="file" id="fsImportFile" accept=".json,application/json" style="display:none"></div></div>`;
  const cb = document.getElementById('fsConnectBtn'); if(cb) cb.addEventListener('click', fsConnect);
  const rs = document.getElementById('fsRescanBtn'); if(rs) rs.addEventListener('click', () => fsRescanFolder().catch(() => { if(typeof showWarning==='function') showWarning('تعذر الفحص','أعد منح الإذن للمجلد.'); }));
  const ab = document.getElementById('fsArchiveBtn'); if(ab) ab.addEventListener('click', () => fsArchiveDay().catch(() => { if(typeof showWarning==='function') showWarning('تعذرت الأرشفة','أعد منح الإذن للمجلد.'); }));
  const ib = document.getElementById('fsImportBtn'); const ih = document.getElementById('fsImportFile');
  if(ib && ih){ ib.addEventListener('click', () => ih.click()); ih.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) fsImportFile(f).catch(() => { if(typeof showWarning==='function') showWarning('تعذر الاستيراد','ملف غير صالح.'); }); e.target.value = ''; }); }
}
