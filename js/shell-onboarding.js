const SHELL_ONBOARDING = `
<div id="onboarding" class="screen">
  <div class="lock-card" id="onbCard" style="max-width:520px">
    <div class="lock-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2 L20 7 V13 C20 18 16 21.5 12 22.5 C8 21.5 4 18 4 13 V7 Z"/>
        <path d="M9 12 L11.5 14.5 L15.5 10.5"/>
      </svg>
    </div>
    <h1>إعداد أول تشغيل</h1>
    <p class="hint">خصّص هوية النظام وحدد كلمة المرور</p>
    <div id="onbStep1">
      <div class="form-grid" style="grid-template-columns:1fr">
        <div class="fg"><label>اسم المراجع</label><input id="onbReviewerName" placeholder="أحمد المراجع"></div>
        <div class="fg"><label>الدور</label><input id="onbReviewerRole" placeholder="مراجع مالي معتمد"></div>
        <div class="fg"><label>اسم الشركة</label><input id="onbCompanyName" placeholder="TPA"></div>
        <div class="fg"><label>العلامة التجارية</label><input id="onbCompanyBrand" placeholder="TPA Pro"></div>
        <div class="fg"><label>كلمة المرور</label><input type="password" id="onbPwd" autocomplete="new-password" placeholder="6 أحرف على الأقل"></div>
        <div class="fg"><label>تأكيد كلمة المرور</label><input type="password" id="onbPwdConfirm" autocomplete="new-password"></div>
      </div>
      <button class="btn-primary" id="onbNextBtn" style="width:100%;margin-top:16px">
        <span>متابعة</span>
      </button>
      <div class="err" id="onbErr"><span></span></div>
    </div>
    <div id="onbStep2" style="display:none">
      <p style="text-align:center;margin:14px 0;font-size:13px;color:var(--muted)">هل لديك بيانات محفوظة (نسخة احتياطية) تريد استيرادها؟</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <button class="btn solid" id="onbImportBtn">استيراد بيانات</button>
        <button class="btn out" id="onbSkipBtn">لا، ابدأ من جديد</button>
      </div>
      <input type="file" id="onbImportFile" accept=".json,application/json" style="display:none">
    </div>
  </div>
</div>
`;