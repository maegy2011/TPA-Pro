const MODAL_DR = `
<!-- نافذة قاعدة الخصم -->
    <div class="modal" id="drModal">
      <div class="modal-bg" data-close-dr></div>
      <div class="modal-panel" style="max-width:620px">
        <div class="modal-head"><div><h3 id="drModalTitle">إضافة قاعدة</h3><p id="drModalSub">—</p></div><button class="close-btn" data-close-dr><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>الاسم *</label><input id="drName"></div>
          <div class="fg"><label>النوع *</label><select id="drType"><option value="coverage_cap">سقف التغطية</option><option value="retiree_copay">تحمل المتقاعد</option></select></div>
          <div class="fg"><label>النسبة % *</label><input id="drRate" type="number" min="0" max="100" step="0.5"></div>
          <div class="fg"><label>السريان *</label><input id="drFrom" type="date"></div>
          <div class="fg"><label>الانتهاء</label><input id="drTo" type="date"></div>
          <div class="fg full"><label class="check-row"><input type="checkbox" id="drActive" checked> نشطة</label></div>
          <div class="fg full"><label>نوع المطالبة</label>
            <div class="scope-grid" style="max-height:none">
              <label class="scope-chk"><input type="checkbox" class="dr-ctype" value="employee" checked> عاملين</label>
              <label class="scope-chk"><input type="checkbox" class="dr-ctype" value="retiree"> معاشات</label>
            </div>
          </div>
          <div class="fg full"><label>ملاحظات</label><textarea id="drNotes"></textarea></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="saveDrBtn" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteDrBtn" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-dr data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
