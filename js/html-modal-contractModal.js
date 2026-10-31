const MODAL_CONTRACT = `
<!-- نافذة العقد -->
    <div class="modal" id="contractModal">
      <div class="modal-bg" data-close-contract></div>
      <div class="modal-panel">
        <div class="modal-head"><div><h3 id="ctrModalTitle">إضافة عقد</h3><p id="ctrModalSub">—</p></div><button class="close-btn" data-close-contract><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>الجهة *</label><select id="ctrProvider"></select></div>
          <div class="fg"><label>رقم العقد</label><input id="ctrNumber" readonly></div>
          <div class="fg"><label>الحالة</label><select id="ctrStatus"><option value="active">نشط</option><option value="cancelled">ملغى</option></select></div>
          <div class="fg"><label>البداية *</label><input id="ctrStart" type="date"></div>
          <div class="fg"><label>النهاية *</label><input id="ctrEnd" type="date"></div>
          <div class="fg"><label>الخصم %</label><input id="ctrDiscount" type="number" min="0" max="100"></div>
          <div class="fg"><label>الدفع</label><select id="ctrPayment"><option>30 يوم</option><option>45 يوم</option><option>60 يوم</option><option>90 يوم</option><option>الدفع الفوري</option></select></div>
          <div class="fg"><label>الخدمات</label><select id="ctrServices"><option>جميع الخدمات</option><option>الخدمات الأساسية</option><option>الطوارئ</option><option>العلاج الطبيعي</option></select></div>
          <div class="fg full"><label>ملاحظات</label><textarea id="ctrNotes"></textarea></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="saveContract" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteContract" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-contract data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
