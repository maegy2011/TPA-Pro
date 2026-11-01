// Claim.js
export class Claim {
  constructor(data = {}) {
    this.id = data.id || '';
    this.type = data.type || 'workers';
    this.provider = data.provider || { id: '', name: '' };
    this.contract = data.contract || null;
    this.incomingNumber = data.incomingNumber || '';
    this.incomingDate = data.incomingDate || '';
    this.claimDate = data.claimDate || data.date || '';
    this.patientName = data.patientName || data.patient || '';
    this.memos = data.memos || [];
    this.exceptions = data.exceptions || [];
    this.totals = data.totals || { claimed: 0, allowed: 0, discounted: 0, net: 0, discountPct: 0 };
    this.decision = data.decision || null;
    this.generalDeductionReason = data.generalDeductionReason || data.reason || null;
    this.finalNotes = data.finalNotes || data.notes || '';
    this._signedOff = data._signedOff || false;
    this._reviewedBy = data._reviewedBy || null;
    this._reviewedAt = data._reviewedAt || null;
    this._locked = data._locked || false;
    this._overrideChecklist = data._overrideChecklist || null;
    this._session = data._session || { dirty: false, lastSavedAt: null };
    this.billed = data.billed || 0;
    this.approved = data.approved || 0;
    this.status = data.status || 'pending';
    this.priorApproval = data.priorApproval || null;
  }
  
  toJSON() {
    return { ...this };
  }
}

export default Claim;
