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
  return true;
}
function ruleMatchesContext(rule, ctx, refDate){
  if(rule.enabled === false || rule.active === false) return false;
  const rDate = (typeof toDate === 'function') ? toDate(refDate) : new Date(refDate);
  if(rule.effectiveFrom && rDate < toDate(rule.effectiveFrom)) return false;
  if(rule.effectiveTo && rDate > toDate(rule.effectiveTo)) return false;
  const claim = ctx.claim;
  if(rule.scope?.claimTypes?.length && !rule.scope.claimTypes.includes(claim.type || 'employee')) return false;
  if(rule.scope?.providerIds?.length){
    const prov = providers.find(p => p.name === claim.provider);
    if(!prov || !rule.scope.providerIds.includes(prov.id)) return false;
  }
  if(rule.scope?.contractIds?.length){
    const prov = providers.find(p => p.name === claim.provider);
    const cids = prov ? contracts.filter(c => c.providerId === prov.id).map(c => c.id) : [];
    if(!rule.scope.contractIds.some(cid => cids.includes(cid))) return false;
  }
  if(rule.conditions && rule.conditions.rules && rule.conditions.rules.length){
    if(!evaluateConditionTree(rule.conditions, ctx)) return false;
  }
  return true;
}
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
