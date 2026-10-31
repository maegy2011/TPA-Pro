const PAGE_SETTINGS = `
<section class="page" id="page-settings">
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div style="display:flex;align-items:center;gap:10px"><svg class="panel-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><div><h2>تخصيص الهوية</h2><p>تحديث بياناتك وبيانات الشركة</p></div></div></div>
        <div class="panel-body">
          <div class="form-grid">
<div class="fg"><label>اسم المراجع</label><input id="setReviewerName"><small class="fg-hint">اسمك (مثال: أحمد المراجع)</small></div>
<div class="fg"><label>الدور</label><input id="setReviewerRole"><small class="fg-hint">مراجع مالي معتمد</small></div>
<div class="fg"><label>اسم الشركة</label><input id="setCompanyName"><small class="fg-hint">اسم الجهة (TPA)</small></div>
<div class="fg"><label>العلامة التجارية</label><input id="setCompanyBrand"><small class="fg-hint">اسم التطبيق (TPA Pro)</small></div>
<div class="fg full"><label>الوصف</label><input id="setCompanyTagline"><small class="fg-hint">وصف مختصر للنظام</small></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn solid" id="saveAppSettingsBtn" style="flex:1;min-width:140px" data-i18n="common.save">حفظ</button>
            <button class="btn out" id="resetAppSettingsBtn" style="flex:0 0 auto;padding:0 20px">استعادة</button>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div style="display:flex;align-items:center;gap:10px"><svg class="panel-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><div><h2>الأمان</h2><p>تغيير كلمة المرور</p></div></div></div>
        <div class="panel-body">
<div class="form-grid">
  <div class="fg full"><label>كلمة المرور الحالية</label><form class="pw-wrap" autocomplete="off" onsubmit="return false;"><input type="text" name="username" autocomplete="username" style="position:absolute;opacity:0;height:0;width:0" tabindex="-1" aria-hidden="true"><input type="password" id="oldPwd" autocomplete="current-password"><button type="button" class="eye-btn onb-eye" data-target="oldPwd" aria-label="إظهار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></form><small class="fg-hint">أدخل كلمة المرور الحالية للتحقق</small></div>
  <div class="fg"><label>الجديدة</label><form class="pw-wrap" autocomplete="off" onsubmit="return false;"><input type="text" name="username" autocomplete="username" style="position:absolute;opacity:0;height:0;width:0" tabindex="-1" aria-hidden="true"><input type="password" id="newPwd" autocomplete="new-password"><button type="button" class="eye-btn onb-eye" data-target="newPwd" aria-label="إظهار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></form><div class="pw-strength"><div class="pw-bar" id="setPwdBar"></div></div><small class="fg-hint">6+ أحرف، حرف ورقم</small></div>
  <div class="fg"><label>التأكيد</label><form class="pw-wrap" autocomplete="off" onsubmit="return false;"><input type="text" name="username" autocomplete="username" style="position:absolute;opacity:0;height:0;width:0" tabindex="-1" aria-hidden="true"><input type="password" id="confirmPwd" autocomplete="new-password"><button type="button" class="eye-btn onb-eye" data-target="confirmPwd" aria-label="إظهار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></form><small class="fg-hint">أعد كتابة كلمة المرور الجديدة</small></div>
</div>
           <button class="btn solid" id="changePwdBtn" style="width:100%;margin-top:16px">تغيير كلمة المرور</button>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div style="display:flex;align-items:center;gap:10px"><svg class="panel-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg><div><h2>إدارة البيانات</h2><p>مسح كل البيانات المحفوظة محلياً</p></div></div></div>
        <div class="panel-body"><div class="info-list">
          <div class="info-row"><div style="flex:1"><div class="k">مسح كل البيانات</div><div style="font-size:11px;color:var(--muted);margin-top:4px">حذف كل البيانات المحفوظة محلياً</div></div>
            <button class="btn-sm ghost" id="resetAllDataBtn" style="flex:0 0 auto;color:var(--bad);border-color:#FECACA">مسح</button></div>
        </div></div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div style="display:flex;align-items:center;gap:10px"><svg class="panel-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><div><h2>النسخ الاحتياطي والاستعادة</h2><p>كامل البيانات + الإعدادات + الجلسات</p></div></div></div>
        <div class="panel-body">
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:11px 14px;font-size:12px;color:#475569;line-height:1.9;margin-bottom:14px">
            <b style="color:var(--navy)">الحالة:</b>
            <span id="backupStats">—</span>
          </div>
          <div class="info-list">
            <div class="info-row"><div style="flex:1"><div class="k">نسخة كاملة</div><div style="font-size:11px;color:var(--muted);margin-top:4px">بيانات + إعدادات + جلسات + حالة صفحة</div></div>
              <button class="btn-sm" id="exportBackupBtn" style="flex:0 0 auto" data-i18n="common.export">تصدير</button></div>
            <div class="info-row"><div style="flex:1"><div class="k">الإعدادات فقط</div></div>
              <button class="btn-sm ghost" id="exportSettingsBtn" style="flex:0 0 auto" data-i18n="common.export">تصدير</button></div>
            <div class="info-row"><div style="flex:1"><div class="k">جلسات فقط</div></div>
              <button class="btn-sm ghost" id="exportSessionsBtn" style="flex:0 0 auto" data-i18n="common.export">تصدير</button></div>
            <div class="info-row"><div style="flex:1"><div class="k">استيراد</div><div style="font-size:11px;color:var(--muted);margin-top:4px">نسخة / إعدادات / جلسات</div></div>
              <button class="btn-sm" id="importBackupBtn" style="flex:0 0 auto">اختر ملف</button>
              <input type="file" id="importBackupFile" accept=".json,application/json" style="display:none">
            </div>
          </div>
          <div class="alert-banner show" style="margin-top:16px;margin-bottom:0;background:#FEF3C7;border-color:#FCD34D;color:#92400E;font-size:12px;padding:11px 14px;display:flex">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;stroke:#D97706;flex:none"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            <span style="line-height:1.6">تذكير: سيُطلب إنشاء نسخة احتياطية عند تسجيل الخروج.</span>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-body" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div><div class="k" style="font-weight:700">تسجيل الخروج</div><div style="font-size:11px;color:var(--muted);margin-top:4px">إنهاء الجلسة الحالية</div></div>
        <button class="btn out" id="logoutBtn2">تسجيل الخروج</button>
      </div></div>
    </section>
`;
