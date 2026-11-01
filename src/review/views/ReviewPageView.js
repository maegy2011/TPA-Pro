// ReviewPageView.js
import { SummaryBar } from '../components/SummaryBar.js';
import { MemoList } from '../components/MemoList.js';

export class ReviewPageView {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.summaryBar = null;
    this.memoList = null;
  }
  
  render(claim) {
    if (!this.container) return;
    this.container.innerHTML = `
      <section class="page" id="page-review-new">
        <div class="review-page" style="display:flex;flex-direction:column;gap:16px;padding:16px">
          <div class="review-page-head" style="display:flex;align-items:center;gap:12px">
            <div style="flex:1">
              <h2>مراجعة المطالبة</h2>
              <p id="rvPageSub">—</p>
            </div>
            <button class="btn out" id="rvPageBack">رجوع</button>
            <button class="btn solid" id="rvPageSave">حفظ المراجعة</button>
          </div>
          <div id="rvSummaryBar"></div>
          <div class="rv-invoice-review-block">
            <div class="rv-tabs" role="tablist">
              <button class="rv-tab active" data-tab="input">📋 1. التدقيق الآلي</button>
              <button class="rv-tab" data-tab="exceptions">⚠️ 2. الاستثناءات المعلقة (<span id="rvPageExcCount">0</span>)</button>
              <button class="rv-tab" data-tab="final">⚖️ 3. التخريج القانوني</button>
            </div>
            <div class="rv-tab-panel" id="rvPageTabInput">
              <div id="rvMemoList"></div>
            </div>
            <div class="rv-tab-panel" id="rvPageTabExceptions" style="display:none">قيد التطوير</div>
            <div class="rv-tab-panel" id="rvPageTabFinal" style="display:none">قيد التطوير</div>
          </div>
        </div>
      </section>
    `;
    
    const sub = this.container.querySelector('#rvPageSub');
    if (sub) sub.textContent = `${claim.id} • ${claim.patientName || claim.patient || ''}`;
    
    const sb = this.container.querySelector('#rvSummaryBar');
    this.summaryBar = new SummaryBar(sb);
    this.summaryBar.render();
    this.summaryBar.bind();
    
    const ml = this.container.querySelector('#rvMemoList');
    this.memoList = new MemoList(ml);
    this.memoList.render();
    this.memoList.bind();
    
    this.container.querySelectorAll('.rv-tab').forEach(btn => {
      btn.onclick = () => {
        this.container.querySelectorAll('.rv-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.container.querySelectorAll('.rv-tab-panel').forEach(p => p.style.display = 'none');
        const tab = btn.dataset.tab;
        if (tab === 'input') this.container.querySelector('#rvPageTabInput').style.display = '';
        if (tab === 'exceptions') this.container.querySelector('#rvPageTabExceptions').style.display = '';
        if (tab === 'final') this.container.querySelector('#rvPageTabFinal').style.display = '';
      };
    });
    
    const back = this.container.querySelector('#rvPageBack');
    if (back) back.onclick = () => { if (typeof closeReview === 'function') closeReview(); };
    const save = this.container.querySelector('#rvPageSave');
    if (save) save.onclick = () => { if (typeof saveReview === 'function') saveReview(); };
  }
  
  destroy() {
    if (this.summaryBar && typeof this.summaryBar.destroy === 'function') this.summaryBar.destroy();
    if (this.memoList && typeof this.memoList.destroy === 'function') this.memoList.destroy();
  }
}

export default ReviewPageView;
