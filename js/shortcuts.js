// shortcuts.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function bindShortcuts(){
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    const inField = (() => { const a = document.activeElement; return a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'); })();
    const reviewOpen = (document.getElementById('reviewModal')?.classList.contains('open')) || (typeof currentPage !== 'undefined' && currentPage === 'review');
    const lineOpen = document.getElementById('lineModal')?.classList.contains('open');
    // Ctrl+S: حفظ — preventDefault فقط عند المعالجة الفعلية حتى لا نحجب حفظ المتصفح خارج المراجعة.
    if(ctrl && (e.key === 's' || e.key === 'S')){ if(reviewOpen || lineOpen){ e.preventDefault(); if(reviewOpen && typeof saveReview === 'function') saveReview(); else if(lineOpen && typeof saveLineEditor === 'function') saveLineEditor(); return; } }
    // Ctrl+Enter: اعتماد — آمن، لا ارتباط له في المتصفح.
    if(ctrl && e.key === 'Enter'){ if(reviewOpen){ e.preventDefault(); if(typeof finalizeReview === 'function') finalizeReview(); return; } }
    // اختصارات التنقل: لا تعمل أثناء الكتابة في الحقول.
    if(ctrl && (e.key === 'k' || e.key === 'K') && !inField){ e.preventDefault(); navHistory=[]; navigateTo('search',{noPush:true}); const inp = document.getElementById('srchQuery')||document.getElementById('searchInput'); if(inp) setTimeout(()=>inp.focus(),50); return; }
    // Alt+N بدل Ctrl+N: الأخير محجوز للمتصفح (نافذة جديدة) ولا يمكن اعتراضه.
    if(e.altKey && !ctrl && (e.key === 'n' || e.key === 'N') && !inField){ e.preventDefault(); if(currentPage!=='inbox') navigateTo('inbox',{noPush:true}); setTimeout(()=>{ const b=document.getElementById('addBatchBtn'); if(b) b.click(); },50); return; }
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
