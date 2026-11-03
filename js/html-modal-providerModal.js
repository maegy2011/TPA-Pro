// html-modal-providerModal.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const MODAL_PROVIDER = `
<!-- نافذة الجهة -->
    <div class="modal" id="providerModal">
      <div class="modal-bg" data-close-provider></div>
      <div class="modal-panel">
        <div class="modal-head"><div><h3 id="prvModalTitle">إضافة جهة</h3><p id="prvModalSub">—</p></div><button class="close-btn" data-close-provider><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="rv-section-title">بيانات الجهة</div>
          <div class="form-grid">
            <div class="fg full"><label>اسم الجهة <span style="color:var(--bad,#DC2626)">*</span></label><input id="pvName" required><div class="hint">اسم الجهة كما يظهر في المطالبات</div></div>
            <div class="fg"><label>كود الجهة</label><input id="pvCode" readonly><div class="hint">رقم فريد يُولد تلقائيًا</div></div>
            <div class="fg"><label>النوع</label><select id="pvType"><option>مستشفى</option><option>معمل تحاليل</option><option>مركز أشعة</option><option>صيدلية</option></select></div>
          </div>
          <div class="rv-section-title">الموقع</div>
          <div class="form-grid">
            <div class="fg full"><label>المحافظة</label>
              <div style="display:flex;gap:6px;margin-bottom:6px">
                <input id="pvProvinceSearch" placeholder="بحث في المحافظات..." style="flex:1">
                <button type="button" class="btn-xs" id="pvSelectVisible">تحديد الظاهر</button>
                <button type="button" class="btn-xs" id="pvClearVisible">إلغاء الظاهر</button>
              </div>
              <div id="pvProvinceList" style="max-height:160px;overflow:auto;border:1px solid var(--line,#E2E8F0);border-radius:8px;padding:6px"></div>
            </div>
          </div>
          <div class="rv-section-title">التواصل</div>
          <div class="form-grid">
            <div class="fg"><label>المسؤول</label><input id="pvContact" placeholder="اسم المسؤول"></div>
            <div class="fg"><label>الهاتف</label><input id="pvPhone" type="tel" inputmode="tel" placeholder="01xxxxxxxxx"></div>
            <div class="fg full"><label>البريد</label><input id="pvEmail" type="email" inputmode="email" placeholder="example@domain.com"></div>
          </div>
          <div class="rv-section-title">خيارات</div>
          <div class="form-grid">
            <div class="fg full"><label>ملاحظات</label><textarea id="pvNotes" rows="3"></textarea></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveProvider" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteProvider" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-provider data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
