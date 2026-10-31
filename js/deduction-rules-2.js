function renderPaProcedures(){
  const body = $('#paProcBody'); if(!body) return;
  if(!paProcedures.length){ body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:22px;color:var(--muted)">لا إجراءات</td></tr>'; return; }
  body.innerHTML = paProcedures.map(p => `<tr><td><span class="mono" style="color:var(--navy-400);font-weight:700">${escapeHtml(p.code)}</span></td><td>${escapeHtml(p.name)}</td><td><span class="badge info">${escapeHtml(p.category)}</span></td><td style="font-size:11px;color:var(--muted)">${escapeHtml(p.notes||'—')}</td><td class="act"><div style="display:flex;gap:3px"><button class="btn-xs" data-edit-paproc="${escapeHtml(p.code)}">تحرير</button><button class="btn-xs danger" data-del-paproc="${escapeHtml(p.code)}">×</button></div></td></tr>`).join('');
}
function openDrModal(id){
  editingDrId = id || null;
  const r = id ? deductionRules.find(x => x.id === id) : null;
  $('#drModalTitle').textContent = r ? 'تعديل' : 'إضافة';
  $('#drModalSub').textContent = r ? r.id : '—';
  $('#drName').value = r ? r.name : ''; $('#drType').value = r ? r.type : 'coverage_cap'; $('#drRate').value = r ? r.rate : 20;
  $('#drFrom').value = r ? r.effectiveFrom : daysFromNow(0); $('#drTo').value = r ? (r.effectiveTo||'') : daysFromNow(365);
  $('#drActive').checked = r ? r.active : true; $('#drNotes').value = r ? r.notes||'' : '';
  const ct = r ? (r.scope.claimTypes||[]) : ['employee'];
  $$('.dr-ctype').forEach(cb => cb.checked = ct.includes(cb.value));
  $('#\1')?.style.display = r ? 'block' : 'none';
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
  const data = { name, type, action: type==='coverage_cap'?'apply_cap':'apply_copay', rate, effectiveFrom:from, effectiveTo:to||'', active:$('#drActive').checked, notes:$('#drNotes').value.trim(), scope:{ providerIds:[], contractIds:[], claimTypes:cts } };
  if(editingDrId){ const r = deductionRules.find(x=>x.id===editingDrId); if(r) Object.assign(r, data); showSuccess('تم','تم'); }
  else {
    const y = new Date(from).getFullYear(), pre = 'DR-'+y+'-';
    let m = 0;
    deductionRules.forEach(x => { if(x.id.startsWith(pre)){ const n = parseInt(x.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
    deductionRules.push({ id:pre+String(m+1).padStart(3,'0'), ...data });
    showSuccess('تم','تمت');
  }
  closeDrModal(); renderDeductionRules();
}
function deleteDr(id){
  const r = deductionRules.find(x=>x.id===id); if(!r) return;
  showDelete('حذف', `"${r.name}".`, () => { deductionRules = deductionRules.filter(x=>x.id!==id); closeDrModal(); renderDeductionRules(); showSuccess('تم','تم'); });
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
  const claim = claims[0];
  const inv0 = claim.invoices && claim.invoices[0];
  const pat = inv0 && inv0.patients && inv0.patients[0];
  if(!pat || !pat.lines || !pat.lines.length){ showWarning('تنبيه','لا بنود'); return; }
  const line = pat.lines[0];
  const inv = claim.invoices && claim.invoices[0];
  const ctx = { claim, patient: pat, invoice: inv, line: { ...line, lineBase: line.qty * line.billedUnit } };
  ctx.line.lineBase = line.qty * (line.tariffUnit != null ? Math.min(line.billedUnit, line.tariffUnit) : line.billedUnit);
  const refDate = claim.date || claim.receivedDate || daysFromNow(0);
  const matched = ruleMatchesContext(rule, ctx, refDate);
  const res = evaluateRuleAction(rule, ctx, ctx.line.lineBase);
  const msg = `القاعدة: ${escapeHtml(rule.name)}<br>مطابقة: ${matched ? '✅ نعم' : '❌ لا'}<br>الأساس: ${fmt(ctx.line.lineBase)}<br>النتيجة: ${res.newApproved !== undefined ? fmt(res.newApproved) : fmt(ctx.line.lineBase - (res.deduct||0))}<br>الخصم: ${fmt(res.deduct || (ctx.line.lineBase - (res.newApproved||ctx.line.lineBase)))}`;
  showInfo('اختبار قاعدة', msg);
}

