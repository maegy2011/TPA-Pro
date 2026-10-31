let toastTimer;
function showToast(msg){
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function updateTrashBadge(){
  const b = $('#trashCount');
  if(b){ if(trash.length > 0){ b.textContent = trash.length; b.style.display = 'grid'; } else b.style.display = 'none'; }
  const tb = $('#tbTrashCount');
  if(tb){ if(trash.length > 0){ tb.textContent = trash.length; tb.style.display = 'inline-flex'; } else tb.style.display = 'none'; }
  const st = $('#settingsTrashCount'); if(st) st.textContent = trash.length;
}
