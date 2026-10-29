function updateBackupStats(){
  const el = $('#backupStats');
  const n = (typeof workSessions !== 'undefined' && Array.isArray(workSessions)) ? workSessions.length : 0;
  const lastBackup = getLastBackupAgo();
  if(el){
    el.innerHTML = `${claims.length} مطالبة · ${providers.length} جهة · ${contracts.length} عقد · ${tariffs.length} لائحة · ${n} جلسة · ${trash.length} محذوف<br>
      <span style="color:${lastBackup?'var(--ok)':'var(--warn)'};font-weight:700">💾 آخر نسخة: ${lastBackup || 'لم تُنشأ'}</span>`;
  }
  const st = document.getElementById('settingsTrashCount'); if(st) st.textContent = trash.length;
}
