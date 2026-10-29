const PAGE_INTAKE = `
<section class="page" id="page-intake">
      <div class="grid-kpi" id="intakeKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="intakeSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div>
        <button class="btn-add" id="addBatchBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> استلام دفعة</button>
      </div>
      <div class="month-chips" id="monthChips"></div>
      <div class="chips" id="intakeStatusChips" style="margin-bottom:14px">
        <button class="chip active" data-istatus="all" data-i18n="common.all">الكل</button>
        <button class="chip" data-istatus="received">وارد جديد</button>
        <button class="chip" data-istatus="under-review">قيد المعالجة</button>
        <button class="chip" data-istatus="completed">مكتمل</button>
      </div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th data-i18n="common.num">رقم</th><th data-i18n="providers.provider">الجهة</th><th data-i18n="intake.month">الشهر</th><th class="hide-sm" data-i18n="intake.received">الاستلام</th><th>العدد</th><th data-i18n="intake.value">القيمة</th><th data-i18n="common.status">الحالة</th><th></th></tr></thead><tbody id="batchesBody"></tbody></table></div></div>
    </section>
`;
