const MODAL_BATCH = `
<!-- نافذة الدفعة -->
    <div class="modal" id="batchModal">
      <div class="modal-bg" data-close-batch></div>
      <div class="modal-panel wide">
        <div class="modal-head"><div><h3 id="btModalTitle">استلام دفعة</h3><p id="btModalSub">—</p></div><button class="close-btn" data-close-batch><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="fg full"><label>الجهة *</label><select id="btProvider"></select></div>
            <div class="fg"><label>الشهر *</label><input id="btMonth" type="month"></div>
            <div class="fg"><label>الاستلام *</label><input id="btReceivedDate" type="date"></div>
            <div class="fg"><label>الحالة</label><select id="btStatus"><option value="received">وارد جديد</option><option value="under-review">قيد المعالجة</option><option value="completed">مكتمل</option></select></div>
            <div class="fg"><label>رقم الدفعة</label><input id="btNumber" readonly></div>
            <div class="fg full"><label>ملاحظات</label><textarea id="btNotes"></textarea></div>
          </div>
          <div class="section-title" style="display:block">إدخال سريع</div>
          <div class="quick-add-form">
            <div class="qa-label">⚡ إضافة سريعة</div>
            <div class="qa-fields">
              <input id="qaRecNum" placeholder="رقم الوارد">
              <input id="qaPatient" placeholder="اسم المريض">
              <input id="qaDate" type="date">
              <input id="qaRecDate" type="date">
              <input id="qaBilled" type="number" placeholder="المبلغ" min="0">
              <button type="button" id="qaAddBtn">+</button>
            </div>
          </div>
          <div class="batch-claims-header"><div>الوارد</div><div>المريض</div><div>الخدمة</div><div>الوارد</div><div>المبلغ</div><div></div></div>
          <div class="batch-claims-list" id="btClaimsList"></div>
          <div class="batch-claims-summary"><span>عدد: <b id="btSummaryCount">0</b></span><span>الإجمالي: <b id="btSummaryTotal">0 ر.س</b></span></div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveBatch" data-i18n="common.save">حفظ</button><button class="btn solid alt" id="saveBatchAnother">حفظ + جديد</button><button class="btn danger" id="deleteBatch" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-batch data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
