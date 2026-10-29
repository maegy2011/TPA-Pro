const PAGE_SEARCH = `
<section class="page" id="page-search">
      <div class="panel" style="margin-bottom:18px">
        <div class="panel-head"><div><h2>محرك البحث في اللوائح</h2><p>ابحث في الخدمات</p></div></div>
        <div class="panel-body">
          <div class="search-filters">
            <div class="fg" style="margin:0"><label>البحث</label>
              <div class="search-box" style="max-width:none"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="text" id="srchQuery" placeholder="اسم، كود، فئة..." data-i18n-placeholder="search.searchPlaceholder"></div>
            </div>
            <div class="fg" style="margin:0"><label>اللائحة</label>
              <select id="srchTariff" style="width:100%;height:44px;border-radius:12px;border:1.5px solid var(--line);background:#fff;padding:0 14px"><option value="all">جميع اللوائح</option></select>
            </div>
          </div>
          <div class="chips" style="margin-top:14px" id="srchChips">
            <button class="chip active" data-srch="all" data-i18n="common.all">الكل</button>
            <button class="chip" data-srch="covered">المغطاة</button>
            <button class="chip" data-srch="pa">تتطلب موافقة</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2>النتائج</h2><p id="srchCount">—</p></div>
          <select id="srchPerPage" style="height:38px;border-radius:9px;border:1.5px solid var(--line);background:#fff;padding:0 10px;font-size:12.5px;font-weight:700"><option value="12">12</option><option value="24">24</option><option value="48">48</option></select>
        </div>
        <div class="panel-body"><div class="srch-stats-bar" id="srchStatsBar"></div><div class="search-results-grid" id="srchResults"></div><div class="pagination" id="srchPagination"></div></div>
      </div>
    </section>
`;
