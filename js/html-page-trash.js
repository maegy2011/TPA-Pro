const PAGE_TRASH = `
<section class="page" id="page-trash">
      <div class="grid-kpi" id="trashKpi"></div>
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="trashSearch" placeholder="بحث..." data-i18n-placeholder="common.search"></div>
        <div class="chips" id="trashFilterChips">
          <button class="chip active" data-trf="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-trf="claim">مطالبات</button>
          <button class="chip" data-trf="provider">جهات</button>
          <button class="chip" data-trf="contract">عقود</button>
          <button class="chip" data-trf="tariff">لوائح</button>
          <button class="chip" data-trf="batch">دفعات</button>
        </div>
        <button class="btn-danger-outline" id="emptyTrashBtn" style="margin-right:0">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          إفراغ
        </button>
      </div>
      <div class="bulk-bar" id="trashBulkBar" style="margin-bottom:12px">
        <span>تم تحديد <b id="trashBulkCount">0</b> عنصر</span>
        <button type="button" class="restore-btn" id="trashBulkRestore">استعادة</button>
        <button type="button" id="trashBulkDelete">حذف نهائي</button>
      </div>
      <div class="panel"><div class="panel-head">
        <div><h2 data-i18n="page.trash">سلة المحذوفات</h2><p id="trashInfo">—</p></div>
        <label class="check-row" style="margin:0;padding:8px 12px;font-size:12px"><input type="checkbox" id="trashSelectAll"> تحديد الكل</label>
      </div><div id="trashList"></div></div>
    </section>
`;
