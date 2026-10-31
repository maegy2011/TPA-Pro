function openDrWizard(){
  wizState = { step:1, type:null, name:'', rate:0, from:'', to:'', notes:'', ctypes:['employee'], providerIds:[], contractIds:[], action:'apply_cap', conditions:{logic:'AND',rules:[]}, requires:{mode:'any',ruleIds:[]}, compositeConfig:{childRuleIds:[],applyMode:'atomic',requireAllMatch:true}, tiers:[], tiersEnabled:false };
  $('#drWizardModal').classList.add('open'); wizRenderStep();
}
function closeDrWizard(){ $('#drWizardModal').classList.remove('open'); }
function bindDrWizard(){
  $$('[data-close-drwiz]').forEach(el => el.addEventListener('click', closeDrWizard));
  $('#wizBackBtn').addEventListener('click', wizBack);
  $('#wizNextBtn').addEventListener('click', wizNext);
  $$('[data-wiz-jump]').forEach(el => el.addEventListener('click', () => wizGoTo(Number(el.dataset.wizJump))));
  $$('.wiz-type-card').forEach(card => card.addEventListener('click', () => {
    wizState.type = card.dataset.wizType;
    if(wizState.type === 'coverage_cap'){ wizState.action = 'apply_cap'; if(!wizState.ctypes.includes('employee')) wizState.ctypes.push('employee'); }
    else if(wizState.type === 'retiree_copay'){ wizState.action = 'apply_copay'; if(!wizState.ctypes.includes('retiree')) wizState.ctypes.push('retiree'); }
    else if(wizState.type === 'composite') wizState.action = 'composite';
    $$('.wiz-type-card').forEach(c => c.classList.toggle('active', c === card));
  }));
  $('#wizAction').addEventListener('change', e => { wizState.action = e.target.value; });
  $('#wizCompositeMode').addEventListener('change', e => { wizState.compositeConfig.applyMode = e.target.value; });
  $('#wizRequireAll').addEventListener('change', e => { wizState.compositeConfig.requireAllMatch = e.target.checked; });
  $('#wizRequiresMode').addEventListener('change', e => { wizState.requires.mode = e.target.value; });
  $('#wizRequiresClear').addEventListener('click', () => { wizState.requires.ruleIds = []; wizRenderRequires(); });
  $('#wizRatePresets').addEventListener('click', e => { const btn = e.target.closest('[data-wiz-rate]'); if(!btn) return; wizState.rate = Number(btn.dataset.wizRate); $('#wizRate').value = wizState.rate; });
  $('#wizPeriodPresets').addEventListener('click', e => { const btn = e.target.closest('[data-wiz-period]'); if(!btn) return; const p = WIZ_PERIOD_PRESETS[Number(btn.dataset.wizPeriod)]; wizState.from = p.from(); wizState.to = p.to(); $('#wizFrom').value = wizState.from; $('#wizTo').value = wizState.to; });
  $$('.wiz-ctype').forEach(cb => cb.addEventListener('change', () => { if(cb.checked){ if(!wizState.ctypes.includes(cb.value)) wizState.ctypes.push(cb.value); } else wizState.ctypes = wizState.ctypes.filter(x=>x!==cb.value); cb.closest('.scope-chk').classList.toggle('checked', cb.checked); }));
  $('#condLogic').addEventListener('change', e => { wizState.conditions.logic = e.target.value; wizRenderCondPreview(); });
  $('#addCondBtn').addEventListener('click', () => { wizState.conditions.rules.push({ field:'line.category', op:'eq', value:'مختبر' }); wizRenderConditions(); });
  $('#addGroupBtn').addEventListener('click', () => { wizState.conditions.rules.push({ logic:'OR', rules:[{ field:'line.billedUnit', op:'gt', value:500 }] }); wizRenderConditions(); });
  $('#drWizardModal').addEventListener('click', e => {
    const sa = e.target.closest('[data-wiz-selectall]');
    if(sa){ if(sa.dataset.wizSelectall === 'providers') wizState.providerIds = providers.map(p=>p.id); else wizState.contractIds = contracts.map(c=>c.id); wizRenderScope(); }
    const cl = e.target.closest('[data-wiz-clear]');
    if(cl){ if(cl.dataset.wizClear === 'providers') wizState.providerIds = []; else wizState.contractIds = []; wizRenderScope(); }
  });
  const addTierBtn = $('#wizAddTierBtn');
  if(addTierBtn) addTierBtn.addEventListener('click', () => { if(!wizState.tiers) wizState.tiers = []; wizState.tiers.push({from:0, to:null, rate:0}); wizState.tiersEnabled = true; const te = $('#wizTiersEnable'); if(te) te.checked = true; wizRenderTiers(); });
  const tiersEnable = $('#wizTiersEnable');
  if(tiersEnable) tiersEnable.addEventListener('change', e => { wizState.tiersEnabled = e.target.checked; if(!wizState.tiersEnabled) wizState.tiers = []; });
}

function wizConditionRowHTML(cond, idPrefix, inGroup, parentPath){
  parentPath = parentPath || '';
  const mode = cond.mode || 'expr';
  const scope = cond.scope || 'self';
  const scopeSel = inGroup ? '' : `<select class="sel-scope" data-cond-scope="${idPrefix}">${Object.entries(WIZ_SCOPES).map(([k,v])=>`<option value="${k}" ${scope===k?'selected':''}>${v.label}</option>`).join('')}</select>`;
  const modeSel = inGroup ? '' : `<select class="sel-mode" data-cond-mode="${idPrefix}">${Object.entries(WIZ_MODES).map(([k,v])=>`<option value="${k}" ${mode===k?'selected':''}>${v.label}</option>`).join('')}</select>`;
  const fSel = val => `<select data-cond-field="${idPrefix}">${WIZ_FIELDS.map(x=>`<option value="${x.path}" ${val===x.path?'selected':''}>${x.label}</option>`).join('')}</select>`;
  const opOptions = (val) => WIZ_OP_GROUPS.map(g => `<optgroup label="${g.label}">${g.ops.map(k=>`<option value="${k}" ${val===k?'selected':''}>${(WIZ_OPS[k]||{}).label||k}</option>`).join('')}</optgroup>`).join('') + `<optgroup label="أخرى">${Object.keys(WIZ_OPS).filter(k=>!WIZ_OP_GROUPS.some(g=>g.ops.includes(k))).map(k=>`<option value="${k}" ${val===k?'selected':''}>${WIZ_OPS[k].label}</option>`).join('')}</optgroup>`;
  const oSel = (val,attr) => `<select data-cond-${attr}="${idPrefix}">${opOptions(val)}</select>`;
  const vInp = (val,attr,opKey) => { const o = cond[opKey]; if((WIZ_OPS[o]||{}).noValue) return ''; return `<input type="text" data-cond-${attr}="${idPrefix}" value="${val||''}" placeholder="قيمة">`; };
  let inner = '';
  if(mode === 'expr') inner = fSel(cond.field||'line.category') + oSel(cond.op||'eq','op') + vInp(cond.value,'value','op');
  else if(mode === 'any' || mode === 'all') inner = fSel(cond.subField||'line.code') + oSel(cond.subOp||'eq','subOp') + vInp(cond.subValue,'subValue','subOp');
  else if(mode === 'count') inner = fSel(cond.subField||'line.category') + oSel(cond.subOp||'eq','subOp') + vInp(cond.subValue,'subValue','subOp') + oSel(cond.compareOp||'gt','compareOp') + `<input type="number" data-cond-compareValue="${idPrefix}" value="${cond.compareValue||0}">`;
  else if(['sum','avg','max','min'].includes(mode)) inner = fSel(cond.aggField||'line.billedTotal') + oSel(cond.compareOp||'gt','compareOp') + `<input type="number" data-cond-compareValue="${idPrefix}" value="${cond.compareValue||0}">`;
  else if(mode === 'duplicate' || mode === 'unique') inner = fSel(cond.field||'line.code');
  else if(mode === 'frequency') inner = fSel(cond.field||'line.code') + oSel(cond.compareOp||'gt','compareOp') + '<input type="number" data-cond-compareValue="' + idPrefix + '" value="' + (cond.compareValue||1) + '" placeholder="حد">' + '<input type="number" data-cond-windowDays="' + idPrefix + '" value="' + (cond.windowDays||14) + '" placeholder="أيام">';
  else if(mode === 'bundle') inner = '<input type="text" data-cond-components="' + idPrefix + '" value="' + (cond.components||[]).join(',') + '" placeholder="أكواد مفصولة بفواصل">' + fSel(cond.field||'line.code');
  else if(mode === 'diagnosis_match') inner = fSel(cond.field||'claim.diagnosis') + oSel(cond.op||'in','op') + '<input type="text" data-cond-value="' + idPrefix + '" value="' + (cond.value||'') + '" placeholder="أكواد ICD-10 مفصولة بفواصل">';
  return `<div class="cond-item mode-${mode}" data-drag-path="${idPrefix}" data-drop-container="${parentPath}">
    <span class="cond-drag-handle" draggable="true" aria-grabbed="false" tabindex="0" title="سحب">⠿</span>
    ${scopeSel}${modeSel}${inner}
    <div class="cond-reorder-btns">
      <button type="button" data-move-up="${idPrefix}" title="أعلى">▲</button>
      <button type="button" data-move-down="${idPrefix}" title="أسفل">▼</button>
    </div>
    <button type="button" class="cond-del" data-cond-del="${idPrefix}">×</button>
  </div>`;
}
function renderNodeHTML(node, path, parentPath){
  parentPath = parentPath || '';
  if(node && node.logic && Array.isArray(node.rules)){
    const inner = node.rules.map((ic,iidx) => renderNodeHTML(ic, path + '_c' + iidx, path)).join('');
    return `<div class="cond-group" data-drag-path="${path}" data-drop-into="${path}" data-drop-container="${parentPath}">
      <div class="cond-group-head">
        <span class="cond-drag-handle" draggable="true" tabindex="0" title="سحب">⠿</span>
        <span>مجموعة</span>
        <select data-group-logic="${path}" class="cond-logic-sel" style="height:26px;font-size:10.5px"><option value="AND" ${node.logic==='AND'?'selected':''}>ALL</option><option value="OR" ${node.logic==='OR'?'selected':''}>ANY</option></select>
        <button type="button" class="del-grp" data-group-del="${path}">×</button>
        <div class="cond-reorder-btns">
          <button type="button" data-move-up="${path}" title="أعلى">▲</button>
          <button type="button" data-move-down="${path}" title="أسفل">▼</button>
        </div>
      </div>
      <div class="cond-list" data-drop-container="${path}" data-drop-target-end="true">${inner}</div>
      <div class="cond-actions">
        <button type="button" class="btn-apply out" data-group-add-cond="${path}" style="height:26px;padding:0 10px;font-size:10.5px;margin-top:4px">+ شرط</button>
        <button type="button" class="btn-apply out" data-group-add-group="${path}" style="height:26px;padding:0 10px;font-size:10.5px;margin-top:4px;margin-right:4px">+ مجموعة</button>
      </div>
    </div>`;
  }
  return wizConditionRowHTML(node, path, false, parentPath);
}
function wizRenderConditions(){
  const list = $('#condList'); const conds = wizState.conditions.rules || [];
  if(!conds.length) list.innerHTML = '<div class="cond-empty">لا شروط</div>';
  else list.innerHTML = conds.map((c,idx) => renderNodeHTML(c, (c.logic&&Array.isArray(c.rules)) ? 'g'+idx : 'c'+idx, '')).join('');
  wizRenderCondPreview(); wizBindConditionHandlers(); if(typeof initDragDrop === 'function') initDragDrop();
}
function wizRenderCondPreview(){
  const el = $('#condPreview'); if(!el) return;
  const conds = wizState.conditions.rules || [];
  if(!conds.length){ el.classList.remove('show'); return; }
  el.innerHTML = `سيتم التطبيق عند: ${conds.length} شرط`;
  el.classList.add('show');
}
function parsePath(id){
  if(!id) return null;
  const nums = String(id).match(/\d+/g);
  if(!nums) return null;
  return nums.map(Number);
}
function getNodeByPath(path){ let node = { rules: wizState.conditions.rules }; for(const i of path){ if(!node.rules || !node.rules[i]) return null; node = node.rules[i]; } return node; }
function getParentByPath(path){ if(path.length === 1) return { parent: { rules: wizState.conditions.rules }, idx: path[0] }; const p = getNodeByPath(path.slice(0,-1)); return p ? { parent: p, idx: path[path.length-1] } : null; }
function wizBindConditionHandlers(){
  const root = $('#condList');
  root.querySelectorAll('[data-cond-scope]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condScope); const n = getNodeByPath(p); if(!n) return; n.scope = e.target.value; n.field = null; n.op = null; n.value = null; wizRenderConditions(); }));
  root.querySelectorAll('[data-cond-mode]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condMode); const n = getNodeByPath(p); if(!n) return; n.mode = e.target.value; n.field = null; n.op = null; n.value = null; wizRenderConditions(); }));
  root.querySelectorAll('[data-cond-field]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condField); const n = getNodeByPath(p); if(!n) return; const mode = n.mode || 'expr'; if(mode === 'expr' || mode === 'duplicate' || mode === 'unique' || mode === 'frequency' || mode === 'diagnosis_match') n.field = e.target.value; else if(mode === 'any' || mode === 'all' || mode === 'count') n.subField = e.target.value; else n.aggField = e.target.value; }));
  root.querySelectorAll('[data-cond-op]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condOp); const n = getNodeByPath(p); if(!n) return; n.op = e.target.value; wizRenderConditions(); }));
  root.querySelectorAll('[data-cond-subOp]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condSubop); const n = getNodeByPath(p); if(!n) return; n.subOp = e.target.value; wizRenderConditions(); }));
  root.querySelectorAll('[data-cond-compareOp]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condCompareop); const n = getNodeByPath(p); if(!n) return; n.compareOp = e.target.value; }));
  ['value','subValue','compareValue'].forEach(attr => {
    root.querySelectorAll(`[data-cond-${attr}]`).forEach(el => {
      ['input','change'].forEach(evt => el.addEventListener(evt, e => {
        const key = 'cond' + attr.charAt(0).toUpperCase() + attr.slice(1);
        const p = parsePath(e.target.dataset[key]); const n = getNodeByPath(p); if(!n) return;
        n[attr] = e.target.value;
      }));
    });
  });
  root.querySelectorAll('[data-cond-windowDays]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condWindowdays); const n = getNodeByPath(p); if(!n) return; n.windowDays = Number(e.target.value)||0; }));
  root.querySelectorAll('[data-cond-components]').forEach(el => el.addEventListener('change', e => { const p = parsePath(e.target.dataset.condComponents); const n = getNodeByPath(p); if(!n) return; n.components = String(e.target.value||'').split(',').map(function(x){return x.trim();}).filter(Boolean); }));
    root.querySelectorAll('[data-cond-del]').forEach(el => el.addEventListener('click', e => { const p = parsePath(e.target.dataset.condDel); if(!p) return; const g = getParentByPath(p); if(!g) return; g.parent.rules.splice(g.idx,1); wizRenderConditions(); }));
  root.querySelectorAll('[data-group-del]').forEach(el => el.addEventListener('click', e => { const path = parsePath(e.target.dataset.groupDel); if(!path) return; const g = getParentByPath(path); if(!g) return; g.parent.rules.splice(g.idx,1); wizRenderConditions(); }));
  root.querySelectorAll('[data-group-logic]').forEach(el => el.addEventListener('change', e => { const path = parsePath(e.target.dataset.groupLogic); const g = getNodeByPath(path); if(g){ g.logic = e.target.value; } }));
  root.querySelectorAll('[data-group-add-cond]').forEach(el => el.addEventListener('click', e => { const path = parsePath(e.target.dataset.groupAddCond); const g = getNodeByPath(path); if(g && g.rules) g.rules.push({ field:'line.category', op:'eq', value:'مختبر' }); wizRenderConditions(); }));
  root.querySelectorAll('[data-group-add-group]').forEach(el => el.addEventListener('click', e => { const path = parsePath(e.target.dataset.groupAddGroup); const g = getNodeByPath(path); if(g && g.rules) g.rules.push({ logic:'OR', rules:[{ field:'line.billedUnit', op:'gt', value:500 }] }); wizRenderConditions(); }));
  if(typeof bindReorderButtons === 'function') bindReorderButtons();
}
