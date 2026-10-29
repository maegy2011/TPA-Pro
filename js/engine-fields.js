function resolveFieldPath(path, ctx){
  if(!path) return null;
  if(path === 'line.billedTotal') return ctx.line ? ctx.line.qty * ctx.line.billedUnit : null;
  if(path === 'line.tariffTotal'){
    if(!ctx.line) return null;
    return (ctx.line.tariffUnit !== null && ctx.line.tariffUnit !== undefined) ? ctx.line.qty * ctx.line.tariffUnit : null;
  }
  if(path === 'line.diff'){
    if(!ctx.line) return null;
    const b = ctx.line.qty * ctx.line.billedUnit;
    return b - (ctx.line.lineBase !== undefined ? ctx.line.lineBase : b);
  }
  if(path === 'line.index'){ if(!ctx.patient || !ctx.line) return null; return (ctx.patient.lines||[]).indexOf(ctx.line)+1; }
  if(path === 'line.nameNormalized') return ctx.line ? normalizeArabic(ctx.line.name) : null;
  if(path === 'line.nameLength') return ctx.line ? String(ctx.line.name||'').length : null;
  if(path === 'line.billedRounded100') return ctx.line ? roundToNearest(ctx.line.qty*ctx.line.billedUnit, 100) : null;
  if(path === 'claim.invoiceCount') return (ctx.claim?.invoices||[]).length;
  if(path === 'claim.patientCount') return (ctx.claim?.invoices||[]).reduce((s,iv)=>s+(iv.patients||[]).length,0);
  if(path === 'claim.lineCount') return (ctx.claim?.invoices||[]).reduce((s,iv)=>s+(iv.patients||[]).reduce((a,p)=>a+(p.lines||[]).length,0),0);
  if(path === 'invoice.patientCount') return (ctx.invoice?.patients||[]).length;
  if(path === 'invoice.lineCount') return (ctx.invoice?.patients||[]).reduce((a,p)=>a+(p.lines||[]).length,0);
  if(path === 'patient.lineCount') return (ctx.patient?.lines||[]).length;
  if(path === 'claim.daysSinceReceived'){
    const d = toDate(ctx.claim?.receivedDate); if(!d) return null;
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.round((now-d)/86400000);
  }
  if(path === 'claim.daysBetweenReceivedAndDate') return daysBetween(ctx.claim?.receivedDate, ctx.claim?.date);
  if(path === 'invoice.daysSince'){
    const d = toDate(ctx.invoice?.date); if(!d) return null;
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.round((now-d)/86400000);
  }
  if(path === 'invoice.stayDays'){
    if(ctx.invoice?.type !== 'inpatient') return null;
    return daysBetween(ctx.invoice?.admissionDate, ctx.invoice?.dischargeDate);
  }
  const cm = path.match(/^(.+)\.(year|month|day|dayOfWeek|quarter|dayName|dayOfYear)$/);
  if(cm){
    const base = resolveFieldPath(cm[1], ctx);
    const d = toDate(base);
    if(!d) return null;
    const c = cm[2];
    if(c === 'year') return d.getFullYear();
    if(c === 'month') return d.getMonth()+1;
    if(c === 'day') return d.getDate();
    if(c === 'dayOfWeek') return d.getDay();
    if(c === 'quarter') return Math.floor(d.getMonth()/3)+1;
    if(c === 'dayName') return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()];
    if(c === 'dayOfYear') return dayOfYear(d);
  }
  if(path === 'patient.beneficiaryType') return (ctx.patient && ctx.patient.beneficiaryType) || (ctx.claim && ctx.claim.type) || null;
  const parts = path.split('.');
  let v = ctx;
  for(const p of parts){ if(v === null || v === undefined) return null; v = v[p]; }
  return v;
}
function resolveFieldRef(exp, ctx){
  if(typeof exp !== 'string') return exp;
  const prefixes = ['claim.', 'line.', 'patient.', 'invoice.'];
  if(!prefixes.some(p=>exp.startsWith(p))) return exp;
  const v = resolveFieldPath(exp, ctx || {});
  return (v !== null && v !== undefined) ? v : exp;
}
const DATE_OPS = ['before','after','on_or_before','on_or_after','between_dates','not_between_dates','same_day','same_month','same_year','same_quarter','is_today','is_weekend','is_weekday','in_last_n_days','in_next_n_days','is_this_month','is_this_quarter','is_this_year','is_last_month','is_last_quarter','is_last_year','before_field','after_field','on_same_day_as','same_week_as','before_field_days','after_field_days','between_fields','working_days_since','within_days','within_days_of','is_business_day','is_not_business_day','is_first_day_of_month','is_last_day_of_month'];
function isDateOperator(op){ return DATE_OPS.includes(op); }
function compareDates(actual, op, exp, ctx){
  ctx = ctx || {};
  const a = toDate(resolveDateKeyword(actual));
  const today = new Date(); today.setHours(0,0,0,0);
  if(op === 'is_today') return a && a.toDateString() === today.toDateString();
  if(op === 'is_weekend'){ if(!a) return false; const d=a.getDay(); return d===0||d===6; }
  if(op === 'is_weekday'){ if(!a) return false; const d=a.getDay(); return d!==0&&d!==6; }
  if(op === 'is_business_day') return isBusinessDay(a);
  if(op === 'is_not_business_day') return a && !isBusinessDay(a);
  if(op === 'is_first_day_of_month') return a && a.getDate() === 1;
  if(op === 'is_last_day_of_month') return a && a.getDate() === getDaysInMonth(a);
  if(!a) return false;
  if(op === 'before_field' || op === 'after_field' || op === 'on_same_day_as' || op === 'same_week_as'){
    const ref = toDate(resolveDateKeyword(resolveFieldRef(exp, ctx)));
    if(!ref) return false;
    if(op === 'before_field') return a < ref;
    if(op === 'after_field') return a > ref;
    if(op === 'on_same_day_as') return a.toDateString() === ref.toDateString();
    if(op === 'same_week_as') return isSameWeek(a, ref);
  }
  if(op === 'before_field_days' || op === 'after_field_days'){
    const [fr, nr] = String(exp||'').split('|');
    const ref = toDate(resolveDateKeyword(resolveFieldRef(fr, ctx)));
    const n = parseNumber(nr)||0;
    if(!ref) return false;
    const b = new Date(ref.getTime() + (op==='before_field_days'?-n:n)*86400000);
    return op === 'before_field_days' ? a < b : a > b;
  }
  if(op === 'between_fields'){
    const parts = String(exp||'').split(',').map(x=>toDate(resolveDateKeyword(resolveFieldRef(x.trim(), ctx))));
    const [f1,f2] = parts;
    if(!f1||!f2) return false;
    const lo = f1<f2?f1:f2, hi = f1<f2?f2:f1;
    return a >= lo && a <= hi;
  }
  if(op === 'working_days_since'){
    const [fr, nr] = String(exp||'').split('|');
    const ref = toDate(resolveDateKeyword(resolveFieldRef(fr, ctx)));
    if(!ref) return false;
    return countWorkingDays(ref, today) >= (parseNumber(nr)||0);
  }
  if(op === 'within_days'){ const n = parseNumber(exp)||0; return Math.abs(Math.round((today-a)/86400000)) <= n; }
  if(op === 'within_days_of'){
    const [rr, nr] = String(exp||'').split('|');
    const ref = toDate(resolveDateKeyword(rr));
    const n = parseNumber(nr)||0;
    return ref && Math.abs(Math.round((a-ref)/86400000)) <= n;
  }
  if(op === 'in_last_n_days'){ const n = parseNumber(exp)||0; const d = Math.floor((today-a)/86400000); return d>=0 && d<=n; }
  if(op === 'in_next_n_days'){ const n = parseNumber(exp)||0; const d = Math.floor((a-today)/86400000); return d>=0 && d<=n; }
  if(op === 'is_this_month') return a.getFullYear()===today.getFullYear() && a.getMonth()===today.getMonth();
  if(op === 'is_this_quarter') return a.getFullYear()===today.getFullYear() && Math.floor(a.getMonth()/3)===Math.floor(today.getMonth()/3);
  if(op === 'is_this_year') return a.getFullYear()===today.getFullYear();
  if(op === 'is_last_month'){ const t = new Date(today); t.setMonth(t.getMonth()-1); return a.getFullYear()===t.getFullYear() && a.getMonth()===t.getMonth(); }
  if(op === 'is_last_quarter'){ const t = new Date(today); t.setMonth(t.getMonth()-3); return a.getFullYear()===t.getFullYear() && Math.floor(a.getMonth()/3)===Math.floor(t.getMonth()/3); }
  if(op === 'is_last_year') return a.getFullYear()===today.getFullYear()-1;
  if(op === 'between_dates' || op === 'not_between_dates'){
    const [e1, e2] = String(exp||'').split(',').map(x=>toDate(resolveDateKeyword(x.trim())));
    if(!e1||!e2) return false;
    const within = a>=e1 && a<=e2;
    return op === 'between_dates' ? within : !within;
  }
  const b = toDate(resolveDateKeyword(exp));
  if(!b) return false;
  if(op === 'before') return a < b;
  if(op === 'after') return a > b;
  if(op === 'on_or_before') return a <= b;
  if(op === 'on_or_after') return a >= b;
  if(op === 'same_day') return a.toDateString() === b.toDateString();
  if(op === 'same_month') return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();
  if(op === 'same_year') return a.getFullYear()===b.getFullYear();
  if(op === 'same_quarter') return a.getFullYear()===b.getFullYear() && Math.floor(a.getMonth()/3)===Math.floor(b.getMonth()/3);
  return false;
}
