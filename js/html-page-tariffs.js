const PAGE_TARIFFS = `
<section class="page" id="page-tariffs">
      <div class="grid-kpi" id="tariffKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="tariffSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div>
        <button class="btn-add" id="addTariffBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> إضافة لائحة</button>
        <div class="chips" id="tariffFilterChips">
          <button class="chip active" data-tfilter="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-tfilter="general">عامة</button>
          <button class="chip" data-tfilter="private">خاصة</button>
          <button class="chip" data-tfilter="supplementary">مكملة</button>
          <button class="chip" data-tfilter="discount">خصم</button>
          <button class="chip" data-tfilter="increase">زيادة</button>
        </div>
      </div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th data-i18n="common.num">رقم</th><th data-i18n="tariffs.name">الاسم</th><th data-i18n="providers.type">النوع</th><th data-i18n="tariffs.adjustment">التسوية</th><th data-i18n="tariffs.link">الربط</th><th data-i18n="common.status">الحالة</th><th></th></tr></thead><tbody id="tariffsBody"></tbody></table></div></div>
    </section>
`;
