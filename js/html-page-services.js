const PAGE_SERVICES = `
<section class="page" id="page-services">
  <div class="grid-kpi" id="servicesKpi"></div>
  <div class="toolbar">
    <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="servicesSearch" placeholder="بحث في الخدمات..." data-i18n-placeholder="common.search"></div>
    <select id="servicesSort" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="name">فرز: الاسم</option>
      <option value="code">فرز: الكود</option>
      <option value="base">فرز: السعر الأساسي</option>
      <option value="current">فرز: السعر الحالي</option>
      <option value="tariff">فرز: اللائحة</option>
      <option value="category">فرز: الفئة</option>
    </select>
    <select id="servicesSortDir" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="asc">تصاعدي</option>
      <option value="desc">تنازلي</option>
    </select>
    <button class="btn-xs" id="servicesAdvToggle">بحث متقدم</button>
    <button class="btn-xs" id="servicesImportBtn">استيراد CSV</button>
    <button class="btn-xs" id="servicesAddBtn">إضافة خدمة (متقدمة)</button>
    <input type="file" id="servicesImportFile" accept=".csv,.txt" style="display:none">
  </div>
  <div id="servicesAdvPanel" style="display:none;margin-bottom:12px;padding:10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
      <input id="advCode" placeholder="كود">
      <input id="advName" placeholder="اسم">
      <input id="advCategory" placeholder="فئة">
      <input id="advTariff" placeholder="لائحة">
      <input id="advMinPrice" type="number" placeholder="سعر أدنى">
      <input id="advMaxPrice" type="number" placeholder="سعر أقصى">
    </div>
    <div style="margin-top:8px"><button class="btn-xs" id="servicesAdvApply">تطبيق</button> <button class="btn-xs" id="servicesAdvReset">إعادة</button></div>
  </div>
  <div class="chips" id="servicesFilterChips" style="margin-bottom:10px">
    <button class="chip active" data-sfilter="all">الكل</button>
    <button class="chip" data-sfilter="covered">مغطاة</button>
    <button class="chip" data-sfilter="uncovered">غير مغطاة</button>
  </div>
  <div class="panel"><div class="table-wrap"><table><thead><tr><th>الكود</th><th>الخدمة</th><th>الفئة</th><th>اللائحة</th><th>الأساسي</th><th>الحالي</th><th>التغطية</th></tr></thead><tbody id="servicesBody"></tbody></table></div></div>
</section>
`;