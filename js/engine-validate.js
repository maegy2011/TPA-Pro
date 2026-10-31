/* ============================================================
   engine-validate.js — محرك الفحص التلقائي
   يعمل بعد engine-rules.js وقبل compute-patient.js
   ============================================================ */

/* ---------- قائمة الأسباب الموحّدة ---------- */
const VALIDATION_REASONS = {
  'not-in-tariff':      { label: 'غير مدرجة في اللائحة',        severity: 'reject',    category: 'coverage' },
  'not-covered':        { label: 'غير مغطاة بالعقد',            severity: 'reject',    category: 'coverage' },
  'pa-rejected':        { label: 'الموافقة المسبقة مرفوضة',     severity: 'reject',    category: 'pa' },
  'pa-expired':         { label: 'الموافقة المسبقة منتهية',     severity: 'reject',    category: 'pa' },
  'manual-entry':       { label: 'إدخال يدوي غير مدرج',          severity: 'reject',    category: 'coverage' },

  'pa-required':        { label: 'تتطلب موافقة مسبقة — لم تُطلب', severity: 'attention', category: 'pa' },
  'pa-pending':         { label: 'موافقة مسبقة قيد الطلب',       severity: 'attention', category: 'pa' },
  'duplicate':          { label: 'بند مكرر',                     severity: 'attention', category: 'duplication' },
  'over-frequency':     { label: 'تجاوز حد التكرار',             severity: 'attention', category: 'duplication' },
  'unbundling':         { label: 'تفكيك إجراء',                  severity: 'attention', category: 'unbundling' },
  'waiting-period':     { label: 'داخل فترة الانتظار',            severity: 'attention', category: 'eligibility' },

  'tariff-limit':       { label: 'تجاوز سعر اللائحة',            severity: 'reduce',    category: 'pricing' },
  'contract-discount':  { label: 'خصم العقد',                    severity: 'reduce',    category: 'contract' },
};

function getContractContext(claim) {
  const empty = { provider: null, contract: null, tariff: null, serviceOverrides: {} };
  if (!claim) return empty;

  const provider = (typeof providers !== 'undefined' ? providers : []).find(p => p.name === claim.provider) || null;
  if (!provider) return { ...empty, provider };

  const contract = (typeof contracts !== 'undefined' ? contracts : []).find(c => c.providerId === provider.id && ['active','expiring','upcoming'].includes(effectiveContractStatus(c))) || null;

  let tariff = null;
  if (contract?.tariffId) {
    tariff = (typeof tariffs !== 'undefined' ? tariffs : []).find(t => t.id === contract.tariffId && effectiveTariffStatus(t) === 'active') || null;
  }
  if (!tariff && contract) {
    tariff = (typeof tariffs !== 'undefined' ? tariffs : []).find(t =>
      ((t.linkedContractIds || []).includes(contract.id) ||
       (t.linkedProviderIds || []).includes(provider.id)) &&
      effectiveTariffStatus(t) === 'active'
    ) || null;
  }

  const serviceOverrides = contract?.serviceOverrides || {};

  return { provider, contract, tariff, serviceOverrides };
}

function getContractRateForService(ctx, code) {
  const ov = ctx?.serviceOverrides?.[code];
  if (ov && ov.discountRate !== null && ov.discountRate !== undefined) {
    return Number(ov.discountRate) || 0;
  }
  return Number(ctx?.contract?.discountRate) || 0;
}

function isServiceCovered(ctx, code) {
  const ov = ctx?.serviceOverrides?.[code];
  if (ov && ov.covered === false) return false;
  const svc = (ctx?.tariff?.services || []).find(s => String(s.code) === String(code));
  if (svc && svc.covered === false) return false;
  return true;
}

/* ---------- التخزين المؤقت لنتائج الفحص ---------- */
const VALIDATION_CACHE = new Map();
function _validationCacheKey(line, ctx){
  try {
    return JSON.stringify({
      code: line.code, qty: line.qty, billedUnit: line.billedUnit, manual: !!line._manualEntry,
      claim: ctx.claim && ctx.claim.id, inv: ctx.invoice && ctx.invoice.id, pat: ctx.patient && ctx.patient.id,
      contract: ctx.contract && ctx.contract.id, tariff: ctx.tariff && ctx.tariff.id,
    });
  } catch(e){ return null; }
}
function clearValidationCache(){ VALIDATION_CACHE.clear(); }

function validateLine(line, ctx) {
  const _ck = _validationCacheKey(line, ctx);
  if (_ck && VALIDATION_CACHE.has(_ck)) { return JSON.parse(JSON.stringify(VALIDATION_CACHE.get(_ck))); }
  const { claim, patient, invoice, contract, tariff, serviceOverrides } = ctx;
  const ctxFull = { claim, patient, invoice, contract, tariff, serviceOverrides: serviceOverrides || (contract?.serviceOverrides || {}) };
  const passed = [];
  const failed = [];
  const reductions = [];

  const billedTotal = (Number(line.qty) || 0) * (Number(line.billedUnit) || 0);
  const code = String(line.code || '').trim();

  const tariffSvc = (tariff?.services || []).find(s => String(s.code) === code) || null;
  if (!tariffSvc || line._manualEntry) {
    failed.push(line._manualEntry ? 'manual-entry' : 'not-in-tariff');
  } else {
    passed.push('in-tariff');
  }

  if (tariffSvc && !line._manualEntry) {
    if (!isServiceCovered(ctxFull, code)) {
      failed.push('not-covered');
    } else {
      passed.push('covered');
    }
  }

  if (tariffSvc && !line._manualEntry) {
    const ov = (ctxFull.serviceOverrides || {})[code] || {};
    const requiresPA = ov.requiresPA === true || tariffSvc.requiresPriorApproval === true;
    if (requiresPA) {
      const pa = claim?.priorApproval;
      if (!pa || !pa.required) {
        failed.push('pa-required');
      } else if (pa.status === 'rejected') {
        failed.push('pa-rejected');
      } else if (pa.status === 'pending' || pa.status === 'not-requested') {
        failed.push('pa-pending');
      } else if (pa.status === 'approved') {
        const lineDate = invoice?.date || claim?.date;
        if (pa.date && lineDate && new Date(pa.date) > new Date(lineDate)) {
          failed.push('pa-expired');
        } else {
          passed.push('pa-valid');
        }
      }
    }
  }

  const tariffUnit = tariffSvc?.currentPrice ?? null;
  const tariffTotal = tariffUnit !== null ? (Number(line.qty) || 0) * tariffUnit : null;

  if (tariffSvc && tariffTotal !== null) {
    if (billedTotal > tariffTotal + 0.01) {
      passed.push('price-exceeds');
      reductions.push('tariff-limit');
    } else {
      passed.push('price-ok');
    }
  }

  if (patient && invoice) {
    const siblings = (patient.lines || []).filter(l => l !== line && String(l.code) === code);
    if (siblings.length > 0) {
      failed.push('duplicate');
    } else {
      passed.push('no-duplicate');
    }
  }

  let decision = 'auto-approved';
  let suggestedAction = null;

  const hasReject = failed.some(f => VALIDATION_REASONS[f]?.severity === 'reject');
  const hasAttention = failed.some(f => VALIDATION_REASONS[f]?.severity === 'attention');

  if (hasReject) {
    decision = 'auto-rejected';
    suggestedAction = { type: 'reject', reason: failed.find(f => VALIDATION_REASONS[f]?.severity === 'reject') };
  } else if (hasAttention) {
    decision = 'needs-attention';
    const first = failed.find(f => VALIDATION_REASONS[f]?.severity === 'attention');
    suggestedAction = {
      type: first?.startsWith('pa') ? 'request-pa' : 'review',
      reason: first
    };
  } else if (reductions.length > 0) {
    decision = 'auto-reduced';
    suggestedAction = { type: 'reduce', reason: reductions[0] };
  }

  const contractRate = getContractRateForService(ctxFull, code);
  const covered = !line._manualEntry && isServiceCovered(ctxFull, code) && !!tariffSvc;
  const lesser = tariffTotal !== null ? Math.min(billedTotal, tariffTotal) : billedTotal;
  const afterContract = covered ? Math.round(lesser * (1 - contractRate / 100)) : 0;

  const _res = {
    passed,
    failed,
    reductions,
    decision,
    suggestedAction,
    tariffSvc,
    tariffUnit,
    tariffTotal,
    billedTotal,
    lesser,
    contractRate,
    covered,
    afterContract,
  };
  if (_ck) VALIDATION_CACHE.set(_ck, JSON.parse(JSON.stringify(_res)));
  return _res;
}

function validateInvoice(inv, ctx) {
  const _ck = inv && inv.id ? ('VINV:'+inv.id+':'+(ctx.contract&&ctx.contract.id)) : null;
  if (_ck && VALIDATION_CACHE.has(_ck)) { return JSON.parse(JSON.stringify(VALIDATION_CACHE.get(_ck))); }
  const passed = [];
  const failed = [];
  const missingDocs = [];
  const DOC_ITEMS_LOCAL = (typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []);
  DOC_ITEMS_LOCAL.forEach(d => {
    if (!inv.documents || !inv.documents[d.key]) missingDocs.push(d.label);
  });
  if (missingDocs.length) {
    failed.push('missing-docs');
  } else {
    passed.push('docs-present');
  }
  const _vires = { passed, failed, missingDocs };
  if (_ck) VALIDATION_CACHE.set(_ck, JSON.parse(JSON.stringify(_vires)));
  return _vires;
}

function validateClaim(claim) {
  const failed = [];
  const entered = (claim.invoices || []).reduce((s, inv) =>
    s + (inv.patients || []).reduce((a, p) =>
      a + (p.lines || []).reduce((c, l) => c + (Number(l.qty) || 0) * (Number(l.billedUnit) || 0), 0), 0), 0);

  const target = Number(claim.billed) || 0;
  const remaining = target - entered;

  if (Math.abs(remaining) > 1) failed.push('invoice-mismatch');

  const pendingExceptions = [];
  (claim.invoices || []).forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => {
    if (l._decision === 'needs-attention' && l._overrideMode === 'auto') {
      pendingExceptions.push({ code: l.code, reasons: l._checksFailed || [] });
    }
  })));

  return { failed, entered, target, remaining, pendingExceptions };
}

function isRejectReason(code) {
  return VALIDATION_REASONS[code]?.severity === 'reject';
}
function isAttentionReason(code) {
  return VALIDATION_REASONS[code]?.severity === 'attention';
}
function reasonLabel(code) {
  return VALIDATION_REASONS[code]?.label || code;
}
