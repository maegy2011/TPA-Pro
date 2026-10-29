const PAGE_DASHBOARD = `
<section class="page active" id="page-dashboard">
      <div class="toolbar" style="justify-content:flex-end;margin-bottom:14px">
        <div class="export-group">
          <button class="btn-export excel" data-export="dashboard" data-format="excel"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="m9 13 6 6M15 13l-6 6"/></svg></button>
          <button class="btn-export pdf" data-export="dashboard" data-format="pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h4M8 17h8"/></svg></button>
          <button class="btn-export print" data-export="dashboard" data-format="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
        </div>
      </div>
      <div class="grid-kpi" id="kpiGrid"></div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h2 data-i18n="dash.latestClaims">أحدث المطالبات</h2><p id="dashSearchInfo" data-i18n="dash.last5">آخر 5 مطالبات</p></div>
          <div class="small-search"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" id="dashSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div></div>
          <div class="table-wrap"><table><thead><tr><th data-i18n="dash.claimNum">رقم / وارد</th><th data-i18n="dash.patient">المريض</th><th data-i18n="dash.billed">المطالب به</th><th data-i18n="dash.approved">المعتمد</th><th data-i18n="dash.status">الحالة</th></tr></thead><tbody id="recentBody"></tbody></table></div>
        </div>
        <div class="panel"><div class="panel-head"><div><h2 data-i18n="dash.deductionRate">نسبة الاستقطاع</h2><p data-i18n="dash.totalDiffs">إجمالي الفروقات</p></div></div>
          <div class="panel-body"><div class="donut-wrap"><div class="donut">
            <svg width="170" height="170" viewBox="0 0 170 170"><circle cx="85" cy="85" r="66" fill="none" stroke="#F1F5F9" stroke-width="16"/><circle id="donutArc" cx="85" cy="85" r="66" fill="none" stroke="url(#g1)" stroke-width="16" stroke-linecap="round" stroke-dasharray="0 415" style="transition:stroke-dasharray 1s"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#14A3A1"/><stop offset="100%" stop-color="#C8A24A"/></linearGradient></defs></svg>
            <div class="donut-center"><b id="donutPct">0%</b><span data-i18n="dash.claimsCount">من المطالبات</span></div>
          </div></div><div class="legend" id="legendBox"></div></div>
        </div>
      </div>
      <div class="panel"><div class="panel-head"><div><h2 data-i18n="dash.deductionReasons">أسباب الاستقطاع</h2><p data-i18n="dash.amountDistribution">توزيع المبالغ</p></div></div>
        <div class="panel-body"><div class="bars" id="reasonBars"></div></div></div>
    </section>
`;
