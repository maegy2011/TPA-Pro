function bindShortcuts(){
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if(ctrl && e.key === 'k'){ e.preventDefault(); navHistory=[]; navigateTo('search',{noPush:true}); const inp = document.getElementById('srchQuery')||document.getElementById('searchInput'); if(inp) setTimeout(()=>inp.focus(),50); return; }
    if(ctrl && e.key === 'n'){ e.preventDefault(); if(currentPage!=='intake') navigateTo('intake',{noPush:true}); setTimeout(()=>{ const b=document.getElementById('addBatchBtn'); if(b) b.click(); },50); return; }
  if(ctrl && e.key === 's'){ e.preventDefault(); if(typeof saveReview === 'function' && document.getElementById('reviewModal')?.classList.contains('open')) saveReview(); else if(typeof saveLineEditor === 'function' && document.getElementById('lineModal')?.classList.contains('open')) saveLineEditor(); return; }
    if(e.key === 'Escape'){
      const openModal = document.querySelector('.modal.open, .dialog-overlay.open');
      if(openModal){
        if(openModal.id === 'unifiedDialog'){ const cb = dialogState.onCancel; closeDialog(); if(cb) cb(); }
        else if(openModal.id === 'reviewModal'){ closeReview(); }
        else if(openModal.id === 'batchModal'){ closeBatchModal(); }
        else if(openModal.id === 'providerModal'){ closeProviderModal(); }
        else if(openModal.id === 'contractModal'){ closeContractModal(); }
        else if(openModal.id === 'tariffModal'){ closeTariffModal(); }
        else if(openModal.id === 'invoiceModal'){ closeInvoiceEditor(); }
        else if(openModal.id === 'patientModal'){ closePatientEditor(); }
        else if(openModal.id === 'lineModal'){ closeLineEditor(); }
        else if(openModal.id === 'serviceModal'){ closeServiceModal(); }
        else if(openModal.id === 'drWizardModal'){ closeDrWizard(); }
        else if(openModal.id === 'drModal'){ closeDrModal(); }
        else if(openModal.id === 'paProcModal'){ $('#paProcModal').classList.remove('open'); _unlockBodyScroll(); }
        else { openModal.classList.remove('open'); _unlockBodyScroll(); }
        return;
      }
      if(window.innerWidth <= 900) closeSidebar();
      return;
    }
    if(e.key === '?' && !ctrl){ const a=document.activeElement; if(a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')) return; e.preventDefault(); navHistory=[]; navigateTo('help',{noPush:true}); return; }
  });
}
