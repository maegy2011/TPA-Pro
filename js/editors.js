// editors.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function toggleInpatientFields(){
  const on = $('#invType').value === 'inpatient';
  ['#invInp1','#invInp2','#invInp3'].forEach(s => { $(s).style.display = on ? 'block' : 'none'; });
}
function openInvoiceEditor(idx){
  rvEditInvoiceIdx = (idx === undefined || idx === null) ? -1 : idx;
  const inv = rvEditInvoiceIdx >= 0 ? workingInvoices[rvEditInvoiceIdx] : null;
  $('#invType').innerHTML = Object.entries(INVOICE_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  $('#invModalTitle').textContent = inv ? 'تعديل مذكرة الخصم' : 'إضافة مذكرة خصم';
  $('#invModalSub').textContent = inv ? (inv.debitNoteNumber||inv.number||inv.id) : '—';
  const ctype = activeClaim ? (activeClaim.type || 'employee') : 'employee';
  if(document.getElementById('invClaimType')) document.getElementById('invClaimType').value = inv && inv.claimType ? inv.claimType : ctype;
  if(inv){
    $('#invType').value = inv.type; $('#invNumber').value = inv.debitNoteNumber||inv.number||inv.id; $('#invDate').value = inv.debitNoteDate||inv.date||'';
    if(document.getElementById('invLinkedInvoice')) document.getElementById('invLinkedInvoice').value = inv.linkedInvoiceNumber||inv.invoiceNumber||'';
    const p0 = (inv.patients||[])[0];
    $('#invPatientName').value = p0 ? p0.name : ''; $('#invPatientId').value = p0 ? p0.nationalId : '';
    $('#invAdmission').value = inv.admissionDate||''; $('#invDischarge').value = inv.dischargeDate||''; $('#invRoomClass').value = inv.roomClass||'';
  } else {
    $('#invType').value = 'outpatient'; $('#invNumber').value = 'DN-' + Date.now().toString().slice(-6); $('#invDate').value = daysFromNow(0);
    if(document.getElementById('invLinkedInvoice')) document.getElementById('invLinkedInvoice').value = '';
    $('#invPatientName').value = ''; $('#invPatientId').value = '';
    $('#invAdmission').value = ''; $('#invDischarge').value = ''; $('#invRoomClass').value = '';
  }
  toggleInpatientFields(); $('#invoiceModal').classList.add('open');
}
function saveInvoiceEditor(confirmed){
  markSessionDirty();
  const type = $('#invType').value, date = $('#invDate').value;
  const pName = $('#invPatientName').value.trim(), pNat = $('#invPatientId').value.trim(), num = $('#invNumber').value.trim();
  const linked = document.getElementById('invLinkedInvoice') ? document.getElementById('invLinkedInvoice').value.trim() : '';
  const claimType = document.getElementById('invClaimType') ? document.getElementById('invClaimType').value : (activeClaim?activeClaim.type:'employee');
  if(!date){ showWarning('تنبيه','أدخل تاريخ مذكرة الخصم'); return; }
  if(!linked){ showWarning('تنبيه','أدخل رقم الفاتورة المرتبطة بمذكرة الخصم'); return; }
  if(!pName){ showWarning('تنبيه','أدخل اسم المريض'); return; }
  // تحقق من تواريخ الإقامة
  if(type === 'inpatient'){
    const adm = $('#invAdmission').value, dis = $('#invDischarge').value;
    if(adm && dis && new Date(dis) <= new Date(adm)){ showWarning('تنبيه','تاريخ الخروج بعد الدخول'); return; }
  }
  if(activeClaim && activeClaim.receivedDate && new Date(date) > new Date(activeClaim.receivedDate) && confirmed !== true){
    showWarning('تنبيه','تاريخ مذكرة الخصم بعد الاستلام. متابعة؟', () => saveInvoiceEditor(true));
    return;
  }
  const inpData = { admissionDate: type==='inpatient'?($('#invAdmission').value||''):'', dischargeDate: type==='inpatient'?($('#invDischarge').value||''):'', roomClass: type==='inpatient'?$('#invRoomClass').value.trim():'' };
  if(rvEditInvoiceIdx >= 0){
    const inv = workingInvoices[rvEditInvoiceIdx];
    inv.type = type; inv.claimType = claimType; inv.debitNoteNumber = num || inv.debitNoteNumber || inv.number || inv.id; inv.number = inv.debitNoteNumber; inv.debitNoteDate = date; inv.date = date; inv.linkedInvoiceNumber = linked; inv.invoiceNumber = linked; Object.assign(inv, inpData);
    if(inv.patients && inv.patients.length) inv.patients.forEach(p => { if(p.beneficiaryType === undefined) p.beneficiaryType = claimType; p.beneficiaryType = claimType; });
    else inv.patients = [mkPatient(newPatientId(inv), pName, pNat, [])];
    if(inv.patients[0]) { inv.patients[0].name = pName; inv.patients[0].nationalId = pNat; inv.patients[0].beneficiaryType = claimType; }
    rvActiveInvoiceIdx = rvEditInvoiceIdx;
  } else {
    const id = newInvoiceId();
    const inv = mkInvoice(id, type, date, [mkPatient(id+'-P1', pName, pNat, [])]);
    inv.claimType = claimType; inv.debitNoteNumber = num || id; inv.number = inv.debitNoteNumber; inv.debitNoteDate = date; inv.date = date; inv.linkedInvoiceNumber = linked; inv.invoiceNumber = linked;
    if(inv.patients[0]) inv.patients[0].beneficiaryType = claimType;
    Object.assign(inv, inpData); workingInvoices.push(inv); rvActiveInvoiceIdx = workingInvoices.length-1;
  }
  rvActivePatientIdx = 0; closeInvoiceEditor(); renderReviewInvoices();
}
function closeInvoiceEditor(){ if(!$('#invoiceModal').classList.contains('open')) return; $('#invoiceModal').classList.remove('open'); rvEditInvoiceIdx = -1; }
function openPatientEditor(invIdx, patIdx){
  rvEditPatientInvoiceIdx = invIdx;
  rvEditPatientIdx = (patIdx === undefined || patIdx === null) ? -1 : patIdx;
  const inv = workingInvoices[invIdx]; if(!inv) return;
  const p = rvEditPatientIdx >= 0 ? (inv.patients||[])[rvEditPatientIdx] : null;
  $('#patModalTitle').textContent = p ? 'تعديل المريض' : 'إضافة مريض';
  $('#patModalSub').textContent = inv.id;
  $('#patName').value = p ? p.name : ''; $('#patNationalId').value = p ? p.nationalId : '';
  $('#patientModal').classList.add('open'); setTimeout(()=>$('#patName').focus(), 120);
}
function savePatientEditor(){
  markSessionDirty();
  const inv = workingInvoices[rvEditPatientInvoiceIdx]; if(!inv) return;
  const name = $('#patName').value.trim(), nat = $('#patNationalId').value.trim();
  if(!name){ showWarning('تنبيه','أدخل اسم المريض'); return; }
  if(!inv.patients) inv.patients = [];
  if(rvEditPatientIdx >= 0){ inv.patients[rvEditPatientIdx].name = name; inv.patients[rvEditPatientIdx].nationalId = nat; rvActivePatientIdx = rvEditPatientIdx; }
  else { inv.patients.push(mkPatient(newPatientId(inv), name, nat, [])); rvActivePatientIdx = inv.patients.length-1; }
  closePatientEditor(); renderActiveInvoice(); recalcReview();
}
function closePatientEditor(){ if(!$('#patientModal').classList.contains('open')) return; $('#patientModal').classList.remove('open'); rvEditPatientInvoiceIdx = -1; rvEditPatientIdx = -1; }
