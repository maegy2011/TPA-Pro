// shortcuts.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
/* الاختصارات ثلاثية الأزرار (معدّلان + زر) لتفادي التعارض مع المتصفح والنظام، وقابلة للتخصيص من الإعدادات. */
const DEFAULT_SHORTCUTS = [
  { id:'save-review',     label:'حفظ المراجعة',   ctrl:true,  shift:true,  alt:false, key:'S' },
  { id:'finalize-review', label:'إنهاء واعتماد',   ctrl:true,  shift:true,  alt:false, key:'Enter' },
  { id:'quick-search',    label:'بحث سريع',       ctrl:true,  shift:true,  alt:false, key:'F' },
  { id:'new-batch',       label:'دفعة وارد جديدة', ctrl:false, shift:true,  alt:true,  key:'N' },
  { id:'focus-search',    label:'تركيز البحث',     ctrl:true,  shift:true,  alt:false, key:'/', code:'Slash' },
];
// تركيبات محجوزة للمتصفح لا يمكن اعتراضها — تُرفض عند التخصيص.
const RESERVED_COMBOS = ['Ctrl+Shift+N', 'Ctrl+Shift+T', 'Ctrl+Shift+W'];
function getShortcut(id){
  const d = DEFAULT_SHORTCUTS.find(s => s.id === id) || {};
  const o = (typeof appSettings !== 'undefined' && appSettings.shortcuts && appSettings.shortcuts[id]) || {};
  return { ...d, ...o };
}
function shortcutLabel(sc){
  const p = [];
  if(sc.ctrl) p.push('Ctrl'); if(sc.alt) p.push('Alt'); if(sc.shift) p.push('Shift');
  p.push(sc.key === ' ' ? 'Space' : sc.key);
  return p.join('+');
}
function eventCombo(e){
  let k = e.key;
  if(k === ' ') k = 'Space'; else if(k.length === 1) k = k.toUpperCase();
  return { ctrl: !!(e.ctrlKey || e.metaKey), shift: !!e.shiftKey, alt: !!e.altKey, key: k, code: e.code || '' };
}
function matchShortcut(e, id){
  const sc = getShortcut(id), ev = eventCombo(e);
  if(ev.ctrl !== !!sc.ctrl || ev.shift !== !!sc.shift || ev.alt !== !!sc.alt) return false;
  if(sc.code) return ev.code === sc.code;
  return ev.key === sc.key;
}
let _recShortcutId = null;
function bindShortcuts(){
  // التقاط وضع التسجيل (تخصيص من الإعدادات) — قبل أي معالج آخر.
  document.addEventListener('keydown', e => {
    if(!_recShortcutId) return;
    e.preventDefault(); e.stopPropagation();
    if(e.key === 'Escape'){ _recShortcutId = null; if(typeof renderShortcutSettings === 'function') renderShortcutSettings(); return; }
    const k = e.key;
    if(['Control','Shift','Alt','Meta'].includes(k)) return; // انتظر الزر الثالث
    const ev = eventCombo(e);
    const mods = (ev.ctrl?1:0) + (ev.alt?1:0) + (ev.shift?1:0);
    if(mods < 2){ if(typeof showWarning === 'function') showWarning('تركيبة ناقصة', 'استخدم زرين تعديل + زر (مثال: Ctrl+Shift+S).'); return; }
    const rec = { ctrl:ev.ctrl, shift:ev.shift, alt:ev.alt, key:ev.key };
    if(ev.key === '/' || ev.code === 'Slash'){ rec.key = '/'; rec.code = 'Slash'; }
    const lbl = shortcutLabel(rec);
    if(RESERVED_COMBOS.includes(lbl)){ if(typeof showWarning === 'function') showWarning('محجوزة للمتصفح', `التركيبة ${lbl} محجوزة للمتصفح ولا يمكن اعتراضها — اختر غيرها.`); return; }
    const clash = DEFAULT_SHORTCUTS.find(s => s.id !== _recShortcutId && (() => { const o = getShortcut(s.id); return !!o.ctrl === rec.ctrl && !!o.shift === rec.shift && !!o.alt === rec.alt && (o.code ? (rec.code === o.code) : (rec.key === o.key)); })());
    if(clash){ if(typeof showWarning === 'function') showWarning('مستخدمة', `التركيبة ${lbl} مستخدمة لـ «${clash.label}» — اختر غيرها.`); return; }
    if(typeof appSettings !== 'undefined'){
      if(!appSettings.shortcuts) appSettings.shortcuts = {};
      appSettings.shortcuts[_recShortcutId] = rec;
      if(typeof saveAppSettings === 'function') saveAppSettings();
    }
    _recShortcutId = null;
    if(typeof renderShortcutSettings === 'function') renderShortcutSettings();
    if(typeof showSuccess === 'function') showSuccess('تم', `الاختصار الجديد: ${lbl}`);
  }, true);
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    const inField = (() => { const a = document.activeElement; return a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'); })();
    const reviewOpen = (document.getElementById('reviewModal')?.classList.contains('open')) || (typeof currentPage !== 'undefined' && currentPage === 'review');
    const lineOpen = document.getElementById('lineModal')?.classList.contains('open');
    if(matchShortcut(e, 'save-review')){ if(reviewOpen || lineOpen){ e.preventDefault(); if(reviewOpen && typeof saveReview === 'function') saveReview(); else if(lineOpen && typeof saveLineEditor === 'function') saveLineEditor(); return; } }
    if(matchShortcut(e, 'finalize-review')){ if(reviewOpen){ e.preventDefault(); if(typeof finalizeReview === 'function') finalizeReview(); return; } }
    if(matchShortcut(e, 'quick-search') && !inField){ e.preventDefault(); navHistory=[]; navigateTo('search',{noPush:true}); const inp = document.getElementById('srchQuery')||document.getElementById('searchInput'); if(inp) setTimeout(()=>inp.focus(),50); return; }
    if(matchShortcut(e, 'new-batch') && !inField){ e.preventDefault(); if(currentPage!=='inbox') navigateTo('inbox',{noPush:true}); setTimeout(()=>{ const b=document.getElementById('addBatchBtn'); if(b) b.click(); },50); return; }
    if(matchShortcut(e, 'focus-search')){
      e.preventDefault();
      if(currentPage === 'claims') $('#searchInput')?.focus();
      else if(currentPage === 'search') $('#srchQuery')?.focus();
      else if(currentPage === 'sessions') $('#sessionsSearch')?.focus();
      return;
    }
    if(e.key === 'Escape'){
      const openModal = document.querySelector('.modal.open, .dialog-overlay.open');
      if(openModal){
        if(openModal.id === 'unifiedDialog'){ const cb = dialogState.onCancel; closeDialog(); if(cb) cb(); }
        else if(openModal.id === 'reviewModal'){ closeReview(); }
        else if(openModal.id === 'batchModal'){ closeBatchModal(); }
        else if(openModal.id === 'providerModal'){ closeProviderModal(); }
        else if(openModal.id === 'contractModal'){ closeContractModal(); }
        else if(openModal.id === 'tariffModal'){ closeTariffModal(); }
        else if(openModal.id === 'invoiceModal'){ closeInvoiceEditor(); }
        else if(openModal.id === 'patientModal'){ closePatientEditor(); }
        else if(openModal.id === 'lineModal'){ closeLineEditor(); }
        else if(openModal.id === 'serviceModal'){ closeServiceModal(); }
        else if(openModal.id === 'drWizardModal'){ closeDrWizard(); }
        else if(openModal.id === 'drModal'){ closeDrModal(); }
        else if(openModal.id === 'paProcModal'){ $('#paProcModal').classList.remove('open'); _unlockBodyScroll(); }
        else { openModal.classList.remove('open'); _unlockBodyScroll(); }
        return;
      }
      if(window.innerWidth <= 900) closeSidebar();
      return;
    }
    if(e.key === '?' && !ctrl){ const a=document.activeElement; if(a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')) return; e.preventDefault(); navHistory=[]; navigateTo('help',{noPush:true}); return; }
  });
}
/* ---------- واجهة التخصيص في الإعدادات ---------- */
function renderShortcutSettings(){
  const box = document.getElementById('shortcutsBox'); if(!box) return;
  box.innerHTML = DEFAULT_SHORTCUTS.map(s => {
    const cur = getShortcut(s.id);
    const isRec = _recShortcutId === s.id;
    return `<div class="info-row"><div style="flex:1"><div class="k">${escapeHtml(s.label)}</div><div style="font-size:11px;color:var(--muted);margin-top:4px"><kbd>${escapeHtml(shortcutLabel(cur))}</kbd>${cur.id && appSettings.shortcuts && appSettings.shortcuts[s.id] ? ' · مخصص' : ' · افتراضي'}</div></div>
      <button class="btn-sm ${isRec ? 'solid' : 'ghost'}" data-sc-edit="${s.id}" style="flex:0 0 auto">${isRec ? 'اضغط التركيبة…' : 'تغيير'}</button></div>`;
  }).join('');
  box.querySelectorAll('[data-sc-edit]').forEach(b => b.addEventListener('click', () => {
    _recShortcutId = b.dataset.scEdit;
    renderShortcutSettings();
    if(typeof showToast === 'function') showToast('اضغط التركيبة الجديدة (زرّا تعديل + زر) — Esc للإلغاء');
  }));
  const rs = document.getElementById('resetShortcutsBtn');
  if(rs && !rs.dataset.bound){
    rs.dataset.bound = '1';
    rs.addEventListener('click', () => {
      if(typeof appSettings !== 'undefined'){ appSettings.shortcuts = {}; if(typeof saveAppSettings === 'function') saveAppSettings(); }
      _recShortcutId = null;
      renderShortcutSettings();
      if(typeof renderHelpShortcuts === 'function') renderHelpShortcuts();
      if(typeof showSuccess === 'function') showSuccess('تم', 'عادت الاختصارات للافتراضي');
    });
  }
}
function renderHelpShortcuts(){
  const box = document.getElementById('helpShortcutsBox'); if(!box) return;
  box.innerHTML = DEFAULT_SHORTCUTS.map(s => `<div class="info-row"><span class="k"><kbd>${escapeHtml(shortcutLabel(getShortcut(s.id)))}</kbd></span><span class="v">${escapeHtml(s.label)}</span></div>`).join('')
    + `<div class="info-row"><span class="k"><kbd>Esc</kbd></span><span class="v">إغلاق النوافذ</span></div>
       <div class="info-row"><span class="k"><kbd>Alt+↑/↓</kbd></span><span class="v">نقل شرط (في معالج القواعد)</span></div>
       <div class="info-row"><span class="k"><kbd>?</kbd></span><span class="v">المساعدة</span></div>`;
}
