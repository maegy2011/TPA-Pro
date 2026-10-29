const MODAL_PAPROC = `
<!-- نافذة الإجراء -->
    <div class="modal" id="paProcModal">
      <div class="modal-bg" data-close-paproc></div>
      <div class="modal-panel" style="max-width:440px">
        <div class="modal-head"><div><h3 id="paProcModalTitle">إضافة إجراء</h3><p>—</p></div><button class="close-btn" data-close-paproc><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg"><label>الكود *</label><input id="paProcCode"></div>
          <div class="fg"><label>الفئة</label><select id="paProcCat"><option>عمليات</option><option>أشعة</option><option>مختبر</option><option>استشارة</option><option>أخرى</option></select></div>
          <div class="fg full"><label>الاسم *</label><input id="paProcName"></div>
          <div class="fg full"><label>ملاحظات</label><textarea id="paProcNotes"></textarea></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="savePaProcBtn" data-i18n="common.save">حفظ</button><button class="btn out" data-close-paproc data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
