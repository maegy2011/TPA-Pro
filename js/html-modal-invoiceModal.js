// html-modal-invoiceModal.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const MODAL_INVOICE = `
<!-- نافذة مذكرة الخصم -->
    <div class="modal" id="invoiceModal">
      <div class="modal-bg" data-close-invoice></div>
      <div class="modal-panel">
        <div class="modal-head"><div><h3 id="invModalTitle">إضافة مذكرة خصم</h3><p id="invModalSub">—</p></div><button class="close-btn" data-close-invoice><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="fg"><label>نوع الفاتورة *</label><select id="invCategory"><option value="external">خارجية</option><option value="internal">داخلية</option></select></div>
            <div class="fg"><label>نوع الخدمة الطبية *</label><select id="invType"></select></div>
            <div class="fg"><label>نوع المطالبة *</label><select id="invClaimType"><option value="employee">عاملين</option><option value="retiree">معاشات</option></select></div>
            <div class="fg"><label>رقم مذكرة الخصم</label><input id="invNumber"></div>
            <div class="fg"><label>رقم الفاتورة المرتبطة *</label><input id="invLinkedInvoice"></div>
            <div class="fg"><label>تاريخ مذكرة الخصم *</label><input id="invDate" type="date"></div>
            <div class="fg"><label>تاريخ إصدار خطاب التحويل</label><input id="invLetterDate" type="date"></div>
            <div class="fg"><label>تاريخ الإجراء</label><input id="invProcedureDate" type="date"></div>
          </div>
          <div class="rv-section-title">بيانات المريض</div>
          <div class="form-grid">
            <div class="fg"><label>اسم المريض *</label><input id="invPatientName"></div>
            <div class="fg"><label>الرقم القومي</label><input id="invPatientId" inputmode="numeric" maxlength="14"></div>
          </div>
          <div id="invInp1" style="display:none">
            <div class="rv-section-title">بيانات الإقامة</div>
            <div class="form-grid">
              <div class="fg"><label>تاريخ الدخول</label><input id="invAdmission" type="date"></div>
              <div class="fg"><label>تاريخ الخروج</label><input id="invDischarge" type="date"></div>
              <div class="fg"><label>فئة الغرفة</label><input id="invRoomClass"></div>
            </div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveInvoiceBtn">حفظ</button><button class="btn out" data-close-invoice>إلغاء</button></div>
      </div>
    </div>
`;
