const MODAL_SERVICE = `
<!-- نافذة الخدمة -->
    <div class="modal" id="serviceModal">
      <div class="modal-bg" data-close-service></div>
      <div class="modal-panel" style="max-width:480px">
        <div class="modal-head"><div><h3 id="svcModalTitle">إضافة خدمة</h3><p id="svcModalSub">—</p></div><button class="close-btn" data-close-service><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>اللائحة *</label><select id="svcTariff"></select></div>
           <div class="fg"><label>الكود *</label><input id="svcCode"></div>
          <div class="fg"><label>الفئة</label><select id="svcCategory"><option>استشارة</option><option>مختبر</option><option>أشعة</option><option>عمليات</option><option>أدوية</option><option>طوارئ</option><option>علاج طبيعي</option><option>أسنان</option><option>أخرى</option></select></div>
          <div class="fg full"><label>الاسم *</label><input id="svcName"></div>
          <div class="fg"><label>الأساسي *</label><input id="svcBasePrice" type="number" min="0" step="1"></div>
          <div class="fg"><label>الحالي *</label><input id="svcCurrentPrice" type="number" min="0" step="1"></div>
          <div class="fg full"><button type="button" class="btn-apply out" id="svcSyncBtn" style="width:100%;justify-content:center">احسب من النسبة</button></div>
          <div class="fg full"><label class="check-row"><input type="checkbox" id="svcCovered" checked> مغطاة</label></div>
          <div class="fg full"><label class="check-row" style="background:#FEF3C7;border-color:#FCD34D"><input type="checkbox" id="svcRequiresPriorApproval"><span style="color:#92400E">⚠ تتطلب موافقة</span></label></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="saveService" data-i18n="common.save">حفظ</button><button class="btn out" data-close-service data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
