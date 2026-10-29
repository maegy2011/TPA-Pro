function deleteTariffWithDialog(id){
  const t = getTariffById(id); if(!t) return;
  showDelete('حذف اللائحة', `سيتم نقل "${t.name}".`, () => {
    addToTrash('tariff','لائحة', t.name, t);
    tariffs = tariffs.filter(x => x.id !== id);
    if($('#tariffModal').classList.contains('open')) closeTariffModal();
    renderAll(); showSuccess('تم','تم النقل');
  });
}
function deleteClaimWithDialog(id){
  const c = getClaimById(id); if(!c) return;
  const linkedSession = findSessionByClaim(id);
  const claimToTrash = JSON.parse(JSON.stringify(c));
  if(linkedSession && Array.isArray(linkedSession.workingInvoices) && linkedSession.workingInvoices.length){
    claimToTrash.invoices = JSON.parse(JSON.stringify(linkedSession.workingInvoices));
    claimToTrash.invoices.forEach(inv => (inv.patients||[]).forEach(p => computePatient(p, claimToTrash, inv.date, inv)));
    claimToTrash.billed = claimToTrash.invoices.reduce((s,inv) => s + (inv.patients||[]).reduce((a,p) => a + (p._subtotal||0), 0), 0);
    claimToTrash.approved = claimToTrash.invoices.reduce((s,inv) => s + (inv.patients||[]).reduce((a,p) => a + (p._final||0), 0), 0);
    if(linkedSession.reviewFormState){
      if(linkedSession.reviewFormState.reason) claimToTrash.reason = linkedSession.reviewFormState.reason;
      if(linkedSession.reviewFormState.notes) claimToTrash.notes = linkedSession.reviewFormState.notes;
      if(claimToTrash.priorApproval && linkedSession.reviewFormState.paStatus){
        claimToTrash.priorApproval.status = linkedSession.reviewFormState.paStatus;
        claimToTrash.priorApproval.refNumber = linkedSession.reviewFormState.paRefNumber || '';
        claimToTrash.priorApproval.date = linkedSession.reviewFormState.paDate || '';
      }
    }
  }
  const msg = linkedSession ? `سيتم نقل "${c.id}" مع تعديلات الجلسة وحذفها.` : `سيتم نقل "${c.id}".`;
  showDelete('حذف', msg, () => {
    addToTrash('claim', 'مطالبة', c.id, claimToTrash);
    claims = claims.filter(x => x.id !== id);
    if(linkedSession){
      workSessions = workSessions.filter(x => x.id !== linkedSession.id);
      if(activeSessionId === linkedSession.id){
        activeSessionId = null;
        $('#reviewModal').classList.remove('open');
        _unlockBodyScroll();
        activeClaim = null; workingInvoices = [];
      }
      persistSessions();
    }
    persistData(true);
    if(currentPage === 'view' && viewState.type === 'claim' && viewState.id === id) goBack();
    renderAll(); showSuccess('تم','تم النقل');
  });
}
