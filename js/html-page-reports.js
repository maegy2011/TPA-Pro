const PAGE_REPORTS = `
<section class="page" id="page-reports">
      <div class="toolbar" style="margin-bottom:18px">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="reportsSearch" placeholder="فلترة..." data-i18n-placeholder="reports.searchPlaceholder"></div>
        <div id="reportsSearchInfo" style="font-size:12.5px;color:var(--muted);font-weight:600"></div>
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
    </section>
`;
