// editors.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function toggleInpatientFields(){
  const on = $('#invType').value === 'inpatient';
  ['#invInp1','#invInp2','#invInp3'].forEach(s => { const el = $(s); if(el) el.style.display = on ? 'block' : 'none'; });
  const cat = document.getElementById('invCategory') ? document.getElementById('invCategory').value : '';
  const pkg = document.getElementById('invInpPkg'); if(pkg) pkg.style.display = (on || cat === 'internal') ? 'block' : 'none';
}
function openInvoiceEditor(idx){
  rvEditInvoiceIdx = (idx === undefined || idx === null) ? -1 : idx;
  const inv = rvEditInvoiceIdx >= 0 ? workingInvoices[rvEditInvoiceIdx] : null;
  $('#invType').innerHTML = Object.entries(INVOICE_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  $('#invModalTitle').textContent = inv ? 'تعديل مذكرة الخصم' : 'إضافة مذكرة خصم';
  $('#invModalSub').textContent = inv ? (inv.debitNoteNumber||inv.number||inv.id) : '—';
  const ctype = activeClaim ? (activeClaim.type || 'employee') : 'employee';
  if(document.getElementById('invClaimType')) document.getElementById('invClaimType').value = inv?.claimType ? inv.claimType : ctype;
  if(document.getElementById('invCategory')) document.getElementById('invCategory').value = inv && (inv.category||inv.invoiceCategory) ? (inv.category||inv.invoiceCategory) : (inv?.type==='inpatient' ? 'internal' : 'external');
  if(inv){
    $('#invType').value = inv.type; $('#invNumber').value = inv.debitNoteNumber||inv.number||inv.id; $('#invDate').value = inv.debitNoteDate||inv.date||'';
    if(document.getElementById('invLinkedInvoice')) document.getElementById('invLinkedInvoice').value = inv.linkedInvoiceNumber||inv.invoiceNumber||'';
    const p0 = (inv.patients||[])[0];
    $('#invPatientName').value = p0 ? p0.name : ''; $('#invPatientId').value = p0 ? p0.nationalId : '';
    $('#invAdmission').value = inv.admissionDate||''; $('#invDischarge').value = inv.dischargeDate||''; $('#invRoomClass').value = inv.roomClass||'';
    if(document.getElementById('invOpClass')) document.getElementById('invOpClass').value = inv.operationClass||'';
    if(document.getElementById('invPackageType')) document.getElementById('invPackageType').value = inv.packageType||'open';
    if(document.getElementById('invPackagePrice')) document.getElementById('invPackagePrice').value = inv.packagePrice||'';
    const _oc = document.getElementById('invCategory'); if(_oc && !_oc.dataset.pkgBound){ _oc.dataset.pkgBound='1'; _oc.addEventListener('change', toggleInpatientFields); }
    const _ot = document.getElementById('invType'); if(_ot && !_ot.dataset.pkgBound){ _ot.dataset.pkgBound='1'; _ot.addEventListener('change', toggleInpatientFields); }
  } else {
    $('#invType').value = 'outpatient'; $('#invNumber').value = 'DN-' + Date.now().toString().slice(-6); $('#invDate').value = daysFromNow(0);
    if(document.getElementById('invLinkedInvoice')) document.getElementById('invLinkedInvoice').value = '';
    $('#invPatientName').value = ''; $('#invPatientId').value = '';
    $('#invAdmission').value = ''; $('#invDischarge').value = ''; $('#invRoomClass').value = '';
    if(document.getElementById('invOpClass')) document.getElementById('invOpClass').value = '';
    if(document.getElementById('invPackageType')) document.getElementById('invPackageType').value = 'open';
    if(document.getElementById('invPackagePrice')) document.getElementById('invPackagePrice').value = '';
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
  if(activeClaim?.receivedDate && new Date(date) > new Date(activeClaim.receivedDate) && confirmed !== true){
    showWarning('تنبيه','تاريخ مذكرة الخصم بعد الاستلام. متابعة؟', () => saveInvoiceEditor(true));
    return;
  }
  const invoiceCategory = document.getElementById('invCategory') ? document.getElementById('invCategory').value : (type==='inpatient'?'internal':'external');
  const _opCls = document.getElementById('invOpClass') ? document.getElementById('invOpClass').value : '';
  const _pkgT = document.getElementById('invPackageType') ? document.getElementById('invPackageType').value : 'open';
  const _pkgP = document.getElementById('invPackagePrice') ? (Number(document.getElementById('invPackagePrice').value)||0) : 0;
  if(_pkgT === 'closed' && !(_pkgP > 0)){ showWarning('تنبيه','أدخل سعر الباكج المغلق'); return; }
  const inpData = { category: invoiceCategory, invoiceCategory, admissionDate: type==='inpatient'?($('#invAdmission').value||''):'', dischargeDate: type==='inpatient'?($('#invDischarge').value||''):'', roomClass: type==='inpatient'?$('#invRoomClass').value.trim():'', operationClass: _opCls||'', packageType: _pkgT, packagePrice: _pkgP };
  if(rvEditInvoiceIdx >= 0){
    const inv = workingInvoices[rvEditInvoiceIdx];
    inv.type = type; inv.claimType = claimType; inv.debitNoteNumber = num || inv.debitNoteNumber || inv.number || inv.id; inv.number = inv.debitNoteNumber; inv.debitNoteDate = date; inv.date = date; inv.linkedInvoiceNumber = linked; inv.invoiceNumber = linked; inv.patientName = pName; inv.patientNationalId = pNat; Object.assign(inv, inpData);
    if(inv.patients && inv.patients.length) inv.patients.forEach(p => { if(p.beneficiaryType === undefined) p.beneficiaryType = claimType; });
    else inv.patients = [mkPatient(newPatientId(inv), pName, pNat, [])];
    if(inv.patients[0]) { inv.patients[0].name = pName; inv.patients[0].nationalId = pNat; if(!inv.patients[0].beneficiaryType) inv.patients[0].beneficiaryType = claimType; }
    rvActiveInvoiceIdx = rvEditInvoiceIdx;
  } else {
    const id = newInvoiceId();
    const inv = mkInvoice(id, type, date, [mkPatient(id+'-P1', pName, pNat, [])]);
    inv.claimType = claimType; inv.debitNoteNumber = num || id; inv.number = inv.debitNoteNumber; inv.debitNoteDate = date; inv.date = date; inv.linkedInvoiceNumber = linked; inv.invoiceNumber = linked; inv.patientName = pName; inv.patientNationalId = pNat;
    if(inv.patients[0]) { inv.patients[0].beneficiaryType = claimType; inv.patients[0].documents = {}; }
    Object.assign(inv, inpData); workingInvoices.push(inv); rvActiveInvoiceIdx = workingInvoices.length-1;
  }
  rvActivePatientIdx = 0; closeInvoiceEditor(); renderReviewInvoices();
  if(typeof showSuccess === 'function') showSuccess('تم','تم حفظ مذكرة الخصم');
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
  if(document.getElementById('patBeneficiaryType')) document.getElementById('patBeneficiaryType').value = p ? (p.beneficiaryType || (inv.claimType || (activeClaim&&activeClaim.type) || 'employee')) : (inv.claimType || (activeClaim&&activeClaim.type) || 'employee');
  if(document.getElementById('patLetterDate')) document.getElementById('patLetterDate').value = p ? (p.letterDate || '') : '';
  const _nat = document.getElementById('patNationalId');
  if(_nat && !_nat.dataset.bound){
    _nat.dataset.bound='1';
    _nat.addEventListener('input', () => {
      const sel = document.getElementById('patBeneficiaryType');
      if(!sel) return;
      const id = _nat.value.trim();
      if(!/^[23]\\d{13}$/.test(id)) return;
      const refDate = (inv && (inv.procedureDate || inv.date)) || (activeClaim && (activeClaim.date || activeClaim.receivedDate)) || new Date().toISOString().slice(0,10);
      if(typeof tpaBeneficiaryTypeForPatient === 'function'){
        const info = tpaBeneficiaryTypeForPatient({nationalId:id}, refDate);
        if(info?.type) sel.value = info.type;
      }
    });
  }
  $('#patientModal').classList.add('open'); setTimeout(()=>$('#patName').focus(), 120);
}
function savePatientEditor(){
  markSessionDirty();
  const inv = workingInvoices[rvEditPatientInvoiceIdx]; if(!inv) return;
  const name = $('#patName').value.trim(), nat = $('#patNationalId').value.trim();
  const beneficiaryType = document.getElementById('patBeneficiaryType') ? document.getElementById('patBeneficiaryType').value : ((inv.claimType || (activeClaim&&activeClaim.type)) || 'employee');
  const letterDate = document.getElementById('patLetterDate') ? document.getElementById('patLetterDate').value : '';
  if(!name){ showWarning('تنبيه','أدخل اسم المريض'); return; }
  if(!inv.patients) inv.patients = [];
  if(rvEditPatientIdx >= 0){ inv.patients[rvEditPatientIdx].name = name; inv.patients[rvEditPatientIdx].nationalId = nat; inv.patients[rvEditPatientIdx].beneficiaryType = beneficiaryType; inv.patients[rvEditPatientIdx].letterDate = letterDate; rvActivePatientIdx = rvEditPatientIdx; }
  else { const newPat = mkPatient(newPatientId(inv), name, nat, []); newPat.beneficiaryType = beneficiaryType; newPat.letterDate = letterDate; newPat.documents = {}; inv.patients.push(newPat); rvActivePatientIdx = inv.patients.length-1; }
  closePatientEditor(); renderActiveInvoice(); recalcReview();
  if(typeof showSuccess === 'function') showSuccess('تم','تم حفظ المريض');
}
function closePatientEditor(){ if(!$('#patientModal').classList.contains('open')) return; $('#patientModal').classList.remove('open'); rvEditPatientInvoiceIdx = -1; rvEditPatientIdx = -1; }
