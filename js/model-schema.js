// model-schema.js — المخطط المنظم لنموذج TPA Pro (الإصدار 2)
// القاعدة: كل كائن يدخل الذاكرة يمر عبر normalize — لا حقول مفقودة ولا أسماء مزدوجة.
const MODEL_VERSION = 2;
const CLAIM_DEFAULTS = { patient:'', provider:'', providerCode:null, type:'employee', date:'', receivedDate:'', receivedNumber:'', status:'new', reason:'', notes:'', billed:0, approved:0, invoices:[], priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' }, batchId:'', _reviewDrafts:[], _auditTrail:[], _overrideChecklist:[] };
const INVOICE_DEFAULTS = { id:'', number:'', debitNoteNumber:'', invoiceNumber:'', linkedInvoiceNumber:'', type:'outpatient', claimType:'employee', category:'external', invoiceCategory:'external', date:'', debitNoteDate:'', admissionDate:'', dischargeDate:'', roomClass:'', operationClass:'', packageType:'open', packagePrice:0, patientName:'', patientNationalId:'', patients:[], documents:{}, internalReview:{}, _locked:false };
const PATIENT_DEFAULTS = { id:'', name:'—', nationalId:'', beneficiaryType:'employee', letterDate:'', documents:{}, lines:[], deductionReasons:[], _final:0, _subtotal:0, _capMode:'auto', _copayMode:'auto', _manualCapAmount:0, _manualCopayAmount:0 };
const LINE_DEFAULTS = { code:'', name:'', category:'أخرى', qty:1, billedUnit:0, tariffUnit:null, tariffId:'', procedureDate:'', approved:0, note:'', requiresPriorApproval:false, _manualEntry:false, _overrideMode:'auto', _decision:'auto-approved', _checksFailed:[], _flaggedReasons:[] };
function _fillDefaults(obj, defaults){
  let fixed = 0;
  for(const k of Object.keys(defaults)){
    if(obj[k] === undefined){
      const d = defaults[k];
      obj[k] = (d && typeof d === 'object') ? JSON.parse(JSON.stringify(d)) : d;
      fixed++;
    }
  }
  return fixed;
}
/* توحيد الأسماء المزدوجة: الأولوية للاسم الأحدث، ثم يُزامن الاثنان. */
function _syncPair(obj, a, b){
  if((obj[a] === undefined || obj[a] === '' || obj[a] === null) && obj[b] !== undefined && obj[b] !== '' && obj[b] !== null){ obj[a] = obj[b]; return 1; }
  if((obj[b] === undefined || obj[b] === '' || obj[b] === null) && obj[a] !== undefined && obj[a] !== '' && obj[a] !== null){ obj[b] = obj[a]; return 1; }
  return 0;
}
function normalizeLine(l){
  if(!l || typeof l !== 'object') return { line: { ...LINE_DEFAULTS }, fixed: 1 };
  let fixed = _fillDefaults(l, LINE_DEFAULTS);
  if(typeof l.qty !== 'number' || !(l.qty > 0)){ l.qty = 1; fixed++; }
  if(!Array.isArray(l._checksFailed)) l._checksFailed = [];
  if(!Array.isArray(l._flaggedReasons)) l._flaggedReasons = [];
  return { line: l, fixed };
}
function normalizePatient(p, invClaimType){
  if(!p || typeof p !== 'object') p = {};
  let fixed = _fillDefaults(p, PATIENT_DEFAULTS);
  if(!p.beneficiaryType && invClaimType) p.beneficiaryType = invClaimType;
  if(!Array.isArray(p.lines)) p.lines = [];
  if(!Array.isArray(p.deductionReasons)) p.deductionReasons = [];
  if(p.documents === undefined || p.documents === null) p.documents = {};
  p.lines.forEach(l => { fixed += normalizeLine(l).fixed; });
  return { patient: p, fixed };
}
function normalizeInvoice(inv, claimType){
  if(!inv || typeof inv !== 'object') inv = {};
  let fixed = _fillDefaults(inv, INVOICE_DEFAULTS);
  fixed += _syncPair(inv, 'debitNoteNumber', 'number');
  fixed += _syncPair(inv, 'linkedInvoiceNumber', 'invoiceNumber');
  fixed += _syncPair(inv, 'invoiceCategory', 'category');
  if(!inv.debitNoteNumber && inv.id) inv.debitNoteNumber = inv.id;
  if(!inv.number && inv.id) inv.number = inv.id;
  if(inv.debitNoteDate && !inv.date) inv.date = inv.debitNoteDate;
  if(!Array.isArray(inv.patients)) inv.patients = [];
  if(inv.documents === undefined || inv.documents === null) inv.documents = {};
  if(inv.internalReview === undefined || inv.internalReview === null || typeof inv.internalReview !== 'object') inv.internalReview = {};
  inv.patients.forEach(p => { fixed += normalizePatient(p, inv.claimType || claimType).fixed; });
  return { invoice: inv, fixed };
}
function mkClaim(overrides){
  const c = { ...JSON.parse(JSON.stringify({ ...CLAIM_DEFAULTS, priorApproval: { ...CLAIM_DEFAULTS.priorApproval } })), id: 'CLM-' + Date.now().toString(36).toUpperCase(), ...(overrides || {}) };
  normalizeClaim(c);
  return c;
}
function normalizeClaim(claim){
  if(!claim || typeof claim !== 'object') return { claim, fixed: 0 };
  let fixed = _fillDefaults(claim, CLAIM_DEFAULTS);
  if(!claim.priorApproval || typeof claim.priorApproval !== 'object') claim.priorApproval = { ...CLAIM_DEFAULTS.priorApproval };
  if(!Array.isArray(claim.invoices)) claim.invoices = [];
  if(!Array.isArray(claim._reviewDrafts)) claim._reviewDrafts = [];
  if(!Array.isArray(claim._auditTrail)) claim._auditTrail = [];
  if(!Array.isArray(claim._overrideChecklist)) claim._overrideChecklist = [];
  if(claim._modelVersion !== MODEL_VERSION){ claim._modelVersion = MODEL_VERSION; fixed++; }
  if('reviewProgress' in claim){ delete claim.reviewProgress; fixed++; } // هجرة: المؤشر انتقل للجلسة
  claim.invoices.forEach(inv => { fixed += normalizeInvoice(inv, claim.type).fixed; });
  return { claim, fixed };
}
/* فحص الشكل: يُستخدم عند الاستيراد والتحميل — يعيد قائمة مشاكل قابلة للقراءة. */
function validateClaimShape(claim){
  const issues = [];
  if(!claim || typeof claim !== 'object') return ['كائن غير صالح'];
  if(!claim.id) issues.push('بلا معرف');
  if(!Array.isArray(claim.invoices)) issues.push('الفواتير ليست قائمة');
  else claim.invoices.forEach((inv, ii) => {
    if(!inv || typeof inv !== 'object'){ issues.push(`مذكرة ${ii+1}: كائن غير صالح`); return; }
    if(!Array.isArray(inv.patients)) issues.push(`مذكرة ${inv.id || ii+1}: المرضى ليسوا قائمة`);
    else inv.patients.forEach((p, pi) => {
      if(!p || typeof p !== 'object'){ issues.push(`مذكرة ${inv.id || ii+1} مريض ${pi+1}: كائن غير صالح`); return; }
      if(!Array.isArray(p.lines)) issues.push(`مريض ${p.name || pi+1}: البنود ليست قائمة`);
      else p.lines.forEach((l, li) => {
        if(!l || typeof l !== 'object'){ issues.push(`مريض ${p.name || pi+1} بند ${li+1}: كائن غير صالح`); return; }
        if(!l.code) issues.push(`مريض ${p.name || pi+1} بند ${li+1}: بلا كود`);
        if(!(Number(l.qty) > 0)) issues.push(`بند ${l.code || li+1}: كمية غير صالحة`);
        if(!((Number(l.billedUnit) || 0) >= 0)) issues.push(`بند ${l.code || li+1}: سعر غير صالح`);
      });
    });
  });
  return issues;
}
