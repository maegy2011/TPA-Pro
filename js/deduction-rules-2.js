// deduction-rules-2.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function detectDeadRules(){
  const sample = (typeof claims !== 'undefined' ? claims : []).slice(-30);
  const dead = [];
  (typeof deductionRules !== 'undefined' ? deductionRules : []).forEach(rule => {
    if(rule.enabled === false || rule.active === false) return;
    let hits = 0;
    try {
      sample.forEach(c => {
        const _ref = c.date || c.receivedDate || daysFromNow(0);
        (c.invoices||[]).forEach(inv => (inv.patients||[]).forEach(p => {
          const ctx = { claim:c, patient:p, invoice:inv };
          if(typeof ruleMatchesContext==='function' && ruleMatchesContext(rule, ctx, _ref)) hits++;
        }));
      });
    } catch(e){}
    if(!hits) dead.push(rule);
  });
  return dead;
}
function renderPaProcedures(){
  const body = $('#paProcBody'); if(!body) return;
  if(!paProcedures.length){ body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:22px;color:var(--muted)">لا إجراءات</td></tr>'; return; }
  body.innerHTML = paProcedures.map(p => `<tr><td><span class="mono" style="color:var(--navy-400);font-weight:700">${escapeHtml(p.code)}</span></td><td>${escapeHtml(p.name)}</td><td><span class="badge info">${escapeHtml(p.category)}</span></td><td style="font-size:11px;color:var(--muted)">${escapeHtml(p.notes||'—')}</td><td class="act"><div style="display:flex;gap:5px;align-items:center"><button class="btn-xs" data-edit-paproc="${escapeHtml(p.code)}">تحرير</button><button class="btn-xs danger" data-del-paproc="${escapeHtml(p.code)}">×</button></div></td></tr>`).join('');
}
function openDrModal(id){
  editingDrId = id || null;
  const r = id ? deductionRules.find(x => x.id === id) : null;
  $('#drModalTitle').textContent = r ? 'تعديل' : 'إضافة';
  $('#drModalSub').textContent = r ? r.id : '—';
  $('#drName').value = r ? r.name : ''; $('#drType').value = r ? r.type : 'coverage_cap'; $('#drRate').value = r ? r.rate : 20;
  $('#drFrom').value = r ? r.effectiveFrom : daysFromNow(0); $('#drTo').value = r ? (r.effectiveTo||'') : daysFromNow(365);
  $('#drActive').checked = r ? r.active : true; $('#drNotes').value = r ? r.notes||'' : '';
  try {
    const _pr = document.getElementById('drPriority'); if(_pr) _pr.value = (r && r.priority) || 0;
    const _rt = document.getElementById('drRetro'); if(_rt) _rt.checked = !!(r && r.retroactive);
    const _sa = document.getElementById('drScopeAll'); if(_sa) _sa.checked = !!(r && r.scopeExplicitAll);
    const _box = document.getElementById('drScopeProviders');
    if(_box && typeof providers !== 'undefined'){
      const _sel = (r && r.scope && r.scope.providerIds) || [];
      _box.innerHTML = providers.map(p => `<label class="scope-chk"><input type="checkbox" class="dr-scope-p" value="${p.id}" ${_sel.includes(p.id)?'checked':''}> ${escapeHtml(p.name||p.id)}</label>`).join('') || '<span style="color:var(--muted)">لا جهات</span>';
    }
  } catch(e){}
  const ct = r ? (r.scope.claimTypes||[]) : ['employee'];
  $$('.dr-ctype').forEach(cb => cb.checked = ct.includes(cb.value));
  (el => { if (el) el.style.display = r ? 'block' : 'none'; })($('#deleteDrBtn'));
  $('#drModal').classList.add('open');
}
function closeDrModal(){ $('#drModal').classList.remove('open'); editingDrId = null; }
function saveDr(){
  const name = $('#drName').value.trim(), type = $('#drType').value, rate = Number($('#drRate').value);
  const from = $('#drFrom').value, to = $('#drTo').value;
  if(!name){ showWarning('تنبيه','أدخل الاسم'); return; }
  if(isNaN(rate) || rate < 0 || rate > 100){ showWarning('تنبيه','النسبة'); return; }
  if(!from){ showWarning('تنبيه','أدخل السريان'); return; }
  const cts = $$('.dr-ctype').filter(cb=>cb.checked).map(cb=>cb.value);
  if(!cts.length){ showWarning('تنبيه','حدد نوع'); return; }
  const _notes = ($('#drNotes') && $('#drNotes').value.trim()) || '';
  if(!_notes){ showWarning('تنبيه','اكتب سبب القاعدة بالعربية (إلزامي للتخريج القانوني)'); return; }
  const _prioEl = document.getElementById('drPriority'); const _prio = _prioEl ? Number(_prioEl.value)||0 : 0;
  const _retro = !!(document.getElementById('drRetro') && document.getElementById('drRetro').checked);
  const _scopeAll = !!(document.getElementById('drScopeAll') && document.getElementById('drScopeAll').checked);
  const _selProv = Array.from(document.querySelectorAll('.dr-scope-p:checked')).map(cb => cb.value);
  if(!_selProv.length && !_scopeAll){ showWarning('تنبيه','حدد جهة واحدة على الأقل أو علّم «كل الجهات» صراحة — القاعدة بلا نطاق ممنوعة'); return; }
  const data = { name, type, action: type==='coverage_cap'?'apply_cap':'apply_copay', rate, priority:_prio, retroactive:_retro, scopeExplicitAll:_scopeAll, effectiveFrom:from, effectiveTo:to||'', active:$('#drActive').checked, notes:$('#drNotes').value.trim(), scope:{ providerIds:_selProv, contractIds:[], claimTypes:cts } };
  if(editingDrId){ const r = deductionRules.find(x=>x.id===editingDrId); if(r){ r._prevVersion = { rate:r.rate, priority:(r.priority||0), at:new Date().toISOString() }; Object.assign(r, data); r.version = (Number(r.version)||1)+1; r._simulated = false; r.enabled = false; r.active = false; } showSuccess('تم — القاعدة معطلة حتى محاكاة إجبارية', 'نفّذ «محاكاة» لعرض الأثر ثم فعّلها'); }
  else {
    const y = new Date(from).getFullYear(), pre = 'DR-'+y+'-';
    let m = 0;
    deductionRules.forEach(x => { if(x.id.startsWith(pre)){ const n = parseInt(x.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
    deductionRules.push({ id:pre+String(m+1).padStart(3,'0'), version:1, _simulated:false, enabled:false, active:false, ...data, enabled:false, active:false });
    showSuccess('تم','تمت');
  }
  closeDrModal(); renderDeductionRules();
  if (typeof claims !== 'undefined') { claims.forEach(c => { if (typeof recalcClaim === 'function') recalcClaim(c); }); }
  if (typeof persistData === 'function') persistData(true);
  if (typeof renderAll === 'function') renderAll();
}
function deleteDr(id){
  const r = deductionRules.find(x=>x.id===id); if(!r) return;
  showDelete('حذف', `"${r.name}".`, () => {
    deductionRules = deductionRules.filter(x=>x.id!==id);
    // clean up dependencies
    deductionRules.forEach(x => {
      if (x.requires && Array.isArray(x.requires.ruleIds)) x.requires.ruleIds = x.requires.ruleIds.filter(rid => rid !== id);
      if (x.compositeConfig && Array.isArray(x.compositeConfig.childRuleIds)) x.compositeConfig.childRuleIds = x.compositeConfig.childRuleIds.filter(rid => rid !== id);
    });
    closeDrModal(); renderDeductionRules(); showSuccess('تم','تم');
    if (typeof claims !== 'undefined') { claims.forEach(c => { if (typeof recalcClaim === 'function') recalcClaim(c); }); }
    if (typeof persistData === 'function') persistData(true);
    if (typeof renderAll === 'function') renderAll();
  });
}
/** التعلم من المراجع: أي خصم يدوي (تخفيض/رفض/سقف/تحمل) يُحفظ كمسودة قاعدة بنطاق ضيق — تُفعَّل من صفحة القواعد. */
function nextLearnedRuleId(){
  const y = new Date().getFullYear(), pre = 'DR-'+y+'-';
  let m = 0;
  (typeof deductionRules !== 'undefined' ? deductionRules : []).forEach(x => { if(x.id && x.id.startsWith(pre)){ const n = parseInt(x.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m, n); } });
  return pre+String(m+1).padStart(3,'0');
}
function ruleAlreadyCovers(action, providerId, conditions){
  const key = JSON.stringify(conditions || {});
  return (typeof deductionRules !== 'undefined' ? deductionRules : []).some(r => r && r.action === action && r.enabled !== false && r.active !== false
    && (!providerId || ((r.scope||{}).providerIds||[]).includes(providerId))
    && JSON.stringify((r||{}).conditions || {}) === key);
}
function learnRuleFromReviewer(kind, d){
  try {
    if(typeof deductionRules === 'undefined' || !d || !d.claim) return null;
    const claim = d.claim;
    const plist = (typeof providers !== 'undefined' ? providers : []);
    const provider = plist.find(x => (claim.providerCode != null && x.code === claim.providerCode) || x.name === claim.provider || x.id === claim.provider) || null;
    const providerIds = provider ? [provider.id] : [];
    let contractIds = [];
    try { const cx = (typeof getContractContext === 'function') ? getContractContext(claim) : null; if(cx && cx.contract) contractIds = [cx.contract.id]; } catch(e){}
    const claimTypes = [claim.type || 'employee'];
    const today = new Date().toISOString().slice(0,10);
    const pname = provider ? provider.name : (claim.provider || '');
    let action = null, rate = 0, conditions = null, name = '';
    if(kind === 'line-reject' && d.line){
      if(((d.line._appliedRuleIds)||[]).length) return null;
      action = 'reject_line'; rate = 0;
      conditions = { logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:String(d.line.code) }] };
      name = `مستفادة: رفض ${d.line.code||''} — ${pname}`.trim();
    } else if(kind === 'line-reduce' && d.line){
      if(((d.line._appliedRuleIds)||[]).length) return null;
      const base = Number(d.base)||0, v = Number(d.value)||0;
      if(!(base > 0) || !(v >= 0) || !(v < base)) return null;
      rate = Math.min(100, Math.round((1 - v/base)*100));
      if(rate <= 0) return null;
      action = 'reduce_by_percent';
      conditions = { logic:'AND', rules:[{ mode:'expr', field:'line.code', op:'eq', value:String(d.line.code) }] };
      name = `مستفادة: خصم ${rate}% ${d.line.code||''} — ${pname}`.trim();
    } else if(kind === 'manual-cap' || kind === 'manual-copay'){
      const subtotal = Number(d.subtotal)||0, v = Number(d.value)||0, auto = Number(d.auto)||0;
      if(!(subtotal > 0) || v < 0 || v >= subtotal || v === auto) return null;
      rate = Math.round(v/subtotal*100);
      if(rate <= 0 || rate >= 100) return null;
      action = kind === 'manual-cap' ? 'apply_cap' : 'apply_copay';
      conditions = { logic:'AND', rules:[] };
      name = `مستفادة: ${kind === 'manual-cap' ? 'سقف' : 'تحمل'} ${rate}% — ${pname}`.trim();
    } else return null;
    if(ruleAlreadyCovers(action, provider ? provider.id : null, conditions)) return 'exists';
    const originNote = `مسودة مستفادة من ${claim.id}${d.line ? ' بند '+d.line.code : ''} بتاريخ ${today}${d.note ? ' — '+d.note : ''}`;
    const sameSig = (r) => r && r.source === 'learned' && r.enabled === false && r.action === action
      && JSON.stringify(((r.scope)||{}).providerIds||[]) === JSON.stringify(providerIds)
      && JSON.stringify(((r.scope)||{}).contractIds||[]) === JSON.stringify(contractIds)
      && JSON.stringify(((r.scope)||{}).claimTypes||[]) === JSON.stringify(claimTypes)
      && JSON.stringify(r.conditions||{}) === JSON.stringify(conditions);
    const prior = deductionRules.find(sameSig);
    if(prior){ prior.rate = rate; prior.name = name; prior.effectiveFrom = today; prior.notes = originNote; if(typeof persistData === 'function') persistData(true); return 'updated'; }
    const id = nextLearnedRuleId();
    deductionRules.push({ id, name, type: action === 'apply_cap' ? 'coverage_cap' : action === 'apply_copay' ? 'retiree_copay' : 'custom', action, rate, isComposite:false, compositeConfig:null, requires:null, scope:{ providerIds, contractIds, claimTypes }, conditions, effectiveFrom:today, effectiveTo:'', active:true, enabled:false, notes:originNote, source:'learned' });
    if(typeof persistData === 'function') persistData(true);
    if(typeof renderDeductionRules === 'function' && document.getElementById('deductionRulesBody')){ try{ renderDeductionRules(); }catch(e){} }
    return id;
  } catch(e){ return null; }
}
/* تفعيل مسودة مستفادة فورًا بتأكيد المراجع — يعيد true عند التفعيل. */
function applyLearnedRuleNow(id){
  try {
    if(typeof deductionRules === 'undefined' || !id) return false;
    const r = deductionRules.find(x => x && x.id === id && x.source === 'learned');
    if(!r || r.enabled !== false) return false;
    r.enabled = true; r.active = true;
    r._autoApplied = true; r._autoAppliedAt = new Date().toISOString();
    r.notes = String(r.notes || '') + ' — طُبقت فورًا بتأكيد المراجع';
    if(typeof persistData === 'function') persistData(true);
    try { if(typeof renderDeductionRules === 'function' && typeof document !== 'undefined' && document.getElementById('deductionRulesBody')) renderDeductionRules(); } catch(e){}
    try { if(typeof recalcReview === 'function') recalcReview(); } catch(e){}
    return true;
  } catch(e){ return false; }
}
/* عرض مسودة مستفادة على المراجع: تحذير + تأكيد التطبيق الفوري أو إبقاؤها مسودة.
   تُستدعى بنتيجة learnRuleFromReviewer؛ لا تعرض شيئًا إلا عند إنشاء مسودة جديدة. */
function offerApplyLearnedRule(result){
  try {
    if(typeof result !== 'string' || !result || result === 'exists' || result === 'updated') return result;
    if(typeof deductionRules === 'undefined') return result;
    const r = deductionRules.find(x => x && x.id === result);
    if(!r) return result;
    const scopeN = ((r.scope || {}).providerIds || []).length;
    const msg = `${r.name || result} — النسبة ${Number(r.rate) || 0}% — النطاق: ${scopeN ? scopeN + ' جهة' : 'عام'}.<br><br>تطبيقها الآن على المراجعات؟ (إلغاء = تبقى مسودة معطلة بانتظار التفعيل من صفحة القواعد)`;
    if(typeof showWarning === 'function'){
      showWarning('قاعدة مستفادة جديدة', msg, () => {
        if(applyLearnedRuleNow(result) && typeof showSuccess === 'function') showSuccess('تم التطبيق', 'القاعدة المستفادة أصبحت فعالة');
      });
    } else if(typeof showSuccess === 'function'){ showSuccess('مسودة قاعدة', 'أُضيفت كمسودة بانتظار التفعيل في القواعد'); }
    return result;
  } catch(e){ return result; }
}
function openPaProcModal(code){
  editingPaProcCode = code || null;
  const p = code ? paProcedures.find(x=>x.code===code) : null;
  $('#paProcModalTitle').textContent = p ? 'تعديل' : 'إضافة';
  $('#paProcCode').value = p ? p.code : ''; $('#paProcName').value = p ? p.name : '';
  $('#paProcCat').value = p ? p.category : 'عمليات'; $('#paProcNotes').value = p ? p.notes||'' : '';
  $('#paProcModal').classList.add('open');
}
function savePaProc(){
  const code = $('#paProcCode').value.trim(), name = $('#paProcName').value.trim();
  if(!code || !name){ showWarning('تنبيه','أدخل الكود والاسم'); return; }
  const data = { code, name, category:$('#paProcCat').value, notes:$('#paProcNotes').value.trim() };
  if(editingPaProcCode){ const i = paProcedures.findIndex(x=>x.code===editingPaProcCode); if(i>=0) paProcedures[i] = data; }
  else { if(paProcedures.find(x=>x.code===code)){ showWarning('تنبيه','مستخدم'); return; } paProcedures.push(data); }
  $('#paProcModal').classList.remove('open'); editingPaProcCode = null;
  renderPaProcedures(); renderDeductionRules(); showSuccess('تم','تم');
}

function testDeductionRule(id){
  const rule = deductionRules.find(r => r.id === id);
  if(!rule){ showWarning('تنبيه','القاعدة غير موجودة'); return; }
  if(!claims.length){ showWarning('تنبيه','لا مطالبات للاختبار'); return; }
  let claim = null, inv0 = null, pat = null, line = null;
  outer:
  for(const c of claims){
    const _ref = c.date || c.receivedDate || daysFromNow(0);
    for(const inv of (c.invoices||[])){
      for(const p of (inv.patients||[])){
        for(const l of (p.lines||[])){
          const _t = { claim: c, patient: p, invoice: inv, line: { ...l, lineBase: l.qty * l.billedUnit } };
          if(ruleMatchesContext(rule, _t, _ref)){ claim = c; inv0 = inv; pat = p; line = l; break outer; }
        }
      }
    }
  }
  if(!line){ showWarning('تنبيه','لا بند مطابق لنطاق هذه القاعدة في المطالبات الحالية — وسّع النطاق أو أضف بندًا تجريبيًا'); return; }
  const inv = inv0;
  const ctx = { claim, patient: pat, invoice: inv, line: { ...line, lineBase: line.qty * line.billedUnit } };
  ctx.line.lineBase = line.qty * (line.tariffUnit != null ? Math.min(line.billedUnit, line.tariffUnit) : line.billedUnit);
  const refDate = claim.date || claim.receivedDate || daysFromNow(0);
  const matched = ruleMatchesContext(rule, ctx, refDate);
  const applied = new Set();
  const res = rule.isComposite
    ? evaluateCompositeRule(rule, ctx, refDate)
    : evaluateRuleAction(rule, ctx, ctx.line.lineBase);
  const requiresOk = checkRequires(rule, applied);
  const msg = `القاعدة: ${escapeHtml(rule.name)}<br>مطابقة: ${matched ? '✅ نعم' : '❌ لا'}<br>الأساس: ${fmt(ctx.line.lineBase)}<br>النتيجة: ${res.newApproved !== undefined ? fmt(res.newApproved) : fmt(ctx.line.lineBase - (res.deduct||0))}<br>الخصم: ${fmt(res.deduct || (ctx.line.lineBase - (res.newApproved||ctx.line.lineBase)))}`;
  showInfo('اختبار قاعدة', msg);
}


function simulateRule(id){
  const rule = deductionRules.find(r => r.id === id);
  if(!rule){ showWarning('تنبيه','القاعدة غير موجودة'); return; }
  if(!claims.length){ showWarning('تنبيه','لا مطالبات للاختبار'); return; }
  const sample = claims.slice(-10);
  let totalLines = 0, affected = 0;
  let totalBefore = 0, totalAfter = 0, totalExtraDed = 0;
  const affectedSamples = [];
  const isPatientLevel = ['apply_cap','apply_copay'].includes(rule.action);

  sample.forEach(claim => {
    const refDate = claim.date || claim.receivedDate || daysFromNow(0);
    if(isPatientLevel){
      (claim.invoices||[]).forEach(inv => {
        (inv.patients||[]).forEach(pat => {
          const subtotal = (pat.lines||[]).reduce((s,l) => s + (Number(l.approved)|| (Number(l.qty)||0)*(Number(l.billedUnit)||0)), 0);
          const ctx = { claim, patient: pat, invoice: inv };
          const matched = ruleMatchesContext(rule, ctx, refDate);
          if(!matched){ totalBefore += subtotal; totalAfter += subtotal; return; }
          const res = evaluateRuleAction(rule, ctx, subtotal);
          const deduct = res.deduct !== undefined ? res.deduct : (subtotal - (res.newApproved !== undefined ? res.newApproved : subtotal));
          const after = Math.max(0, subtotal - deduct);
          totalLines += (pat.lines||[]).length;
          totalBefore += subtotal; totalAfter += after;
          if(deduct > 0){ affected++; totalExtraDed += deduct; if(affectedSamples.length < 8) affectedSamples.push({ claim: claim.id, service: (pat.lines||[]).map(l=>l.name||l.code).join(', ').slice(0,40), before: subtotal, after }); }
        });
      });
    } else {
      (claim.invoices||[]).forEach(inv => {
        (inv.patients||[]).forEach(pat => {
          (pat.lines||[]).forEach(line => {
            totalLines++;
            const base = line.qty * (line.tariffUnit != null ? Math.min(line.billedUnit, line.tariffUnit) : line.billedUnit);
            const ctx = { claim, patient: pat, invoice: inv, line: { ...line, lineBase: base } };
            const matched = ruleMatchesContext(rule, ctx, refDate);
            if(!matched){ totalBefore += base; totalAfter += base; return; }
            const res = rule.isComposite ? evaluateCompositeRule(rule, ctx, refDate) : evaluateRuleAction(rule, ctx, base);
            const newVal = res && res.newApproved !== undefined ? res.newApproved : (base - (res && res.deduct ? res.deduct : 0));
            totalBefore += base; totalAfter += newVal;
            if(newVal < base){ affected++; totalExtraDed += (base - newVal); if(affectedSamples.length < 8) affectedSamples.push({ claim: claim.id, service: line.name || line.code, before: base, after: newVal }); }
          });
        });
      });
    }
  });

  const pct = totalBefore ? ((totalExtraDed/totalBefore)*100).toFixed(1) : '0';
  let msg = `القاعدة: ${rule.name}<br>المطالبات المختبرة: ${sample.length}<br>البنود: ${totalLines}<br>البنود/المرضى المتأثرون: ${affected}<br>إجمالي قبل: ${fmt(totalBefore)}<br>إجمالي بعد: ${fmt(totalAfter)}<br>استقطاع إضافي: ${fmt(totalExtraDed)} (${pct}%)`;
  if(affectedSamples.length){
    msg += '<br><br><b>عينة من البنود المتأثرة:</b><br>';
    affectedSamples.forEach(s => { msg += `${escapeHtml(s.claim)} — ${escapeHtml(s.service)}: ${fmt(s.before)} → ${fmt(s.after)}<br>`; });
  }
  rule._simulated = true; rule._simAt = new Date().toISOString();
  rule._simResult = { claims: sample.length, lines: totalLines, affected, extraDed: Math.round(totalExtraDed) };
  try { if(typeof appendClaimAuditEvent==='function' && claims[0]) appendClaimAuditEvent(claims[0],{action:'rule.simulated',details:{rule:rule.id,affected,extraDed:Math.round(totalExtraDed)}}); } catch(e){}
  msg += `<br><br><button type="button" class="btn-sm solid" data-sim-activate="${rule.id}" ${affected>0?'':'disabled'}>تفعيل القاعدة (الأثر ${fmt(totalExtraDed)})</button>`;
  showInfo('محاكاة قاعدة الخصم — آخر 10 مطالبات', msg);
  setTimeout(() => {
    const b = document.querySelector(`[data-sim-activate="${rule.id}"]`);
    if(b && !b.dataset.bound){ b.dataset.bound='1'; b.addEventListener('click', () => {
      rule.enabled = true; rule.active = true;
      try { if(typeof renderDeductionRules==='function') renderDeductionRules(); } catch(e){}
      try { if(typeof persistData==='function') persistData(true); } catch(e){}
      try { if(typeof showSuccess==='function') showSuccess('تم التفعيل', rule.name); } catch(e){}
    }); }
  }, 300);
}
