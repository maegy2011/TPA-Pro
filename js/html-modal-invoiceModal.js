const MODAL_INVOICE = `
<!-- نافذة الفاتورة -->
    <div class="modal" id="invoiceModal">
      <div class="modal-bg" data-close-invoice></div>
      <div class="modal-panel" style="max-width:500px">
        <div class="modal-head"><div><h3 id="invModalTitle">إضافة فاتورة</h3><p id="invModalSub">—</p></div><button class="close-btn" data-close-invoice><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="fg"><label>نوع الفاتورة *</label><select id="invType"></select></div>
            <div class="fg"><label>رقم الفاتورة</label><input id="invNumber"></div>
            <div class="fg full"><label>التاريخ *</label><input id="invDate" type="date"></div>
            <div class="fg full"><label>اسم المريض الأول *</label><input id="invPatientName"></div>
            <div class="fg full"><label>رقم الهوية</label><input id="invPatientId"></div>
            <div class="fg" id="invInp1" style="display:none"><label>تاريخ الدخول</label><input id="invAdmission" type="date"></div>
            <div class="fg" id="invInp2" style="display:none"><label>تاريخ الخروج</label><input id="invDischarge" type="date"></div>
            <div class="fg full" id="invInp3" style="display:none"><label>فئة الغرفة</label><input id="invRoomClass"></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveInvoiceBtn" data-i18n="common.save">حفظ</button><button class="btn out" data-close-invoice data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
