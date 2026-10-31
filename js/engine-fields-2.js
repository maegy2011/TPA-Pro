function compareValues(actual, op, exp, ctx){
  ctx = ctx || {};
  if(isDateOperator(op)) return compareDates(actual, op, exp, ctx);
  if(op === 'len_eq') return String(actual||'').length === parseNumber(exp);
  if(op === 'len_gt') return String(actual||'').length > parseNumber(exp);
  if(op === 'len_lt') return String(actual||'').length < parseNumber(exp);
  if(op === 'normalize_eq') return normalizeArabic(actual) === normalizeArabic(exp);
  if(op === 'normalize_contains') return normalizeArabic(actual).includes(normalizeArabic(exp));
  if(op === 'regex_match'){ try { return new RegExp(String(exp)).test(String(actual||'')); } catch(e){ return false; } }
  if(op === 'similar_to'){ const [t, th] = String(exp||'').split('|'); return levenshteinSimilarity(String(actual||''), t||'') >= (parseNumber(th)||80); }
  if(op === 'not_contains') return !String(actual||'').includes(String(exp||''));
  if(op === 'num_between'){ const [lo, hi] = String(exp||'').split(',').map(parseNumber); return parseNumber(actual)>=lo && parseNumber(actual)<=hi; }
  if(op === 'approx_eq'){ const [t, tol] = String(exp||'').split('|'); return Math.abs(parseNumber(actual)-parseNumber(t)) <= (parseNumber(tol)||0.5); }
  if(['gt','gte','lt','lte'].includes(op)){
    const a = parseNumber(actual), b = parseNumber(exp);
    if(String(actual).trim()!=='' && String(exp).trim()!==''){
      if(op === 'gt') return a > b;
      if(op === 'gte') return a >= b;
      if(op === 'lt') return a < b;
      if(op === 'lte') return a <= b;
    }
  }
  switch(op){
    case 'eq': return String(actual) === String(exp);
    case 'ne': return String(actual) !== String(exp);
    case 'in': { const arr = String(exp||'').split(',').map(s=>s.trim()); return arr.includes(String(actual)); }
    case 'not_in': { const arr = String(exp||'').split(',').map(s=>s.trim()); return !arr.includes(String(actual)); }
    case 'contains': return String(actual||'').includes(String(exp||''));
    case 'starts_with': return String(actual||'').startsWith(String(exp||''));
    case 'exists': return actual !== undefined && actual !== null;
    case 'is_empty': return !actual || String(actual).trim() === '';
    case 'is_not_empty': return actual !== undefined && actual !== null && String(actual).trim() !== '';
    case 'is_true': return actual === true || actual === 'true';
    case 'is_false': return actual === false || actual === 'false';
    default: return true;
  }
}
function getScopeItems(scope, ctx){
  if(scope === 'self' || scope === 'line') return ctx.line ? [{line:ctx.line, patient:ctx.patient, invoice:ctx.invoice, claim:ctx.claim}] : [];
  if(scope === 'patient') return (ctx.patient?.lines||[]).map(l=>({line:l, patient:ctx.patient, invoice:ctx.invoice, claim:ctx.claim}));
  if(scope === 'invoice') return (ctx.invoice?.patients||[]).flatMap(pt=>(pt.lines||[]).map(l=>({line:l, patient:pt, invoice:ctx.invoice, claim:ctx.claim})));
  if(scope === 'claim') return (ctx.claim?.invoices||[]).flatMap(iv=>(iv.patients||[]).flatMap(pt=>(pt.lines||[]).map(l=>({line:l, patient:pt, invoice:iv, claim:ctx.claim}))));
  return [];
}
function evaluateCondition(cond, ctx){
  if(!cond) return true;
  const mode = cond.mode || 'expr';
  const scope = cond.scope || 'self';
  if(mode === 'expr'){ if(!cond.field || !cond.op) return true; return compareValues(resolveFieldPath(cond.field, ctx), cond.op, cond.value, ctx); }
  if(mode === 'duplicate' || mode === 'unique'){
    const f = cond.field || 'line.code';
    const items = getScopeItems(scope, ctx);
    const my = resolveFieldPath(f, ctx);
    const cnt = items.filter(it => String(resolveFieldPath(f, it)) === String(my)).length;
    return mode === 'duplicate' ? cnt > 1 : cnt === 1;
  }
  const items = getScopeItems(scope, ctx);
  if(mode === 'any'){ if(!cond.subField || !cond.subOp) return true; return items.some(it => compareValues(resolveFieldPath(cond.subField, it), cond.subOp, cond.subValue, it)); }
  if(mode === 'all'){ if(!cond.subField || !cond.subOp) return true; if(!items.length) return false; return items.every(it => compareValues(resolveFieldPath(cond.subField, it), cond.subOp, cond.subValue, it)); }
  if(mode === 'count'){ if(!cond.subField || !cond.subOp) return true; const n = items.filter(it => compareValues(resolveFieldPath(cond.subField, it), cond.subOp, cond.subValue, it)).length; return compareValues(n, cond.compareOp||'gt', cond.compareValue||0, ctx); }
  if(['sum','avg','max','min'].includes(mode)){
    const vals = items.map(it => Number(resolveFieldPath(cond.aggField||'line.billedTotal', it))||0);
    let res = 0;
    if(mode === 'sum') res = vals.reduce((a,b)=>a+b,0);
    else if(mode === 'avg') res = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    else if(mode === 'max') res = vals.length ? Math.max(...vals) : 0;
    else if(mode === 'min') res = vals.length ? Math.min(...vals) : 0;
    return compareValues(Math.round(res), cond.compareOp||'gt', cond.compareValue||0, ctx);
  }
  return true;
}
function evaluateConditionTree(node, ctx){
  if(!node || !Array.isArray(node.rules)) return true;
  if(!node.rules.length) return node.logic === 'OR' ? false : true;
  const res = node.rules.map(item => {
    if(item.logic && Array.isArray(item.rules)) return evaluateConditionTree(item, ctx);
    return evaluateCondition(item, ctx);
  });
  return node.logic === 'OR' ? res.some(Boolean) : res.every(Boolean);
}
