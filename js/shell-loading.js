const SHELL_LOADING = `
<div id="loading" class="screen">
  <div class="ld-wrap">
    <div class="ld-head">
      <div class="logo-mark">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 4 L42 11 V24 C42 34.5 34 42.5 24 45.5 C14 42.5 6 34.5 6 24 V11 Z" fill="rgba(255,255,255,.07)" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M16 24 L21.5 29.5 L33 18" stroke="#C8A24A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div><h2>TPA Pro</h2><p data-i18n="loading">جارٍ تهيئة النظام</p></div>
    </div>
    <div>
      <div class="ld-track"><div class="ld-fill" id="ldFill"></div></div>
      <div class="ld-meta" style="margin-top:10px"><span id="ldStatus" data-i18n="loading.start">بدء التشغيل...</span><span class="ld-pct" id="ldPct">0%</span></div>
    </div>
  </div>
  <div class="ld-foot">© 2026 TPA Pro — جميع الحقوق محفوظة</div>
</div>
`;