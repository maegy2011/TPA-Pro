function mkLine(code, name, category, qty, billedUnit, tariffUnit, approved, note){
  const billed = qty * billedUnit;
  const hasT = (tariffUnit !== undefined && tariffUnit !== null);
  const tariffTotal = hasT ? qty * tariffUnit : null;
  const lesser = hasT ? Math.min(billed, tariffTotal) : billed;
  return { code, name, category, qty, billedUnit, tariffUnit: hasT ? tariffUnit : null,
           approved: (approved === undefined ? lesser : approved), note: note || '' };
}
function mkPatient(id, name, nationalId, lines){
  return { id, name: name || '—', nationalId: nationalId || '', lines: lines || [] };
}
function mkInvoice(id, type, date, patients, extra){
  return Object.assign({
    id, number: id, type, date,
    documents: { patientId:true, referral:true, medicalReport:true, priorApprovalDoc:true },
    admissionDate:'', dischargeDate:'', roomClass:'',
    patients: patients || []
  }, extra || {});
}
function allInvoiceLines(inv){
  if(!inv || !inv.patients) return [];
  return inv.patients.reduce((acc,p)=> acc.concat(p.lines || []), []);
}
function invoiceTotals(inv){
  const lines = allInvoiceLines(inv);
  const billed = lines.reduce((a,l)=> a + l.qty*l.billedUnit, 0);
  const approved = lines.reduce((a,l)=> a + (Number(l.approved)||0), 0);
  return { billed, approved, deduction: Math.max(0, billed-approved) };
}
function labLines(n, base){
  const out=[];
  for(let i=1;i<=n;i++){
    out.push(mkLine('LAB-'+String(i).padStart(3,'0'), 'تحليل مخبري #'+i, 'مختبر', 1, base + (i%5)*20, base + (i%4)*15));
  }
  return out;
}
