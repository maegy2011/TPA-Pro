// inbox.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let intakeMonthFilter = 'all', intakeStatusFilter = 'all', intakeSearch = '', editingBatchId = null;
let workingBatchClaim = null;
/* ترشيح الوارد — منطق خالص (يُختبر آليًا). يشمل دعم الفترات المركبة (a,b). */
function filterBatchesList(list, monthFilter, statusFilter, term, providersList, claimsList){
  const q = String(term || '').trim().toLowerCase();
  const byId = {};
  (providersList || []).forEach(p => { byId[p.id] = p; });
  return (list || []).filter(b => {
    if(monthFilter && monthFilter !== 'all' && String(b.month) !== monthFilter && !(String(b.month).split(',').includes(monthFilter))) return false;
    if(statusFilter === 'archived'){
      if(typeof isBatchArchived === 'function' ? !isBatchArchived(b, claimsList) : b.archived !== true) return false;
    }
    else if(statusFilter && statusFilter !== 'all' && b.status !== statusFilter) return false;
    if(q){ const p = byId[b.providerId]; const hay = String(b.receivedNumber || '') + ' ' + String(b.id || ''); return hay.toLowerCase().includes(q) || (p && String(p.name||'').toLowerCase().includes(q)); }
    return true;
  });
}
let intakeArchiveTab = 'active';
/* الدفعة مؤرشفة إذا أُرشفت صراحة أو أُرشفت كل مطالباتها — منطق خالص (يُختبر آليًا). */
function isBatchArchived(batch, claimsList){
  if(!batch) return false;
  if(batch.archived === true) return true;
  const linked = (claimsList || []).filter(c => c.batchId && c.batchId === batch.id);
  if(!linked.length) return false;
  return linked.every(c => c.archived === true || c.archiveStatus === 'read-only');
}
/* تقسيم الدفعات نشطة/مؤرشفة — منطق خالص (يُختبر آليًا). */
function splitBatchesByArchive(list, claimsList){
  const active = [], archived = [];
  (list || []).forEach(b => { ((typeof isBatchArchived === 'function' ? isBatchArchived(b, claimsList) : !!b.archived) ? archived : active).push(b); });
  return { active, archived };
}
/* فرز الوارد بالأحدث استلامًا — منطق خالص (يُختبر آليًا). */
function sortBatchesByReceived(list){
  return (list || []).slice().sort((a,b) => String(b.receivedDate||'').localeCompare(String(a.receivedDate||'')));
}
/* فحص مدخلات الدفعة — منطق خالص (يُختبر آليًا). */
function validateBatchInput(d){
  d = d || {};
  if(!d.providerId) return { ok:false, msg:'اختر الجهة' };
  const cl = d.contractsList || [];
  if(!cl.some(c => c.providerId === d.providerId)) return { ok:false, msg:'لا يوجد تعاقد مع هذه الجهة — لا يمكن استلام مطالبة (حالة العقد لا تمنع الاستلام)' };
  if(!String(d.month || '').trim()) return { ok:false, msg:'أدخل فترة المطالبة' };
  if(!Number(d.billed) || Number(d.billed) <= 0) return { ok:false, msg:'أدخل القيمة الإجمالية' };
  return { ok:true, msg:'' };
}
function renderProviderOptions(filter){
  const sel = $('#btProvider'); if(!sel) return;
  const contracted = providers.filter(p => (typeof contracts !== 'undefined' ? contracts : []).some(c => c.providerId === p.id));
  const q = (filter||'').trim().toLowerCase();
  const list = q ? contracted.filter(p => (p.name||'').toLowerCase().includes(q) || (p.city||'').toLowerCase().includes(q)) : contracted;
  sel.innerHTML = list.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.city?' — '+escapeHtml(p.city):''}</option>`).join('');
  if(!list.length) sel.innerHTML = '<option value="">لا نتائج</option>';
}
function bindIntakeControls(){
  $('#intakeSearch').addEventListener('input', e => { intakeSearch = e.target.value.trim().toLowerCase(); renderIntake(); });
  const _archTabs = $('#intakeArchiveTabs');
  if(_archTabs && !_archTabs.dataset.bound){ _archTabs.dataset.bound = '1'; _archTabs.addEventListener('click', e => { const t = e.target.closest('[data-archtab]'); if(!t) return; intakeArchiveTab = t.dataset.archtab; renderIntake(); }); }
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
}
function renderIntake(){
  const _claims0 = (typeof claims !== 'undefined' ? claims : []) || [];
  const _split0 = (typeof splitBatchesByArchive === 'function') ? splitBatchesByArchive(batches, _claims0) : { active: batches, archived: [] };
  const _tab0 = (typeof intakeArchiveTab !== 'undefined' ? intakeArchiveTab : 'active');
  const _view = _tab0 === 'archived' ? _split0.archived : _split0.active;
  const total = _view.length;
  const tc = _view.reduce((s,b)=>s+(b.claimsCount||0),0);
  const tv = _view.reduce((s,b)=>s+(b.totalBilled||0),0);
  const nc = _view.filter(b=>b.status==='new').length;
  const ic = _view.filter(b=>b.status==='istifa').length;
  $('#intakeKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الدفعات</div><div class="kpi-val">${total} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('inbox')}</div></div><div class="kpi-foot">${nc} جديدة · ${ic} استيفا</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">المطالبات</div><div class="kpi-val">${fmt(tc)} <small>مطالبة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${total} دفعة</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">القيمة</div><div class="kpi-val">${fmt(tv)} <small>ج.م</small></div></div><div class="kpi-ico">${kpiIcon('money')}</div></div><div class="kpi-foot">مجموع الوارد</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">استيفا</div><div class="kpi-val">${ic} <small>دفعة</small></div></div><div class="kpi-ico">${kpiIcon('shield')}</div></div><div class="kpi-foot">بانتظار الاستكمال</div></div>`;
  const months = [...new Set(_view.map(b=>b.month))].sort().reverse();
  const mHtml = ['<button class="month-chip '+(intakeMonthFilter==='all'?'active':'')+'" data-month="all">الكل <span class="mc-count">'+total+'</span></button>']
    .concat(months.map(m => { const cnt = _view.filter(b=>b.month===m).length; return `<button class="month-chip ${intakeMonthFilter===m?'active':''}" data-month="${m}">${formatMonth(String(m).split(',')[0])} <span class="mc-count">${cnt}</span></button>`; }));
  $('#monthChips').innerHTML = mHtml.join('');
  const _claims = _claims0;
  const _split = _split0;
  const _tab = _tab0;
  const _base = _view;
  const list = (typeof sortBatchesByReceived === 'function' && typeof filterBatchesList === 'function')
    ? sortBatchesByReceived(filterBatchesList(_base, intakeMonthFilter, _tab === 'archived' ? 'all' : intakeStatusFilter, intakeSearch, (typeof providers !== 'undefined' ? providers : []), _claims))
    : _base.slice();
  const _archTab = $('#intakeArchiveTabs');
  if(_archTab){ _archTab.innerHTML = `<button class="tf-tab ${_tab === 'active' ? 'active' : ''}" data-archtab="active">النشطة (${_split.active.length})</button><button class="tf-tab ${_tab === 'archived' ? 'active' : ''}" data-archtab="archived">الأرشيف (${_split.archived.length})</button>`; }
  const body = $('#batchesBody');
  if(!list.length){ body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--muted)">لا دفعات</td></tr>'; return; }
  body.innerHTML = list.map(b => {
    const p = getProviderById(b.providerId);
    const pName = p ? p.name : '—';
    const bs = BATCH_STATUS[b.status] || BATCH_STATUS.new;
    return `<tr>
      <td data-label="رقم"><span class="clm-id">${escapeHtml(b.receivedNumber||b.id)}</span></td>
      <td data-label="الجهة"><div class="prov-cell"><div class="prov-avatar alt">${pName.charAt(0)}</div><div><div class="prov-name">${escapeHtml(pName)}</div><div class="prov-city">${escapeHtml(p?p.city:'' )}</div></div></div></td>
      <td data-label="فترة المطالبة"><span class="mono">${escapeHtml(String(b.month))}</span></td>
      <td data-label="الاستلام" class="hide-sm mono">${formatDate(b.receivedDate)}</td>
      <td data-label="المطالبات" class="mono">${fmt(b.claimsCount)}</td>
      <td data-label="القيمة" class="mono big">${fmt(b.totalBilled||0)}</td>
      <td data-label="الحالة"><span class="badge ${bs.cls}">${bs.label}</span></td>
      <td class="act"><div style="display:flex;gap:5px;flex-wrap:nowrap;align-items:center"><button class="btn-xs" data-edit-batch="${b.id}">تعديل</button><button class="btn-xs danger" data-delete-batch="${b.id}">×</button></div></td>
    </tr>`;
  }).join('');
}
function openBatchModal(id){
  editingBatchId = id || null; const isEdit = !!id;
  const b = isEdit ? getBatchById(id) : null; if(isEdit && !b) return;
  $('#btModalTitle').textContent = isEdit ? 'تعديل الدفعة' : 'تسجيل وارد';
  $('#btModalSub').textContent = isEdit ? (b.receivedNumber||b.id) : 'بيانات جديدة';
  renderProviderOptions('');
  $('#btProviderSearch').value = '';
  workingBatchClaim = null;
  if(isEdit){
    $('#btProvider').value = b.providerId;
    $('#btPeriodType').value = b.periodType || 'single';
    $('#btMonth').value = b.month;
    $('#btStatus').value = b.status;
    $('#btNumber').value = b.receivedNumber||'';
    $('#btNotes').value = b.notes||'';
    $('#btClaimReceivedDate').value = b.claimReceivedDate||'';
    $('#btBilled').value = b.totalBilled||0;
    (el => { if (el) el.style.display = 'block'; })($('#deleteBatch'));
  } else {
    const today = daysFromNow(0);
    $('#btPeriodType').value = 'single';
    $('#btMonth').value = today.slice(0,7);
    $('#btStatus').value = 'new';
    $('#btNumber').value = nextReceivedNumber();
    $('#btNotes').value = '';
    $('#btClaimReceivedDate').value = today;
    $('#btBilled').value = '';
    (el => { if (el) el.style.display = 'none'; })($('#deleteBatch'));
  }
  $('#btMonth').onchange = () => { if(!isEdit) $('#btNumber').value = nextReceivedNumber(); };
  $('#batchModal').classList.add('open'); document.body.style.overflow = 'hidden';
  setTimeout(() => $('#btMonth')?.focus(), 200);}
function closeBatchModal(){ if(!$('#batchModal').classList.contains('open')) return; $('#batchModal').classList.remove('open'); _unlockBodyScroll(); editingBatchId = null; workingBatchClaim = null; }
function saveBatch(another){
  const providerId = $('#btProvider').value;
  const periodType = $('#btPeriodType').value;
  const month = $('#btMonth').value.trim();
  const claimReceivedDate = $('#btClaimReceivedDate').value || daysFromNow(0);
  const receivedDate = claimReceivedDate;
  const status = $('#btStatus').value;
  const claimDate = receivedDate;
  const billed = Number($('#btBilled').value);
  const notes = $('#btNotes').value.trim();
  const vchk = (typeof validateBatchInput === 'function') ? validateBatchInput({ providerId, month, billed, contractsList:(typeof contracts !== 'undefined' ? contracts : []) }) : { ok:true };
  if(!vchk.ok){ showWarning('تنبيه', vchk.msg); return; }
  const p = getProviderById(providerId);
  const receivedNumber = $('#btNumber').value;
  const batchId = editingBatchId || ('BTH-'+month.split(',')[0]+'-'+receivedNumber);
  if(editingBatchId){
    const b = getBatchById(editingBatchId);
    if(b){ b.providerId = providerId; b.month = month; b.periodType = periodType; b.receivedDate = receivedDate; b.status = status; b.notes = notes; b.claimDate = claimDate; b.claimReceivedDate = claimReceivedDate; b.claimsCount = 1; }
  } else {
    batches.push({ id: batchId, receivedNumber, providerId, providerCode:(p&&p.code!=null?p.code:null), month, periodType, receivedDate, status, notes, patient: '', claimDate, claimReceivedDate, claimsCount:1, totalBilled:billed });
    // create a claim with the intake total — amounts recomputed during review from lines
    const claimId = generateClaimId();
    claims.push({ id: claimId, patient: '', provider: p?p.name:'', providerCode:(p&&p.code!=null?p.code:null), type:'employee', date: claimDate, receivedDate: claimReceivedDate||receivedDate, receivedNumber, status: status==='new'?'new':status, reason:'', notes, priorApproval:{required:false,status:'not-requested',refNumber:'',date:''}, batchId, invoices: [] , billed });
    // set billed on claim
    const c = claims[claims.length-1]; c.billed = billed; c.approved = 0; c.eligible = billed;
  }
  persistData(true); renderIntake(); updateBackupStats();
  if(another){ openBatchModal(null); }
  else { closeBatchModal(); showSuccess('تم','تم الحفظ'); }
}
function deleteBatchWithDialog(id){
  const b = getBatchById(id); if(!b) return;
  showDelete('حذف الدفعة', `سيتم حذف وارد ${escapeHtml(b.receivedNumber||b.id)}.`, () => {
    batches = batches.filter(x => x.id !== id);
    claims = claims.filter(c => c.batchId !== id);
    persistData(true); renderIntake(); updateBackupStats(); showSuccess('تم','تم');
  });
}