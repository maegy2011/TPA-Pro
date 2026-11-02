// notifications-v2.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
let toastTimer;
let _persistFailNotified = false;
/* تنبيه فشل الحفظ: toast صامت عند التلقائي، وdialog صريح عند ضغطة المراجع. */
function notifyPersistFailed(explicit){
  if(explicit){
    if(typeof showWarning === 'function') showWarning('تعذّر الحفظ', 'امتلأ التخزين المحلي أو تعذّرت الكتابة — التعديلات ظاهرة أمامك لكنها غير محفوظة. احذف مسودات/جلسات قديمة ثم أعد الحفظ.');
    return;
  }
  if(_persistFailNotified) return;
  _persistFailNotified = true;
  showToast('⚠ تعذّر الحفظ التلقائي — قد يكون التخزين ممتلئًا');
}
function notifyPersistOk(){ _persistFailNotified = false; }
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
