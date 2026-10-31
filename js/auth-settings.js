function logoutWithReminder(){
  if(hasRecentBackup(3600000) && !(typeof activeClaim !== 'undefined' && activeClaim)){
    openDialog({ type:'info', title:'تسجيل الخروج', message:`آخر نسخة ${getLastBackupAgo()}. خروج؟`, confirmText:'خروج', cancelText:'إلغاء',
      onConfirm: () => { localStorage.removeItem(AUTH_KEY); go('lock'); setTimeout(()=>$('#pwd').focus(),300); } });
    return;
  }
  openDialog({
    type:'warning', title:'نسخة احتياطية', message:'لم تُنشئ نسخة حديثة.',
    body: `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;font-size:12.5px;line-height:1.9;text-align:center"><div><b style="color:var(--navy);font-size:15px">${claims.length}</b> مطالبة · <b style="color:var(--navy);font-size:15px">${providers.length}</b> جهة · <b style="color:var(--navy);font-size:15px">${workSessions.length}</b> جلسة</div><div style="color:var(--muted);font-size:11px;margin-top:4px">آخر: ${getLastBackupAgo() || 'لم'}</div></div><div style="margin-top:14px;text-align:center"><button type="button" class="btn-xs danger" onclick="confirmLogoutWithoutBackup()" style="padding:9px 18px;font-size:12px;font-weight:700">خروج بدون نسخة</button></div>`,
    confirmText:'تصدير وخروج', cancelText:'إلغاء',
    onConfirm: () => { doExportBackup(true); setTimeout(() => { localStorage.removeItem(AUTH_KEY); go('lock'); setTimeout(()=>$('#pwd').focus(),300); }, 500); }
  });
}
function confirmLogoutWithoutBackup(){
  closeDialog();
  setTimeout(() => {
    openDialog({ type:'danger', title:'خروج', message:'متأكد من الخروج بدون نسخة؟', confirmText:'خروج', cancelText:'إلغاء',
      onConfirm: () => { localStorage.removeItem(AUTH_KEY); go('lock'); setTimeout(()=>$('#pwd').focus(),300); } });
  }, 200);
}
function bindSettingsPassword(){
  document.querySelectorAll('#page-settings .onb-eye').forEach(btn => {
    if(btn.dataset.bound) return; btn.dataset.bound='1';
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if(!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'إخفاء' : 'إظهار');
    });
  });
  const newPwd = document.getElementById('newPwd');
  const bar = document.getElementById('setPwdBar');
  if(newPwd && bar && !newPwd.dataset.bound){ newPwd.dataset.bound='1';
    newPwd.addEventListener('input', () => {
      const v = newPwd.value; let score = 0;
      if(v.length > 0) score = 1;
      if(v.length >= 6) score = 2;
      if(v.length >= 10) score = 3;
      if(/[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v)) score = Math.max(score, 3);
      if(v.length >= 6 && /[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v)) score = 4;
      if(/[^A-Za-z0-9\u0600-\u06FF]/.test(v)) score = Math.min(4, score+1);
      bar.style.width = (score*25)+'%';
      bar.className = 'pw-bar s'+score;
    });
  }
}
function applyAppSettingsToUI(){
  try {
    const brandH3 = document.querySelector('.brand h3'), brandSpan = document.querySelector('.brand span');
    if(brandH3) brandH3.textContent = appSettings.company.brand;
    if(brandSpan) brandSpan.textContent = `${appSettings.company.version} — ${appSettings.company.name}`;
    const sN = document.getElementById('sidebarUserName'), sR = document.getElementById('sidebarUserRole'), sA = document.getElementById('sidebarAvatar');
    if(sN) sN.textContent = appSettings.reviewer.name;
    if(sR) sR.textContent = appSettings.reviewer.role;
    if(sA) sA.textContent = (appSettings.reviewer.name||'أ').trim().charAt(0);
    const tN = document.getElementById('tbUserName'), tR = document.getElementById('tbUserRole'), tA = document.getElementById('tbAvatar');
    if(tN) tN.textContent = appSettings.reviewer.name;
    if(tR) tR.textContent = appSettings.reviewer.role;
    if(tA) tA.textContent = (appSettings.reviewer.name||'أ').trim().charAt(0);
    const spT = document.querySelector('.sp-title');
    if(spT){ const parts = (appSettings.company.brand||'TPA Pro').trim().split(/\s+/); spT.innerHTML = parts.length > 1 ? `${escapeHtml(parts[0])} <span>${escapeHtml(parts.slice(1).join(' '))}</span>` : escapeHtml(parts[0]||'TPA Pro'); }
    const spS = document.querySelector('.sp-sub'); if(spS) spS.textContent = appSettings.company.tagline;
    const spB = document.querySelector('.sp-badge'); if(spB) spB.textContent = appSettings.company.version;
    const ldH = document.querySelector('.ld-head h2'); if(ldH) ldH.textContent = appSettings.company.brand;
    const lf = document.querySelector('.lock-foot'); if(lf) lf.innerHTML = `${escapeHtml(appSettings.company.brand)} ${escapeHtml(appSettings.company.version)}`;
    document.title = `${appSettings.company.brand} ${appSettings.company.version}`;
    const s1 = document.getElementById('settingsReviewerName'); if(s1) s1.textContent = appSettings.reviewer.name;
    const s2 = document.getElementById('settingsReviewerRole'); if(s2) s2.textContent = appSettings.reviewer.role;
    const s3 = document.getElementById('settingsCompanyName'); if(s3) s3.textContent = appSettings.company.name;
    const s4 = document.getElementById('settingsCompanyBrand'); if(s4) s4.textContent = appSettings.company.brand;
    const s5 = document.getElementById('settingsVersion'); if(s5) s5.textContent = appSettings.company.version;
    const i1 = document.getElementById('setReviewerName'); if(i1) i1.value = appSettings.reviewer.name;
    const i2 = document.getElementById('setReviewerRole'); if(i2) i2.value = appSettings.reviewer.role;
    const i3 = document.getElementById('setCompanyName'); if(i3) i3.value = appSettings.company.name;
    const i4 = document.getElementById('setCompanyBrand'); if(i4) i4.value = appSettings.company.brand;
    const i5 = document.getElementById('setCompanyTagline'); if(i5) i5.value = appSettings.company.tagline;
    if(typeof EXPORT_BRAND !== 'undefined' && EXPORT_BRAND){ try { EXPORT_BRAND.name = appSettings.company.brand; EXPORT_BRAND.sub = appSettings.company.tagline; EXPORT_BRAND.version = appSettings.company.version; } catch(e){} }
  } catch(e){ console.warn('applyAppSettingsToUI', e); }
}
function logout(){ if(typeof logoutWithReminder === 'function') logoutWithReminder(); }
