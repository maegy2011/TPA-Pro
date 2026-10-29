const PAGE_CLAIMS = `
<section class="page" id="page-claims">
      <div class="toolbar">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="text" id="searchInput" placeholder="بحث برقم أو وارد أو مريض أو بند..." data-i18n-placeholder="claims.searchPlaceholder"></div>
        <div class="chips" id="filterChips">
          <button class="chip active" data-filter="all" data-i18n="common.all">الكل</button>
          <button class="chip" data-filter="pending">قيد المراجعة</button>
          <button class="chip" data-filter="partial">جزئياً</button>
          <button class="chip" data-filter="approved">معتمدة</button>
          <button class="chip" data-filter="rejected">مرفوضة</button>
          <button class="chip" data-filter="pa-required">⚠ تحتاج موافقة</button>
        </div>
        <div class="export-group">
          <button class="btn-export excel" data-export="claims" data-format="excel"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="m9 13 6 6M15 13l-6 6"/></svg></button>
          <button class="btn-export pdf" data-export="claims" data-format="pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h4M8 17h8"/></svg></button>
          <button class="btn-export print" data-export="claims" data-format="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
        </div>
      </div>
      <div class="bulk-bar" id="claimsBulkBar" style="margin-bottom:12px">
        <span>تم تحديد <b id="claimsBulkCount">0</b> مطالبة</span>
        <button type="button" id="claimsBulkReview" style="background:#EFF6F6;color:var(--teal);border-color:#C7E9E8">مراجعة الأولى</button>
        <button type="button" id="claimsBulkDelete" data-i18n="common.delete">حذف</button>
        <button type="button" class="restore-btn" id="claimsBulkClear" data-i18n="common.cancel">إلغاء</button>
      </div>
      <div class="panel"><div class="table-wrap"><table>
        <thead><tr>
          <th style="width:36px"><input type="checkbox" id="claimsSelectAll"></th>
          <th data-i18n="dash.claimNum">رقم / وارد</th><th data-i18n="dash.patient">المريض</th><th class="hide-sm">مقدم الخدمة</th><th class="hide-sm">التواريخ</th><th data-i18n="dash.billed">المطالب به</th><th data-i18n="dash.approved">المعتمد</th><th data-i18n="common.status">الحالة</th><th></th>
        </tr></thead><tbody id="claimsBody"></tbody></table></div></div>
    </section>
`;
