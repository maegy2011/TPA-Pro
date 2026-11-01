// Item.js
export class Item {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.memoId = data.memoId || '';
    this.procedure = data.procedure || { code: '', name: '', listId: '', listName: '' };
    this.enteredValue = Number(data.enteredValue) || 0;
    this.allowedValue = Number(data.allowedValue) || 0;
    this.discounted = Number(data.discounted) || Math.max(0, this.enteredValue - this.allowedValue);
    this.reasonCode = data.reasonCode || null;
    this.reasonText = data.reasonText || '';
    this.source = data.source || 'auto';
    this.ruleApplied = data.ruleApplied || null;
    this.status = data.status || 'ok';
    this.exceptionId = data.exceptionId || null;
    this.note = data.note || '';
    this.audit = data.audit || [];
  }
  
  generateId() {
    return 'IT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }
  
  recalc() {
    this.discounted = Math.max(0, Number(this.enteredValue) || 0 - Number(this.allowedValue) || 0);
    return this;
  }
  
  toJSON() {
    return { ...this };
  }
}

export default Item;
