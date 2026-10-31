let toastTimer;
function showToast(msg){
  const tm = $('#toastMsg'); if(tm) tm.textContent = msg;
  const t = $('#toast'); if(t) t.classList.add('show');
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

function checkOverdueClaims(){
  try {
    const now = new Date();
    const overdue = (typeof claims !== 'undefined' ? claims : []).filter(c => c.status === 'pending' && c.receivedDate && (now - new Date(c.receivedDate)) > 7*86400000);
    if (overdue.length) showToast(`⚠️ ${overdue.length} مطالبة معلّقة منذ أكثر من 7 أيام`);
  } catch(e){}
}
