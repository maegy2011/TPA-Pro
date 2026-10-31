const MODAL_BATCH = `
<!-- نافذة الدفعة -->
    <div class="modal" id="batchModal">
      <div class="modal-bg" data-close-batch></div>
      <div class="modal-panel wide">
        <div class="modal-head"><div><h3 id="btModalTitle">استلام مطالبة</h3><p id="btModalSub">—</p></div><button class="close-btn" data-close-batch><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="fg full"><label>الجهة *</label>
              <div style="display:flex;gap:6px">
                <input id="btProviderSearch" placeholder="بحث جهة..." style="flex:1">

              </div>
              <select id="btProvider" style="margin-top:6px"></select>
            </div>
            <div class="fg"><label>نوع الفترة</label><select id="btPeriodType"><option value="single">فترة واحدة</option><option value="multi">فترات متعددة (متتالية)</option><option value="scattered">فترات متفرقة</option></select></div>
            <div class="fg"><label>الشهر / الأشهر *</label><input id="btMonth" placeholder="2025-01 أو 2025-01,2025-02"></div>

            <div class="fg"><label>الحالة</label><select id="btStatus"><option value="new">جديدة</option><option value="received">وارد جديد</option><option value="under-review">قيد المعالجة</option><option value="completed">مكتمل</option></select></div>
            <div class="fg"><label>رقم وارد المطالبة</label><input id="btNumber" readonly></div>

            <div class="fg"><label>تاريخ وارد المطالبة</label><input id="btClaimReceivedDate" type="date"></div>
            <div class="fg"><label>القيمة الإجمالية (ج.م) *</label><input id="btBilled" type="number" min="0" placeholder="0"></div>
            <div class="fg full"><label>ملاحظات</label><textarea id="btNotes"></textarea></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveBatch" data-i18n="common.save">حفظ</button><button class="btn solid alt" id="saveBatchAnother">حفظ + جديد</button><button class="btn danger" id="deleteBatch" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-batch data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;