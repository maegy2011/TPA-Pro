// DiscountMemo.js
export class DiscountMemo {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.number = data.number || this.id;
    this.status = data.status || 'draft';
    this.patient = data.patient || { name: '', membershipNo: '', admissionDate: '', dischargeDate: '' };
    this.invoice = data.invoice || { number: '', enteredValue: 0, computedValue: 0, variance: 0 };
    this.items = data.items || [];
    this.memoNotes = data.memoNotes || '';
    this.generalReason = data.generalReason || null;
    this.attachments = data.attachments || [];
    this.totals = data.totals || { claimed: 0, allowed: 0, discounted: 0, net: 0 };
    this.audit = data.audit || [];
    this._dirty = data._dirty || false;
  }
  
  generateId() {
    return 'DM-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }
  
  toJSON() {
    return { ...this };
  }
}

export default DiscountMemo;
