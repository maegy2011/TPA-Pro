const MODAL_TARIFF = `
<!-- نافذة اللائحة -->
    <div class="modal" id="tariffModal">
      <div class="modal-bg" data-close-tariff></div>
      <div class="modal-panel wide">
        <div class="modal-head"><div><h3 id="tfModalTitle">إضافة لائحة</h3><p id="tfModalSub">—</p></div><button class="close-btn" data-close-tariff><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="tf-tabs">
            <button type="button" class="tf-tab active" data-tf-tab="basic">أساسية</button>
            <button type="button" class="tf-tab" data-tf-tab="services">أسعار</button>
            <button type="button" class="tf-tab" data-tf-tab="annual">زيادات</button>
            <button type="button" class="tf-tab" data-tf-tab="links">ربط</button>
          </div>
          <div class="tf-panel active" data-tf-panel="basic">
            <div class="form-grid">
              <div class="fg full"><label>الاسم *</label><input id="tfName"></div>
              <div class="fg"><label>النوع</label><select id="tfType"><option value="general">عامة</option><option value="private">خاصة</option><option value="supplementary">مكملة</option></select></div>
              <div class="fg"><label>الحالة</label><select id="tfStatus"><option value="active">نشطة</option><option value="pending">قيد الاعتماد</option><option value="cancelled">ملغاة</option></select></div>
              <div class="fg"><label>السريان *</label><input id="tfEffective" type="date"></div>
              <div class="fg"><label>الانتهاء</label><input id="tfExpiry" type="date"></div>
              <div class="fg"><label>مستوى السعر %</label><input id="tfPriceLevel" type="number" min="1" max="500"></div>
              <div class="fg"><label>الرقم</label><input id="tfNumber" readonly></div>
              <div class="fg full"><label>الوصف</label><textarea id="tfDescription"></textarea></div>
            </div>
          </div>
          <div class="tf-panel" data-tf-panel="services">
            <div class="adjust-box">
              <h4>تطبيق نسبة على الخدمات</h4>
              <div class="adjust-grid">
                <div class="fg"><label>النوع</label><select id="tfAdjustType"><option value="none">بدون</option><option value="discount">خصم</option><option value="increase">زيادة</option></select></div>
                <div class="fg"><label>النسبة %</label><input id="tfAdjustRate" type="number" min="0" max="100" step="0.5"></div>
              </div>
              <div class="adjust-actions">
                <button type="button" class="btn-apply" id="tfApplyAll">الجميع</button>
                <button type="button" class="btn-apply out" id="tfApplySelected" disabled>المحدد (<span id="tfSelCount">0</span>)</button>
                <button type="button" class="btn-apply out" id="tfResetBase">أساسي</button>
              </div>
              <div class="adjust-preview" id="tfAdjustPreview">لا خدمات</div>
            </div>
            <div class="bulk-bar" id="tfBulkBar"><span>محدد: <b id="tfBulkCount">0</b></span><button type="button" id="tfBulkDelete" data-i18n="common.delete">حذف</button></div>
            <div class="services-head"><h4>الخدمات (<span id="tfServicesCount">0</span>)</h4>
              <button type="button" class="btn-add-sm" id="tfAddServiceBtn">+ إضافة</button>
            </div>
            <div class="services-wrap"><table class="services-table"><thead><tr><th style="width:34px"><input type="checkbox" id="tfSelectAll"></th><th>الكود</th><th>الخدمة</th><th>الأساسي</th><th>الحالي</th><th>التغطية</th><th></th></tr></thead><tbody id="tfServicesBody"></tbody></table></div>
          </div>
          <div class="tf-panel" data-tf-panel="annual">
            <div class="form-grid">
              <div class="fg"><label>النسبة %</label><input id="tfIncreaseRate" type="number" min="0" max="100" step="0.5"></div>
              <div class="fg"><label>آخر زيادة</label><input id="tfLastIncrease" type="date"></div>
              <div class="fg full"><label>الموافقة</label><input id="tfApprovedBy"></div>
            </div>
            <div style="margin:14px 0"><button type="button" class="btn-apply" id="tfApplyAnnual">تطبيق الزيادة</button></div>
            <div class="section-title" style="display:block">سجل الزيادات</div>
            <div class="history-list" id="tfHistoryList"></div>
          </div>
          <div class="tf-panel" data-tf-panel="links">
            <div class="link-list" id="linkContractsList"></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveTariff" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteTariff" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-tariff data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
