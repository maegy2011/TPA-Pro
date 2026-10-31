function computePatient(pat, claim, refDate, invoice){
  refDate = refDate || (invoice && invoice.date) || claim.date || claim.receivedDate || daysFromNow(0);
  const allRules = deductionRules.filter(r => r.enabled !== false && r.active !== false);
  const ctx = { claim, patient: pat, invoice: invoice || null };
  const _ctx = getContractContext(claim);
  (pat.lines||[]).forEach(l => {
    const billed = (Number(l.qty)||0) * (Number(l.billedUnit)||0);
    const hasT = (l.tariffUnit !== null && l.tariffUnit !== undefined);
    const tariffTotal = hasT ? (Number(l.qty)||0) * (Number(l.tariffUnit)||0) : billed;
    const lesser = hasT ? Math.min(billed, tariffTotal) : billed;
    l.lineBase = lesser;
    if(l._overrideMode === undefined) l._overrideMode = 'auto';

    const covered = !l._manualEntry && isServiceCovered(_ctx, l.code) && hasT;
    if(!covered){
      l._autoApproved = 0;
      l._contractRejected = true;
      l._contractRate = 0;
      l.lineBaseAfterContract = 0;
      return;
    }
    const rate = getContractRateForService(_ctx, l.code);
    l._contractRate = rate;
    l.lineBaseAfterContract = Math.round(lesser * (1 - rate / 100));
    l._contractRejected = false;
  });
  const lineRules = topoSortRules(allRules.filter(r => r.isComposite || isLineLevelAction(r.action)));
  pat.lines.forEach(l => {
    const lctx = { ...ctx, line: l };
    const appliedIds = new Set();
    const compositeLog = [];
    let current = (l.lineBaseAfterContract !== undefined ? l.lineBaseAfterContract : l.lineBase);
    let lastRuleId = null, lastRuleName = '', lastRuleRate = 0;
    for(const rule of lineRules){
      if(!checkRequires(rule, appliedIds)) continue;
      if(!ruleMatchesContext(rule, lctx, refDate)) continue;
      if(rule.isComposite){
        const cctx = { ...lctx, line: { ...l, lineBase: current } };
        const res = evaluateCompositeRule(rule, cctx, refDate);
        if(res && res.newApproved !== undefined && res.newApproved < current){
          current = Math.max(0, Math.min(current, res.newApproved));
          appliedIds.add(rule.id);
          (res.appliedChildRules||[]).forEach(cr => appliedIds.add(cr.id));
          compositeLog.push({ id: rule.id, name: rule.name, children: (res.appliedChildRules||[]).map(c=>c.id) });
          lastRuleId = rule.id; lastRuleName = rule.name; lastRuleRate = 0;
        }
      } else {
        const res = evaluateRuleAction(rule, lctx, current);
        if(res.newApproved !== undefined && res.newApproved < current){
          current = Math.max(0, Math.min(current, res.newApproved));
          appliedIds.add(rule.id);
          lastRuleId = rule.id; lastRuleName = rule.name; lastRuleRate = rule.rate;
        }
      }
    }
    l._autoApproved = current;
    l._appliedRuleIds = Array.from(appliedIds);
    l._autoRuleId = lastRuleId; l._autoRuleName = lastRuleName; l._autoRuleRate = lastRuleRate;
    l._compositeApplied = compositeLog;
    l.paRejected = false;
  });
  // ✅ F6: الأولوية لـ _maxlabsForced قبل القواعد العادية
  pat.lines.forEach(l => {
    if(l._contractRejected){
      l.approved = 0;
      l._overrideMode = 'manual';
      l._manualValue = 0;
      if(!l.note) l.note = l._manualEntry ? 'إدخال يدوي غير مدرج' : 'غير مغطاة/غير مدرجة';
      return;
    }
    if(l._maxlabsForced){
      l.approved = 0;
      l._autoApproved = 0;
      l._autoRuleId = '_maxlabs';
      l._autoRuleName = `حد التحاليل (${REVIEW_RULES.maxLabsPerVisit})`;
      l._autoRuleRate = 0;
      l._appliedRuleIds = ['_maxlabs'];
      l.note = 'تجاوز حد التحاليل';
      return;
    }
    if(l._overrideMode === 'manual' && l._manualValue !== null && l._manualValue !== undefined){
      l.approved = Math.max(0, Math.min(l.qty*l.billedUnit, Number(l._manualValue)||0));
    } else if(l._overrideMode === 'reverted'){ l.approved = l.lineBase; }
    else { l.approved = l._autoApproved; }
  });
  if(!pat.beneficiaryType) pat.beneficiaryType = claim.type || 'employee';
  const benType = patientBeneficiaryType(pat, claim);
  const paValid = hasValidPriorApproval(claim);
  if(benType === 'retiree' && !paValid){
    pat.lines.forEach(l => { if(lineRequiresPA(l)){ l.paRejected = true; l.approved = 0; } });
  }
  const subtotal = pat.lines.reduce((s,l)=>s+(Number(l.approved)||0), 0);
  const pctx = { ...ctx, patient: pat };
  const patientRules = topoSortRules(allRules.filter(r => ['apply_cap','apply_copay'].includes(r.action)));
  let autoCap = 0, capRule = null;
  let autoCopay = 0, copayRule = null;
  const appliedPids = new Set();
  for(const rule of patientRules.filter(r => r.action === 'apply_cap')){
    if(!checkRequires(rule, appliedPids)) continue;
    if(!ruleMatchesContext(rule, pctx, refDate)) continue;
    const r = evaluateRuleAction(rule, pctx, subtotal);
    if(r.deduct !== undefined && r.deduct > autoCap){ autoCap = r.deduct; capRule = rule; }
    appliedPids.add(rule.id);
  }
  for(const rule of patientRules.filter(r => r.action === 'apply_copay')){
    if(!checkRequires(rule, appliedPids)) continue;
    if(!ruleMatchesContext(rule, pctx, refDate)) continue;
    const r = evaluateRuleAction(rule, pctx, subtotal-autoCap);
    if(r.deduct !== undefined && r.deduct > autoCopay){ autoCopay = r.deduct; copayRule = rule; }
    appliedPids.add(rule.id);
  }
  let finalCap = autoCap, finalCopay = autoCopay;
  if(pat._capMode === 'manual' && pat._manualCapAmount !== null && pat._manualCapAmount !== undefined) finalCap = Number(pat._manualCapAmount)||0;
  else if(pat._capMode === 'reverted') finalCap = 0;
  if(pat._copayMode === 'manual' && pat._manualCopayAmount !== null && pat._manualCopayAmount !== undefined) finalCopay = Number(pat._manualCopayAmount)||0;
  else if(pat._copayMode === 'reverted') finalCopay = 0;
  pat._subtotal = subtotal;
  pat._autoCapAmt = autoCap; pat._autoCapRule = capRule;
  pat._autoCopayAmt = autoCopay; pat._autoCopayRule = copayRule;
  pat._capAmt = Math.max(0, Math.min(subtotal, Math.round(finalCap)));
  pat._copayAmt = Math.max(0, Math.min(subtotal-pat._capAmt, Math.round(finalCopay)));
  pat._final = Math.max(0, subtotal-pat._capAmt-pat._copayAmt);
  pat._beneficiaryPays = pat._capAmt + pat._copayAmt;
  pat._refDate = refDate;
  if(pat._capMode === undefined) pat._capMode = 'auto';
  if(pat._copayMode === undefined) pat._copayMode = 'auto';
  return pat;
}
function recalcClaim(c){
  if(!c.invoices) c.invoices = [];
  let billed = 0, eligible = 0, approved = 0, cap = 0, copay = 0;
  c.invoices.forEach(inv => {
    (inv.patients||[]).forEach(p => {
      computePatient(p, c, inv.date, inv);
      billed += (p.lines||[]).reduce((s,l)=>s + (Number(l.qty)||0)*(Number(l.billedUnit)||0), 0);
      eligible += p._subtotal||0; approved += p._final||0;
      cap += p._capAmt||0; copay += p._copayAmt||0;
    });
  });
  c.billed = billed; c.eligible = eligible;
  c.approved = (c.status === 'pending') ? 0 : approved;
  c.violationDeduction = cap + copay;
  c.capDeduction = cap; c.copayDeduction = copay;
}
claims.forEach(c => { if(!c.type) c.type = 'employee'; recalcClaim(c); });
