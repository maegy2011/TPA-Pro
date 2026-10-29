function confirmFullImport(parsed){
  const d = parsed.data || {}, hasS = !!parsed.settings, hasSess = !!parsed.session, hasWS = Array.isArray(d.workSessions) && d.workSessions.length > 0;
  const meta = parsed.sessionsMeta || {};
  const dateStr = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('ar-SA') : '—';
  const s = parsed.settings || {};
  const importedIds = new Set((d.claims||[]).map(c=>c.id));
  const stale = hasWS ? d.workSessions.filter(w => !importedIds.has(w.claimId)).length : 0;
  const rec = hasWS ? d.workSessions.filter(w => !importedIds.has(w.claimId) && w.claimSnapshot && w.claimSnapshot.id).length : 0;
  openDialog({
    type:'warning', title:'استيراد كامل', message:'سيتم استبدال كل البيانات.',
    body: `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;font-size:12.5px;line-height:2;text-align:right">
        <div><b>التاريخ:</b> ${escapeHtml(dateStr)}</div>
        <div><b>البيانات:</b> ${(d.claims||[]).length} مطالبة · ${(d.providers||[]).length} جهة · ${(d.contracts||[]).length} عقد · ${(d.tariffs||[]).length} لائحة</div>
        ${hasS?`<div style="color:var(--teal)"><b>✓ الإعدادات:</b> ${escapeHtml(s.reviewer?.name||'—')} — ${escapeHtml(s.company?.brand||'—')}</div>`:''}
        ${hasWS?`<div style="color:var(--info)"><b>✓ جلسات:</b> ${d.workSessions.length}${stale>0?` — <span style="color:var(--bad)">${stale} مفقودة</span>`:''}</div>`:''}
        ${hasSess?`<div style="color:var(--info)"><b>✓ حالة صفحة:</b> ${parsed.session?.currentPage||'—'}</div>`:''}
      </div>
      ${hasSess?`<label class="check-row" style="margin-top:10px;font-size:12px;background:#EFF6FF;border-color:#BFDBFE"><input type="checkbox" id="chkRSess" checked><span style="color:#1D4ED8;font-weight:700">حالة الصفحة</span></label>`:''}
      ${hasWS?`<label class="check-row" style="margin-top:6px;font-size:12px;background:#EFF6FF;border-color:#BFDBFE"><input type="checkbox" id="chkRWS" checked><span style="color:#1D4ED8;font-weight:700">جلسات (${d.workSessions.length})</span></label>
      <label class="check-row" style="margin-top:6px;font-size:12px;background:#F5F3FF;border-color:#DDD6FE"><input type="checkbox" id="chkRPtr" checked><span style="color:#6D28D9;font-weight:700">مؤشر الجلسة</span></label>
      ${rec>0?`<label class="check-row" style="margin-top:6px;font-size:12px;background:#FEF2F2;border-color:#FECACA"><input type="checkbox" id="chkRRec" checked><span style="color:#B91C1C;font-weight:700">استرداد ${rec}</span></label>`:''}`:''}
      <div style="margin-top:12px;font-size:11.5px;color:#92400E;background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:10px 12px;line-height:1.7">⚠️ سيتم حذف البيانات الحالية.</div>`,
    confirmText:'استيراد', cancelText:'إلغاء',
    onConfirm: () => applyFullBackup(parsed, {
      restoreSess: !!document.getElementById('chkRSess')?.checked,
      restoreSessions: !!document.getElementById('chkRWS')?.checked,
      restoreActivePtr: !!document.getElementById('chkRPtr')?.checked,
      recoverClaims: !!document.getElementById('chkRRec')?.checked
    })
  });
}
function applyFullBackup(parsed, opts){
  opts = opts || {};
  try {
    if(parsed.settings){
      if(parsed.settings.reviewer) appSettings.reviewer = { ...appSettings.reviewer, ...parsed.settings.reviewer };
      if(parsed.settings.company) appSettings.company = { ...appSettings.company, ...parsed.settings.company };
      saveAppSettings(); applyAppSettingsToUI();
    }
    const d = parsed.data || {};
    if(Array.isArray(d.providers)) providers = d.providers;
    if(Array.isArray(d.contracts)) contracts = d.contracts;
    if(Array.isArray(d.tariffs)) tariffs = d.tariffs;
    if(Array.isArray(d.batches)) batches = d.batches;
    if(Array.isArray(d.claims)) claims = d.claims;
    if(Array.isArray(d.trash)) trash = d.trash;
    if(Array.isArray(d.deductionRules)) deductionRules = d.deductionRules;
    if(Array.isArray(d.paProcedures)) paProcedures = d.paProcedures;
    claims.forEach(c => { if(!c.type) c.type = 'employee'; if(!c.invoices) c.invoices = []; if(!c.priorApproval) c.priorApproval = {required:false,status:'not-requested',refNumber:'',date:''}; recalcClaim(c); });
    activeSessionId = null;
    if(opts.restoreSessions && Array.isArray(d.workSessions)){
      if(document.getElementById('reviewModal')?.classList.contains('open')) try { closeReview({discard:true}); } catch(e){}
      let recovered = 0;
      if(opts.recoverClaims){
        const exIds = new Set(claims.map(c=>c.id));
        d.workSessions.forEach(w => { if(!exIds.has(w.claimId) && w.claimSnapshot && w.claimSnapshot.id){ const snap = JSON.parse(JSON.stringify(w.claimSnapshot)); if(!snap.type) snap.type = 'employee'; if(!snap.invoices) snap.invoices = []; if(!snap.priorApproval) snap.priorApproval = {required:false,status:'not-requested',refNumber:'',date:''}; recalcClaim(snap); claims.push(snap); exIds.add(snap.id); recovered++; } });
      }
      workSessions = d.workSessions.map(w => ({ ...JSON.parse(JSON.stringify(w)), status:'paused' }));
      if(opts.restoreActivePtr && parsed.sessionsMeta?.activeSessionId && workSessions.some(s => s.id === parsed.sessionsMeta.activeSessionId)) activeSessionId = parsed.sessionsMeta.activeSessionId;
      if(parsed.sessionsMeta){ if(parsed.sessionsMeta.sessionsFilter !== undefined) sessionsFilter = parsed.sessionsMeta.sessionsFilter; if(typeof parsed.sessionsMeta.sessionsSearch === 'string') sessionsSearch = parsed.sessionsMeta.sessionsSearch; }
      persistSessions();
      if(recovered > 0) setTimeout(() => showToast(`استُردّت ${recovered}`), 600);
    }
    persistData(true);
    renderAll();
    if(opts.restoreSess && parsed.session) restoreSessionState(parsed.session);
    else navigateTo('dashboard', {noPush:true, force:true});
    const parts = [`${claims.length} مطالبة`, `${providers.length} جهة`];
    if(parsed.settings) parts.push('الإعدادات');
    if(opts.restoreSessions && Array.isArray(d.workSessions)) parts.push(`${workSessions.length} جلسة`);
    showSuccess('تم', parts.join(' + '));
  } catch(err){ console.error(err); showWarning('خطأ', err.message); }
}
function confirmSettingsImport(parsed){
  const s = parsed.settings || {};
  openDialog({
    type:'warning', title:'استيراد الإعدادات', message:'سيتم استبدال الهوية والقواعد.',
    body: `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;font-size:12.5px;line-height:2;text-align:right"><div><b>المراجع:</b> ${escapeHtml(s.reviewer?.name||'—')}</div><div><b>الشركة:</b> ${escapeHtml(s.company?.name||'—')}</div><div><b>قواعد:</b> ${(s.deductionRules||[]).length}</div><div><b>إجراءات:</b> ${(s.paProcedures||[]).length}</div></div>`,
    confirmText:'استيراد', cancelText:'إلغاء', onConfirm: () => applySettingsImport(parsed)
  });
}
function applySettingsImport(parsed){
  try {
    const s = parsed.settings || {};
    if(s.reviewer) appSettings.reviewer = { ...appSettings.reviewer, ...s.reviewer };
    if(s.company) appSettings.company = { ...appSettings.company, ...s.company };
    saveAppSettings(); applyAppSettingsToUI();
    if(Array.isArray(s.deductionRules)) deductionRules = s.deductionRules;
    if(Array.isArray(s.paProcedures)) paProcedures = s.paProcedures;
    persistData(true);
    renderAll(); showSuccess('تم','تم');
  } catch(err){ showWarning('خطأ', err.message); }
}
function confirmSessionsImport(parsed){
  const list = Array.isArray(parsed.sessions) ? parsed.sessions : [];
  const meta = parsed.sessionsMeta || {};
  const exIds = new Set(claims.map(c=>c.id));
  const stale = list.filter(w => !exIds.has(w.claimId)).length;
  const rec = list.filter(w => !exIds.has(w.claimId) && w.claimSnapshot && w.claimSnapshot.id).length;
  openDialog({
    type:'warning', title:'استيراد جلسات', message:'اختر الطريقة',
    body: `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;font-size:12.5px;line-height:2;text-align:right;margin-bottom:12px">
        <div><b>عدد:</b> ${list.length}</div>
        ${stale>0?`<div style="color:var(--bad)"><b>⚠ مفقودة:</b> ${stale}${rec>0?` (${rec} قابلة)`:''}</div>`:''}
        <div style="color:var(--muted);font-size:11px;margin-top:4px">الحالية: ${workSessions.length}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <label class="check-row" style="font-size:12px;background:#ECFDF5;border-color:#A7F3D0"><input type="radio" name="sessMode" value="merge" checked><span style="color:#047857;font-weight:800">دمج</span></label>
        <label class="check-row" style="font-size:12px;background:#FEF2F2;border-color:#FECACA"><input type="radio" name="sessMode" value="replace"><span style="color:#B91C1C;font-weight:800">استبدال</span></label>
      </div>
      ${rec>0?`<label class="check-row" style="margin-top:10px;font-size:12px;background:#EFF6FF;border-color:#BFDBFE"><input type="checkbox" id="chkSRec" checked><span style="color:#1D4ED8;font-weight:700">استرداد ${rec}</span></label>`:''}
      <label class="check-row" style="margin-top:6px;font-size:12px;background:#F5F3FF;border-color:#DDD6FE"><input type="checkbox" id="chkSPtr" checked><span style="color:#6D28D9;font-weight:700">مؤشر</span></label>`,
    confirmText:'استيراد', cancelText:'إلغاء',
    onConfirm: () => {
      const mode = document.querySelector('input[name="sessMode"]:checked')?.value || 'merge';
      const rec2 = !!document.getElementById('chkSRec')?.checked;
      const ptr = !!document.getElementById('chkSPtr')?.checked;
      applySessionsImport(parsed, { mode, recover:rec2, restorePtr:ptr });
    }
  });
}
function applySessionsImport(parsed, opts){
  opts = opts || {};
  try {
    const list = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    if(!list.length){ showWarning('تنبيه','لا جلسات'); return; }
    if(document.getElementById('reviewModal')?.classList.contains('open')) try { closeReview({discard:true}); } catch(e){}
    let recovered = 0;
    if(opts.recover){
      const exIds = new Set(claims.map(c=>c.id));
      list.forEach(w => { if(!exIds.has(w.claimId) && w.claimSnapshot && w.claimSnapshot.id){ const snap = JSON.parse(JSON.stringify(w.claimSnapshot)); if(!snap.type) snap.type = 'employee'; if(!snap.invoices) snap.invoices = []; if(!snap.priorApproval) snap.priorApproval = {required:false,status:'not-requested',refNumber:'',date:''}; recalcClaim(snap); claims.push(snap); exIds.add(snap.id); recovered++; } });
    }
    if(opts.mode === 'replace') workSessions = list.map(w => ({ ...JSON.parse(JSON.stringify(w)), status:'paused' }));
    else { const byId = new Map(workSessions.map(s => [s.id, s])); list.forEach(w => { byId.set(w.id, { ...JSON.parse(JSON.stringify(w)), status:'paused' }); }); workSessions = Array.from(byId.values()); }
    if(opts.restorePtr && parsed.sessionsMeta?.activeSessionId && workSessions.some(s => s.id === parsed.sessionsMeta.activeSessionId)) activeSessionId = parsed.sessionsMeta.activeSessionId;
    persistSessions(); persistData(true); renderSessions(); updateSessionsBadge();
    const msg = opts.mode === 'replace' ? `استبدال بـ ${workSessions.length}` : `دمج ${list.length} (إجمالي: ${workSessions.length})`;
    showSuccess('تم', msg + (recovered>0?` · ${recovered}`:''));
  } catch(err){ showWarning('خطأ', err.message); }
}
