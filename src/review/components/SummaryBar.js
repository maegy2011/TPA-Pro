// SummaryBar.js
import * as ReviewController from '../controller/ReviewController.js';

export class SummaryBar {
  constructor(container) {
    this.container = container;
    this.unsub = null;
  }
  
  render() {
    if (!this.container) return;
    const claim = ReviewController.getClaim();
    const totals = ReviewController.recalcTotals();
    const memos = (claim && claim.memos) ? claim.memos : [];
    const patients = new Set();
    memos.forEach(m => { if (m.patient && m.patient.name) patients.add(m.patient.name); });
    
    const varianceCount = memos.filter(m => m.invoice && Math.abs(Number(m.invoice.variance) || 0) > 0).length;
    const warn = varianceCount > 0 ? `<span style="background:#f59e0b22;color:#b45309;padding:2px 8px;border-radius:6px">⚠️ فرق في ${varianceCount} مذكرة</span>` : '';
    
    this.container.innerHTML = `
      <div class="review-summary-bar" style="display:flex;gap:16px;align-items:center;padding:10px 16px;background:var(--panel);border:1px solid var(--line);border-radius:10px;position:sticky;top:0;z-index:5;flex-wrap:wrap">
        <div>مذكرات: <b>${memos.length}</b></div>
        <div>مرضى: <b>${patients.size}</b></div>
        <div>إجمالي: <b>${fmt ? fmt(totals.claimed) : totals.claimed}</b></div>
        <div>استقطاع: <b style="color:var(--bad)">${fmt ? fmt(totals.discounted) : totals.discounted} (${totals.discountPct.toFixed(1)}%)</b></div>
        <div>صافي: <b style="color:var(--ok)">${fmt ? fmt(totals.net) : totals.net}</b></div>
        <div>${warn}</div>
      </div>
    `;
  }
  
  bind() {
    this.unsub = ReviewController.on('totals:changed', () => this.render());
    ReviewController.on('memo:created', () => this.render());
    ReviewController.on('memo:updated', () => this.render());
    ReviewController.on('memo:removed', () => this.render());
    ReviewController.on('item:added', () => this.render());
    ReviewController.on('item:updated', () => this.render());
    ReviewController.on('item:removed', () => this.render());
  }
  
  destroy() {
    if (typeof this.unsub === 'function') this.unsub();
  }
}

export default SummaryBar;
