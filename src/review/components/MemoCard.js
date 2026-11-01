// MemoCard.js
import * as ItemsController from '../controller/ItemsController.js';
import * as MemoController from '../controller/MemoController.js';

export class MemoCard {
  constructor(container) {
    this.container = container;
    this.memo = null;
  }
  
  render(memo) {
    this.memo = memo;
    if (!this.container) return;
    const items = memo.items || [];
    const statusMap = { draft: 'مسودة', in_review: 'قيد المراجعة', approved: 'معتمدة', sent: 'مرسلة', reopened: 'معاد فتحها' };
    
    this.container.innerHTML = `
      <div class="memo-card" style="border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)">
        <div class="memo-card-head" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:linear-gradient(90deg,var(--panel2),transparent)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${memo.number} — ${memo.patient.name || '—'}</div>
            <div style="font-size:12px;color:var(--muted)">فاتورة: ${memo.invoice.number || '—'} | عضوية: ${memo.patient.membershipNo || '—'} | حالة: ${statusMap[memo.status] || memo.status}</div>
          </div>
          <button class="btn-sm ghost" data-action="toggle">طي/فتح</button>
          <button class="btn-sm ghost" data-action="reapply">إعادة تطبيق القواعد</button>
          <button class="btn-sm ghost" data-action="delete">حذف</button>
        </div>
        <div class="memo-card-body">
          <div style="padding:12px 14px">
            <table class="items-table" style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:var(--panel2)">
                  <th style="text-align:right;padding:8px">الكود</th>
                  <th style="text-align:right;padding:8px">الإجراء</th>
                  <th style="text-align:right;padding:8px">المطالب به</th>
                  <th style="text-align:right;padding:8px">المسموح</th>
                  <th style="text-align:right;padding:8px">الخصم</th>
                  <th style="text-align:right;padding:8px">سبب الخصم</th>
                  <th style="text-align:right;padding:8px">المصدر</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td style="padding:6px 8px">${it.procedure.code || ''}</td>
                    <td style="padding:6px 8px">${it.procedure.name || ''}</td>
                    <td style="padding:6px 8px">${fmt ? fmt(it.enteredValue) : it.enteredValue}</td>
                    <td style="padding:6px 8px">${fmt ? fmt(it.allowedValue) : it.allowedValue}</td>
                    <td style="padding:6px 8px;color:var(--bad)">${fmt ? fmt(it.discounted) : it.discounted}</td>
                    <td style="padding:6px 8px">${it.reasonCode || '—'}</td>
                    <td style="padding:6px 8px">${it.source}</td>
                  </tr>
                `).join('')}
                ${items.length === 0 ? `<tr><td colspan="7" style="padding:12px;text-align:center;color:var(--muted)">لا توجد بنود</td></tr>` : ''}
              </tbody>
            </table>
          </div>
          <div class="memo-card-foot" style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid var(--line)">
            <button class="btn-sm solid" data-action="add-item">+ إضافة بند</button>
            <div style="flex:1"></div>
            <div style="font-size:13px">المطالب به: <b>${fmt ? fmt(memo.totals.claimed) : memo.totals.claimed}</b> | المسموح: <b>${fmt ? fmt(memo.totals.allowed) : memo.totals.allowed}</b> | الخصم: <b style="color:var(--bad)">${fmt ? fmt(memo.totals.discounted) : memo.totals.discounted}</b></div>
          </div>
        </div>
      </div>
    `;
  }
  
  bind() {
    if (!this.container) return;
    this.container.onclick = (e) => {
      const act = e.target.closest('[data-action]');
      if (!act) return;
      const action = act.dataset.action;
      if (action === 'delete') {
        if (confirm('حذف المذكرة؟')) {
          MemoController.deleteMemo(this.memo.id);
        }
        return;
      }
      if (action === 'reapply') {
        ItemsController.reapplyRules(this.memo.id);
        return;
      }
      if (action === 'add-item') {
        // فتح البحث بسرعة
        if (typeof openSearchPalette === 'function') {
          openSearchPalette(this.memo.id);
        } else {
          alert('لوحة البحث قيد التطوير');
        }
        return;
      }
      if (action === 'toggle') {
        const body = this.container.querySelector('.memo-card-body');
        if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
        return;
      }
    };
  }
  
  destroy() {}
}

export default MemoCard;
