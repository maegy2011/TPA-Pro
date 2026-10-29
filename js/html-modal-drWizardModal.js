const MODAL_DRWIZARD = `
<!-- معالج القواعد -->
    <div class="modal" id="drWizardModal">
      <div class="modal-bg" data-close-drwiz></div>
      <div class="modal-panel" style="max-width:720px">
        <div class="modal-head"><div><h3>معالج إنشاء قاعدة</h3><p id="drWizSub">—</p></div><button class="close-btn" data-close-drwiz><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="wiz-steps" id="drWizSteps">
            <div class="wiz-step active" data-wiz-step="1" data-wiz-jump="1">النوع</div>
            <div class="wiz-step" data-wiz-step="2" data-wiz-jump="2">الأساسيات</div>
            <div class="wiz-step" data-wiz-step="3" data-wiz-jump="3">الفترة</div>
            <div class="wiz-step" data-wiz-step="4" data-wiz-jump="4">الشروط</div>
            <div class="wiz-step" data-wiz-step="5" data-wiz-jump="5">النطاق</div>
            <div class="wiz-step" data-wiz-step="6" data-wiz-jump="6">المعاينة</div>
          </div>
          <div class="wiz-panel active" data-wiz-panel="1">
            <div class="wiz-type-cards" style="grid-template-columns:repeat(2,1fr)">
              <label class="wiz-type-card" data-wiz-type="coverage_cap"><input type="radio" name="wizType" value="coverage_cap"><div class="icon">🛡️</div><h4>سقف التغطية</h4><p>للعاملين</p></label>
              <label class="wiz-type-card" data-wiz-type="retiree_copay"><input type="radio" name="wizType" value="retiree_copay"><div class="icon">💰</div><h4>تحمل المتقاعد</h4><p>للمعاشات</p></label>
              <label class="wiz-type-card" data-wiz-type="custom"><input type="radio" name="wizType" value="custom"><div class="icon">⚙️</div><h4>قاعدة مخصصة</h4><p>على البند</p></label>
              <label class="wiz-type-card" data-wiz-type="composite"><input type="radio" name="wizType" value="composite"><div class="icon">🎁</div><h4>سوبر</h4><p>تجميع</p></label>
            </div>
          </div>
          <div class="wiz-panel" data-wiz-panel="2">
            <div class="form-grid">
              <div class="fg full"><label>الاسم *</label><input id="wizName"></div>
              <div class="fg full" id="wizActionWrap" style="display:none"><label>الإجراء</label>
                <select id="wizAction">
                  <option value="reject_line">رفض البند</option>
                  <option value="reduce_by_percent">خصم نسبة</option>
                  <option value="reduce_by_fixed">خصم مبلغ</option>
                  <option value="cap_to_amount">تقيد بمبلغ</option>
                  <option value="set_to_percent">اعتماد نسبة</option>
                </select>
              </div>
              <div class="fg full" id="wizRateWrap"><label>النسبة / المبلغ *</label>
                <div class="wiz-rate-wrap"><input id="wizRate" type="number" min="0" step="0.5"><span class="wiz-rate-hint" id="wizRateHint">%</span></div>
                <div class="wiz-rate-presets" id="wizRatePresets"></div>
              </div>
              <div class="fg full" id="wizTiersWrap" style="display:none">
                <label>شرائح (متقدم)</label>
                <label class="check-row" style="height:34px;margin-bottom:8px"><input type="checkbox" id="wizTiersEnable"> تفعيل الشرائح</label>
                <div id="wizTiersList"></div>
                <button type="button" class="btn-apply out" id="wizAddTierBtn" style="height:30px;padding:0 10px;font-size:11px;margin-top:4px">+ شريحة</button>
              </div>
              <div class="fg full" id="wizCompositeWrap" style="display:none">
                <label>القواعد الفرعية *</label>
                <div class="scope-grid" id="wizChildRules" style="max-height:200px"></div>
                <div class="form-grid" style="margin-top:10px">
                  <div class="fg"><label>النمط</label>
                    <select id="wizCompositeMode">
                      <option value="atomic">تراكمي</option>
                      <option value="best">الأفضل</option>
                      <option value="sum">المجموع</option>
                      <option value="first_match">الأول</option>
                    </select>
                  </div>
                  <div class="fg"><label>&nbsp;</label><label class="check-row" style="height:46px"><input type="checkbox" id="wizRequireAll" checked> يجب تطابق الكل</label></div>
                </div>
              </div>
              <div class="fg full" id="wizRequiresWrap">
                <label>الاعتماديات</label>
                <div class="form-grid" style="margin-bottom:8px">
                  <div class="fg"><label>النمط</label><select id="wizRequiresMode"><option value="any">واحدة</option><option value="all">الكل</option><option value="none">لا شيء</option></select></div>
                  <div class="fg"><label>&nbsp;</label><button type="button" class="btn-apply out" id="wizRequiresClear" style="height:46px;width:100%;justify-content:center">مسح</button></div>
                </div>
                <div class="scope-grid" id="wizRequiresRules" style="max-height:160px"></div>
              </div>
              <div class="fg full"><label>ملاحظات</label><textarea id="wizNotes"></textarea></div>
            </div>
            <div class="wiz-hint" id="wizTypeHint">—</div>
          </div>
          <div class="wiz-panel" data-wiz-panel="3">
            <div class="form-grid">
              <div class="fg"><label>السريان *</label><input id="wizFrom" type="date"></div>
              <div class="fg"><label>الانتهاء</label><input id="wizTo" type="date"></div>
              <div class="fg full"><label>قوالب</label><div class="wiz-period-presets" id="wizPeriodPresets"></div></div>
            </div>
            <div class="wiz-hint">💡 تُقيَّم الفترة مقابل <b>تاريخ المطالبة</b>.</div>
          </div>
          <div class="wiz-panel" data-wiz-panel="4">
            <div class="cond-builder">
              <div class="cond-header"><span>شروط التطبيق</span>
                <select id="condLogic" class="cond-logic-sel"><option value="AND">AND</option><option value="OR">OR</option></select>
              </div>
              <div class="cond-list" id="condList"></div>
              <div class="cond-actions"><button type="button" id="addCondBtn">+ شرط</button><button type="button" id="addGroupBtn">+ مجموعة</button></div>
              <div class="cond-preview" id="condPreview"></div>
            </div>
          </div>
          <div class="wiz-panel" data-wiz-panel="5">
            <div class="wiz-scope-section"><h4>نوع المطالبة</h4>
              <div class="wiz-scope-ctypes">
                <label class="scope-chk"><input type="checkbox" class="wiz-ctype" value="employee" checked>عاملين</label>
                <label class="scope-chk"><input type="checkbox" class="wiz-ctype" value="retiree">معاشات</label>
              </div>
            </div>
            <div class="wiz-scope-section">
              <h4><span>الجهات</span><span class="wiz-scope-actions"><button type="button" class="btn-xs" data-wiz-selectall="providers">الكل</button><button type="button" class="btn-xs ghost" data-wiz-clear="providers">مسح</button></span></h4>
              <div class="scope-grid" id="wizProvidersScope"></div>
            </div>
            <div class="wiz-scope-section">
              <h4><span>العقود</span><span class="wiz-scope-actions"><button type="button" class="btn-xs" data-wiz-selectall="contracts">الكل</button><button type="button" class="btn-xs ghost" data-wiz-clear="contracts">مسح</button></span></h4>
              <div class="scope-grid" id="wizContractsScope"></div>
            </div>
          </div>
          <div class="wiz-panel" data-wiz-panel="6"><div class="wiz-preview" id="wizPreview"></div></div>
        </div>
        <div class="modal-foot">
          <button class="btn out" id="wizBackBtn">السابق</button>
          <button class="btn solid" id="wizNextBtn">التالي</button>
          <button class="btn out" data-close-drwiz data-i18n="common.cancel">إلغاء</button>
        </div>
      </div>
    </div>
`;
