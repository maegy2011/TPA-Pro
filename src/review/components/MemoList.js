// MemoList.js
import { MemoCard } from './MemoCard.js';
import * as MemoController from '../controller/MemoController.js';
import * as ReviewController from '../controller/ReviewController.js';

export class MemoList {
  constructor(container) {
    this.container = container;
    this.cards = new Map();
  }
  
  render() {
    if (!this.container) return;
    const memos = MemoController.getMemos();
    this.container.innerHTML = `
      <div class="memo-list" style="display:flex;flex-direction:column;gap:12px">
        ${memos.map(m => `<div class="memo-wrap" data-memo-id="${m.id}"></div>`).join('')}
      </div>
      <div style="margin-top:12px">
        <button class="btn out" id="btnAddMemo">+ إنشاء مذكرة خصم</button>
      </div>
    `;
    
    memos.forEach(m => {
      const wrap = this.container.querySelector(`.memo-wrap[data-memo-id="${m.id}"]`);
      if (wrap) {
        const card = new MemoCard(wrap);
        card.render(m);
        card.bind();
        this.cards.set(m.id, card);
      }
    });
    
    const btn = this.container.querySelector('#btnAddMemo');
    if (btn) {
      btn.onclick = () => {
        const claim = ReviewController.getClaim();
        const memo = MemoController.createMemo(claim.id, { name: claim.patientName }, {});
        this.render();
      };
    }
  }
  
  bind() {
    ReviewController.on('memo:created', () => this.render());
    ReviewController.on('memo:updated', () => this.render());
    ReviewController.on('memo:removed', () => this.render());
  }
  
  destroy() {
    this.cards.forEach(c => { if (typeof c.destroy === 'function') c.destroy(); });
    this.cards.clear();
  }
}

export default MemoList;
