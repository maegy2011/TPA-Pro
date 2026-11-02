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

function getContractContext(claim, effectiveDate) {
  const empty = { provider: null, contract: null, tariff: null, serviceOverrides: {} };
  if (!claim) return empty;

  const provider = (typeof providers !== 'undefined' ? providers : []).find(p => p.name === claim.provider || p.id === claim.provider || (claim.providerId && p.id === claim.providerId)) || null;
  if (!provider) return { ...empty, provider };

  const claimDate = String(effectiveDate || claim.date || claim.receivedDate || new Date().toISOString().slice(0,10)).slice(0,10);
  let contract = (typeof contracts !== 'undefined' ? contracts : []).find(c => { const start=String(c.startDate||''); const end=String(c.endDate||''); return c.providerId===provider.id && c.status!=='terminated' && (!start || start<=claimDate) && (!end || claimDate<=end); }) || null;

  if (contract && Array.isArray(contract.rateVersions) && contract.rateVersions.length) {
    const version = contract.rateVersions.filter(v => (!v.effectiveFrom || v.effectiveFrom <= claimDate) && (!v.effectiveTo || claimDate <= v.effectiveTo))
      .sort((a,b)=>String(b.effectiveFrom||'').localeCompare(String(a.effectiveFrom||'')))[0];
    if (version) contract = { ...contract, ...version, id:contract.id, providerId:contract.providerId, startDate:contract.startDate, endDate:contract.endDate, rateVersionEffectiveDate:version.effectiveFrom };
  }
  let tariffBase = null;
  const applicable = t => (typeof isTariffApplicableForDate === 'function') ? isTariffApplicableForDate(t, claimDate) : effectiveTariffStatus(t) === 'active';
  if (contract?.tariffId) {
    tariffBase = (typeof tariffs !== 'undefined' ? tariffs : []).find(t => t.id === contract.tariffId && applicable(t)) || null;
  }
  if (!tariffBase) {
    tariffBase = (typeof tariffs !== 'undefined' ? tariffs : []).find(t =>
      ((contract && (t.linkedContractIds || []).includes(contract.id)) ||
       (t.linkedProviderIds || []).includes(provider.id)) && applicable(t)
    ) || null;
  }
  const resolvedVersion = tariffBase && typeof getTariffVersionForDate==='function' ? getTariffVersionForDate(tariffBase,claimDate) : null;
  const tariff = tariffBase ? { ...tariffBase, services: (typeof getTariffServicesForDate === 'function') ? getTariffServicesForDate(tariffBase, claimDate) : (tariffBase.services||[]), _resolvedVersionEffectiveDate: resolvedVersion && resolvedVersion.effectiveDate || tariffBase.effectiveDate } : null;

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
      priorApproval: ctx.claim && ctx.claim.priorApproval ? {
        required: !!ctx.claim.priorApproval.required,
        status: ctx.claim.priorApproval.status || '',
        date: ctx.claim.priorApproval.date || ''
      } : null,
      contract: ctx.contract && ctx.contract.id, tariff: ctx.tariff && ctx.tariff.id, tariffVersion: ctx.tariff && ctx.tariff._resolvedVersionEffectiveDate,
      serviceOverride: (ctx.serviceOverrides || ctx.contract?.serviceOverrides || {})[String(line.code)] || null,
    });
  } catch(e){ return null; }
}
function clearValidationCache(){ VALIDATION_CACHE.clear(); }

/**
 * التحقق من بند واحد وتطبيق التعرفة والعقد والقواعد.
 * @param {Object} line - البند
 * @param {Object} ctx - السياق (claim, patient, invoice, contract, tariff, ...)
 * @returns {Object} نتيجة التحقق
 */
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
  const adminExempt = !!(line && (line._adminExempt === true || line.adminExempt === true));
  if (!tariffSvc && !adminExempt) {
    failed.push(line._manualEntry ? 'manual-entry' : 'not-in-tariff');
  } else if (line._manualEntry && !adminExempt) {
    failed.push('manual-entry');
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
  const covered = adminExempt ? true : (!line._manualEntry && isServiceCovered(ctxFull, code) && !!tariffSvc);
  const lesser = tariffTotal !== null ? Math.min(billedTotal, tariffTotal) : billedTotal;
  const afterContract = covered ? Math.round(lesser * (1 - contractRate / 100)) : 0;

  function _mapLegalKey(r){ 
    if(r === 'not-in-tariff') return 'not-in-tariff';
    if(r === 'not-covered') return 'not-covered';
    if(r === 'manual-entry') return 'not-in-tariff';
    if(r && String(r).startsWith('pa')) return 'pa-required';
    if(r === 'tariff-limit') return 'price-exceeds';
    if(r === 'contract-discount') return 'contract-discount';
    return r;
  }
  const _primaryReason = hasReject ? failed.find(f => VALIDATION_REASONS[f]?.severity === 'reject') : (hasAttention ? failed.find(f => VALIDATION_REASONS[f]?.severity === 'attention') : (reductions.length ? reductions[0] : null));
  const _legalKey = _primaryReason ? _mapLegalKey(_primaryReason) : null;
  const _legalDeduction = (_legalKey && typeof generateLegalDeductionReason === 'function') ? generateLegalDeductionReason(_legalKey, { claim, patient, invoice, line, diff: billedTotal - (tariffTotal !== null ? tariffTotal : billedTotal), maxLabs: null }) : null;
  const _legalReasons = [...failed, ...(reductions||[])].map(_mapLegalKey).map(k => (typeof generateLegalDeductionReason === 'function') ? generateLegalDeductionReason(k, { claim, patient, invoice, line }) : null).filter(Boolean);

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
    legalKey: _legalKey,
    legalReason: _legalDeduction,
    legalDeduction: _legalDeduction,
    legalReasons: _legalReasons,
  };
  if (_ck) VALIDATION_CACHE.set(_ck, JSON.parse(JSON.stringify(_res)));
  return _res;
}

function validateInvoice(inv, ctx) {
  const _ck = inv && inv.id ? ('VINV:'+JSON.stringify({ id: inv.id, contract: ctx.contract&&ctx.contract.id, documents: inv.documents || {} })) : null;
  if (_ck && VALIDATION_CACHE.has(_ck)) { return JSON.parse(JSON.stringify(VALIDATION_CACHE.get(_ck))); }
  const passed = [];
  const failed = [];
  const missingDocs = [];
  // مستندات مذكرة الخصم حُذفت؛ يكتفى بمستندات المريض.
  passed.push('docs-present');
  const _vires = { passed, failed, missingDocs };
  if (_ck) VALIDATION_CACHE.set(_ck, JSON.parse(JSON.stringify(_vires)));
  return _vires;
}

function getClaimReconciliationTarget(claim) {
  if (!claim) return { amount: 0, source: 'missing-claim' };
  const submitted = claim.submittedBilled;
  if (submitted !== undefined && submitted !== null && submitted !== '' && Number.isFinite(Number(submitted)) && Number(submitted) >= 0) {
    return { amount: Number(submitted), source: 'submittedBilled' };
  }
  return { amount: Number(claim.billed) || 0, source: 'legacy-billed' };
}

function validateClaim(claim) {
  const failed = [];
  const entered = (claim.invoices || []).reduce((s, inv) =>
    s + (inv.patients || []).reduce((a, p) =>
      a + (p.lines || []).reduce((c, l) => c + (Number(l.qty) || 0) * (Number(l.billedUnit) || 0), 0), 0), 0);

  // Compare invoice lines with the immutable submitted amount, not the recalculated billed total.
  const reconciliationTarget = getClaimReconciliationTarget(claim);
  const target = reconciliationTarget.amount;
  const remaining = target - entered;

  if (Math.abs(remaining) > 1) failed.push('invoice-mismatch');

  const pendingExceptions = [];
  (claim.invoices || []).forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => {
    if (l._decision === 'needs-attention' && l._overrideMode === 'auto') {
      pendingExceptions.push({ code: l.code, reasons: l._checksFailed || [] });
    }
  })));

  return { failed, entered, target, remaining, pendingExceptions, targetSource: reconciliationTarget.source };
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
