const SHELL_LOCK = `
<!-- ============================================================
     شاشة القفل
     ============================================================ -->
<div id="lock" class="screen">
  <div class="lock-card" id="lockCard">
    <div class="lock-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3.5" y="10.5" width="17" height="11" rx="2.5"/>
        <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/>
        <circle cx="12" cy="16" r="1.4"/>
      </svg>
    </div>
    <h1 data-i18n="auth.title">تسجيل الدخول</h1>
    <p class="hint" data-i18n="auth.hint">أدخل كلمة المرور الخاصة بالمراجع للوصول إلى النظام</p>
    <form id="lockForm" autocomplete="off">
      <div class="field">
        <label for="pwd">كلمة المرور</label>
        <input type="text" name="username" autocomplete="username" style="position:absolute;opacity:0;height:0;width:0" tabindex="-1" aria-hidden="true">
        <div class="input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          <input type="password" id="pwd" placeholder="••••••••" autocomplete="current-password">
          <button type="button" class="eye-btn" id="eyeBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <div class="err" id="lockErr"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg><span>كلمة المرور غير صحيحة</span></div>
      <button type="submit" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
        <span data-i18n="auth.login">دخول النظام</span>
      </button>
    </form>
    <div class="lock-foot">TPA Pro v1.0 — نظام المراجعة المالية</div>
  </div>
</div>
`;
