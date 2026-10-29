const PAGE_CONTRACTS = `
<section class="page" id="page-contracts">
      <div class="alert-banner" id="contractAlert"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg><span id="contractAlertText"></span></div>
      <div class="grid-kpi" id="contractKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="contractSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div>
        <button class="btn-add" id="addContractBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> إضافة عقد</button>
        <div class="chips" id="contractFilterChips">
          <button class="chip active" data-cfilter="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-cfilter="active">نشط</button>
          <button class="chip" data-cfilter="expiring">قريب</button>
          <button class="chip" data-cfilter="expired">منتهي</button>
          <button class="chip" data-cfilter="upcoming">لم يبدأ</button>
        </div>
      </div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th data-i18n="common.num">رقم</th><th data-i18n="providers.provider">الجهة</th><th class="hide-sm" data-i18n="contracts.start">البداية</th><th class="hide-sm" data-i18n="contracts.end">النهاية</th><th data-i18n="contracts.remaining">المتبقي</th><th data-i18n="contracts.discount">الخصم</th><th data-i18n="common.status">الحالة</th><th></th></tr></thead><tbody id="contractsBody"></tbody></table></div></div>
    </section>
`;
