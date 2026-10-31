let toastTimer;
function showToast(msg){
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function updateTrashBadge(){
  const items = Array.isArray(trash) ? trash : [];
  const b = $('#trashCount');
  if(b){ b.textContent = items.length; b.style.display = items.length > 0 ? 'grid' : 'none'; }
  const tb = $('#tbTrashCount');
  if(tb){ tb.textContent = items.length; tb.style.display = items.length > 0 ? 'inline-flex' : 'none'; }
  const st = $('#settingsTrashCount'); if(st) st.textContent = items.length;
}
