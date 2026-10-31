let drFilter = 'all', drSearch = '', editingDrId = null;
let editingPaProcCode = null;
function bindDeductionRulesControls(){
  $$('.dr-tab').forEach(t => t.addEventListener('click', () => {
    $$('.dr-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $$('.dr-panel').forEach(p => p.classList.toggle('active', p.dataset.drPanel === t.dataset.drTab));
  }));
  $('#drSearch').addEventListener('input', e => { drSearch = e.target.value.trim().toLowerCase(); renderDeductionRules(); });
  $('#drFilterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#drFilterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); drFilter = chip.dataset.drf; renderDeductionRules();
  });
  $('#addDrBtn').addEventListener('click', () => openDrWizard());
  $('#drBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-dr]'); if(ed) openDrModal(ed.dataset.editDr);
    const del = e.target.closest('[data-del-dr]'); if(del) deleteDr(del.dataset.delDr);
    const ts = e.target.closest('[data-test-dr]'); if(ts) testDeductionRule(ts.dataset.testDr);
    const sm = e.target.closest('[data-sim-dr]'); if(sm) simulateRule(sm.dataset.simDr);
  });
  $$('[data-close-dr]').forEach(el => el.addEventListener('click', closeDrModal));
  $('#saveDrBtn').addEventListener('click', saveDr);
  $('#deleteDrBtn').addEventListener('click', () => { if(editingDrId) deleteDr(editingDrId); });
  $('#addPaProcBtn').addEventListener('click', () => openPaProcModal());
  $('#paProcBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-paproc]'); if(ed) openPaProcModal(ed.dataset.editPaproc);
    const del = e.target.closest('[data-del-paproc]'); if(del){ paProcedures = paProcedures.filter(x => x.code !== del.dataset.delPaproc); renderPaProcedures(); showSuccess('تم','تم'); }
  });
  $$('[data-close-paproc]').forEach(el => el.addEventListener('click', () => $('#paProcModal').classList.remove('open')));
  $('#savePaProcBtn').addEventListener('click', savePaProc);
  bindDrWizard();
}
function drStatus(r){
  const today = daysFromNow(0);
  if(!r.active) return { label:'معطّلة', cls:'inactive' };
  if(r.effectiveFrom && today < r.effectiveFrom) return { label:'لم تبدأ', cls:'upcoming' };
  if(r.effectiveTo && today > r.effectiveTo) return { label:'منتهية', cls:'expired' };
  return { label:'نشطة', cls:'active' };
}
function renderDeductionRules(){
  const activeN = deductionRules.filter(r => drStatus(r).cls === 'active').length;
  const capN = deductionRules.filter(r => r.type === 'coverage_cap').length;
  const copayN = deductionRules.filter(r => r.type === 'retiree_copay').length;
  $('#drKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">القواعد</div><div class="kpi-val">${deductionRules.length} <small>قاعدة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">${activeN} نشطة</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">سقف</div><div class="kpi-val">${capN} <small>قاعدة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">للعاملين</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">تحمل</div><div class="kpi-val">${copayN} <small>قاعدة</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">للمعاشات</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">إجراءات</div><div class="kpi-val">${paProcedures.length} <small>إجراء</small></div></div><div class="kpi-ico">${kpiIcon('contract')}</div></div><div class="kpi-foot">الموافقة</div></div>`;
  const list = deductionRules.filter(r => {
    if(drFilter === 'active' && drStatus(r).cls !== 'active') return false;
    if(drFilter === 'expired' && drStatus(r).cls !== 'expired') return false;
    if((drFilter === 'coverage_cap' || drFilter === 'retiree_copay') && r.type !== drFilter) return false;
    if(drSearch){ const q = drSearch; return r.name.toLowerCase().includes(q) || r.type.includes(q); }
    return true;
  });
  const body = $('#drBody');
  if(!list.length) body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:26px;color:var(--muted)">لا قواعد</td></tr>';
  else body.innerHTML = list.map(r => {
    const st = drStatus(r);
    const tl = r.type === 'coverage_cap' ? 'سقف' : r.type === 'retiree_copay' ? 'تحمل' : r.isComposite ? 'سوبر' : 'مخصص';
    const tc = r.type === 'coverage_cap' ? 'cap' : 'copay';
    const tags = [];
    if(r.scope?.providerIds?.length) tags.push(`<span class="dr-scope-tag">${r.scope.providerIds.length} جهة</span>`);
    (r.scope?.claimTypes||[]).forEach(ct => tags.push(`<span class="dr-scope-tag ${ct==='retiree'?'warn':''}">${ct==='employee'?'عاملين':'معاشات'}</span>`));
    if(!r.scope?.providerIds?.length) tags.unshift('<span class="dr-scope-tag bad">كل</span>');
    return `<tr>
      <td data-label="الرقم"><span class="clm-id">${escapeHtml(r.id)}</span></td>
      <td data-label="الاسم"><div style="font-weight:700;font-size:12.5px">${escapeHtml(r.name)}</div>${r.notes?`<div style="font-size:10.5px;color:var(--muted);margin-top:2px">${escapeHtml(r.notes)}</div>`:''}</td>
      <td data-label="النوع"><span class="dr-type-badge ${tc}">${tl}</span></td>
      <td data-label="النسبة"><span class="dr-rate-badge">${r.rate}%</span></td>
      <td data-label="النطاق"><div class="dr-scope-tags">${tags.join('')}</div></td>
      <td data-label="السريان" style="font-size:11px;line-height:1.6"><div>${escapeHtml(r.effectiveFrom||'—')}</div><div style="color:var(--muted)">${escapeHtml(r.effectiveTo||'—')}</div></td>
      <td data-label="الحالة"><span class="dr-status-pill ${st.cls}">${st.label}</span></td>
      <td class="act"><div style="display:flex;gap:3px"><button class="btn-xs" data-test-dr="${escapeHtml(r.id)}">اختبار</button><button class="btn-xs" data-sim-dr="${escapeHtml(r.id)}">محاكاة</button><button class="btn-xs" data-edit-dr="${escapeHtml(r.id)}">تحرير</button><button class="btn-xs danger" data-del-dr="${escapeHtml(r.id)}">×</button></div></td>
    </tr>`;
  }).join('');
  renderPaProcedures();
}
