function buildModals(){
  $('#modalsContainer').innerHTML = MODAL_REVIEW + MODAL_INVOICE + MODAL_PATIENT + MODAL_LINE + MODAL_PROVIDER + MODAL_CONTRACT + MODAL_TARIFF + MODAL_BATCH + MODAL_DR + MODAL_PAPROC + MODAL_DRWIZARD;
  // Accessibility: expose modal dialogs to assistive tech
  $$('#modalsContainer .modal').forEach((m, i) => {
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    const title = m.querySelector('.modal-head h3, h3');
    if (title && !title.id) title.id = 'modalTitle' + i;
    if (title) m.setAttribute('aria-labelledby', title.id);
  });
}
buildModals();
