// sessions.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let workSessions = [];
let _sessionsStorageState = 'uninitialized';
let activeSessionId = null;
let sessionsFilter = 'all';
let sessionsSearch = '';
let currentSessionTimer = null;
let lastUserActivityTimestamp = Date.now();
let activeSessionTimer = null;
let lastActivityTime = Date.now();
function genSessionId(){ return 'SES-'+Date.now().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*1000); }
function loadSessions(){
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if(raw === null){ _sessionsStorageState = 'empty'; return; }
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed) || !parsed.every(s => s && typeof s === 'object' && !Array.isArray(s))) throw new Error('بنية جلسات المراجعة غير صالحة');
    workSessions = parsed.map(s => ({ ...s, status:'paused' }));
    _sessionsStorageState = 'loaded';
  } catch(e){
    _sessionsStorageState = 'corrupt';
    console.error('loadSessions rejected stored sessions; original value preserved', e);
  }
}
function persistSessions(){
  if(_sessionsStorageState === 'corrupt') { console.error('persistSessions blocked: corrupted session storage requires recovery'); return false; }
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(workSessions)); _sessionsStorageState = 'loaded';
    try { if(typeof fsWriteData === 'function' && FS_STORE.dirHandle) fsWriteData('جلسات', workSessions); } catch(e){}
    return true; }
  catch(e){ console.error('persistSessions failed', e); return false; }
}
function findSessionByClaim(claimId){ return workSessions.find(s => s.claimId === claimId); }
// Compare the live claim with the immutable baseline captured when this review session began.
// Older sessions without a baseline remain resumable but cannot be conflict-checked.
function getSessionConflictState(session, liveClaim){
  if(!session || !session.baseClaimSnapshot || !liveClaim) return 'unknown';
  try {
    if(typeof canonicalSnapshot === 'function')
      return JSON.stringify(canonicalSnapshot(session.baseClaimSnapshot)) === JSON.stringify(canonicalSnapshot(liveClaim)) ? 'current' : 'conflict';
    return JSON.stringify(session.baseClaimSnapshot) === JSON.stringify(liveClaim) ? 'current' : 'conflict';
  } catch(e){ return 'unknown'; }
}
function getSessionClaimInfo(s){
  const live = getClaimById(s.claimId);
  const snap = s.claimSnapshot || {};
  return { id:s.claimId, patient:(live&&live.patient)||snap.patient||'—', provider:(live&&live.provider)||snap.provider||'—', billed:(live&&live.billed)||snap.billed||0, approved:(live&&live.approved)||snap.approved||0, stale:!live };
}
/**
 * التقاط حالة الجلسة الحالية (لحفظ/استئناف).
 * @returns {Object|null} حالة الجلسة
 */
function captureCurrentSessionState(){
  if(!activeClaim) return null;
  const ex = findSessionByClaim(activeClaim.id);
  return {
    id:(ex&&ex.id)||activeSessionId||genSessionId(),
    claimId:activeClaim.id,
    claimSnapshot:JSON.parse(JSON.stringify(activeClaim)),
    baseClaimSnapshot:(ex && ex.baseClaimSnapshot) ? JSON.parse(JSON.stringify(ex.baseClaimSnapshot)) : JSON.parse(JSON.stringify(getClaimById(activeClaim.id) || activeClaim)),
    sessionSchemaVersion:2,
    workingInvoices:JSON.parse(JSON.stringify(workingInvoices||[])),
    rvActiveInvoiceIdx:rvActiveInvoiceIdx||0,
    rvActivePatientIdx:rvActivePatientIdx||0,
    reviewFormState:{ reason:($('#rvReason')&&$('#rvReason').value)||'', notes:($('#rvNotes')&&$('#rvNotes').value)||'', paStatus:($('#paStatus')&&$('#paStatus').value)||'not-requested', paRefNumber:($('#paRefNumber')&&$('#paRefNumber').value)||'', paDate:($('#paDate')&&$('#paDate').value)||'', claimType:activeClaim.type||'employee' },
    createdAt:(ex&&ex.createdAt)||new Date().toISOString(),
    lastActiveAt:new Date().toISOString(),
    status:(activeSessionId ? 'active' : 'paused'),
    name:(ex&&ex.name)||null,
    elapsedSeconds: (ex && typeof ex.elapsedSeconds === 'number') ? ex.elapsedSeconds : 0,
    lastSavedPoint: (ex && ex.lastSavedPoint) ? JSON.parse(JSON.stringify(ex.lastSavedPoint)) : { invoiceIdx: rvActiveInvoiceIdx||0, patientIdx: rvActivePatientIdx||0, lineIdx: 0 }
  };
}
function upsertCurrentSession(){
  const s = captureCurrentSessionState(); if(!s) return null;
  const i = workSessions.findIndex(x => x.id === s.id);
  if(i >= 0) workSessions[i] = s; else workSessions.push(s);
  const _ok = (typeof persistSessions === 'function') ? persistSessions() : true;
  if(_ok){ if(typeof notifyPersistOk === 'function') notifyPersistOk(); }
  else if(typeof notifyPersistFailed === 'function') notifyPersistFailed(false);
  updateSessionsBadge(); return s;
}
function updateSessionsBadge(){
  const b = document.getElementById('sessionsCount');
  if(!b) return;
  const n = workSessions.length;
  if(n > 0){ b.textContent = n; b.style.display = 'grid'; } else b.style.display = 'none';
  renderSessionSwitcher();
}
function renderSessionSwitcher(){
  const sel = document.getElementById('rvSessionSwitcher'); if(!sel) return;
  const others = workSessions.filter(s => s.id !== activeSessionId);
  if(!others.length){ sel.innerHTML = '<option value="">لا جلسات أخرى</option>'; sel.disabled = true; return; }
  sel.disabled = false;
  sel.innerHTML = '<option value="">⇄ تبديل...</option>' + others.map(s => { const info = getSessionClaimInfo(s); return `<option value="${escapeHtml(s.id)}">${escapeHtml(s.claimId)} — ${escapeHtml(info.patient.substring(0,22))}</option>`; }).join('');
}
function resumeSession(sessionId){
  const s = workSessions.find(x => x.id === sessionId); if(!s){ showWarning('خطأ','غير موجودة'); return false; }
  let live = getClaimById(s.claimId);
  const conflictState = live ? getSessionConflictState(s, live) : 'missing';
  if(conflictState === 'conflict'){
    showWarning('تعارض في بيانات المطالبة', 'تغيرت المطالبة بعد إنشاء جلسة المراجعة. أوقفنا الاستئناف حتى لا تستبدل الجلسة تعديلات أحدث. احتفظ بنسخة احتياطية وافحص المطالبة والجلسة قبل المتابعة.');
    return false;
  }
  if(!live){
    live = JSON.parse(JSON.stringify(s.claimSnapshot || {}));
    if(!live.id || !live.patient){ showWarning('خطأ','لا يمكن'); return; }
    claims.push(live); showToast(`تم استرداد ${live.id}`);
  }
  activeClaim = live;
  if(s.claimSnapshot && Array.isArray(s.claimSnapshot.invoices)) activeClaim.invoices = JSON.parse(JSON.stringify(s.claimSnapshot.invoices));
  else if(!Array.isArray(activeClaim.invoices)) activeClaim.invoices = [];
  workingInvoices = JSON.parse(JSON.stringify(s.workingInvoices || []));
  // H1: املأ صفحة المراجعة (الترويسة + السياق + المسودات) — لا تكتفِ بحقول المودال القديم.
  try { if(typeof _fillReviewPage === 'function') _fillReviewPage(activeClaim); } catch(e){}
  try {
    const _pr = document.getElementById('rvPageReason'); if(_pr && s.reviewFormState && s.reviewFormState.reason !== undefined) _pr.value = s.reviewFormState.reason;
    const _pn = document.getElementById('rvPageNotes'); if(_pn && s.reviewFormState && s.reviewFormState.notes !== undefined) _pn.value = s.reviewFormState.notes;
  } catch(e){}
  try { if(typeof renderReviewDrafts === 'function') renderReviewDrafts(); } catch(e){}
  rvActiveInvoiceIdx = s.rvActiveInvoiceIdx || 0;
  rvActivePatientIdx = s.rvActivePatientIdx || 0;
  activeSessionId = s.id;
  s.status = 'active'; s.lastActiveAt = new Date().toISOString(); persistSessions();
  if(s.lastSavedPoint){ rvActiveInvoiceIdx = s.lastSavedPoint.invoiceIdx || rvActiveInvoiceIdx || 0; rvActivePatientIdx = s.lastSavedPoint.patientIdx || rvActivePatientIdx || 0; }
  if(typeof startSessionTimeTracker === 'function') startSessionTimeTracker(s);
  $('#rvSub').textContent = `${activeClaim.id} • ${activeClaim.patient}`;
  $('#rvId').value = activeClaim.id; $('#rvDate').value = activeClaim.date||'';
  $('#rvReceivedNumber').value = activeClaim.receivedNumber||'—'; $('#rvReceivedDate').value = activeClaim.receivedDate||'—';
  $('#rvPatient').value = activeClaim.patient||''; $('#rvProvider').value = activeClaim.provider||'';
  $('#rvReason').value = s.reviewFormState.reason||''; $('#rvNotes').value = s.reviewFormState.notes||'';
  if(s.reviewFormState.claimType) activeClaim.type = s.reviewFormState.claimType;
  $$('.rv-type-btn').forEach(b => b.classList.toggle('active', b.dataset.claimType === activeClaim.type));
  if(activeClaim.priorApproval && activeClaim.priorApproval.required){
    (el => { if (el) el.style.display = 'block'; })($('#priorApprovalBox'));
    $('#paStatus').value = s.reviewFormState.paStatus || activeClaim.priorApproval.status || 'not-requested';
    $('#paRefNumber').value = s.reviewFormState.paRefNumber || activeClaim.priorApproval.refNumber || '';
    $('#paDate').value = s.reviewFormState.paDate || activeClaim.priorApproval.date || '';
    updatePAWarning();
  } else (el => { if (el) el.style.display = 'none'; })($('#priorApprovalBox'));
  renderReviewInvoices();
  clearSessionDirty();
  try { navigateTo('review', {noPush:false}); } catch(e){ if($('#reviewModal')) { $('#reviewModal').classList.add('open'); document.body.style.overflow = 'hidden'; } }
  updateSessionsBadge(); renderSessions();
  return true;
}
function formatTimeAgo(iso){
  if(!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime())/1000);
  if(diff < 30) return 'الآن';
  if(diff < 3600) return `قبل ${Math.floor(diff/60)} د`;
  if(diff < 86400) return `قبل ${Math.floor(diff/3600)} س`;
  return new Date(iso).toLocaleDateString('ar-SA');
}
function renderSessionCard(s){
  const info = getSessionClaimInfo(s);
  const inv = (s.workingInvoices||[]).length;
  const pat = (s.workingInvoices||[]).reduce((a,i)=>a+(i.patients||[]).length,0);
  const lines = (s.workingInvoices||[]).reduce((a,i)=>a+(i.patients||[]).reduce((b,p)=>b+(p.lines||[]).length,0),0);
  const billed = (s.workingInvoices||[]).reduce((a,i)=>a+(i.patients||[]).reduce((b,p)=>b+(p.lines||[]).reduce((c,l)=>c+(l.qty*l.billedUnit),0),0),0);
  const appr = (s.workingInvoices||[]).reduce((a,i)=>a+(i.patients||[]).reduce((b,p)=>b+(p.lines||[]).reduce((c,l)=>c+(Number(l.approved)||0),0),0),0);
  const rate = billed ? ((billed-appr)/billed*100) : 0;
  let pc = 'paused', pt = 'موقوفة';
  if(info.stale){ pc = 'stale'; pt = 'مفقودة'; }
  else if(s.status === 'active'){ pc = 'active'; pt = 'نشطة'; }
  return `<div class="session-card ${s.id===activeSessionId?'active-session':''} ${info.stale?'stale':''}">
    <div class="sc-head"><div class="sc-claim"><div class="sc-claim-id">${escapeHtml(s.claimId)}</div><div class="sc-patient">${escapeHtml(info.patient)}</div><div class="sc-provider">${escapeHtml(info.provider)}</div></div><span class="sc-status-pill ${pc}">${pt}</span></div>
    <div class="sc-stats"><div><span>فواتير</span><b>${inv}</b></div><div><span>مرضى</span><b>${pat}</b></div><div><span>بنود</span><b>${lines}</b></div></div>
    <div class="sc-money"><span>مطالب: <b>${fmt(billed)}</b></span><span style="color:var(--ok)">معتمد: <b>${fmt(appr)}</b></span><span style="color:var(--bad)">استقطاع: <b>${rate.toFixed(1)}%</b></span></div>
    <div class="sc-foot"><div class="sc-time">🕐 ${formatTimeAgo(s.lastActiveAt)}</div><div class="sc-actions"><button class="btn-xs" data-resume-session="${escapeHtml(s.id)}">${info.stale?'⚠ حذف':'استئناف'}</button><button class="btn-xs danger" data-delete-session="${escapeHtml(s.id)}">×</button></div></div>
  </div>`;
}
function renderSessions(){
  const box = document.getElementById('sessionsList'); if(!box) return;
  const activeN = workSessions.filter(s=>s.status==='active').length;
  const pausedN = workSessions.filter(s=>s.status==='paused').length;
  const kpi = document.getElementById('sessionsKpi');
  if(kpi){
    kpi.innerHTML = `
      <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الجلسات</div><div class="kpi-val">${workSessions.length} <small>جلسة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${activeN} نشطة · ${pausedN} موقوفة</div></div>
      <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">قيد العمل</div><div class="kpi-val">${activeN} <small>جلسة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">${pausedN} بانتظار</div></div>
      <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">مطالبات</div><div class="kpi-val">${workSessions.length} <small>مطالبة</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">غير مكتملة</div></div>
      <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">آخر نشاط</div><div class="kpi-val" style="font-size:13px">${workSessions.length?formatTimeAgo(workSessions.reduce((a,s)=> (s.lastActiveAt>a?s.lastActiveAt:a), workSessions[0].lastActiveAt)):'—'}</div></div><div class="kpi-ico">${kpiIcon('check')}</div></div><div class="kpi-foot">تحديث تلقائي</div></div>`;
  }
  const filtered = workSessions.filter(s => {
    if(sessionsFilter === 'active' && s.status !== 'active') return false;
    if(sessionsFilter === 'paused' && s.status !== 'paused') return false;
    if(sessionsSearch){ const info = getSessionClaimInfo(s), q = sessionsSearch.toLowerCase(); return s.claimId.toLowerCase().includes(q) || info.patient.toLowerCase().includes(q) || info.provider.toLowerCase().includes(q); }
    return true;
  }).sort((a,b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
  if(!filtered.length){
    box.innerHTML = `<div class="session-empty"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M6.5 3v4M17.5 3v4M2.5 10h19"/></svg><p>${workSessions.length?'لا نتائج':'لا جلسات'}</p><span>${workSessions.length?'جرّب آخر':'ابدأ بمراجعة'}</span></div>`;
  } else box.innerHTML = `<div class="sessions-grid">${filtered.map(renderSessionCard).join('')}</div>`;
  updateSessionsBadge();
}

/* ---------- تتبع النشاط الفعلي والحفظ التلقائي ---------- */
(function(){
  const syncActivity = () => { lastUserActivityTimestamp = Date.now(); lastActivityTime = Date.now(); };
  ['click', 'keydown', 'mousemove', 'scroll'].forEach(evt => {
    try { window.addEventListener(evt, syncActivity, { passive: true }); } catch(e){}
  });
})();

function startSessionTimeTracker(session) {
  if (currentSessionTimer) clearInterval(currentSessionTimer);
  if (activeSessionTimer) clearInterval(activeSessionTimer);
  if (!session) return;
  if (!session.elapsedSeconds) session.elapsedSeconds = 0;
  if (!session.lastSavedPoint) session.lastSavedPoint = { invoiceIdx: 0, patientIdx: 0, lineIdx: 0 };
  currentSessionTimer = setInterval(() => {
    const isUserActive = (Date.now() - lastUserActivityTimestamp) < 60000;
    const isWindowFocused = !document.hidden;
    if (isUserActive && isWindowFocused && session.status === 'active') {
      session.elapsedSeconds += 1;
      updateSessionTimerUI(session.elapsedSeconds);
      updateTimerUI(session.elapsedSeconds);
    }
  }, 1000);
  activeSessionTimer = currentSessionTimer;
}
function initActiveSessionTracker(session){ return startSessionTimeTracker(session); }

function stopSessionTimeTracker() {
  if (currentSessionTimer) { clearInterval(currentSessionTimer); currentSessionTimer = null; }
  if (activeSessionTimer) { clearInterval(activeSessionTimer); activeSessionTimer = null; }
}
function stopActiveSessionTracker(){ return stopSessionTimeTracker(); }

function updateCurrentReviewProgressPoint(claimId, invoiceIdx, patientIdx, lineIdx) {
  let session = workSessions.find(s => s.claimId === claimId && s.status === 'active');
  if (!session) return;
  session.lastSavedPoint = {
    invoiceIdx: invoiceIdx || 0,
    patientIdx: patientIdx || 0,
    lineIdx: lineIdx || 0,
    timestamp: new Date().toISOString()
  };
  session.updatedAt = new Date().toISOString();
  // المؤشر يعيش في الجلسة (lastSavedPoint) — ممنوع كتابته في جسم المطالبة.
  persistSessions();
}
function saveProgressPoint(claimId, invoiceIdx, patientIdx, lineIdx) {
  return updateCurrentReviewProgressPoint(claimId, invoiceIdx, patientIdx, lineIdx);
}

function resumeSessionFromLastPoint(sessionId) {
  const session = workSessions.find(s => s.id === sessionId);
  if (!session) return;
  workSessions.forEach(s => { if (s.status === 'active') s.status = 'paused'; });
  // توحيد: نفس مسار resumeSession (يستعيد مساحة العمل + فحص التعارض) ثم القفز لآخر نقطة.
  const ok = (typeof resumeSession === 'function') ? resumeSession(sessionId) : false;
  if(ok === false) return;
  if (session.lastSavedPoint) {
    rvActiveInvoiceIdx = session.lastSavedPoint.invoiceIdx || 0;
    rvActivePatientIdx = session.lastSavedPoint.patientIdx || 0;
    try { renderReviewInvoices(); } catch(e){}
    try { if(typeof renderActiveInvoice === 'function') renderActiveInvoice(); } catch(e){}
  }
  try { if(typeof showToast === 'function') showToast(`تم الاستئناف — الوقت المستغرق: ${formatElapsedTime(session.elapsedSeconds || 0)}`); } catch(e){}
}

function formatElapsedTime(seconds) {
  seconds = seconds || 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs} ساعة و ${mins} دقيقة`;
  return `${mins} دقيقة و ${secs} ثانية`;
}

function updateSessionTimerUI(seconds) {
  const timerEl = document.getElementById('rvSessionTimerDisplay');
  if (timerEl) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `⏱️ وقت المراجعة الفعلي: ${hrs}:${mins}:${secs}`;
  }
}
function updateTimerUI(seconds) {
  const el = document.getElementById('rvSessionTimerDisplay');
  if (el) {
    const m = String(Math.floor((seconds||0) / 60)).padStart(2, '0');
    const s = String((seconds||0) % 60).padStart(2, '0');
    el.textContent = `⏱️ وقت العمل الفعلي: ${m}:${s}`;
  }
  updateSessionTimerUI(seconds);
}
