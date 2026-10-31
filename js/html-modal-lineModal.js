const MODAL_LINE = `
<!-- نافذة البند -->
    <div class="modal" id="lineModal">
      <div class="modal-bg" data-close-line></div>
      <div class="modal-panel" style="max-width:640px">
        <div class="modal-head"><div><h3 id="lnModalTitle">إضافة بند</h3><p id="lnModalSub">—</p></div><button class="close-btn" data-close-line><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">

          <div class="ln-source-banner" id="lnSourceBanner">—</div>

          <div class="fg full" style="margin-bottom:12px">
            <label>الخدمة *</label>
            <select id="lnServiceSelect">
              <option value="">— اختر من لائحة العقد —</option>
            </select>
          </div>

          <div class="form-grid">
            <div class="fg"><label>الكود</label><input id="lnCode" readonly></div>
            <div class="fg"><label>الفئة</label><input id="lnCategory" readonly></div>
            <div class="fg full"><label>اسم الخدمة</label><input id="lnName" readonly></div>
            <div class="fg"><label>سعر اللائحة</label><input id="lnTariffUnit" readonly></div>
            <div class="fg"><label>خصم العقد %</label><input id="lnContractDiscount" readonly></div>
            <div class="fg"><label>الكمية *</label><input id="lnQty" type="number" min="1" step="1" value="1"></div>
            <div class="fg"><label>سعر الفاتورة *</label><input id="lnBilledUnit" type="number" min="0" step="0.01"></div>
          </div>

          <div class="ln-source-result" id="lnComputedPreview"></div>

        </div>
        <div class="modal-foot">
          <button class="btn solid" id="saveLineBtn" data-i18n="common.save">حفظ</button>
          <button class="btn out" data-close-line data-i18n="common.cancel">إلغاء</button>
        </div>
      </div>
    </div>
`;
