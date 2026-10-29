const PAGE_SETTINGS = `
<section class="page" id="page-settings">
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h2>بيانات المراجع</h2><p>الحساب النشط</p></div></div>
          <div class="panel-body"><div class="info-list">
            <div class="info-row"><span class="k">الاسم</span><span class="v" id="settingsReviewerName">أحمد المراجع</span></div>
            <div class="info-row"><span class="k">الدور</span><span class="v" id="settingsReviewerRole">مراجع مالي معتمد</span></div>
            <div class="info-row"><span class="k">الصلاحية</span><span class="v">مراجع واحد (كامل)</span></div>
            <div class="info-row"><span class="k">الحالة</span><span class="v" style="color:var(--ok)">نشط</span></div>
          </div></div>
        </div>
        <div class="panel"><div class="panel-head"><div><h2>معلومات النظام</h2></div></div>
          <div class="panel-body"><div class="info-list">
            <div class="info-row"><span class="k">اسم الشركة</span><span class="v" id="settingsCompanyName">TPA</span></div>
            <div class="info-row"><span class="k">العلامة</span><span class="v" id="settingsCompanyBrand">TPA Pro</span></div>
            <div class="info-row"><span class="k">الإصدار</span><span class="v" id="settingsVersion">v1.0</span></div>
           <div class="info-row"><span class="k">المحذوفات</span><span class="v" id="settingsTrashCount">0</span></div>
           <div class="info-row"><div style="flex:1"><div class="k">تثبيت التطبيق</div><div style="font-size:11px;color:var(--muted);margin-top:4px">PWA على Android</div></div>
             <button class="btn-sm" id="installAppBtn" style="flex:0 0 auto;display:none" onclick="installApp()">تثبيت</button></div>
           </div>
           <button class="btn out" style="width:100%;margin-top:20px" id="logoutBtn2">تسجيل الخروج</button></div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>تخصيص الهوية</h2></div></div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="fg"><label>اسم المراجع</label><input id="setReviewerName"></div>
            <div class="fg"><label>الدور</label><input id="setReviewerRole"></div>
            <div class="fg"><label>اسم الشركة</label><input id="setCompanyName"></div>
            <div class="fg"><label>العلامة التجارية</label><input id="setCompanyBrand"></div>
            <div class="fg full"><label>الوصف</label><input id="setCompanyTagline"></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn solid" id="saveAppSettingsBtn" style="flex:1;min-width:140px" data-i18n="common.save">حفظ</button>
            <button class="btn out" id="resetAppSettingsBtn" style="flex:0 0 auto;padding:0 20px">استعادة</button>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>الأمان</h2><p>تغيير كلمة المرور</p></div></div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="fg full"><label>كلمة المرور الحالية</label><input type="password" id="oldPwd" autocomplete="current-password"></div>
            <div class="fg"><label>الجديدة</label><input type="password" id="newPwd" autocomplete="new-password"></div>
            <div class="fg"><label>التأكيد</label><input type="password" id="confirmPwd" autocomplete="new-password"></div>
          </div>
           <button class="btn solid" id="changePwdBtn" style="width:100%;margin-top:16px">تغيير كلمة المرور</button>
        </div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>إدارة البيانات</h2></div></div>
        <div class="panel-body"><div class="info-list">
          <div class="info-row"><div style="flex:1"><div class="k">مسح كل البيانات</div><div style="font-size:11px;color:var(--muted);margin-top:4px">حذف كل البيانات المحفوظة محلياً</div></div>
            <button class="btn-sm ghost" id="resetAllDataBtn" style="flex:0 0 auto;color:var(--bad);border-color:#FECACA">مسح</button></div>
        </div></div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>النسخ الاحتياطي والاستعادة</h2><p>كامل البيانات + الإعدادات + الجلسات</p></div></div>
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
    </section>
`;
