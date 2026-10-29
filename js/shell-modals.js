const SHELL_MODALS = `
<!-- ============================================================
     نافذة الحوار الموحدة
     ============================================================ -->
<div class="dialog-overlay" id="unifiedDialog">
  <div class="dialog-backdrop" data-dialog-close></div>
  <div class="dialog-box">
    <button class="dialog-close-x" data-dialog-close><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    <div class="dialog-icon-wrap info" id="dialogIcon"></div>
    <div class="dialog-title" id="dialogTitle">—</div>
    <div class="dialog-message" id="dialogMessage">—</div>
    <div class="dialog-body" id="dialogBody"></div>
    <div class="dialog-actions" id="dialogActions"></div>
  </div>
</div>

<!-- حاوية النوافذ المنبثقة الديناميكية -->
<div id="modalsContainer"></div>

<!-- الإشعار -->
<div class="toast" id="toast"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span id="toastMsg">تم الحفظ</span></div>
`;
