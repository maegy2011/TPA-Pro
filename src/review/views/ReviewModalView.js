// ReviewModalView.js
import { SummaryBar } from '../components/SummaryBar.js';
import { MemoList } from '../components/MemoList.js';

export class ReviewModalView {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.summaryBar = null;
    this.memoList = null;
  }
  
  render(claim) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="review-modal-view" style="display:flex;flex-direction:column;gap:12px">
        <div id="rvSummaryBar"></div>
        <div class="rv-tabs" role="tablist">
          <button class="rv-tab active" data-tab="input">📋 1. الإدخال والتدقيق الآلي</button>
          <button class="rv-tab" data-tab="exceptions">⚠️ 2. الاستثناءات المعلقة (<span id="rvExcCount">0</span>)</button>
          <button class="rv-tab" data-tab="final">⚖️ 3. القرار والتخريج القانوني النهائي</button>
        </div>
        <div class="rv-tab-panel" id="rvTabInput">
          <div id="rvMemoList"></div>
        </div>
        <div class="rv-tab-panel" id="rvTabExceptions" style="display:none">
          <div id="rvExceptionsPanel">قيد التطوير</div>
        </div>
        <div class="rv-tab-panel" id="rvTabFinal" style="display:none">
          <div id="rvFinalPanel">قيد التطوير</div>
        </div>
      </div>
    `;
    
    const sb = this.container.querySelector('#rvSummaryBar');
    this.summaryBar = new SummaryBar(sb);
    this.summaryBar.render();
    this.summaryBar.bind();
    
    const ml = this.container.querySelector('#rvMemoList');
    this.memoList = new MemoList(ml);
    this.memoList.render();
    this.memoList.bind();
    
    // تبويبات بسيطة
    this.container.querySelectorAll('.rv-tab').forEach(btn => {
      btn.onclick = () => {
        this.container.querySelectorAll('.rv-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.container.querySelectorAll('.rv-tab-panel').forEach(p => p.style.display = 'none');
        const tab = btn.dataset.tab;
        if (tab === 'input') this.container.querySelector('#rvTabInput').style.display = '';
        if (tab === 'exceptions') this.container.querySelector('#rvTabExceptions').style.display = '';
        if (tab === 'final') this.container.querySelector('#rvTabFinal').style.display = '';
      };
    });
  }
  
  destroy() {
    if (this.summaryBar && typeof this.summaryBar.destroy === 'function') this.summaryBar.destroy();
    if (this.memoList && typeof this.memoList.destroy === 'function') this.memoList.destroy();
  }
}

export default ReviewModalView;
