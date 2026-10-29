const PAGE_SESSIONS = `
<section class="page" id="page-sessions">
      <div class="grid-kpi" id="sessionsKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="sessionsSearch" placeholder="بحث برقم أو مريض..." data-i18n-placeholder="sessions.searchPlaceholder"></div>
        <div class="chips" id="sessionsFilterChips">
          <button class="chip active" data-sfilter="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-sfilter="active">نشطة</button>
          <button class="chip" data-sfilter="paused">موقوفة</button>
        </div>
        <button class="btn-add" id="newSessionBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> جلسة جديدة</button>
      </div>
      <div id="sessionsList"></div>
    </section>
`;
