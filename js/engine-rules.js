// engine-rules.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function isLineLevelAction(a){ return ['reject_line','reduce_by_percent','reduce_by_fixed','cap_to_amount','set_to_percent'].includes(a); }
function topoSortRules(rules){
  const byId = {}; rules.forEach(r => byId[r.id] = r);
  const visited = {}, sorted = [], stack = new Set(), cycles = [];
  function visit(id, path){
    if(visited[id]) return;
    if(stack.has(id)){ const cs = path.indexOf(id); if(cs >= 0) cycles.push(path.slice(cs).concat([id]).join(' → ')); return; }
    stack.add(id);
    const r = byId[id];
    if(!r){ stack.delete(id); return; }
    (r.requires?.ruleIds||[]).forEach(dep => { if(byId[dep]) visit(dep, path.concat([id])); });
    stack.delete(id);
    visited[id] = true; sorted.push(r);
  }
  rules.forEach(r => visit(r.id, []));
  if(cycles.length){
    console.warn('⚠️ حلقات دائرية:', cycles);
  }
  const cyclicIds = new Set(cycles.flatMap(c => c.split(' → ')));
  return sorted.filter(r => !cyclicIds.has(r.id));
}
function checkRequires(rule, appliedIds){
  if(!rule.requires || !rule.requires.ruleIds || !rule.requires.ruleIds.length) return true;
  const mode = rule.requires.mode || 'any';
  if(mode === 'any') return rule.requires.ruleIds.some(id => appliedIds.has(id));
  if(mode === 'all') return rule.requires.ruleIds.every(id => appliedIds.has(id));
  if(mode === 'none') return !rule.requires.ruleIds.some(id => appliedIds.has(id));
  // Fail closed: an unknown dependency mode must never silently bypass prerequisites.
  return false;
}
function ruleMatchesContext(rule, ctx, refDate){
  if(rule.enabled === false || rule.active === false) return false;
  if(!rule.retroactive && rule._simAt){
    try { const _rd = (refDate && String(refDate).slice(0,10)) || ''; if(_rd && _rd < String(rule._simAt).slice(0,10)) return false; } catch(e){}
  }
  const rDate = (typeof toDate === 'function') ? toDate(refDate) : new Date(refDate);
  if(rule.effectiveFrom && rDate < toDate(rule.effectiveFrom)) return false;
  if(rule.effectiveTo && rDate > toDate(rule.effectiveTo)) return false;
  const claim = ctx.claim;
  const _plist = ctx.providers || (function(){ try { return (typeof providers !== 'undefined') ? providers : []; } catch(e){ return []; } })() || [];
  const _clist = ctx.contracts || (function(){ try { return (typeof contracts !== 'undefined') ? contracts : []; } catch(e){ return []; } })() || [];
  if(rule.scope?.claimTypes?.length && !rule.scope.claimTypes.includes(claim.type || 'employee')) return false;
  if(rule.scope?.providerIds?.length){
    const prov = _plist.find(p => (claim.providerCode != null && p.code === claim.providerCode) || p.name === claim.provider || p.id === claim.provider || (claim.providerId && p.id === claim.providerId));
    if(!prov || !rule.scope.providerIds.includes(prov.id)) return false;
  }
  if(rule.scope?.contractIds?.length){
    const prov = _plist.find(p => (claim.providerCode != null && p.code === claim.providerCode) || p.name === claim.provider || p.id === claim.provider || (claim.providerId && p.id === claim.providerId));
    const cids = prov ? _clist.filter(c => c.providerId === prov.id).map(c => c.id) : [];
    if(!rule.scope.contractIds.some(cid => cids.includes(cid))) return false;
  }
  if(rule.conditions && rule.conditions.rules && rule.conditions.rules.length){
    if(!evaluateConditionTree(rule.conditions, ctx)) return false;
  }
  return true;
}
/** القواعد الداخلة في اعتمادية دائرية — مصدر واحد: topoSortRules يستبعدها، وهنا نعيد أسماءها فقط. */
function getCyclicRuleIds(){
  try {
    const rules = (typeof deductionRules !== 'undefined' ? deductionRules : []).filter(r => r && r.enabled !== false && r.active !== false);
    const sorted = (typeof topoSortRules === 'function') ? topoSortRules(rules) : rules;
    const kept = new Set(sorted.map(r => r.id));
    return new Set(rules.map(r => r.id).filter(id => !kept.has(id)));
  } catch(e){ return new Set(); }
}
/* فحص تعريف القاعدة — منطق خالص (يُختبر آليًا). مرآة شروط الحفظ في الواجهة. */
function validateRuleDefinition(d){
  d = d || {};
  if(!String(d.name || '').trim()) return { ok:false, msg:'أدخل الاسم' };
  if(!Number.isFinite(Number(d.rate)) || Number(d.rate) < 0 || Number(d.rate) > 100) return { ok:false, msg:'النسبة' };
  if(!String(d.effectiveFrom || '').trim()) return { ok:false, msg:'أدخل السريان' };
  if(!Array.isArray(d.claimTypes) || !d.claimTypes.length) return { ok:false, msg:'حدد نوع' };
  if(!String(d.notes || '').trim()) return { ok:false, msg:'اكتب سبب القاعدة بالعربية (إلزامي للتخريج القانوني)' };
  const sel = Array.isArray(d.providerIds) ? d.providerIds.filter(Boolean) : [];
  if(!sel.length && !d.scopeExplicitAll) return { ok:false, msg:'حدد جهة واحدة على الأقل أو علّم «كل الجهات» صراحة — القاعدة بلا نطاق ممنوعة' };
  return { ok:true, msg:'' };
}
/* ملخص أثر قاعدة على عينة مطالبات — منطق خالص (يُختبر آليًا). */
function summarizeRuleImpact(rule, claimsSample){
  const out = { claims:0, lines:0, affected:0, before:0, after:0, extraDed:0, pct:'0', samples:[] };
  if(!rule || !Array.isArray(claimsSample) || !claimsSample.length) return out;
  const isPatientLevel = ['apply_cap','apply_copay'].includes(rule.action);
  out.claims = claimsSample.length;
  claimsSample.forEach(claim => {
    const refDate = claim.date || claim.receivedDate || '';
    (claim.invoices || []).forEach(inv => {
      (inv.patients || []).forEach(pat => {
        if(isPatientLevel){
          const subtotal = (pat.lines || []).reduce((s,l) => s + ((Number(l.approved) || (Number(l.qty) || 0) * (Number(l.billedUnit) || 0))), 0);
          const matched = (typeof ruleMatchesContext === 'function') ? ruleMatchesContext(rule, { claim, patient:pat, invoice:inv }, refDate) : false;
          out.lines += (pat.lines || []).length;
          if(!matched){ out.before += subtotal; out.after += subtotal; return; }
          const res = (typeof evaluateRuleAction === 'function') ? evaluateRuleAction(rule, { claim, patient:pat, invoice:inv }, subtotal) : {};
          const deduct = res.deduct !== undefined ? res.deduct : 0;
          out.before += subtotal; out.after += Math.max(0, subtotal - deduct);
          if(deduct > 0){ out.affected++; out.extraDed += deduct;
            if(out.samples.length < 8) out.samples.push({ claim:claim.id, service:(pat.lines||[]).map(l=>l.name||l.code).join(', ').slice(0,40), before:subtotal, after:Math.max(0, subtotal-deduct) }); }
        } else {
          (pat.lines || []).forEach(line => {
            out.lines++;
            const base = (Number(line.qty) || 0) * (line.tariffUnit != null ? Math.min(Number(line.billedUnit) || 0, Number(line.tariffUnit)) : (Number(line.billedUnit) || 0));
            const ctx = { claim, patient:pat, invoice:inv, line:{ ...line, lineBase:base } };
            const matched = (typeof ruleMatchesContext === 'function') ? ruleMatchesContext(rule, ctx, refDate) : false;
            if(!matched){ out.before += base; out.after += base; return; }
            const res = (rule.isComposite && typeof evaluateCompositeRule === 'function') ? evaluateCompositeRule(rule, ctx, refDate) : ((typeof evaluateRuleAction === 'function') ? evaluateRuleAction(rule, ctx, base) : {});
            const nv = res && res.newApproved !== undefined ? res.newApproved : (base - (res && res.deduct ? res.deduct : 0));
            out.before += base; out.after += nv;
            if(nv < base){ out.affected++; out.extraDed += (base - nv);
              if(out.samples.length < 8) out.samples.push({ claim:claim.id, service:line.name || line.code, before:base, after:nv }); }
          });
        }
      });
    });
  });
  out.before = Math.round(out.before); out.after = Math.round(out.after); out.extraDed = Math.round(out.extraDed);
  out.pct = out.before ? ((out.extraDed / out.before) * 100).toFixed(1) : '0';
  return out;
}
/* تبديل تفعيل قاعدة — منطق خالص يعيد القرار (تحتاج محاكاة أولًا أم لا). */
function toggleRuleEnabled(rule){
  if(!rule || typeof rule !== 'object') return { ok:false, msg:'القاعدة غير موجودة' };
  if(rule.enabled === false || rule.active === false){
    if(!rule._simulated) return { ok:false, needsSim:true, msg:'لم تُحاكَ بعد — نفّذ «محاكاة» أولًا أو فعّل مباشرة بتأكيدك' };
    rule.enabled = true; rule.active = true;
    return { ok:true, enabled:true };
  }
  rule.enabled = false;
  return { ok:true, enabled:false };
}
/* أولوية القاعدة: الأعلى يُطبَّق أولًا؛ الافتراضي 0. */
function rulePriority(r){ const p = Number(r && r.priority); return isNaN(p) ? 0 : p; }
function sortRulesByPriority(rules){ return (rules||[]).slice().sort((a,b) => rulePriority(b) - rulePriority(a)); }
function evaluateRuleAction(rule, ctx, baseAmount){
  const amt = baseAmount !== undefined ? baseAmount : (ctx.line ? ctx.line.lineBase : 0);
  let rate = Number(rule.rate) || 0;
  if(rule.tiersEnabled && Array.isArray(rule.tiers) && rule.tiers.length){
    const tier = rule.tiers.find(t => (Number(t.from)||0) <= amt && (t.to === null || t.to === undefined || t.to === '' || amt <= Number(t.to)));
    if(tier) rate = Number(tier.rate) || rate;
  }
  switch(rule.action){
    case 'reject_line': return { newApproved: 0 };
    case 'reduce_by_percent': return { newApproved: Math.max(0, Math.round(amt*(1-Math.min(100,rate)/100))) };
    case 'reduce_by_fixed': return { newApproved: Math.max(0, amt-rate) };
    case 'cap_to_amount': return { newApproved: Math.min(amt, Math.max(0, rate)) };
    case 'set_to_percent': return { newApproved: Math.min(amt, Math.max(0, Math.round(amt*Math.min(100,rate)/100))) };
    case 'apply_cap': return { deduct: Math.round(amt*rate/100) };
    case 'apply_copay': return { deduct: Math.round(amt*rate/100) };
    default: return { newApproved: amt };
  }
}
function evaluateCompositeRule(rule, ctx, refDate){
  const cfg = rule.compositeConfig || {};
  const childRules = (cfg.childRuleIds||[]).map(id => deductionRules.find(r => r.id === id)).filter(r => r && r.enabled !== false && r.active !== false && isLineLevelAction(r.action));
  if(!childRules.length) return null;
  const requireAll = cfg.requireAllMatch !== false;
  const matched = childRules.map(child => ({ rule:child, matched: ruleMatchesContext(child, ctx, refDate) })).filter(r => r.matched);
  if(requireAll && matched.length !== childRules.length) return null;
  if(!matched.length) return null;
  const base = ctx.line ? (ctx.line.lineBase||0) : 0;
  const mode = cfg.applyMode || 'atomic';
  if(mode === 'atomic'){
    let cur = base, applied = [];
    for(const c of matched){
      const cctx = { ...ctx, line: ctx.line ? { ...ctx.line, lineBase: cur } : null };
      const r = evaluateRuleAction(c.rule, cctx, cur);
      if(r.newApproved !== undefined){ cur = Math.max(0, Math.min(cur, r.newApproved)); applied.push(c.rule); }
    }
    return { newApproved: cur, appliedChildRules: applied };
  }
  if(mode === 'best'){
    let best = base, bestR = null;
    for(const c of matched){ const r = evaluateRuleAction(c.rule, ctx, base); const v = r.newApproved !== undefined ? r.newApproved : base; if(v < best){ best = v; bestR = c.rule; } }
    return { newApproved: best, appliedChildRules: bestR ? [bestR] : [] };
  }
  if(mode === 'sum'){
    let total = 0, applied = [];
    for(const c of matched){ const r = evaluateRuleAction(c.rule, ctx, base); const d = r.deduct !== undefined ? r.deduct : (r.newApproved !== undefined ? (base-r.newApproved) : 0); total += Math.max(0, d); applied.push(c.rule); }
    return { newApproved: Math.max(0, base-total), appliedChildRules: applied };
  }
  if(mode === 'first_match'){
    const c = matched[0]; const r = evaluateRuleAction(c.rule, ctx, base);
    return { newApproved: r.newApproved !== undefined ? r.newApproved : base, appliedChildRules: [c.rule] };
  }
  return null;
}
function patientBeneficiaryType(pat, claim){ return pat.beneficiaryType || claim.type || 'employee'; }
function hasValidPriorApproval(claim){ return claim.priorApproval && claim.priorApproval.required && claim.priorApproval.status === 'approved'; }
function lineRequiresPA(line){ if(line.requiresPriorApproval) return true; return paProcedures.some(p => (p.code || p.id) === line.code); }

/* ---------- كشف التعارضات (Conflict Detection) ---------- */
function _scopeOverlaps(a, b){
  const aProv = (a.scope?.providerIds||[]), bProv = (b.scope?.providerIds||[]);
  const aCon = (a.scope?.contractIds||[]), bCon = (b.scope?.contractIds||[]);
  const aCt = (a.scope?.claimTypes||[]), bCt = (b.scope?.claimTypes||[]);
  const provOverlap = (!aProv.length || !bProv.length) || aProv.some(x => bProv.includes(x));
  const conOverlap = (!aCon.length || !bCon.length) || aCon.some(x => bCon.includes(x));
  const ctOverlap = (!aCt.length || !bCt.length) || aCt.some(x => bCt.includes(x));
  return provOverlap && conOverlap && ctOverlap;
}
function _conditionsEqual(a, b){
  try { return JSON.stringify(a||{}) === JSON.stringify(b||{}); } catch(e){ return false; }
}
function detectRuleConflicts(newRule, existingRules){
  existingRules = existingRules || (typeof deductionRules !== 'undefined' ? deductionRules : []);
  const conflicts = [];
  // 1. broken dependencies
  const reqIds = (newRule.requires && newRule.requires.ruleIds) ? newRule.requires.ruleIds : [];
  reqIds.forEach(rid => {
    if(!existingRules.some(r => r.id === rid)){
      conflicts.push({ type:'REQUIRES_MISSING', severity:'error', message:`القاعدة تعتمد على قاعدة غير موجودة: ${rid}` });
    }
  });
  // 2. circular dependencies
  reqIds.forEach(rid => {
    const dep = existingRules.find(r => r.id === rid);
    if(dep && dep.requires && Array.isArray(dep.requires.ruleIds)){
      if(dep.requires.ruleIds.includes(newRule.id)){
        conflicts.push({ type:'CIRCULAR_DEPENDENCY', severity:'error', message:`حلقة دائرية محتملة بين القاعدة الجديدة والقاعدة ${rid}` });
      }
      // mutual among required
      if(dep.requires.ruleIds.some(x => reqIds.includes(x) && x !== rid)){
        conflicts.push({ type:'CIRCULAR_DEPENDENCY', severity:'warning', message:`اعتماد متبادل بين القواعد المطلوبة (${rid})` });
      }
    }
  });
  existingRules.forEach(ex => {
    // 3. redundant exact duplicate
    if(ex.id !== newRule.id && ex.action && newRule.action && ex.action === newRule.action && ex.rate === newRule.rate && _scopeOverlaps(ex, newRule) && _conditionsEqual(ex.conditions, newRule.conditions)){
      conflicts.push({ type:'REDUNDANT', severity:'warning', message:`القاعدة مطابقة (أو شبه مطابقة) للقاعدة السارية: ${ex.id} — ${ex.name}` });
    }
    // 4. contradictory intent on same scope+conditions
    const rejectIntent = (r) => r.action === 'reject_line' || (['reduce_by_percent','cap_to_amount','set_to_percent'].includes(r.action) && (Number(r.rate)||0) >= 99);
    const allowIntent = (r) => r.action === 'cap_to_amount' && (Number(r.rate)||0) > 0 && (Number(r.rate)||0) < 99;
    if(_scopeOverlaps(ex, newRule) && _conditionsEqual(ex.conditions, newRule.conditions)){
      if(rejectIntent(newRule) && allowIntent(ex)){
        conflicts.push({ type:'CONTRADICTORY', severity:'warning', message:`القاعدة الجديدة (رفض) تتعارض مع القاعدة السارية ${ex.id} (سماح)` });
      }
      if(allowIntent(newRule) && rejectIntent(ex)){
        conflicts.push({ type:'CONTRADICTORY', severity:'warning', message:`القاعدة الجديدة (سماح) تتعارض مع القاعدة السارية ${ex.id} (رفض)` });
      }
    }
    const exHasCond = !!(ex.conditions && Array.isArray(ex.conditions.rules) && ex.conditions.rules.length);
    const newHasCond = !!(newRule.conditions && Array.isArray(newRule.conditions.rules) && newRule.conditions.rules.length);
    // 5. double-deduction risk: same scope+conditions, both line-level, different rules
    if(ex.id !== newRule.id && exHasCond && newHasCond && _scopeOverlaps(ex, newRule) && _conditionsEqual(ex.conditions, newRule.conditions) && isLineLevelAction(ex.action) && isLineLevelAction(newRule.action) && ex.action !== newRule.action){
      conflicts.push({ type:'OVERLAP', severity:'info', message:`خطر استقطاع مزدوج: ${ex.id} و القاعدة الجديدة تطبقان على نفس الشروط` });
    }
  });
  // de-duplicate by message
  const seen = new Set();
  const uniq = conflicts.filter(c => { if(seen.has(c.message)) return false; seen.add(c.message); return true; });
  return { hasConflicts: uniq.length > 0, conflicts: uniq };
}

/* ---------- قاموس التخريج القانوني والتفسير المالي والإجرائي ---------- */
const LEGAL_DEDUCTION_REASONS = {
  'not-in-tariff': {
    title: 'عدم الإدراج في لائحة الأسعار المعتمدة',
    legalBasis: 'استناداً إلى أحكام العقد المبرم وبنود لائحة الأسعار المتفق عليها بين الطرفين.',
    explanation: (ctx) => `تبين أن الخدمة المطلوبة (${ctx?.line?.name || ''} - رمز: ${ctx?.line?.code || ''}) غير مدرجة ضمن لائحة الأسعار المعتمدة للجهة (${ctx?.claim?.provider || ''}). يُخصم كامل المبلغ المطالب به.`
  },
  'not-covered': {
    title: 'استبعاد الخدمة من جدول المنافع والتغطية التأمينية',
    legalBasis: 'وفقاً لملحق الاستثناءات والخدمات غير المغطاة في وثيقة التغطية التأمينية المعتمدة.',
    explanation: (ctx) => `الخدمة المقدمة (${ctx?.line?.name || ''}) صريحة الاستثناء ولا تقع ضمن نطاق الخدمات Covered Services المتفق عليها في العقد.`
  },
  'price-exceeds': {
    title: 'تجاوز السقف التسعيري المحدد باللائحة',
    legalBasis: 'طبقاً لبند التعرفة المعتمدة والسقف الأعلى المحدد للخدمة الطبية.',
    explanation: (ctx) => `تم تعديل سعر الوحدة للخدمة (${ctx?.line?.name || ''}) من المبلغ المطالب به (${ctx?.line?.billedUnit || 0} ج.م) إلى السقف المعتمد باللائحة (${ctx?.line?.tariffUnit || 0} ج.م)، ويُخصم الفارق البالغ (${ctx?.diff || 0} ج.م).`
  },
  'contract-discount': {
    title: 'تطبيق نسبة الخصم التعاقدي المباشر',
    legalBasis: 'بناءً على بند الخصومات التجارية والتعاقدية الوارد في العقد المبرم.',
    explanation: (ctx) => `تطبيق نسبة الخصم التعاقدي المتفق عليها (${ctx?.rate || 0}%) على إجمالي المبلغ المستحق للخدمة (${ctx?.line?.name || ''}).`
  },
  'pa-required': {
    title: 'غياب الحصول على الموافقة المسبقة (Prior Authorization)',
    legalBasis: 'وفقاً للإجراءات التنظيمية وشروط الموافقة المسبقة للخدمات والعمليات الخاصة.',
    explanation: (ctx) => `الخدمة/الإجراء (${ctx?.line?.name || ''}) يندرج تحت قائمة الخدمات التي تتطلب الحصول على موافقة مسبقة قبل التقديم، ولم تُرفق الموافقة المعتمدة.`
  },
  'max-labs-exceeded': {
    title: 'تجاوز الحد الأقصى اليومي للفحوصات المخبرية في الزيارة الواحدة',
    legalBasis: 'استناداً إلى أدلة الممارسة الطبية وضوابط الترشيد المالي والترشيد الطبي المعتمدة للنظام.',
    explanation: (ctx) => `تجاوز عدد الفحوصات المخبرية في الزيارة الواحدة الحد المسموح به (${ctx?.maxLabs || 0} فحوصات). تم اعتماد الفحوصات الأعلى تكلفة وخصم الفحوصات الزائدة الإضافية.`
  },
  'coverage-cap': {
    title: 'تجاوز سقف التغطية المالي المسموح للمريض',
    legalBasis: 'وفقاً لضوابط وسقوف التغطية التأمينية والحد الأقصى للمستفيدين.',
    explanation: (ctx) => `تجاوزت مطالبة المريض (${ctx?.patient?.name || ''}) الحد الأقصى المسموح به لسقف التغطية (${ctx?.capRate || 0}%). تم تطبيق خصم السقف بمبلغ (${ctx?.capAmount || 0} ج.م).`
  },
  'tariff-limit': {
    title: 'تجاوز السقف التسعيري المحدد باللائحة',
    legalBasis: 'طبقاً لبند التعرفة المعتمدة والسقف الأعلى المحدد للخدمة الطبية.',
    explanation: (ctx) => `تم تعديل سعر الوحدة للخدمة (${ctx?.line?.name || ''}) من المبلغ المطالب به (${ctx?.line?.billedUnit || 0} ج.م) إلى السقف المعتمد باللائحة (${ctx?.line?.tariffUnit || 0} ج.م)، ويُخصم الفارق البالغ (${ctx?.diff || 0} ج.م).`
  },
  'manual-entry': {
    title: 'عدم الإدراج في لائحة الأسعار المعتمدة',
    legalBasis: 'استناداً إلى أحكام العقد المبرم وبنود لائحة الأسعار المتفق عليها بين الطرفين.',
    explanation: (ctx) => `تبين أن الخدمة المطلوبة (${ctx?.line?.name || ''} - رمز: ${ctx?.line?.code || ''}) غير مدرجة ضمن لائحة الأسعار المعتمدة للجهة (${ctx?.claim?.provider || ''}). يُخصم كامل المبلغ المطالب به.`
  },
  'retiree-copay': {
    title: 'تطبيق نسبة التحمل المقررة لشريحة المعاشات/المتقاعدين',
    legalBasis: 'طبقاً لجدول نفقات التحمل وشروط تغطية فئة المتقاعدين والمعاشات.',
    explanation: (ctx) => `تطبيق نسبة تحمل المتقاعد المقررة (${ctx?.copayRate || 0}%) على صافي المطالبة القابلة للتغطية، بمبلغ تحمل قدره (${ctx?.copayAmount || 0} ج.م).`
  }
};

/**
 * توليد سبب الخصم القانوني (عنوان/سند/تفسير) لمفتاح قاعدة معين.
 * @param {string} ruleKey - مفتاح القاعدة
 * @param {Object} [context] - سياق (claim, patient, invoice, line, ...)
 * @returns {Object} كائن {title, legalBasis, explanation, fullText, formattedText}
 */
function generateLegalDeductionReason(ruleKey, context) {
  context = context || {};
  const template = LEGAL_DEDUCTION_REASONS[ruleKey];
  if (!template) {
    const fallbackExpl = context.note || 'تم تطبيق الاستقطاع بناءً على قواعد التدقيق الآلي.';
    const fallback = {
      title: 'استقطاع مالي وتعديل تعاقدي',
      legalBasis: 'بناءً على أحكام المراجعة المالية والتدقيق التعاقدي.',
      explanation: fallbackExpl,
      fullText: `[سبب الخصم]: استقطاع مالي وتعديل تعاقدي\n[المستند القانوني]: بناءً على أحكام المراجعة المالية والتدقيق التعاقدي.\n[التفسير الإجرائي]: ${fallbackExpl}`,
      formattedText: `[السبب]: استقطاع مالي وتعديل تعاقدي | [السند]: بناءً على أحكام المراجعة المالية والتدقيق التعاقدي. | [التفسير]: ${fallbackExpl}`
    };
    return fallback;
  }
  let explanationText;
  try { explanationText = template.explanation(context); }
  catch (e) { explanationText = context.note || 'تم تطبيق الاستقطاع بناءً على قواعد التدقيق الآلي.'; }
  return {
    title: template.title,
    legalBasis: template.legalBasis,
    explanation: explanationText,
    fullText: `[سبب الخصم]: ${template.title}\n[المستند القانوني]: ${template.legalBasis}\n[التفسير الإجرائي]: ${explanationText}`,
    formattedText: `[السبب]: ${template.title} | [السند]: ${template.legalBasis} | [التفسير]: ${explanationText}`
  };
}
