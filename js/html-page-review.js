// html-page-review.js — صفحة مراجعة المطالبة
const PAGE_REVIEW = `
<section class="page" id="page-review">
  <div class="review-page" id="reviewPage">
    <div class="review-page-head">
      <div style="flex:1;min-width:0">
        <h2>مراجعة المطالبة</h2>
        <p id="rvPageSub">—</p>
      </div>
      <div class="rv-page-actions">
        <button class="btn out" id="rvPageBack"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> رجوع</button>
        <button class="btn solid" id="rvPageSave">حفظ المراجعة</button>
      </div>
    </div>
    <div class="review-page-body">
      <div class="rv-context-bar" id="rvPageContextBar">—</div>
      <details class="rv-claim-header" open>
        <summary>بيانات المطالبة</summary>
        <div class="rv-claim-header-body">
          <div class="rv-claim-type-bar">
            <span>نوع المطالبة الافتراضي:</span>
            <button type="button" class="rv-type-btn" data-claim-type="employee">عاملين</button>
            <button type="button" class="rv-type-btn" data-claim-type="retiree">معاشات</button>
          </div>
          <div class="form-grid">
            <div class="fg"><label>رقم المطالبة</label><input id="rvPageId" readonly></div>
            <div class="fg"><label>تاريخ المطالبة</label><input id="rvPageDate" readonly></div>
            <div class="fg"><label>رقم الوارد</label><input id="rvPageReceivedNumber" readonly></div>
            <div class="fg"><label>تاريخ الوارد</label><input id="rvPageReceivedDate" readonly></div>
            <div class="fg"><label>مقدم الخدمة</label><input id="rvPageProvider" readonly></div>
          </div>
          <button type="button" class="btn-sm ghost" id="rvPageViewTimelineBtn" style="margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;stroke:currentColor"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>
            عرض الخط الزمني
          </button>
        </div>
      </details>
      <div class="rv-section-title">الفواتير</div>
      <div class="rv-invoice-tabs" id="rvPageInvoiceTabs"></div>
      <div id="rvPageInvoicePanel"></div>
      <div class="rv-invoice-review-block" id="rvPageInvoiceReviewBlock" style="margin-top:16px">
        <div class="rv-tabs" role="tablist">
          <button type="button" class="rv-tab active" role="tab" aria-selected="true" data-rv-tab="input">📋 1. التدقيق الآلي</button>
          <button type="button" class="rv-tab" role="tab" aria-selected="false" data-rv-tab="exceptions">⚠️ 2. الاستثناءات المعلقة (<span id="rvPageExcCount">0</span>)</button>
          <button type="button" class="rv-tab" role="tab" aria-selected="false" data-rv-tab="final">⚖️ 3. التخريج القانوني</button>
        </div>
        <div class="rv-tab-panel" id="rvPageTabInput" role="tabpanel">
        <div class="calc-box">
          <div class="calc-item"><span>المطالب به</span><b id="rvPageCalcBilled">0</b></div>
          <div class="calc-item ded"><span>الاستقطاع</span><b id="rvPageCalcDed">0</b></div>
          <div class="calc-item rate"><span>النسبة</span><b id="rvPageCalcRate">0%</b></div>
        </div>
        <div class="pa-box warn" id="rvPagePriorApprovalBox" style="display:none">
          <div class="pa-head"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg><span>تتطلب موافقة مسبقة</span></div>
          <div id="rvPagePaWarningText" style="font-size:12px;line-height:1.7"></div>
          <div class="pa-fields">
            <div class="fg"><label>الحالة</label><select id="rvPagePaStatus"><option value="not-requested">لم تُطلب</option><option value="pending">قيد الطلب</option><option value="approved">موافق عليها</option><option value="rejected">مرفوضة</option></select></div>
            <div class="fg"><label>رقم الموافقة</label><input id="rvPagePaRefNumber"></div>
            <div class="fg"><label>التاريخ</label><input id="rvPagePaDate" type="date"></div>
          </div>
        </div>
      </div>
      <div class="rv-tab-panel" id="rvPageTabExceptions" role="tabpanel" style="display:none">
        <div id="rvPageExceptions"></div>
      </div>
      <div class="rv-tab-panel" id="rvPageTabFinal" role="tabpanel" style="display:none">
        <div id="rvPageFinalNumbers"></div>
        <div id="rvPageFinalReasons"></div>
        <div id="rvPageFinalChecklist"></div>
        <div class="form-grid" style="margin-top:12px">
          <div class="fg full"><label>القرار</label>
            <div style="display:flex;gap:12px">
              <label><input type="radio" name="rvPageDecision" value="approved"> اعتماد كامل</label>
              <label><input type="radio" name="rvPageDecision" value="partial" checked> اعتماد جزئي</label>
              <label><input type="radio" name="rvPageDecision" value="rejected"> رفض كامل</label>
            </div>
          </div>
          <div class="fg full" id="rvPageReasonWrap"><label>سبب الاستقطاع العام</label>
            <select id="rvPageFinalReason">
              <option value="">— اختر —</option>
              <option>خدمات غير مغطاة</option><option>تجاوز اللائحة</option><option>تكرار</option><option>نقص مستندات</option><option>موافقة مسبقة</option><option>فترة انتظار</option><option>أخرى</option>
            </select>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn solid" id="rvPageFinalizeBtn">إنهاء المراجعة والتوقيع</button>
        </div>
      </div>
      </div>
    </div>
  </div>
</section>
`;
