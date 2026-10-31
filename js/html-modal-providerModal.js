const MODAL_PROVIDER = `
<!-- نافذة الجهة -->
    <div class="modal" id="providerModal">
      <div class="modal-bg" data-close-provider></div>
      <div class="modal-panel">
        <div class="modal-head"><div><h3 id="prvModalTitle">إضافة جهة</h3><p id="prvModalSub">—</p></div><button class="close-btn" data-close-provider><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>اسم الجهة *</label><input id="pvName"></div>
          <div class="fg"><label>النوع</label><select id="pvType"><option>مستشفى</option><option>مجمع طبي</option><option>عيادة</option><option>مركز تخصصي</option><option>صيدلية</option><option>معمل</option></select></div>
          <div class="fg full"><label>المحافظة</label>
            <input id="pvProvinceSearch" placeholder="بحث في المحافظات..." style="margin-bottom:6px">
            <div id="pvProvinceList" style="max-height:160px;overflow:auto;border:1px solid var(--line,#E2E8F0);border-radius:8px;padding:6px"></div>
          </div>
          <div class="fg"><label>التواصل</label><input id="pvContact"></div>
          <div class="fg"><label>الهاتف</label><input id="pvPhone" type="tel"></div>
          <div class="fg full"><label>البريد</label><input id="pvEmail" type="email"></div>
          <div class="fg full"><label>ملاحظات</label><textarea id="pvNotes"></textarea></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="saveProvider" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteProvider" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-provider data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
