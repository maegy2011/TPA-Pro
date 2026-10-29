const PAGE_TIMELINE = `
<section class="page" id="page-timeline">
      <div class="tl-page-header">
        <button class="btn-back" id="timelineBackBtn"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg> عودة</button>
        <div><div id="tlHeaderTitle" style="font-size:17px;font-weight:800;color:var(--navy)">—</div><div id="tlHeaderSub" style="font-size:12.5px;color:var(--muted);margin-top:3px">—</div></div>
        <div class="export-group" style="margin-right:auto">
          <button class="btn-export pdf" data-export="timeline" data-format="pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h4M8 17h8"/></svg></button>
          <button class="btn-export print" data-export="timeline" data-format="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></button>
          <button class="btn-sm" id="timelineReviewBtn" data-i18n="timeline.review">مراجعة</button>
        </div>
      </div>
      <div class="tl-summary" id="tlSummary"></div>
      <div class="panel"><div class="panel-head"><div><h2>الخط الزمني الكامل</h2><p id="tlCount">—</p></div></div>
        <div class="panel-body"><div class="vertical-timeline" id="timelineList"></div></div></div>
    </section>
`;
