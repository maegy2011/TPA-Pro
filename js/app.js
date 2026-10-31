function renderAll(){
  renderKPIs(); renderRecent(); renderDonut(); renderReasonBars('#reasonBars');
  renderClaims(); renderIntake(); renderProviders(); renderContracts();
  renderTariffs(); renderReports(); renderSearch(); renderTrash(); renderDeductionRules();
  renderSessions();
  updateTrashBadge(); updateBackupStats();
  persistData();
}
let appReady = false;
function initApp(){
  if(!appReady){
    appReady = true;
    bindNav();
    if(typeof bindMobile === 'function') bindMobile();
    if(typeof bindShortcuts === 'function') bindShortcuts();
    const langBtn = document.getElementById('tbLangBtn');
    if(langBtn){
      langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
      langBtn.addEventListener('click', () => { setLang(currentLang === 'ar' ? 'en' : 'ar'); langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR'; });
    }
    if(typeof applyAllTranslations === 'function') applyAllTranslations();
    bindClaimsControls();
    bindReviewModal();
    bindProvidersControls();
    bindContractsControls();
    bindTariffsControls();
    bindIntakeControls();
    bindSearchControls();
    bindTrashControls();
    bindDeductionRulesControls();
    bindSessionsControls();
    $('#timelineBackBtn').addEventListener('click', goBack);
    $('#timelineReviewBtn').addEventListener('click', () => { if(currentTimelineClaimId) openReview(currentTimelineClaimId); });
    let t1, t2;
    $('#dashSearch').addEventListener('input', e => { clearTimeout(t1); t1 = setTimeout(() => { dashSearchTerm = e.target.value.trim(); renderRecent(); }, 200); });
    $('#reportsSearch').addEventListener('input', e => { clearTimeout(t2); t2 = setTimeout(() => { reportsSearchTerm = e.target.value.trim(); renderReports(); }, 200); });
    currentPage = 'dashboard';
    if(typeof setLang === 'function') setLang(currentLang || 'ar');
    if(typeof applyPage === 'function') applyPage('dashboard');
    $('#logoutBtn').addEventListener('click', logout);
    $('#logoutBtn2').addEventListener('click', logout);

    // أزرار التصدير/الاستيراد
    const _eB = $('#exportBackupBtn'), _eS = $('#exportSettingsBtn'), _eSess = $('#exportSessionsBtn'), _iB = $('#importBackupBtn'), _iF = $('#importBackupFile');
    if(_eB) _eB.addEventListener('click', exportBackup);
    if(_eS) _eS.addEventListener('click', exportSettings);
    if(_eSess) _eSess.addEventListener('click', exportSessions);
    if(_iB && _iF){ _iB.addEventListener('click', () => _iF.click()); _iF.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) importBackupFile(f); e.target.value = ''; }); }

    // تخصيص
    const saveSet = $('#saveAppSettingsBtn'), resetSet = $('#resetAppSettingsBtn');
    if(saveSet) saveSet.addEventListener('click', () => {
      const n = ($('#setReviewerName')?.value||'').trim(), r = ($('#setReviewerRole')?.value||'').trim();
      const cn = ($('#setCompanyName')?.value||'').trim(), cb = ($('#setCompanyBrand')?.value||'').trim(), ct = ($('#setCompanyTagline')?.value||'').trim();
      if(!n){ showWarning('تنبيه','أدخل اسم المراجع'); return; }
      if(!cb){ showWarning('تنبيه','أدخل العلامة'); return; }
      appSettings.reviewer.name = n; appSettings.reviewer.role = r || 'مراجع مالي معتمد';
      appSettings.company.name = cn || 'TPA'; appSettings.company.brand = cb; appSettings.company.tagline = ct || appSettings.company.tagline;
      saveAppSettings(); applyAppSettingsToUI(); updateBackupStats(); showSuccess('تم','تم');
    });
    if(resetSet) resetSet.addEventListener('click', () => {
      openDialog({ type:'warning', title:'استعادة', message:'سيتم إعادة التعيين.', confirmText:'استعادة', cancelText:'إلغاء',
        onConfirm: () => { appSettings = { reviewer:{ name:'المراجع', role:'مراجع مالي معتمد' }, company:{ name:'TPA', brand:'TPA Pro', tagline:'نظام المراجعة المالية', version:'v1.0' } }; saveAppSettings(); applyAppSettingsToUI(); updateBackupStats(); showSuccess('تم','تم'); } });
    });

    // كلمة المرور
    const chgBtn = $('#changePwdBtn');
    if(chgBtn) chgBtn.addEventListener('click', async () => {
      const oldP = $('#oldPwd').value, newP = $('#newPwd').value, confP = $('#confirmPwd').value;
      if(!oldP || !newP){ showWarning('تنبيه','املأ الحقول'); return; }
      if(newP !== confP){ showWarning('تنبيه','التأكيد لا يطابق'); return; }
      try { await changePassword(oldP, newP); $('#oldPwd').value = ''; $('#newPwd').value = ''; $('#confirmPwd').value = ''; showSuccess('تم','تم التغيير'); }
      catch(err){ showWarning('خطأ', err.message); }
    });

    // مسح البيانات
    const resetAll = $('#resetAllDataBtn');
    if(resetAll) resetAll.addEventListener('click', () => {
      showDelete('مسح كل البيانات', 'سيتم حذف كل شيء والعودة للافتراضي. <b>لا يمكن التراجع.</b>', () => {
        try { localStorage.removeItem(DATA_STORE_KEY); localStorage.removeItem(SESSIONS_KEY); localStorage.removeItem(LAST_BACKUP_KEY); localStorage.removeItem(PWD_HASH_KEY); showSuccess('تم','إعادة التحميل...'); setTimeout(() => location.reload(), 1200); }
        catch(e){ showWarning('خطأ', e.message); }
      });
    });

    // شريط علوي
    const tbB = document.getElementById('tbBackupBtn'), tbU = document.getElementById('tbUserBtn'), tbT = document.getElementById('tbTrashBtn');
    if(tbB) tbB.addEventListener('click', () => doExportBackup(false));
    if(tbT) tbT.addEventListener('click', () => { if(currentPage && currentPage !== 'trash') navHistory.push({ page: currentPage, viewType: viewState.type, viewId: viewState.id }); navigateTo('trash', {noPush:true}); });
    const sb = document.getElementById('smartBackBtn');
    if(sb) sb.addEventListener('click', goBack);
    document.addEventListener('click', (e) => { const m = document.getElementById('tbUserMenu'); if(m && !e.target.closest('#tbUserWrap')) m.style.display = 'none'; });
    const tm = document.getElementById('tbUserMenu');
    if(tm) tm.addEventListener('click', (e) => {
      const btn = e.target.closest('.tb-menu-item'); if(!btn) return;
      const action = btn.dataset.action;
      const m = document.getElementById('tbUserMenu'); if(m) m.style.display = 'none';
    if(action === 'help'){ navHistory = []; navigateTo('help', {noPush:true}); }
    if(action === 'settings'){ navHistory = []; navigateTo('settings', {noPush:true}); }
    if(action === 'lang'){ setLang(currentLang === 'ar' ? 'en' : 'ar'); const item = tm.querySelector('[data-action=\"lang\"]'); if(item) item.textContent = currentLang === 'ar' ? 'اللغة: EN' : 'Language: AR'; }
    });

    // ⏱️ حفظ تلقائي كل 20 ثانية
    if(!window._autosaveInterval){
      window._autosaveInterval = setInterval(() => {
        try { if(activeClaim && document.getElementById('reviewModal')?.classList.contains('open')) upsertCurrentSession(); } catch(e){}
      }, 20000);
    }

    // ⚠️ تحذير قبل الإغلاق
    if(!window._unloadBound){
      window._unloadBound = true;
      window.addEventListener('beforeunload', (e) => {
        try {
          if(activeClaim && document.getElementById('reviewModal')?.classList.contains('open')){
            upsertCurrentSession();
            if(_hasUnsavedChanges()){ e.preventDefault(); e.returnValue = ''; return ''; }
          }
        } catch(err){}
      });
    }

    // ⌨️ اختصارات لوحة المفاتيح
    document.addEventListener('keydown', e => {
      if(document.getElementById('reviewModal')?.classList.contains('open')){
        if((e.ctrlKey || e.metaKey) && e.key === 's'){ e.preventDefault(); saveReview(); return; }
        if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); finalizeReview(); return; }
      }
      if((e.ctrlKey || e.metaKey) && e.key === '/'){
        e.preventDefault();
        if(currentPage === 'claims') $('#searchInput')?.focus();
        else if(currentPage === 'search') $('#srchQuery')?.focus();
        else if(currentPage === 'sessions') $('#sessionsSearch')?.focus();
      }
    });

    loadSessions(); updateSessionsBadge();
  }
  renderAll();
  if (typeof checkOverdueClaims === 'function') setTimeout(checkOverdueClaims, 1000);
  setTimeout(() => { if(typeof translateDOMMulti === 'function') translateDOMMulti(); else if(typeof translateDOM === 'function') translateDOM(document.body); }, 0);
}
