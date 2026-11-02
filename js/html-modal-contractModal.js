// html-modal-contractModal.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const MODAL_CONTRACT = `
<!-- نافذة العقد -->
    <div class="modal" id="contractModal">
      <div class="modal-bg" data-close-contract></div>
      <div class="modal-panel">
        <div class="modal-head"><div><h3 id="ctrModalTitle">إضافة عقد</h3><p id="ctrModalSub">—</p></div><button class="close-btn" data-close-contract><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body"><div class="form-grid">
          <div class="fg full"><label>الجهة *</label><select id="ctrProvider"></select></div>
          <div class="fg"><label>البداية *</label><input id="ctrStart" type="date"></div>
          <div class="fg"><label>مدة العقد (سنة) *</label><input id="ctrDuration" type="number" min="1" step="1" value="1"></div>
          <div class="fg"><label>النهاية (تلقائي)</label><input id="ctrEnd" type="date" readonly><small class="fg-hint">تُحسب تلقائيًا: البداية + المدة</small></div>
          <div class="fg"><label>الخصم %</label><input id="ctrDiscount" type="number" min="0" max="100"></div>
          <div class="fg"><label>سريان النسخة المالية من</label><input id="ctrVersionEffective" type="date"><small class="fg-hint">يُستخدم لتغيير الخصم والخدمات دون محو القيم التاريخية</small></div>
          <div class="fg"><label>الزيادة السنوية %</label><input id="ctrIncreaseRate" type="number" min="0" step="0.5"></div>
          <div class="fg"><label>&nbsp;</label><button type="button" class="btn-apply" id="ctrApplyIncrease">تطبيق الزيادة</button></div>
          <div class="fg full"><div id="ctrIncreaseHistory" style="font-size:12px;color:var(--muted);padding:8px;border:1px solid var(--line);border-radius:8px">لا زيادات مسجلة</div><small class="fg-hint">تُطبق الزيادات على أسعار اللائحة في المراجعة من تاريخ تطبيقها — بأثر مركب</small></div>
          <div class="fg full"><label>خدمات غير متعاقد عليها</label><small class="fg-hint" style="display:block;margin-bottom:6px">بنود اللائحة العامة المستثناة من هذا العقد — تُخصم تلقائيًا في المراجعة</small>
            <input id="ctrServicesSearch" placeholder="بحث في الخدمات..." style="margin-bottom:6px">
            <div id="ctrServicesList" style="max-height:160px;overflow:auto;border:1px solid var(--line,#E2E8F0);border-radius:8px;padding:6px"></div>
          </div>
          <div class="fg full"><label>ملاحظات</label><textarea id="ctrNotes"></textarea></div>
          <div class="fg full"><label>السجل التاريخي للخصومات</label><div id="ctrRateHistory" style="font-size:12px;color:var(--muted);padding:8px;border:1px solid var(--line);border-radius:8px">لا توجد نسخ تاريخية بعد</div></div>
        </div></div>
        <div class="modal-foot"><button class="btn solid" id="saveContract" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteContract" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-contract data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;