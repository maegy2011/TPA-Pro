const MODAL_REVIEW = `
<!-- نافذة المراجعة -->
    <div class="modal" id="reviewModal">
      <div class="modal-bg" data-close></div>
      <div class="modal-panel wide">
        <div class="modal-head">
          <div style="flex:1;min-width:0"><h3>مراجعة المطالبة</h3><p id="rvSub">—</p></div>
          <select class="rv-session-switcher" id="rvSessionSwitcher" title="التبديل بين الجلسات"><option value="">لا جلسات أخرى</option></select>
          <button class="close-btn" data-close><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="modal-body">
          <div class="rv-context-bar" id="rvContextBar">—</div>
          <div class="rv-tabs" role="tablist">
            <button type="button" class="rv-tab active" role="tab" aria-selected="true" data-rv-tab="input">1. الإدخال</button>
            <button type="button" class="rv-tab" role="tab" aria-selected="false" data-rv-tab="exceptions">2. الاستثناءات <span class="rv-tab-count" id="rvExcCount">0</span></button>
            <button type="button" class="rv-tab" role="tab" aria-selected="false" data-rv-tab="final">3. المراجعة النهائية</button>
          </div>
          <div class="rv-tab-panel" id="rvTabInput" role="tabpanel">
          <button type="button" class="btn-sm ghost" id="rvViewTimelineBtn" style="width:100%;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;stroke:currentColor"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>
            عرض الخط الزمني
          </button>
          <div class="rv-claim-type-bar">
            <span>نوع المطالبة:</span>
            <button type="button" class="rv-type-btn" data-claim-type="employee">عاملين</button>
            <button type="button" class="rv-type-btn" data-claim-type="retiree">معاشات</button>
          </div>
          <div class="form-grid">
            <div class="fg"><label>رقم المطالبة</label><input id="rvId" readonly></div>
            <div class="fg"><label>تاريخ المطالبة</label><input id="rvDate" readonly></div>
            <div class="fg"><label>رقم الوارد</label><input id="rvReceivedNumber" readonly></div>
            <div class="fg"><label>تاريخ الوارد</label><input id="rvReceivedDate" readonly></div>
            <div class="fg"><label>اسم المريض</label><input id="rvPatient" readonly></div>
            <div class="fg"><label>مقدم الخدمة</label><input id="rvProvider" readonly></div>
          </div>
          <div class="rv-section-title">الفواتير</div>
          <div class="rv-invoice-tabs" id="rvInvoiceTabs"></div>
          <div id="rvInvoicePanel"></div>
          <div class="calc-box">
            <div class="calc-item"><span>المطالب به</span><b id="calcBilled">0</b></div>
            <div class="calc-item ded"><span>الاستقطاع</span><b id="calcDed">0</b></div>
            <div class="calc-item rate"><span>النسبة</span><b id="calcRate">0%</b></div>
          </div>
          <div class="form-grid">
            <div class="fg full"><label>سبب الاستقطاع</label><select id="rvReason">
              <option value="">— لا يوجد —</option>
              <option>خدمات غير مغطاة</option><option>تجاوز الحد الأقصى</option><option>تكرار في المطالبة</option>
              <option>خطأ في التسعير</option><option>نقص في المستندات</option><option>إجراء تجميلي غير مؤهل</option>
              <option>فترة انتظار لم تنتهِ</option><option>خدمة تتطلب موافقة مسبقة</option>
            </select></div>
            <div class="fg full"><label>ملاحظات</label><textarea id="rvNotes"></textarea></div>
          </div>
          <div class="pa-box warn" id="priorApprovalBox" style="display:none">
            <div class="pa-head"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg><span>تتطلب موافقة مسبقة</span></div>
            <div id="paWarningText" style="font-size:12px;line-height:1.7"></div>
            <div class="pa-fields">
              <div class="fg"><label>الحالة</label><select id="paStatus"><option value="not-requested">لم تُطلب</option><option value="pending">قيد الطلب</option><option value="approved">موافق عليها</option><option value="rejected">مرفوضة</option></select></div>
              <div class="fg"><label>رقم الموافقة</label><input id="paRefNumber"></div>
              <div class="fg"><label>التاريخ</label><input id="paDate" type="date"></div>
            </div>
          </div>
        </div>
          <div class="rv-tab-panel" id="rvTabExceptions" role="tabpanel" style="display:none">
            <div id="rvExceptions"></div>
          </div>
          <div class="rv-tab-panel" id="rvTabFinal" role="tabpanel" style="display:none">
            <div id="rvFinalNumbers"></div>
            <div id="rvFinalReasons"></div>
            <div id="rvFinalChecklist"></div>
            <div class="form-grid" style="margin-top:12px">
              <div class="fg full"><label>القرار</label>
                <div style="display:flex;gap:12px">
                  <label><input type="radio" name="rvDecision" value="approved"> اعتماد كامل</label>
                  <label><input type="radio" name="rvDecision" value="partial" checked> اعتماد جزئي</label>
                  <label><input type="radio" name="rvDecision" value="rejected"> رفض كامل</label>
                </div>
              </div>
              <div class="fg full" id="rvReasonWrap"><label>سبب الاستقطاع العام</label>
                <select id="rvFinalReason">
                  <option value="">— اختر —</option>
                  <option>خدمات غير مغطاة</option><option>تجاوز اللائحة</option><option>تكرار</option><option>نقص مستندات</option><option>موافقة مسبقة</option><option>فترة انتظار</option><option>أخرى</option>
                </select>
              </div>
              <div class="fg full"><label>ملاحظات</label><textarea id="rvFinalNotes"></textarea></div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px">
              <button class="btn solid" id="finalizeReviewBtn">إنهاء المراجعة والتوقيع</button>
            </div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveReview">حفظ المراجعة</button><button class="btn out" data-close data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;
