const PAGE_DEDUCTION_RULES = `
<section class="page" id="page-deduction-rules">
      <div class="dr-tabs">
        <button class="dr-tab active" data-dr-tab="rules">القواعد</button>
        <button class="dr-tab" data-dr-tab="pa-procedures">إجراءات الموافقة</button>
      </div>
      <div class="dr-panel active" data-dr-panel="rules">
        <div class="grid-kpi" id="drKpi"></div>
        <div class="toolbar">
          <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" id="drSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div>
          <div class="chips" id="drFilterChips">
            <button class="chip active" data-drf="all" data-i18n="common.all">الكل</button>
            <button class="chip" data-drf="coverage_cap">سقف</button>
            <button class="chip" data-drf="retiree_copay">تحمل</button>
            <button class="chip" data-drf="active">نشطة</button>
            <button class="chip" data-drf="expired">منتهية</button>
          </div>
          <button class="btn-add" id="addDrBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> معالج</button>
        </div>
        <div class="panel"><div class="table-wrap"><table><thead><tr><th>الرقم</th><th data-i18n="tariffs.name">الاسم</th><th data-i18n="providers.type">النوع</th><th>النسبة</th><th>النطاق</th><th>السريان</th><th data-i18n="common.status">الحالة</th><th></th></tr></thead><tbody id="drBody"></tbody></table></div></div>
      </div>
      <div class="dr-panel" data-dr-panel="pa-procedures">
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-head"><div><h2>إجراءات الموافقة المسبقة</h2></div>
            <button class="btn-add" id="addPaProcBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> إضافة</button>
          </div>
          <div class="table-wrap"><table><thead><tr><th>الكود</th><th>الإجراء</th><th>الفئة</th><th>ملاحظات</th><th></th></tr></thead><tbody id="paProcBody"></tbody></table></div>
        </div>
      </div>
    </section>
`;
