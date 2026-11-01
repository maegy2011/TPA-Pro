// schemas.js - تعريفات الحقول والتحقق
export const SCHEMAS = {
  claim: {
    id: { type: 'string', required: true },
    type: { type: 'enum', values: ['workers', 'pensions'], default: 'workers' },
    provider: { type: 'object', required: true },
    contract: { type: 'object' },
    incomingNumber: { type: 'string' },
    incomingDate: { type: 'string' },
    claimDate: { type: 'string' },
    patientName: { type: 'string' },
    memos: { type: 'array', default: [] },
    exceptions: { type: 'array', default: [] },
    totals: { type: 'object', default: { claimed: 0, allowed: 0, discounted: 0, net: 0, discountPct: 0 } },
    decision: { type: 'enum', values: ['approve_full', 'approve_partial', 'reject_full'], default: null },
    generalDeductionReason: { type: 'string', default: null },
    finalNotes: { type: 'string', default: '' },
    _signedOff: { type: 'boolean', default: false },
    _reviewedBy: { type: 'string', default: null },
    _reviewedAt: { type: 'string', default: null },
    _locked: { type: 'boolean', default: false },
    _overrideChecklist: { type: 'array', default: null },
    _session: { type: 'object', default: { dirty: false, lastSavedAt: null } }
  },
  discountMemo: {
    id: { type: 'string', required: true },
    number: { type: 'string', required: true },
    status: { type: 'enum', values: ['draft', 'in_review', 'approved', 'sent', 'reopened'], default: 'draft' },
    patient: { type: 'object', required: true },
    invoice: { type: 'object', required: true },
    items: { type: 'array', default: [] },
    memoNotes: { type: 'string', default: '' },
    generalReason: { type: 'string', default: null },
    attachments: { type: 'array', default: [] },
    totals: { type: 'object', default: { claimed: 0, allowed: 0, discounted: 0, net: 0 } },
    audit: { type: 'array', default: [] }
  },
  item: {
    id: { type: 'string', required: true },
    memoId: { type: 'string', required: true },
    procedure: { type: 'object', required: true },
    enteredValue: { type: 'number', required: true, min: 0 },
    allowedValue: { type: 'number', required: true, min: 0 },
    discounted: { type: 'number', default: 0, min: 0 },
    reasonCode: { type: 'string', default: null },
    reasonText: { type: 'string', default: '' },
    source: { type: 'enum', values: ['auto', 'manual', 'mixed'], default: 'auto' },
    ruleApplied: { type: 'object', default: null },
    status: { type: 'enum', values: ['ok', 'exception', 'needs_review'], default: 'ok' },
    exceptionId: { type: 'string', default: null },
    note: { type: 'string', default: '' },
    audit: { type: 'array', default: [] }
  },
  exception: {
    id: { type: 'string', required: true },
    memoId: { type: 'string', required: true },
    itemId: { type: 'string', required: true },
    severity: { type: 'enum', values: ['critical', 'medium', 'info'], default: 'medium' },
    ruleCode: { type: 'string', required: true },
    ruleMessage: { type: 'string', required: true },
    decision: { type: 'enum', values: ['approve_manual', 'reject', 'reduce', 'request_preapproval', 'reopen'], default: null },
    reductionAmount: { type: 'number', default: null },
    note: { type: 'string', default: '' },
    decidedBy: { type: 'string', default: null },
    decidedAt: { type: 'string', default: null }
  }
};

export const VALIDATORS = {
  membershipNo: /^\d{5,12}$/,
  validateMembershipNo(val) {
    if (!val) return { valid: false, message: 'رقم العضوية مطلوب' };
    if (!this.membershipNo.test(val)) return { valid: false, message: 'رقم عضوية غير صالح' };
    return { valid: true };
  },
  validateDates(admissionDate, dischargeDate) {
    if (!admissionDate) return { valid: false, message: 'تاريخ الدخول مطلوب' };
    if (!dischargeDate) return { valid: false, message: 'تاريخ الخروج مطلوب' };
    if (new Date(dischargeDate) < new Date(admissionDate)) {
      return { valid: false, message: 'تاريخ الخروج قبل الدخول' };
    }
    return { valid: true };
  },
  validateInvoiceValue(val) {
    if (val === null || val === undefined || val === '') return { valid: false, message: 'قيمة الفاتورة مطلوبة' };
    const n = Number(val);
    if (isNaN(n) || n <= 0) return { valid: false, message: 'قيمة الفاتورة مطلوبة' };
    return { valid: true };
  },
  validateItemValue(val) {
    if (val === null || val === undefined || val === '') return { valid: false, message: 'قيمة البند مطلوبة' };
    const n = Number(val);
    if (isNaN(n) || n <= 0) return { valid: false, message: 'قيمة البند مطلوبة' };
    return { valid: true };
  },
  validateDiscountReason(item) {
    if ((Number(item.discounted) || 0) > 0 && !item.reasonCode) {
      return { valid: false, message: 'سبب الخصم إلزامي' };
    }
    return { valid: true };
  }
};
