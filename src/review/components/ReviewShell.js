// ReviewShell.js
import * as ReviewController from '../controller/ReviewController.js';

export class ReviewShell {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;
    this.mode = options.mode || 'auto';
    this.view = null;
  }
  
  mount(claim, workingInvoices) {
    if (!this.container) throw new Error('container not found');
    ReviewController.setClaim(claim);
    ReviewController.setWorkingInvoices(workingInvoices);
    ReviewController.markDirty(false);
    
    // تحديد النسخة
    if (this.mode === 'auto') {
      const memosCount = (claim.memos || []).length;
      const excCount = (claim.exceptions || []).filter(e => !e.decision).length;
      if (memosCount > 3 || excCount > 0 || new URLSearchParams(location.search).get('mode') === 'page') {
        this.mode = 'page';
      } else {
        this.mode = 'modal';
      }
    }
    
    console.info('[ReviewShell] mode:', this.mode);
    
    if (this.mode === 'page') {
      import('../views/ReviewPageView.js').then(m => {
        this.view = new m.ReviewPageView(this.container, this.options);
        this.view.render(claim);
      });
    } else {
      import('../views/ReviewModalView.js').then(m => {
        this.view = new m.ReviewModalView(this.container, this.options);
        this.view.render(claim);
      });
    }
    
    return this;
  }
  
  destroy() {
    if (this.view && typeof this.view.destroy === 'function') {
      this.view.destroy();
    }
    this.view = null;
  }
}

export default ReviewShell;
