const PAGE_PROVIDERS = `
<section class="page" id="page-providers">
      <div class="grid-kpi" id="providerKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="providerSearch" placeholder="بحث بالاسم أو المدينة..." data-i18n-placeholder="providers.searchPlaceholder"></div>
        <button class="btn-add" id="addProviderBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> إضافة جهة</button>
        <div class="chips" id="providerFilterChips">
          <button class="chip active" data-pfilter="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-pfilter="active">نشط</button>
          <button class="chip" data-pfilter="expiring">قريب</button>
          <button class="chip" data-pfilter="expired">منتهي</button>
        </div>
      </div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th data-i18n="providers.provider">الجهة</th><th data-i18n="providers.type">النوع</th><th class="hide-sm" data-i18n="providers.contact">التواصل</th><th data-i18n="providers.contract">العقد</th><th data-i18n="intake.claims">المطالبات</th><th></th></tr></thead><tbody id="providersBody"></tbody></table></div></div>
    </section>
`;
