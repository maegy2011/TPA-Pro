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
  'admin-exempt-no-note': { label: 'إعفاء إداري بلا سبب مسجل',    severity: 'attention', category: 'coverage' },

  'pa-required':        { label: 'تتطلب موافقة مسبقة — لم تُطلب', severity: 'attention', category: 'pa' },
  'incomplete-data':    { label: 'بيانات البند ناقصة (كود/كمية/سعر) — القرار للمراجع', severity: 'attention', category: 'coverage' },
  'cap-conflict':       { label: 'تعارض قواعد السقف — القرار للمراجع', severity: 'attention', category: 'rules' },
  'copay-conflict':     { label: 'تعارض قواعد التحمل — القرار للمراجع', severity: 'attention', category: 'rules' },
  'rule-cycle':         { label: 'اعتمادية دائرية — القرار للمراجع', severity: 'attention', category: 'rules' },
  'rule-overlap':       { label: 'قواعد متداخلة على نفس البند — القرار للمراجع', severity: 'attention', category: 'rules' },
  'rule-requires-missing': { label: 'اعتمادية مفقودة — القرار للمراجع', severity: 'attention', category: 'rules' },
  'pa-pending':         { label: 'موافقة مسبقة قيد الطلب',       severity: 'attention', category: 'pa' },
  'duplicate':          { label: 'بند مكرر',                     severity: 'attention', category: 'duplication' },
  'over-frequency':     { label: 'تجاوز حد التكرار',             severity: 'attention', category: 'duplication' },
  'unbundling':         { label: 'تفكيك إجراء',                  severity: 'attention', category: 'unbundling' },
  'waiting-period':     { label: 'داخل فترة الانتظار',            severity: 'attention', category: 'eligibility' },

  'tariff-limit':       { label: 'تجاوز سعر اللائحة',            severity: 'reduce',    category: 'pricing' },
  'stay-mismatch':      { label: 'فرق أيام الإقامة — القرار للمراجع', severity: 'attention', category: 'stay' },
  'checklist-icu':      { label: 'عناية مركزة بلا تعليم تدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'checklist-surgery':  { label: 'إجراء جراحي بلا تعليم تدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'checklist-anesthesia': { label: 'تخدير بلا تعليم تدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'checklist-blood':    { label: 'نقل دم بلا تعليم تدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'link-fee-nosurgery': { label: 'أتعاب (جراح/تخدير) بلا إجراء جراحي — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'link-assistant':     { label: 'مساعد جراح بلا شروطه (جراح + عملية كبرى/متوسطة) — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'link-anesthesia':    { label: 'إجراء جراحي بلا أتعاب تخدير — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'opclass-stay-exceed': { label: 'تجاوز سقف أيام تصنيف العملية — القرار للمراجع', severity: 'attention', category: 'opclass' },
  'link-implant-nosurgery': { label: 'مزروع بلا إجراء جراحي — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'consumables-share': { label: 'تجاوز حصة المستهلكات (25%) — القرار للمراجع', severity: 'attention', category: 'supplies' },
  'stay-overlap':      { label: 'ازدواج أيام (عناية + غرفة) — القرار للمراجع', severity: 'attention', category: 'stay' },
  'nursing-exceed':   { label: 'تجاوز أيام التمريض لأيام الإقامة — القرار للمراجع', severity: 'attention', category: 'stay' },
  'or-exceed':        { label: 'غرف عمليات أكثر من الإجراءات — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'physio-exceed':    { label: 'جلسات علاج طبيعي تتجاوز أيام الإقامة — القرار للمراجع', severity: 'attention', category: 'linkage' },
  'checklist-admission': { label: 'مبرر الدخول غير معلَّم في التدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'checklist-discharge': { label: 'ملخص الخروج غير معلَّم في التدقيق — القرار للمراجع', severity: 'attention', category: 'checklist' },
  'contract-discount':  { label: 'خصم العقد',                    severity: 'reduce',    category: 'contract' },
};

function getContractContext(claim, effectiveDate) {
  const empty = { provider: null, contract: null, tariff: null, serviceOverrides: {} };
  if (!claim) return empty;

  const plist = (typeof providers !== 'undefined' ? providers : []);
  const provider = plist.find(p => (claim.providerCode != null && p.code === claim.providerCode) || p.name === claim.provider || p.id === claim.provider || (claim.providerId && p.id === claim.providerId)) || null;
  if (!provider) return { ...empty, provider };

  const claimDate = String(effectiveDate || claim.date || claim.receivedDate || new Date().toISOString().slice(0,10)).slice(0,10);
  // لا يجوز عقدان فعالان لنفس الجهة — الأفضلية للعقد الفعال ثم الأحدث؛ والمراجعة لا تتوقف بتوقف العقد.
  const covering = (typeof contracts !== 'undefined' ? contracts : []).filter(c => { const start=String(c.startDate||''); const end=String(c.endDate||''); return c.providerId===provider.id && (!start || start<=claimDate) && (!end || claimDate<=end); });
  let contract = covering.find(c => (typeof effectiveContractStatus === 'function' ? effectiveContractStatus(c) : '') === 'active')
    || covering.slice().sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')) || String(b.endDate||'').localeCompare(String(a.endDate||'')))[0] || null;

  // النسخة المطبقة = النسخة المغطية لتاريخ إجراء البند؛ فاتورة من سنتين تتحاسب بأسعار وخصم سنتين.
  if (contract && Array.isArray(contract.rateVersions) && contract.rateVersions.length) {
    const version = contract.rateVersions.filter(v => (!v.effectiveFrom || v.effectiveFrom <= claimDate) && (!v.effectiveTo || claimDate <= v.effectiveTo))
      .sort((a,b)=>String(b.effectiveFrom||'').localeCompare(String(a.effectiveFrom||'')))[0];
    if (version) contract = { ...contract, ...version, id:contract.id, providerId:contract.providerId, startDate:contract.startDate, endDate:contract.endDate, rateVersionEffectiveDate:version.effectiveFrom };
  }
  const tlist = (typeof tariffs !== 'undefined' ? tariffs : []);
  const applicable = t => (typeof isTariffApplicableForDate === 'function') ? isTariffApplicableForDate(t, claimDate) : ((typeof effectiveTariffStatus === 'function' ? effectiveTariffStatus(t) : '') === 'active');
  const TAPRIO = { general:0, supplementary:1, private:2 };
  const trank = t => (t && TAPRIO[t.type] != null) ? TAPRIO[t.type] : 9;
  let directBase = null;
  if (contract?.tariffId) directBase = tlist.find(t => t.id === contract.tariffId && applicable(t)) || null;
  const linked = tlist.filter(t =>
    ((contract && (t.linkedContractIds || []).includes(contract.id)) ||
     (t.linkedProviderIds || []).includes(provider.id)) && applicable(t)
  );
  if (directBase && !linked.includes(directBase)) linked.push(directBase);
  // دمج اللوائح (عامة + مكملة + خاصة): الأعلى أولوية يغلب عند تعارض نفس الكود.
  let mergedServices = [];
  linked.slice().sort((a,b)=>trank(a)-trank(b)).forEach(t => {
    const svcs = (typeof getTariffServicesForDate === 'function') ? getTariffServicesForDate(t, claimDate) : (t.services||[]);
    (svcs||[]).forEach(s => {
      const i = mergedServices.findIndex(x=>String(x.code)===String(s.code));
      if(i>=0) mergedServices[i]=s; else mergedServices.push(s);
    });
  });
  const primary = directBase || linked.slice().sort((a,b)=>trank(b)-trank(a))[0] || null;
  const resolvedVersion = primary && typeof getTariffVersionForDate==='function' ? getTariffVersionForDate(primary,claimDate) : null;
  let resolvedServices = mergedServices;
  const _incF = (typeof getContractIncreaseFactor === 'function') ? getContractIncreaseFactor(contract, claimDate) : 1;
  if(_incF !== 1 && Array.isArray(resolvedServices)) resolvedServices = resolvedServices.map(s => ({...s, currentPrice:(s.currentPrice===null||s.currentPrice===undefined)?s.currentPrice:(Math.round(Number(s.currentPrice)*_incF*100)/100)}));
  const tariff = primary ? { ...primary, services: resolvedServices, _resolvedVersionEffectiveDate: resolvedVersion?.effectiveDate || primary.effectiveDate, _increaseFactorApplied: _incF } : null;

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

/* القرار الدائم (بأمر محمد 2026-11-03): الخاص يغلب المستثنى — التوجيه اليدوي للخدمة
   يتفوق على قائمة الاستثناءات، والمستثنى يوقف الصرف فقط عند غياب توجيه خاص. */
function isServiceCovered(ctx, code) {
  const ov = ctx?.serviceOverrides?.[code];
  if (ov?.covered === true) return true;
  if (ov?.covered === false) return false;
  const svc = (ctx?.tariff?.services || []).find(s => String(s.code) === String(code));
  if (svc?.covered === false) return false;
  const excl = ctx?.contract?.excludedServices;
  const list = Array.isArray(excl) ? excl : (excl ? String(excl).split('، ').map(x=>x.trim()).filter(Boolean) : []);
  if (list.length) {
    if (svc?.name && list.includes(svc.name)) return false;
    if (list.includes(String(code))) return false;
  }
  return true;
}

/* نافذة سريان التجاوز الخاص — منطق خالص (يُختبر آليًا). */
function isOverrideActive(entry, dateStr){
  if(!entry || typeof entry !== 'object') return false;
  const d = String(dateStr || '').slice(0,10);
  const from = String(entry.effectiveFrom || '').slice(0,10);
  const to = String(entry.effectiveTo || '').slice(0,10);
  if(from && (!d || d < from)) return false;
  if(to && (!d || d > to)) return false;
  return true;
}
/* السعر الخاص الساري — يعيد null عند غيابه أو عدم سريانه. منطق خالص. */
function getActiveOverridePrice(entry, dateStr){
  if(!entry || typeof entry !== 'object') return null;
  if(entry.price === null || entry.price === undefined || entry.price === '') return null;
  const p = Number(entry.price);
  if(!Number.isFinite(p) || p < 0) return null;
  if(!isOverrideActive(entry, dateStr)) return null;
  return p;
}
/* ---------- مصدر الحقيقة الوحيد لحساب البند (السعر/التغطية/الخصم) ----------
أي تعديل مستقبلي على معادلة البند يتم هنا فقط — compute-patient و validateLine يستهلكانها. */
function resolveLineTariff(line, baseCtx, procedureDate){
  const baseTariff = (baseCtx?.tariff) || null;
  if(!(line?.tariffId && typeof tariffs !== 'undefined')) return baseTariff;
  let lineTariff = null;
  const base = tariffs.find(t => t.id === line.tariffId);
  if(base && typeof isTariffApplicableForDate === 'function' && isTariffApplicableForDate(base, procedureDate)){
    const version = (typeof getTariffVersionForDate === 'function') ? getTariffVersionForDate(base, procedureDate) : null;
    let ovSvcs = version ? (version.services||[]) : (base.services||[]);
    const _of = (typeof getContractIncreaseFactor === 'function' && baseCtx?.contract) ? getContractIncreaseFactor(baseCtx.contract, procedureDate) : 1;
    if(_of !== 1 && Array.isArray(ovSvcs)) ovSvcs = ovSvcs.map(s => ({...s, currentPrice:(s.currentPrice===null||s.currentPrice===undefined)?s.currentPrice:(Math.round(Number(s.currentPrice)*_of*100)/100)}));
    const merged = (baseTariff && Array.isArray(baseTariff.services)) ? [...baseTariff.services] : [];
    (ovSvcs||[]).forEach(s => { const i = merged.findIndex(x => String(x.code) === String(s.code)); if(i>=0) merged[i]=s; else merged.push(s); });
    lineTariff = { ...base, services: merged, _resolvedVersionEffectiveDate:version&&version.effectiveDate||base.effectiveDate, _increaseFactorApplied:_of };
  }
  return lineTariff;
}
function computeLineAmounts(line, ctx, procedureDate){
  ctx = ctx || {};
  const billedTotal = (Number(line.qty)||0) * (Number(line.billedUnit)||0);
  const tariff = resolveLineTariff(line, { tariff: ctx.tariff, contract: ctx.contract }, procedureDate);
  let tariffUnit = null;
  if(tariff){
    const svc = (tariff.services||[]).find(s => String(s.code) === String(line.code));
    if(svc?.currentPrice !== undefined && svc.currentPrice !== null) tariffUnit = Number(svc.currentPrice);
  }
  const _ovEntry = (ctx.serviceOverrides || {})[String(line.code)] || null;
  const _procDate = procedureDate || line.procedureDate || line.serviceDate || line.date || (ctx.claim && (ctx.claim.date || ctx.claim.receivedDate)) || '';
  const _ovPrice = (typeof getActiveOverridePrice === 'function') ? getActiveOverridePrice(_ovEntry, _procDate) : null;
  if(_ovPrice !== null && _ovPrice !== undefined) tariffUnit = _ovPrice;
  const hasT = (tariffUnit !== null && tariffUnit !== undefined);
  const tariffTotal = hasT ? (Number(line.qty)||0) * tariffUnit : null;
  const lesser = (tariffTotal !== null) ? Math.min(billedTotal, tariffTotal) : billedTotal;
  const rate = (typeof getContractRateForService === 'function') ? getContractRateForService({ contract: ctx.contract, serviceOverrides: ctx.serviceOverrides }, line.code) : 0;
  const adminExempt = !!(line && (line._adminExempt === true || line.adminExempt === true));
  const covered = adminExempt ? true : (!line._manualEntry && (typeof isServiceCovered === 'function' ? isServiceCovered({ tariff, contract: ctx.contract, serviceOverrides: ctx.serviceOverrides }, line.code) : true) && hasT);
  const afterContract = covered ? Math.round(lesser * (1 - rate/100)) : 0;
  return { billedTotal, tariff, tariffUnit, hasT, tariffTotal, lesser, rate, covered, afterContract };
}
/* ---------- التخزين المؤقت لنتائج الفحص ---------- */
const VALIDATION_CACHE = new Map();
function _validationCacheKey(line, ctx){
  try {
    return JSON.stringify({
      code: line.code, qty: line.qty, billedUnit: line.billedUnit, manual: !!line._manualEntry,
      tariffId: line.tariffId || '', procDate: line.procedureDate || line.serviceDate || line.date || '', note: line.note || '', adminExempt: !!line._adminExempt,
      claim: ctx.claim && ctx.claim.id, inv: ctx.invoice && ctx.invoice.id, pat: ctx.patient && ctx.patient.id,
      priorApproval: ctx.claim && ctx.claim.priorApproval ? {
        required: !!ctx.claim.priorApproval.required,
        status: ctx.claim.priorApproval.status || '',
        date: ctx.claim.priorApproval.date || ''
      } : null,
      contract: ctx.contract && ctx.contract.id, tariff: ctx.tariff && ctx.tariff.id, tariffVersion: ctx.tariff && ctx.tariff._resolvedVersionEffectiveDate,
      serviceOverride: (ctx.serviceOverrides || ctx.contract?.serviceOverrides || {})[String(line.code)] || null,
      // الفحوص الشقيقة (تكرار/تفرّق/تفكيك) تعتمد على بنود المريض كلها — أي تغيير فيها يُبطل الكاش.
      siblings: (ctx.patient && Array.isArray(ctx.patient.lines)) ? ctx.patient.lines.map(l => `${l.code||''}×${l.qty||0}@${l.procedureDate||l.serviceDate||l.date||''}`).join('|') : '',
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
  try { if(typeof normalizeLine === 'function' && line && typeof line === 'object') normalizeLine(line); } catch(e){}
  const _ck = _validationCacheKey(line, ctx);
  if (_ck && VALIDATION_CACHE.has(_ck)) { return JSON.parse(JSON.stringify(VALIDATION_CACHE.get(_ck))); }
  const { claim, patient, invoice, contract, tariff, serviceOverrides } = ctx;
  const ctxFull = { claim, patient, invoice, contract, tariff, serviceOverrides: serviceOverrides || (contract?.serviceOverrides || {}) };
  const passed = [];
  const failed = [];
  const reductions = [];

  const code = String(line.code || '').trim();
  if(!code || !(Number(line.qty) > 0) || !((Number(line.billedUnit) || 0) >= 0)) failed.push('incomplete-data');
  // نفس معادلة compute-patient — مصدر واحد للحقيقة.
  const _procDate = String(line.procedureDate || line.serviceDate || line.date || (invoice?.date) || (claim && (claim.date || claim.receivedDate)) || '').slice(0,10) || null;
  const amounts = computeLineAmounts(line, ctxFull, _procDate);
  const billedTotal = amounts.billedTotal;
  const tariffSvc = amounts.tariff ? ((amounts.tariff.services||[]).find(s => String(s.code) === code) || null) : null;
  const adminExempt = !!(line && (line._adminExempt === true || line.adminExempt === true));
  if (!tariffSvc && !adminExempt) {
    failed.push(line._manualEntry ? 'manual-entry' : 'not-in-tariff');
  } else if (line._manualEntry && !adminExempt) {
    failed.push('manual-entry');
  } else {
    passed.push('in-tariff');
  }

  if (tariffSvc && !line._manualEntry) {
    if (!isServiceCovered({ ...ctxFull, tariff: amounts.tariff }, code)) {
      failed.push('not-covered');
    } else {
      passed.push('covered');
    }
  }
  // الإعفاء الإداري مقبول للحالات الاستثنائية بشرط تسجيل السبب على البند.
  if (adminExempt && !(String(line.note || '').trim())) {
    failed.push('admin-exempt-no-note');
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

  const tariffUnit = amounts.tariffUnit;
  const tariffTotal = amounts.tariffTotal;

  if (tariffSvc && tariffTotal !== null) {
    if (billedTotal > tariffTotal + 0.01) {
      passed.push('price-exceeds');
      reductions.push('tariff-limit');
    } else {
      passed.push('price-ok');
    }
  }

  // ترتيب الفحوص بالأخطر أولًا: الرفض (تغطية/سعر) قبل الانتباه (تكرار) حتى لا يتشتت المراجع.
  if (patient && invoice) {
    // تكرار مفرط: نفس الكود أكثر من 3 مرات للمريض الواحد.
    const _sameCode = (patient.lines || []).filter(l => String(l.code||'').trim() === code).length;
    if (_sameCode > 3) failed.push('over-frequency');
    // فترة الانتظار: الإجراء قبل بداية خطاب التغطية.
    try {
      const _letter = String((patient?.letterDate) || (invoice?.letterDate) || (claim?.letterStartDate) || '').slice(0,10);
      const _proc = String(line.procedureDate || line.serviceDate || line.date || '').slice(0,10);
      if(_letter && _proc && _proc < _letter) failed.push('waiting-period');
    } catch(e){}
    // تفكيك عبر التصنيف الديناميكي: أتعاب بلا إجراء جراحي مستقل — أي نوع مخصص جديد يُلتقط تلقائيًا.
    try {
      const _myTypes = (typeof matchLineTypes === 'function') ? matchLineTypes(line) : [];
      if(_myTypes.some(t => t.fee)){
        const _hasProc = (patient.lines||[]).some(l => {
          if(l === line) return false;
          try { return (typeof matchLineTypes === 'function' ? matchLineTypes(l) : []).some(t => t.surgeryProc && !t.fee); }
          catch(e){ return false; }
        });
        if(!_hasProc) failed.push('unbundling');
      }
    } catch(e){}
  }

  // أي تعارض أو اعتماد دائري يُرجع بسؤال المراجع بدل الحسم الصامت.
  try {
    const _allRules = (typeof deductionRules !== 'undefined' ? deductionRules : []).filter(r => r?.enabled !== false && r.active !== false);
    const _lineRules = _allRules.filter(r => (typeof isLineLevelAction === 'function' ? isLineLevelAction(r.action) : true));
    const _cyc = (typeof getCyclicRuleIds === 'function') ? getCyclicRuleIds() : new Set();
    const _refDate = (invoice?.date) || (claim && (claim.date || claim.receivedDate)) || null;
    const _lctx = { claim, patient, invoice, contract, tariff, serviceOverrides: ctxFull.serviceOverrides };
    let _cycHit = false, _missHit = false;
    for(const r of _lineRules){
      let _match = false;
      try { _match = (typeof ruleMatchesContext === 'function') ? ruleMatchesContext(r, _lctx, _refDate) : false; } catch(e){ _match = false; }
      if(!_match) continue;
      if(_cyc.has(r.id)) _cycHit = true;
      const _req = (r.requires && r.requires.ruleIds) || [];
      if(_req.some(id => !_allRules.some(x => x.id === id))) _missHit = true;
      if(_cycHit && _missHit) break;
    }
    if(_cycHit) failed.push('rule-cycle');
    if(_missHit) failed.push('rule-requires-missing');
  } catch(e){}
  // التكرار آخرًا: الأقل خطورة ولا يحجب أسباب الرفض.
  try {
    if(patient && invoice){
      const _sib = (patient.lines || []).filter(l => l !== line && String(l.code||'').trim() === code);
      if(_sib.length > 0) failed.push('duplicate'); else passed.push('no-duplicate');
    }
  } catch(e){}

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

  const contractRate = amounts.rate;
  const covered = amounts.covered;
  const lesser = amounts.lesser;
  const afterContract = amounts.afterContract;

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
  const _ck = inv?.id ? ('VINV:'+JSON.stringify({ id: inv.id, contract: ctx.contract&&ctx.contract.id, documents: inv.documents || {} })) : null;
  if (_ck && VALIDATION_CACHE.has(_ck)) { return JSON.parse(JSON.stringify(VALIDATION_CACHE.get(_ck))); }
  const passed = [];
  const failed = [];
  const missingDocs = [];
  const docs = (inv?.documents && typeof inv.documents === 'object') ? inv.documents : {};
  const allPresent = (typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []).every(d => !!docs[d.key]);
  if (allPresent) {
    passed.push('docs-present');
  } else {
    failed.push('missing-docs');
    (typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []).forEach(d => { if (!docs[d.key]) missingDocs.push(d.key); });
  }
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
