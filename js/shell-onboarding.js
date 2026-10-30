const SHELL_ONBOARDING = `
<div id="onboarding" class="screen">
  <button class="onb-lang" id="onbLangBtn" type="button">EN</button>
  <div class="lock-card onb-card" id="onbCard">
    <div class="lock-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2 L20 7 V13 C20 18 16 21.5 12 22.5 C8 21.5 4 18 4 13 V7 Z"/>
        <path d="M9 12 L11.5 14.5 L15.5 10.5"/>
      </svg>
    </div>
    <h1>إعداد أول تشغيل</h1>
    <p class="hint">خصّص هوية النظام وحدد كلمة المرور</p>
    <div class="onb-progress"><span class="onb-dot active"></span><span class="onb-dot"></span></div>
    <div id="onbStep1">
      <div class="form-grid onb-grid">
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>اسم المراجع</label><input id="onbReviewerName"><small class="fg-hint">اسمك (مثال: أحمد المراجع)</small></div>
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>الدور</label><input id="onbReviewerRole"><small class="fg-hint">مراجع مالي معتمد</small></div>
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>اسم الشركة</label><input id="onbCompanyName"><small class="fg-hint">اسم الجهة (TPA)</small></div>
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>العلامة التجارية</label><input id="onbCompanyBrand"><small class="fg-hint">اسم التطبيق (TPA Pro)</small></div>
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>كلمة المرور</label><div class="pw-wrap"><input type="password" id="onbPwd" autocomplete="new-password"><button type="button" class="eye-btn onb-eye" data-target="onbPwd" aria-label="إظهار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="pw-strength"><div class="pw-bar" id="onbPwdBar"></div></div><small class="fg-hint">الشروط: 6 أحرف على الأقل • حرف ورقم • تطابق التأكيد</small></div>
        <div class="fg"><label><svg class="fg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>تأكيد كلمة المرور</label><div class="pw-wrap"><input type="password" id="onbPwdConfirm" autocomplete="new-password"><button type="button" class="eye-btn onb-eye" data-target="onbPwdConfirm" aria-label="إظهار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div><small class="fg-hint">أدخل نفس كلمة المرور للتأكيد</small></div>
      </div>
      <button class="btn-primary" id="onbNextBtn" style="width:100%;margin-top:16px">
        <span>متابعة</span>
      </button>
      <div class="err" id="onbErr"><span></span></div>
    </div>
    <div id="onbStep2" style="display:none">
      <p style="text-align:center;margin:14px 0;font-size:13px;color:var(--muted)">هل لديك بيانات محفوظة (نسخة احتياطية) تريد استيرادها؟</p>
      <div class="onb-actions">
        <button class="btn solid" id="onbImportBtn">استيراد بيانات</button>
        <button class="btn out" id="onbSkipBtn">لا، ابدأ من جديد</button>
      </div>
      <input type="file" id="onbImportFile" accept=".json,application/json" style="display:none">
    </div>
  </div>
</div>
`;