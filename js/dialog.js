let dialogState = { open:false, onConfirm:null, onCancel:null, interval:null };
function _unlockBodyScroll(){ if(!document.querySelector('.modal.open, .dialog-overlay.open')) document.body.style.overflow = ''; }
const DIALOG_ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>'
};
function openDialog(opts){
  if(dialogState.interval){ clearInterval(dialogState.interval); dialogState.interval = null; }
  const type = opts.type || 'info';
  const iconType = type === 'delete' ? 'delete' : type;
  $('#dialogIcon').className = 'dialog-icon-wrap ' + (iconType === 'delete' ? 'danger' : type);
  $('#dialogIcon').innerHTML = DIALOG_ICONS[iconType] || DIALOG_ICONS.info;
  $('#dialogTitle').textContent = opts.title || '';
  $('#dialogMessage').innerHTML = escapeHtml(opts.message || '');
  $('#\1')?.style.display = opts.message ? 'block' : 'none';
  $('#dialogBody').innerHTML = opts.body || '';
  $('#\1')?.style.display = opts.body ? 'block' : 'none';
  const actions = $('#dialogActions'); actions.innerHTML = '';
  if(opts.requireCountdown){
    let rem = 5;
    const cBtn = document.createElement('button');
    cBtn.className = 'dialog-btn primary ' + (iconType === 'delete' || type === 'danger' ? 'danger' : (type === 'warning' ? 'warning' : 'info'));
    cBtn.disabled = true;
    cBtn.innerHTML = `<span>${opts.confirmText||'حذف'}</span> <span class="countdown-num">(${rem})</span>`;
    const xBtn = document.createElement('button');
    xBtn.className = 'dialog-btn secondary'; xBtn.textContent = opts.cancelText || 'إلغاء';
    xBtn.addEventListener('click', () => { closeDialog(); if(opts.onCancel) opts.onCancel(); });
    actions.appendChild(cBtn); actions.appendChild(xBtn);
    dialogState.interval = setInterval(() => {
      rem--;
      if(rem > 0) cBtn.innerHTML = `<span>${opts.confirmText||'حذف'}</span> <span class="countdown-num">(${rem})</span>`;
      else { clearInterval(dialogState.interval); dialogState.interval = null; cBtn.disabled = false; cBtn.innerHTML = `<span>${opts.confirmText||'حذف'}</span>`; }
    }, 1000);
    cBtn.addEventListener('click', () => { if(cBtn.disabled) return; clearInterval(dialogState.interval); dialogState.interval = null; closeDialog(); if(opts.onConfirm) opts.onConfirm(); });
  } else {
    if(opts.cancelText !== null){
      const xBtn = document.createElement('button');
      xBtn.className = 'dialog-btn secondary'; xBtn.textContent = opts.cancelText || 'إلغاء';
      xBtn.addEventListener('click', () => { closeDialog(); if(opts.onCancel) opts.onCancel(); });
      actions.appendChild(xBtn);
    }
    const cBtn = document.createElement('button');
    cBtn.className = 'dialog-btn primary ' + (iconType === 'delete' || type === 'danger' ? 'danger' : (type === 'warning' ? 'warning' : (type === 'info' ? 'info' : '')));
    cBtn.innerHTML = opts.confirmText || 'حسنًا';
    cBtn.addEventListener('click', () => { closeDialog(); if(opts.onConfirm) opts.onConfirm(); });
    actions.appendChild(cBtn);
  }
  dialogState.onConfirm = opts.onConfirm; dialogState.onCancel = opts.onCancel; dialogState.open = true;
  $('#unifiedDialog').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeDialog(){
  if(dialogState.interval){ clearInterval(dialogState.interval); dialogState.interval = null; }
  $('#unifiedDialog').classList.remove('open'); _unlockBodyScroll(); dialogState.open = false;
}
function showInfo(t,m,oc){ openDialog({type:'info', title:t, message:m, confirmText:'حسنًا', cancelText:null, onConfirm:oc}); }
function showSuccess(t,m,oc){ openDialog({type:'success', title:t, message:m, confirmText:'تم', cancelText:null, onConfirm:oc}); }
function showWarning(t,m,oc,xc){ openDialog({type:'warning', title:t, message:m, confirmText:'متابعة', cancelText:'إلغاء', onConfirm:oc, onCancel:xc}); }
function showDelete(t,m,oc){ openDialog({type:'delete', title:t, message:m, confirmText:'حذف نهائي', cancelText:'إلغاء', requireCountdown:true, onConfirm:oc}); }
$$('[data-dialog-close]').forEach(el => el.addEventListener('click', () => { if(dialogState.interval) clearInterval(dialogState.interval); closeDialog(); if(dialogState.onCancel) dialogState.onCancel(); }));
