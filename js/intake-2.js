function saveBatch(openNew){
  const pid = $('#btProvider').value, month = $('#btMonth').value, rd = $('#btReceivedDate').value;
  const notes = $('#btNotes').value.trim(), status = $('#btStatus').value;
  if(!pid || !month || !rd){ showWarning('تنبيه','يرجى ملء الحقول'); return; }
  const recNums = workingBatchClaims.map(c => c.receivedNumber);
  const dup = recNums.find((n,i) => recNums.indexOf(n) !== i);
  if(dup){ showWarning('تنبيه',`وارد مكرر: ${dup}`); return; }
  const prov = getProviderById(pid);
  const pName = prov ? prov.name : '—';
  const total = workingBatchClaims.reduce((s,c)=>s+(Number(c.billed)||0), 0);
  if(editingBatchId){
    const b = getBatchById(editingBatchId); if(!b) return;
    Object.assign(b, { providerId:pid, month, receivedDate:rd, notes, status });
    const existingByRN = new Map();
    claims.filter(c => c.batchId === editingBatchId).forEach(c => { if(c.receivedNumber) existingByRN.set(c.receivedNumber, c); });
    const newClaims = [];
    workingBatchClaims.forEach(wc => {
      const existing = existingByRN.get(wc.receivedNumber);
      if(existing){
        existing.patient = wc.patient;
        existing.date = wc.date;
        existing.receivedDate = wc.receivedDate;
        if(existing.status === 'pending'){
          existing.billed = Number(wc.billed);
          existing.invoices = [mkInvoice(existing.id+'-1','outpatient',wc.date,[mkPatient(existing.id+'-P1',wc.patient,'',[mkLine('GEN-001','بند مطالبة غير مفصل','أخرى',1,Number(wc.billed),Number(wc.billed),0)])])];
          recalcClaim(existing);
        }
        newClaims.push(existing);
        existingByRN.delete(wc.receivedNumber);
      } else {
        const cid = generateClaimId();
        const nc = { id:cid, batchId:editingBatchId, patient:wc.patient, provider:pName, type:'employee', date:wc.date, receivedDate:wc.receivedDate, receivedNumber:wc.receivedNumber, reviewedDate:'', billed:Number(wc.billed), approved:0, status:'pending', reason:'', notes:'', priorApproval:{required:false,status:'not-requested',refNumber:'',date:''}, invoices:[mkInvoice(cid+'-1','outpatient',wc.date,[mkPatient(cid+'-P1',wc.patient,'',[mkLine('GEN-001','بند مطالبة غير مفصل','أخرى',1,Number(wc.billed),Number(wc.billed),0)])])] };
        recalcClaim(nc);
        newClaims.push(nc);
      }
    });
    const removedCount = existingByRN.size;
    existingByRN.forEach(removed => addToTrash('claim','مطالبة', removed.id, removed));
    claims = claims.filter(c => c.batchId !== editingBatchId).concat(newClaims);
    b.claimsCount = newClaims.length;
    b.totalBilled = newClaims.reduce((s,c) => s + (c.billed || 0), 0);
    const reviewedN = newClaims.filter(c => c.status !== 'pending').length;
    if(removedCount > 0) showToast(`تم نقل ${removedCount} مطالبة للسلة`);
    if(reviewedN > 0) showToast(`تم الاحتفاظ بـ ${reviewedN} مراجَعة`);
    showSuccess('تم','تم تحديث الدفعة');
  } else {
    const bid = nextBatchNumber(month);
    batches.push({ id:bid, providerId:pid, month, receivedDate:rd, notes, status, claimsCount:workingBatchClaims.length, totalBilled:total });
    workingBatchClaims.forEach(wc => {
      const cid = generateClaimId();
      const nc = { id:cid, batchId:bid, patient:wc.patient, provider:pName, type:'employee', date:wc.date, receivedDate:wc.receivedDate, receivedNumber:wc.receivedNumber, reviewedDate:'', billed:Number(wc.billed), approved:0, status:'pending', reason:'', notes:'', priorApproval:{required:false,status:'not-requested',refNumber:'',date:''}, invoices:[mkInvoice(cid+'-1','outpatient',wc.date,[mkPatient(cid+'-P1',wc.patient,'',[mkLine('GEN-001','بند مطالبة غير مفصل','أخرى',1,Number(wc.billed),Number(wc.billed),0)])])] };
      recalcClaim(nc);
      claims.push(nc);
    });
    showSuccess('تم', `${workingBatchClaims.length} مطالبة`);
  }
  renderAll();
  if(openNew){
    workingBatchClaims = [];
    $('#btNumber').value = nextBatchNumber(month);
    $('#btNotes').value = ''; $('#deleteBatch').style.display = 'none';
    editingBatchId = null; $('#btModalTitle').textContent = 'استلام دفعة جديدة';
    renderBatchClaims(); resetQuickAddForm(); setTimeout(()=>$('#qaPatient').focus(), 100);
  } else closeBatchModal();
}
function deleteBatchWithDialog(id){
  const b = getBatchById(id); if(!b) return;
  const linked = claims.filter(c => c.batchId === id);
  showDelete('حذف الدفعة', `سيتم نقل الدفعة${linked.length?' و'+linked.length+' مطالبة':''}.`, () => {
    addToTrash('batch','دفعة', b.id, b);
    linked.forEach(c => addToTrash('claim','مطالبة', c.id, c));
    batches = batches.filter(x => x.id !== id);
    claims = claims.filter(c => c.batchId !== id);
    if($('#batchModal').classList.contains('open')) closeBatchModal();
    renderAll(); showSuccess('تم','تم النقل');
  });
}
