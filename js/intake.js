let intakeMonthFilter = 'all', intakeStatusFilter = 'all', intakeSearch = '', editingBatchId = null;
let workingBatchClaim = null;
function renderProviderOptions(filter){
  const sel = $('#btProvider'); if(!sel) return;
  const q = (filter||'').trim().toLowerCase();
  const list = q ? providers.filter(p => (p.name||'').toLowerCase().includes(q) || (p.city||'').toLowerCase().includes(q)) : providers;
  sel.innerHTML = list.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.city?' — '+escapeHtml(p.city):''}</option>`).join('');
  if(!list.length) sel.innerHTML = '<option value="">لا نتائج</option>';
}
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
  $('#btProviderSearch').addEventListener('input', e => renderProviderOptions(e.target.value));
  $('#btAddProviderBtn').addEventListener('click', () => {
    const name = (prompt('اسم الجهة')||'').trim(); if(!name) return;
    const id = 'PRV-'+String(providers.length+1).padStart(3,'0');
    providers.push({ id, name, type:'', city:'', contact:'', phone:'', email:'', notes:'' });
    persistData(true); renderProviderOptions(name); $('#btProvider').value = id;
  });
}
function renderIntake(){
  const total = batches.length;
  const tc = batches.reduce((s,b)=>s+b.claimsCount,0);
  const tv = batches.reduce((s,b)=>s+b.totalBilled,0);
  const rc = batches.filter(b=>b.status==='received' || b.status==='new').length;
  const uc = batches.filter(b=>b.status==='under-review').length;
  const cc = batches.filter(b=>b.status==='completed').length;
  $('#intakeKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الدفعات</div><div class="kpi-val">${total} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('inbox')}</div></div><div class="kpi-foot">${rc} وارد · ${uc} قيد · ${cc} مكتمل</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">المطالبات</div><div class="kpi-val">${fmt(tc)} <small>مطالبة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${total} دفعة</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">القيمة</div><div class="kpi-val">${fmt(tv)} <small>ر.س</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">مجموع</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">بحاجة إجراء</div><div class="kpi-val">${rc+uc} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">لم تكتمل</div></div>`;
  const months = [...new Set(batches.map(b=>b.month))].sort().reverse();
  const mHtml = ['<button class="month-chip '+(intakeMonthFilter==='all'?'active':'')+'" data-month="all">الكل <span class="mc-count">'+total+'</span></button>']
    .concat(months.map(m => { const cnt = batches.filter(b=>b.month===m).length; return `<button class="month-chip ${intakeMonthFilter===m?'active':''}" data-month="${m}">${formatMonth(String(m).split(',')[0])} <span class="mc-count">${cnt}</span></button>`; }));
  $('#monthChips').innerHTML = mHtml.join('');
  const list = batches.filter(b => {
    if(intakeMonthFilter !== 'all' && String(b.month) !== intakeMonthFilter && !(String(b.month).split(',').includes(intakeMonthFilter))) return false;
    if(intakeStatusFilter !== 'all' && b.status !== intakeStatusFilter) return false;
    if(intakeSearch){ const p = getProviderById(b.providerId); const q = intakeSearch; return b.id.toLowerCase().includes(q) || (p && p.name.toLowerCase().includes(q)); }
    return true;
  }).sort((a,b) => (b.receivedDate||'').localeCompare(a.receivedDate||''));
  const body = $('#batchesBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">لا دفعات</td></tr>'; return; }
  body.innerHTML = list.map(b => {
    const p = getProviderById(b.providerId);
    const pName = p ? p.name : '—';
    const bs = BATCH_STATUS[b.status] || BATCH_STATUS.received;
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(b.id)}</span></td>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar alt">${pName.charAt(0)}</div><div><div class="prov-name">${escapeHtml(pName)}</div><div class="prov-city">${escapeHtml(p?p.city:'' )}</div></div></div></td>
      <td data-label="الشهر"><span class="mono">${escapeHtml(String(b.month))}</span></td>
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
  renderProviderOptions('');
  $('#btProviderSearch').value = '';
  workingBatchClaim = null;
  if(isEdit){
    $('#btProvider').value = b.providerId;
    $('#btPeriodType').value = b.periodType || 'single';
    $('#btMonth').value = b.month;
    $('#btReceivedDate').value = b.receivedDate;
    $('#btStatus').value = b.status;
    $('#btNumber').value = b.id;
    $('#btNotes').value = b.notes||'';
    $('#btPatient').value = b.patient||'';
    $('#btClaimDate').value = b.claimDate||'';
    $('#btClaimReceivedDate').value = b.claimReceivedDate||'';
    $('#btBilled').value = b.totalBilled||0;
    $('#deleteBatch').style.display = 'block';
  } else {
    const today = daysFromNow(0);
    $('#btPeriodType').value = 'single';
    $('#btMonth').value = today.slice(0,7);
    $('#btReceivedDate').value = today;
    $('#btStatus').value = 'new';
    $('#btNumber').value = nextReceivedNumber();
    $('#btNotes').value = '';
    $('#btPatient').value = '';
    $('#btClaimDate').value = today;
    $('#btClaimReceivedDate').value = today;
    $('#btBilled').value = '';
    $('#deleteBatch').style.display = 'none';
  }
  $('#btMonth').onchange = () => { if(!isEdit) $('#btNumber').value = nextReceivedNumber(); };
  $('#batchModal').classList.add('open'); document.body.style.overflow = 'hidden';
  setTimeout(() => $('#btPatient').focus(), 200);
}
function closeBatchModal(){ if(!$('#batchModal').classList.contains('open')) return; $('#batchModal').classList.remove('open'); _unlockBodyScroll(); editingBatchId = null; workingBatchClaim = null; }
function saveBatch(another){
  const providerId = $('#btProvider').value;
  const periodType = $('#btPeriodType').value;
  const month = $('#btMonth').value.trim();
  const receivedDate = $('#btReceivedDate').value;
  const status = $('#btStatus').value;
  const patient = $('#btPatient').value.trim();
  const claimDate = $('#btClaimDate').value;
  const claimReceivedDate = $('#btClaimReceivedDate').value;
  const billed = Number($('#btBilled').value);
  const notes = $('#btNotes').value.trim();
  if(!providerId){ showWarning('تنبيه','اختر الجهة'); return; }
  if(!month){ showWarning('تنبيه','أدخل الشهر'); return; }
  if(!receivedDate){ showWarning('تنبيه','أدخل تاريخ الاستلام'); return; }
  if(!patient){ showWarning('تنبيه','أدخل اسم المريض'); return; }
  if(!claimDate){ showWarning('تنبيه','أدخل تاريخ المطالبة'); return; }
  if(!billed || billed <= 0){ showWarning('تنبيه','أدخل القيمة الإجمالية'); return; }
  const p = getProviderById(providerId);
  const batchId = editingBatchId || ('BTH-'+month.split(',')[0]+'-'+$('#btNumber').value);
  if(editingBatchId){
    const b = getBatchById(editingBatchId);
    if(b){ b.providerId = providerId; b.month = month; b.periodType = periodType; b.receivedDate = receivedDate; b.status = status; b.notes = notes; b.patient = patient; b.claimDate = claimDate; b.claimReceivedDate = claimReceivedDate; b.totalBilled = billed; b.claimsCount = 1; }
  } else {
    batches.push({ id: batchId, providerId, month, periodType, receivedDate, status, notes, patient, claimDate, claimReceivedDate, claimsCount:1, totalBilled:billed });
    // create a claim with status 'new' and total billed
    const claimId = generateClaimId();
    claims.push({ id: claimId, patient, provider: p?p.name:'', type:'employee', date: claimDate, receivedDate: claimReceivedDate||receivedDate, receivedNumber: $('#btNumber').value, status: status==='new'?'new':status, reason:'', notes, priorApproval:{required:false,status:'not-requested',refNumber:'',date:''}, batchId, invoices: [] , billed });
    // set billed on claim
    const c = claims[claims.length-1]; c.billed = billed; c.approved = 0; c.eligible = billed;
  }
  persistData(true); renderIntake(); updateBackupStats();
  if(another){ openBatchModal(null); }
  else { closeBatchModal(); showSuccess('تم','تم الحفظ'); }
}
function deleteBatchWithDialog(id){
  const b = getBatchById(id); if(!b) return;
  showDelete('حذف الدفعة', `سيتم حذف ${escapeHtml(b.id)}.`, () => {
    batches = batches.filter(x => x.id !== id);
    claims = claims.filter(c => c.batchId !== id);
    persistData(true); renderIntake(); updateBackupStats(); showSuccess('تم','تم');
  });
}