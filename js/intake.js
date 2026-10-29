let intakeMonthFilter = 'all', intakeStatusFilter = 'all', intakeSearch = '', editingBatchId = null;
let workingBatchClaims = [];
function bindIntakeControls(){
  $('#intakeSearch').addEventListener('input', e => { intakeSearch = e.target.value.trim().toLowerCase(); renderIntake(); });
  $('#intakeStatusChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#intakeStatusChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); intakeStatusFilter = chip.dataset.istatus; renderIntake();
  });
  $('#monthChips').addEventListener('click', e => {
    const chip = e.target.closest('.month-chip'); if(!chip) return;
    $$('#monthChips .month-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); intakeMonthFilter = chip.dataset.month; renderIntake();
  });
  $('#addBatchBtn').addEventListener('click', () => openBatchModal());
  $('#batchesBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-batch]'); if(ed){ openBatchModal(ed.dataset.editBatch); return; }
    const del = e.target.closest('[data-delete-batch]'); if(del){ deleteBatchWithDialog(del.dataset.deleteBatch); return; }
  });
  $$('[data-close-batch]').forEach(el => el.addEventListener('click', closeBatchModal));
  $('#saveBatch').addEventListener('click', () => saveBatch(false));
  $('#saveBatchAnother').addEventListener('click', () => saveBatch(true));
  $('#deleteBatch').addEventListener('click', () => { if(editingBatchId) deleteBatchWithDialog(editingBatchId); });
  $('#qaAddBtn').addEventListener('click', quickAddClaim);
  ['#qaRecNum','#qaPatient','#qaDate','#qaRecDate','#qaBilled'].forEach(sel => { $(sel).addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); quickAddClaim(); } }); });
  $('#btReceivedDate').addEventListener('change', () => { if(!editingBatchId) $('#qaRecDate').value = $('#btReceivedDate').value; });
  $('#btClaimsList').addEventListener('input', handleBatchClaimInput);
  $('#btClaimsList').addEventListener('click', handleBatchClaimAction);
}
function renderIntake(){
  const total = batches.length;
  const tc = batches.reduce((s,b)=>s+b.claimsCount,0);
  const tv = batches.reduce((s,b)=>s+b.totalBilled,0);
  const rc = batches.filter(b=>b.status==='received').length;
  const uc = batches.filter(b=>b.status==='under-review').length;
  const cc = batches.filter(b=>b.status==='completed').length;
  $('#intakeKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الدفعات</div><div class="kpi-val">${total} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('inbox')}</div></div><div class="kpi-foot">${rc} وارد · ${uc} قيد · ${cc} مكتمل</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">المطالبات</div><div class="kpi-val">${fmt(tc)} <small>مطالبة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${total} دفعة</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">القيمة</div><div class="kpi-val">${fmt(tv)} <small>ر.س</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">مجموع</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">بحاجة إجراء</div><div class="kpi-val">${rc+uc} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">لم تكتمل</div></div>`;
  const months = [...new Set(batches.map(b=>b.month))].sort().reverse();
  const mHtml = ['<button class="month-chip '+(intakeMonthFilter==='all'?'active':'')+'" data-month="all">الكل <span class="mc-count">'+total+'</span></button>']
    .concat(months.map(m => { const cnt = batches.filter(b=>b.month===m).length; return `<button class="month-chip ${intakeMonthFilter===m?'active':''}" data-month="${m}">${formatMonth(m)} <span class="mc-count">${cnt}</span></button>`; }));
  $('#monthChips').innerHTML = mHtml.join('');
  const list = batches.filter(b => {
    if(intakeMonthFilter !== 'all' && b.month !== intakeMonthFilter) return false;
    if(intakeStatusFilter !== 'all' && b.status !== intakeStatusFilter) return false;
    if(intakeSearch){ const p = getProviderById(b.providerId); const q = intakeSearch; return b.id.toLowerCase().includes(q) || (p && p.name.toLowerCase().includes(q)); }
    return true;
  }).sort((a,b) => b.receivedDate.localeCompare(a.receivedDate));
  const body = $('#batchesBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">لا دفعات</td></tr>'; return; }
  body.innerHTML = list.map(b => {
    const p = getProviderById(b.providerId);
    const pName = p ? p.name : '—';
    const bs = BATCH_STATUS[b.status] || BATCH_STATUS.received;
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(b.id)}</span></td>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar alt">${pName.charAt(0)}</div><div><div class="prov-name">${escapeHtml(pName)}</div><div class="prov-city">${escapeHtml(p?p.city:'' )}</div></div></div></td>
      <td data-label="الشهر"><span class="mono">${formatMonth(b.month)}</span></td>
      <td data-label="الاستلام" class="hide-sm mono">${formatDate(b.receivedDate)}</td>
      <td data-label="المطالبات" class="mono">${fmt(b.claimsCount)}</td>
      <td data-label="القيمة" class="mono big">${fmt(b.totalBilled)}</td>
      <td data-label="الحالة"><span class="badge ${bs.cls}">${bs.label}</span></td>
      <td class="act"><div style="display:flex;gap:3px;flex-wrap:wrap"><button class="btn-xs" data-edit-batch="${b.id}">تعديل</button><button class="btn-xs danger" data-delete-batch="${b.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function openBatchModal(id){
  editingBatchId = id || null; const isEdit = !!id;
  const b = isEdit ? getBatchById(id) : null; if(isEdit && !b) return;
  $('#btModalTitle').textContent = isEdit ? 'تعديل الدفعة' : 'استلام دفعة';
  $('#btModalSub').textContent = isEdit ? b.id : 'بيانات جديدة';
  $('#btProvider').innerHTML = providers.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  workingBatchClaims = [];
  if(isEdit){
    $('#btProvider').value = b.providerId; $('#btMonth').value = b.month; $('#btReceivedDate').value = b.receivedDate;
    $('#btStatus').value = b.status; $('#btNumber').value = b.id; $('#btNotes').value = b.notes||'';
    $('#deleteBatch').style.display = 'block';
    workingBatchClaims = claims.filter(c => c.batchId === id).map(c => ({ receivedNumber:c.receivedNumber||'', patient:c.patient||'', date:c.date||'', receivedDate:c.receivedDate||'', billed:c.billed||0 }));
  } else {
    const today = daysFromNow(0);
    $('#btMonth').value = today.slice(0,7); $('#btReceivedDate').value = today;
    $('#btStatus').value = 'received'; $('#btNumber').value = nextBatchNumber(today.slice(0,7));
    $('#btNotes').value = ''; $('#deleteBatch').style.display = 'none';
  }
  $('#btMonth').onchange = () => { if(!isEdit) $('#btNumber').value = nextBatchNumber($('#btMonth').value); };
  renderBatchClaims(); resetQuickAddForm();
  $('#batchModal').classList.add('open'); document.body.style.overflow = 'hidden';
  setTimeout(() => $('#qaPatient').focus(), 200);
}
function closeBatchModal(){ if(!$('#batchModal').classList.contains('open')) return; $('#batchModal').classList.remove('open'); _unlockBodyScroll(); editingBatchId = null; workingBatchClaims = []; }
function resetQuickAddForm(){
  $('#qaRecNum').value = nextReceivedNumber();
  $('#qaPatient').value = ''; $('#qaBilled').value = '';
  $('#qaDate').value = daysFromNow(0);
  $('#qaRecDate').value = $('#btReceivedDate').value || daysFromNow(0);
}
function quickAddClaim(){
  const rn = $('#qaRecNum').value.trim(), p = $('#qaPatient').value.trim();
  const d = $('#qaDate').value, rd = $('#qaRecDate').value;
  const b = Number($('#qaBilled').value);
  if(!rn){ showWarning('تنبيه','أدخل الوارد'); $('#qaRecNum').focus(); return; }
  if(!p){ showWarning('تنبيه','أدخل المريض'); $('#qaPatient').focus(); return; }
  if(!d){ showWarning('تنبيه','أدخل التاريخ'); $('#qaDate').focus(); return; }
  if(!rd){ showWarning('تنبيه','أدخل تاريخ الوارد'); $('#qaRecDate').focus(); return; }
  if(!b || b <= 0){ showWarning('تنبيه','أدخل المبلغ'); $('#qaBilled').focus(); return; }
  if(workingBatchClaims.some(c => c.receivedNumber === rn)){ showWarning('تنبيه','رقم وارد مكرر'); $('#qaRecNum').focus(); return; }
  workingBatchClaims.push({ receivedNumber:rn, patient:p, date:d, receivedDate:rd, billed:b });
  resetQuickAddForm(); renderBatchClaims(); $('#qaPatient').focus();
}
function renderBatchClaims(){
  const list = $('#btClaimsList');
  if(!workingBatchClaims.length) list.innerHTML = '<div class="batch-claims-empty">لا مطالبات بعد</div>';
  else list.innerHTML = workingBatchClaims.map((c,i) => `<div class="batch-claim-row" data-idx="${i}"><input class="bc-rec-num" value="${escapeHtml(c.receivedNumber||'')}" placeholder="IN-XXXX"><input class="bc-patient" value="${escapeHtml(c.patient||'')}" placeholder="المريض"><input type="date" class="bc-date" value="${escapeHtml(c.date||'')}"><input type="date" class="bc-rec-date" value="${escapeHtml(c.receivedDate||'')}"><input type="number" class="bc-billed" value="${escapeHtml(c.billed||'')}" placeholder="المبلغ" min="0"><button class="del-claim" data-del-claim="${i}">×</button></div>`).join('');
  const total = workingBatchClaims.reduce((s,c)=>s+(Number(c.billed)||0), 0);
  $('#btSummaryCount').textContent = workingBatchClaims.length;
  $('#btSummaryTotal').textContent = fmt(total)+' ر.س';
}
function handleBatchClaimInput(e){
  const row = e.target.closest('.batch-claim-row'); if(!row) return;
  const idx = parseInt(row.dataset.idx, 10); const c = workingBatchClaims[idx]; if(!c) return;
  if(e.target.classList.contains('bc-rec-num')) c.receivedNumber = e.target.value;
  else if(e.target.classList.contains('bc-patient')) c.patient = e.target.value;
  else if(e.target.classList.contains('bc-date')) c.date = e.target.value;
  else if(e.target.classList.contains('bc-rec-date')) c.receivedDate = e.target.value;
  else if(e.target.classList.contains('bc-billed')){ c.billed = Number(e.target.value)||0; const total = workingBatchClaims.reduce((s,x)=>s+(Number(x.billed)||0),0); $('#btSummaryTotal').textContent = fmt(total)+' ر.س'; }
}
function handleBatchClaimAction(e){ const btn = e.target.closest('[data-del-claim]'); if(!btn) return; workingBatchClaims.splice(parseInt(btn.dataset.delClaim, 10),1); renderBatchClaims(); }
