let wizState = { step:1, type:null, name:'', rate:0, from:'', to:'', notes:'', ctypes:['employee'], providerIds:[], contractIds:[], action:'apply_cap', conditions:{logic:'AND',rules:[]}, requires:{mode:'any',ruleIds:[]}, compositeConfig:{childRuleIds:[],applyMode:'atomic',requireAllMatch:true} };
function wizRenderRatePresets(){ $('#wizRatePresets').innerHTML = WIZ_RATE_PRESETS.map(v=>`<button type="button" data-wiz-rate="${v}">${v}%</button>`).join(''); }
function wizRenderTiers(){
  const box = $('#wizTiersList'); if(!box) return;
  if(!wizState.tiers || !wizState.tiers.length){ box.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:6px">لا شرائح</div>'; return; }
  box.innerHTML = wizState.tiers.map((t,i) => `<div class="tier-row" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;margin-bottom:6px">
    <input type="number" placeholder="من" value="${t.from||0}" data-tier-idx="${i}" data-tier-field="from">
    <input type="number" placeholder="إلى" value="${t.to||''}" data-tier-idx="${i}" data-tier-field="to">
    <input type="number" placeholder="%" value="${t.rate||0}" data-tier-idx="${i}" data-tier-field="rate">
    <button type="button" class="btn-xs danger" data-tier-del="${i}">×</button>
  </div>`).join('');
  box.querySelectorAll('input[data-tier-idx]').forEach(inp => inp.addEventListener('change', e => {
    const i = Number(e.target.dataset.tierIdx); const f = e.target.dataset.tierField;
    if(!wizState.tiers[i]) return;
    wizState.tiers[i][f] = e.target.value === '' ? (f==='to' ? null : 0) : Number(e.target.value);
  }));
  box.querySelectorAll('[data-tier-del]').forEach(btn => btn.addEventListener('click', e => {
    wizState.tiers.splice(Number(e.target.dataset.tierDel), 1); wizRenderTiers();
  }));
}
function wizRenderPeriodPresets(){ $('#wizPeriodPresets').innerHTML = WIZ_PERIOD_PRESETS.map((p,i)=>`<button type="button" data-wiz-period="${i}">${p.label}</button>`).join(''); }
function wizRenderScope(){
  $('#wizProvidersScope').innerHTML = providers.map(p=>`<label class="scope-chk ${wizState.providerIds.includes(p.id)?'checked':''}"><input type="checkbox" data-wiz-prov="${escapeHtml(p.id)}" ${wizState.providerIds.includes(p.id)?'checked':''}>${escapeHtml(p.name)}</label>`).join('');
  $('#wizContractsScope').innerHTML = contracts.map(c=>{ const p = getProviderById(c.providerId); return `<label class="scope-chk ${wizState.contractIds.includes(c.id)?'checked':''}"><input type="checkbox" data-wiz-con="${escapeHtml(c.id)}" ${wizState.contractIds.includes(c.id)?'checked':''}>${escapeHtml(c.id)} — ${p?escapeHtml(p.name):''}</label>`; }).join('');
  $$('#wizProvidersScope input').forEach(cb => cb.addEventListener('change', () => { const v = cb.dataset.wizProv; if(cb.checked){ if(!wizState.providerIds.includes(v)) wizState.providerIds.push(v); } else wizState.providerIds = wizState.providerIds.filter(x=>x!==v); cb.closest('.scope-chk').classList.toggle('checked', cb.checked); }));
  $$('#wizContractsScope input').forEach(cb => cb.addEventListener('change', () => { const v = cb.dataset.wizCon; if(cb.checked){ if(!wizState.contractIds.includes(v)) wizState.contractIds.push(v); } else wizState.contractIds = wizState.contractIds.filter(x=>x!==v); cb.closest('.scope-chk').classList.toggle('checked', cb.checked); }));
}
function wizTypeHint(){
  const h = $('#wizTypeHint'); if(!h) return;
  if(wizState.type === 'coverage_cap'){ h.className = 'wiz-hint'; h.innerHTML = '🛡️ سقف للعاملين.'; }
  else if(wizState.type === 'retiree_copay'){ h.className = 'wiz-hint wiz-warn'; h.innerHTML = '💰 تحمل للمعاشات.'; }
  else if(wizState.type === 'custom'){ h.className = 'wiz-hint'; h.innerHTML = '⚙️ قاعدة مخصصة.'; }
  else if(wizState.type === 'composite'){ h.className = 'wiz-hint'; h.innerHTML = '🎁 سوبر.'; }
  else { h.className = 'wiz-hint'; h.innerHTML = 'اختر'; }
}
function wizRenderStep(){
  $$('.wiz-step').forEach(s => { const n = Number(s.dataset.wizStep); s.classList.toggle('active', n === wizState.step); s.classList.toggle('done', n < wizState.step); });
  $$('.wiz-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.wizPanel) === wizState.step));
  $('#drWizSub').textContent = `الخطوة ${wizState.step} من 6`;
  $('#\1')?.style.visibility = wizState.step === 1 ? 'hidden' : 'visible';
  $('#wizNextBtn').textContent = wizState.step === 6 ? 'حفظ' : 'التالي';
  if(wizState.step === 1) $$('.wiz-type-card').forEach(c => c.classList.toggle('active', c.dataset.wizType === wizState.type));
  if(wizState.step === 2){
    $('#wizName').value = wizState.name; $('#wizNotes').value = wizState.notes;
    const isComp = wizState.type === 'composite', isCust = wizState.type === 'custom';
    $('#\1')?.style.display = isComp ? 'none' : 'block';
    $('#\1')?.style.display = isCust ? 'block' : 'none';
    $('#\1')?.style.display = isComp ? 'block' : 'none';
    if(isCust) $('#wizAction').value = wizState.action;
    if(!isComp){ $('#wizRate').value = wizState.rate||''; wizRenderRatePresets(); $('#\1')?.style.display = 'block'; $('#wizTiersEnable').checked = !!wizState.tiersEnabled; wizRenderTiers(); }
    else { $('#\1')?.style.display = 'none'; wizRenderChildRules(); $('#wizCompositeMode').value = wizState.compositeConfig.applyMode; $('#wizRequireAll').checked = wizState.compositeConfig.requireAllMatch; }
    wizRenderRequires(); $('#wizRequiresMode').value = wizState.requires.mode; wizTypeHint();
  }
  if(wizState.step === 3){ $('#wizFrom').value = wizState.from; $('#wizTo').value = wizState.to; wizRenderPeriodPresets(); }
  if(wizState.step === 4){ $('#condLogic').value = wizState.conditions.logic || 'AND'; wizRenderConditions(); }
  if(wizState.step === 5) wizRenderScope();
  if(wizState.step === 6) wizRenderPreview();
}
function wizRenderChildRules(){
  const box = $('#wizChildRules');
  const cand = deductionRules.filter(r => !r.isComposite);
  if(!cand.length){ box.innerHTML = '<div style="padding:12px;color:var(--muted);text-align:center">لا قواعد</div>'; return; }
  box.innerHTML = cand.map(r => `<label class="scope-chk ${wizState.compositeConfig.childRuleIds.includes(r.id)?'checked':''}"><input type="checkbox" data-wiz-child="${escapeHtml(r.id)}" ${wizState.compositeConfig.childRuleIds.includes(r.id)?'checked':''}>${escapeHtml(r.id)} — ${escapeHtml(r.name)}</label>`).join('');
  box.querySelectorAll('input').forEach(cb => cb.addEventListener('change', e => { const id = e.target.dataset.wizChild; if(e.target.checked){ if(!wizState.compositeConfig.childRuleIds.includes(id)) wizState.compositeConfig.childRuleIds.push(id); } else wizState.compositeConfig.childRuleIds = wizState.compositeConfig.childRuleIds.filter(x=>x!==id); e.target.closest('.scope-chk').classList.toggle('checked', e.target.checked); }));
}
function wizRenderRequires(){
  const box = $('#wizRequiresRules'); if(!box) return;
  if(!deductionRules.length){ box.innerHTML = '<div style="padding:12px;color:var(--muted);text-align:center">لا قواعد</div>'; return; }
  box.innerHTML = deductionRules.map(r => `<label class="scope-chk ${wizState.requires.ruleIds.includes(r.id)?'checked':''}"><input type="checkbox" data-wiz-req="${escapeHtml(r.id)}" ${wizState.requires.ruleIds.includes(r.id)?'checked':''}>${escapeHtml(r.id)} — ${escapeHtml(r.name)}${r.isComposite?' 🎁':''}</label>`).join('');
  box.querySelectorAll('input').forEach(cb => cb.addEventListener('change', e => { const id = e.target.dataset.wizReq; if(e.target.checked){ if(!wizState.requires.ruleIds.includes(id)) wizState.requires.ruleIds.push(id); } else wizState.requires.ruleIds = wizState.requires.ruleIds.filter(x=>x!==id); e.target.closest('.scope-chk').classList.toggle('checked', e.target.checked); }));
}
function wizRenderPreview(){
  const tl = wizState.type==='coverage_cap'?'سقف':wizState.type==='retiree_copay'?'تحمل':wizState.type==='custom'?'مخصصة':'سوبر';
  const cts = wizState.ctypes.map(ct => ct==='employee'?'عاملين':'معاشات').join(' · ');
  const pv = wizState.providerIds.length ? `${wizState.providerIds.length} جهة` : 'جميع الجهات';
  const cn = wizState.contractIds.length ? `${wizState.contractIds.length} عقد` : 'جميع العقود';
  const pr = wizState.from + (wizState.to?` ← ${wizState.to}`:' (مفتوح)');
  $('#wizPreview').innerHTML = `
    <h4>المعاينة</h4>
    <div class="wiz-preview-grid">
      <div class="wiz-preview-item"><span>النوع</span><b>${tl}</b></div>
      <div class="wiz-preview-item"><span>النسبة</span><b style="color:var(--teal);font-size:16px">${wizState.rate}%</b></div>
      <div class="wiz-preview-item full"><span>الاسم</span><b>${wizState.name||'—'}</b></div>
      <div class="wiz-preview-item full"><span>نوع المطالبة</span><b>${cts}</b></div>
      <div class="wiz-preview-item full"><span>النطاق</span><b>${pv} · ${cn}</b></div>
      <div class="wiz-preview-item full"><span>الفترة</span><b>${pr}</b></div>
    </div>`;
}
function wizSyncInputs(){
  if(wizState.step === 2){
    wizState.name = $('#wizName').value.trim(); wizState.notes = $('#wizNotes').value.trim();
    if(wizState.type !== 'composite') wizState.rate = Number($('#wizRate').value)||0;
    if(wizState.type === 'custom') wizState.action = $('#wizAction').value;
    else if(wizState.type === 'coverage_cap') wizState.action = 'apply_cap';
    else if(wizState.type === 'retiree_copay') wizState.action = 'apply_copay';
    else if(wizState.type === 'composite') wizState.action = 'composite';
    if(wizState.type === 'composite'){ wizState.compositeConfig.applyMode = $('#wizCompositeMode').value; wizState.compositeConfig.requireAllMatch = $('#wizRequireAll').checked; }
    const te = $('#wizTiersEnable'); if(te) wizState.tiersEnabled = te.checked;
    wizState.requires.mode = $('#wizRequiresMode').value;
  }
  if(wizState.step === 3){ wizState.from = $('#wizFrom').value; wizState.to = $('#wizTo').value; }
  if(wizState.step === 4) wizState.conditions.logic = $('#condLogic').value;
}
function wizValidate(step){
  if(step === 1){ if(!wizState.type){ showWarning('تنبيه','اختر'); return false; } return true; }
  if(step === 2){
    if(!wizState.name.trim()){ showWarning('تنبيه','أدخل الاسم'); return false; }
    if(wizState.type === 'composite'){ if(!wizState.compositeConfig.childRuleIds.length){ showWarning('تنبيه','اختر'); return false; } }
    else if(!wizState.rate || wizState.rate <= 0){ showWarning('تنبيه','أدخل النسبة'); return false; }
    return true;
  }
  if(step === 3){
    if(!wizState.from){ showWarning('تنبيه','أدخل السريان'); return false; }
    if(wizState.to && wizState.to < wizState.from){ showWarning('تنبيه','النهاية بعد'); return false; }
    return true;
  }
  return true;
}
function wizGoTo(step){
  if(step < wizState.step){ wizSyncInputs(); wizState.step = step; wizRenderStep(); return; }
  for(let s = wizState.step; s < step; s++){ wizSyncInputs(); if(!wizValidate(s)) return; }
  wizState.step = step; wizRenderStep();
}
function wizNext(){ wizSyncInputs(); if(!wizValidate(wizState.step)) return; if(wizState.step === 6){ wizSave(); return; } wizState.step++; wizRenderStep(); }
function wizBack(){ wizSyncInputs(); if(wizState.step > 1){ wizState.step--; wizRenderStep(); } }
function wizSave(){
  wizSyncInputs();
  if(!wizValidate(5)) return;
  const y = new Date(wizState.from).getFullYear(), pre = 'DR-'+y+'-';
  let m = 0;
  deductionRules.forEach(x => { if(x.id.startsWith(pre)){ const n = parseInt(x.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
  const rule = { id:pre+String(m+1).padStart(3,'0'), name:wizState.name, type:wizState.type, action:wizState.action, rate:wizState.type === 'composite' ? 0 : wizState.rate, isComposite:wizState.type === 'composite', compositeConfig:wizState.type === 'composite' ? JSON.parse(JSON.stringify(wizState.compositeConfig)) : null, requires:(wizState.requires.ruleIds && wizState.requires.ruleIds.length) ? JSON.parse(JSON.stringify(wizState.requires)) : null, scope:{ providerIds:[...wizState.providerIds], contractIds:[...wizState.contractIds], claimTypes:[...wizState.ctypes] }, conditions:JSON.parse(JSON.stringify(wizState.conditions)), effectiveFrom:wizState.from, effectiveTo:wizState.to||'', active:true, enabled:true, notes:wizState.notes, tiers: (wizState.tiersEnabled && wizState.tiers && wizState.tiers.length) ? JSON.parse(JSON.stringify(wizState.tiers)) : null, tiersEnabled: !!wizState.tiersEnabled };
  deductionRules.push(rule); closeDrWizard(); renderDeductionRules(); showSuccess('تم', rule.id);
}

