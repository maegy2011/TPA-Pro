const MODAL_LINE = `
<!-- نافذة البند -->
    <div class="modal" id="lineModal">
      <div class="modal-bg" data-close-line></div>
      <div class="modal-panel" style="max-width:560px">
        <div class="modal-head"><div><h3 id="lnModalTitle">إضافة بند</h3><p id="lnModalSub">—</p></div><button class="close-btn" data-close-line><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="ln-source-banner" id="lnSourceBanner">—</div>
          <div class="form-grid">
            <div class="fg"><label>الكود *</label><input id="lnCode" autocomplete="off"></div>
            <div class="fg"><label>الفئة</label><select id="lnCategory">
              <option>مختبر</option><option>أشعة</option><option>استشارة</option><option>عمليات</option>
              <option>أدوية</option><option>طوارئ</option><option>علاج طبيعي</option><option>أسنان</option>
              <option>عيون</option><option>إقامة</option><option>أخرى</option>
            </select></div>
            <div class="fg full"><label>الاسم *</label><input id="lnName" autocomplete="off"></div>
            <div class="fg"><label>الكمية *</label><input id="lnQty" type="number" min="1" step="1" value="1"></div>
            <div class="fg"><label>سعر الفاتورة *</label><input id="lnBilledUnit" type="number" min="0" step="0.01"></div>
            <div class="fg"><label>سعر اللائحة</label><input id="lnTariffUnit" type="number" min="0" step="0.01"></div>
          </div>
          <div class="ln-suggest" id="lnSuggest"></div>
          <div class="ln-source-result" id="lnSourceResult"></div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveLineBtn" data-i18n="common.save">حفظ</button><button class="btn out" data-close-line data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
