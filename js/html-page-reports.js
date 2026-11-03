// html-page-reports.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const PAGE_REPORTS = `
<section class="page" id="page-reports">
      <div class="page-header">
        <div><h1 data-i18n="reports.title">التقارير</h1><p class="page-sub" data-i18n="reports.subtitle">تحليلات مالية</p></div>
        <div class="toolbar" style="margin-bottom:12px">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="reportsSearch" placeholder="فلترة..." data-i18n-placeholder="reports.searchPlaceholder"></div>
        <div id="reportsSearchInfo" style="font-size:12.5px;color:var(--muted);font-weight:600"></div>
        <div class="export-group">
          <button class="btn-export excel" data-export="reports" data-format="excel"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="m9 13 6 6M15 13l-6 6"/></svg></button>
          <button class="btn-export pdf" data-export="reports" data-format="pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h4M8 17h8"/></svg></button>
          <button class="btn-export print" data-export="reports" data-format="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
        </div>
      </div>
      <div class="toolbar" style="margin-bottom:18px" id="reportsFilters">
        <input type="date" id="reportsFrom" title="من" style="max-width:150px">
        <input type="date" id="reportsTo" title="إلى" style="max-width:150px">
        <select id="reportsProvider" style="max-width:190px"><option value="">كل الجهات</option></select>
        <select id="reportsStatus" style="max-width:150px"><option value="">كل الحالات</option><option value="approved">معتمدة</option><option value="partial">جزئياً</option><option value="pending">قيد</option><option value="rejected">مرفوضة</option></select>
        <button class="btn out" id="reportsReset" style="padding:6px 14px">إعادة ضبط</button>
      </div>
      </div>
      <div class="grid-kpi" id="reportKpi"></div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h2>توزيع الحالات</h2></div></div>
          <div class="panel-body"><div class="bars" id="statusBars"></div></div></div>
        <div class="panel"><div class="panel-head"><div><h2>ملخص مالي</h2></div></div>
          <div class="panel-body"><div class="info-list" id="summaryList"></div></div></div>
      </div>
      <div class="panel"><div class="panel-head"><div><h2>أسباب الاستقطاع</h2></div></div>
        <div class="panel-body"><div class="bars" id="reasonBars2"></div></div></div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h2>أعلى الجهات استقطاعًا</h2></div></div>
          <div class="panel-body"><div class="info-list" id="topProvidersList"></div></div></div>
        <div class="panel"><div class="panel-head"><div><h2>الاتجاه الشهري (آخر 6 شهور)</h2></div></div>
          <div class="panel-body"><div class="bars" id="monthlyTrendBars"></div></div></div>
      </div>
    </section>
`;
