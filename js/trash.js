let trashFilter = 'all', trashSearch = '', trashDebounce = null;
function bindTrashControls(){
  $('#trashSearch').addEventListener('input', e => { clearTimeout(trashDebounce); trashDebounce = setTimeout(() => { trashSearch = e.target.value.trim().toLowerCase(); renderTrash(); }, 200); });
  $('#trashFilterChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if(!chip) return;
    $$('#trashFilterChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); trashFilter = chip.dataset.trf; renderTrash();
  });
  $('#emptyTrashBtn').addEventListener('click', () => { if(!trash.length){ showWarning('تنبيه','فارغة'); return; } showDelete('إفراغ', `سيتم حذف ${trash.length}.`, () => { trash = []; renderAll(); showSuccess('تم','تم'); }); });
  $('#trashBulkRestore').addEventListener('click', () => {
    const ids = $$('#trashList .trash-cb:checked').map(cb => cb.dataset.id);
    if(!ids.length){ showWarning('تنبيه','حدد'); return; }
    let r = 0; ids.forEach(id => { if(restoreTrashItem(id)) r++; });
    trash = trash.filter(t => !ids.includes(t.id));
    renderAll(); showSuccess('تم', `${r}`);
  });
  $('#trashBulkDelete').addEventListener('click', () => {
    const ids = $$('#trashList .trash-cb:checked').map(cb => cb.dataset.id);
    if(!ids.length){ showWarning('تنبيه','حدد'); return; }
    showDelete('حذف نهائي', `${ids.length}.`, () => { trash = trash.filter(t => !ids.includes(t.id)); renderAll(); showSuccess('تم','تم'); });
  });
  $('#trashSelectAll').addEventListener('change', e => { $$('#trashList .trash-cb').forEach(cb => { cb.checked = e.target.checked; }); $$('#trashList .trash-row').forEach(r => r.classList.toggle('selected', e.target.checked)); updateTrashBulkBar(); });
  $('#trashList').addEventListener('change', e => { if(e.target.classList.contains('trash-cb')){ e.target.closest('.trash-row').classList.toggle('selected', e.target.checked); updateTrashBulkBar(); } });
  $('#trashList').addEventListener('click', e => {
    const res = e.target.closest('[data-restore-id]');
    if(res){ const id = res.dataset.restoreId; if(restoreTrashItem(id)){ trash = trash.filter(t => t.id !== id); renderAll(); showSuccess('تم','تم'); } else showWarning('تعذّر','لا يمكن'); return; }
    const del = e.target.closest('[data-permanent-delete-id]');
    if(del){ const id = del.dataset.permanentDeleteId; const item = trash.find(t => t.id === id); if(!item) return; showDelete('حذف نهائي', `"${item.name}".`, () => { trash = trash.filter(t => t.id !== id); renderAll(); showSuccess('تم','تم'); }); }
  });
}
function updateTrashBulkBar(){ const n = $$('#trashList .trash-cb:checked').length; $('#trashBulkCount').textContent = n; $('#trashBulkBar').classList.toggle('show', n > 0); }
function restoreTrashItem(id){
  const item = trash.find(t => t.id === id); if(!item) return false;
  switch(item.type){
    case 'claim': { const c = {...item.data}; if(typeof recalcClaim==='function') recalcClaim(c); claims.push(c); return true; }
    case 'provider': if(providers.find(p => p.id === item.data.id)) return false; providers.push({...item.data}); return true;
    case 'contract': if(contracts.find(c => c.id === item.data.id)) return false; contracts.push({...item.data}); return true;
    case 'tariff': if(tariffs.find(t => t.id === item.data.id)) return false; tariffs.push({...item.data}); return true;
    case 'batch': if(batches.find(b => b.id === item.data.id)) return false; batches.push({...item.data}); return true;
    case 'service': { const t = tariffs.find(x => x.id === item.data.tariffId); if(!t) return false; if(!t.services) t.services = []; t.services.push({...item.data.service}); return true; }
  }
  return false;
}
function getTrashItemDetails(item){
  switch(item.type){
    case 'provider': return `${item.data.type||''} — ${item.data.city||''}`;
    case 'contract': { const p = getProviderById(item.data.providerId); return `${p?p.name:'—'} — ${item.data.discountRate||0}%`; }
    case 'tariff': return `${TARIFF_TYPES[item.data.type]?.label||''} — ${item.data.services?.length||0}`;
    case 'batch': { const p = getProviderById(item.data.providerId); return `${p?p.name:'—'} — ${formatMonth(item.data.month)}`; }
    case 'claim': return `${item.data.patient} — ${fmtC(item.data.billed||0)}`;
    default: return '';
  }
}
function renderTrash(){
  const total = trash.length;
  const cc = trash.filter(t => t.type === 'claim').length;
  const pc = trash.filter(t => t.type === 'provider').length;
  const ctc = trash.filter(t => t.type === 'contract').length;
  const tc = trash.filter(t => t.type === 'tariff').length;
  const bc = trash.filter(t => t.type === 'batch').length;
  $('#trashKpi').innerHTML = `
    <div class="kpi"><div class="kpi-top"><div><div class="kpi-label">الإجمالي</div><div class="kpi-val">${total} <small>عنصر</small></div></div><div class="kpi-ico">${kpiIcon('trash')}</div></div><div class="kpi-foot">في السلة</div></div>
    <div class="kpi k2"><div class="kpi-top"><div><div class="kpi-label">مطالبات</div><div class="kpi-val">${cc} <small>مطالبة</small></div></div><div class="kpi-ico">${kpiIcon('file')}</div></div><div class="kpi-foot">${bc} دفعة</div></div>
    <div class="kpi k3"><div class="kpi-top"><div><div class="kpi-label">جهات وعقود</div><div class="kpi-val">${pc+ctc} <small>عنصر</small></div></div><div class="kpi-ico">${kpiIcon('building')}</div></div><div class="kpi-foot">${pc} · ${ctc}</div></div>
    <div class="kpi k4"><div class="kpi-top"><div><div class="kpi-label">لوائح</div><div class="kpi-val">${tc}</div></div><div class="kpi-ico">${kpiIcon('tariff')}</div></div><div class="kpi-foot">—</div></div>`;
  $('#trashInfo').textContent = `${total} عنصر`;
  const list = trash.filter(item => {
    if(trashFilter !== 'all' && item.type !== trashFilter) return false;
    if(trashSearch){ const q = trashSearch; return item.name.toLowerCase().includes(q) || item.typeLabel.toLowerCase().includes(q) || getTrashItemDetails(item).toLowerCase().includes(q); }
    return true;
  }).sort((a,b) => new Date(b.deletedAt) - new Date(a.deletedAt));
  const box = $('#trashList');
  if(!list.length){ box.innerHTML = `<div class="trash-empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg><p>${trash.length?'لا نتائج':'فارغة'}</p></div>`; updateTrashBulkBar(); return; }
  box.innerHTML = list.map(item => {
    const d = new Date(item.deletedAt).toISOString().slice(0,10);
    return `<div class="trash-row" data-trash-id="${item.id}"><input type="checkbox" class="trash-cb" data-id="${item.id}"><span class="badge trash-${item.type}">${item.typeLabel}</span><div class="trash-info"><div class="trash-name">${escapeHtml(item.name)}</div><div class="trash-details">${escapeHtml(getTrashItemDetails(item))}</div></div><div class="trash-date">${d}</div><div class="trash-actions"><button class="btn-xs restore" data-restore-id="${item.id}">استعادة</button><button class="btn-xs danger" data-permanent-delete-id="${item.id}">حذف</button></div></div>`;
  }).join('');
  updateTrashBulkBar(); updateTrashBadge();
}
