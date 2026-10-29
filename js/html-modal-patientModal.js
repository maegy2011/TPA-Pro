const MODAL_PATIENT = `
<!-- نافذة المريض -->
    <div class="modal" id="patientModal">
      <div class="modal-bg" data-close-patient></div>
      <div class="modal-panel" style="max-width:420px">
        <div class="modal-head"><div><h3 id="patModalTitle">إضافة مريض</h3><p id="patModalSub">—</p></div><button class="close-btn" data-close-patient><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>الاسم *</label><input id="patName"></div>
          <div class="fg full"><label>رقم الهوية</label><input id="patNationalId"></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="savePatientBtn" data-i18n="common.save">حفظ</button><button class="btn out" data-close-patient data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
