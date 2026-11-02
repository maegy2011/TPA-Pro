// review-taxonomy.js — نموذج تصنيف بنود المراجعة (ديناميكي، يُدار من الإعدادات)
// كل سلوك رقابي يُشتق من هذا الجدول — لا ثوابت متصلبة في المحرك.
const DEFAULT_LINE_TAXONOMY = [
  { key:'stay', label:'إقامة/غرفة', kind:'line', keywords:['إقامة','اقامه','إقامه','stay','room','يوم','أيام','ايام','ليلة','سرير'], stayQty:true, checklistCode:'stay-mismatch' },
  { key:'icu', label:'عناية مركزة', kind:'line', keywords:['عناية','icu'], icuQty:true, requiresChecklist:true, checklistKey:'icu', checklistCode:'checklist-icu' },
  { key:'nursing', label:'تمريض', kind:'line', keywords:['تمريض','nursing'], perStayMax:1, perStayCode:'nursing-exceed' },
  { key:'or-room', label:'غرفة عمليات', kind:'line', keywords:['غرفة عمليات','غرفه عمليات','تجهيز غرفة','استخدام غرفة'], countVsSurg:true, countCode:'or-exceed' },
  { key:'physio', label:'علاج طبيعي/تأهيل', kind:'line', keywords:['طبيعي','تأهيل','physio'], perStayMax:1, perStayCode:'physio-exceed' },
  { key:'surgery-proc', label:'إجراء جراحي', kind:'line', keywords:['جراح','عملية','جراحة'], surgeryProc:true, requiresChecklist:true, checklistKey:'surgery', checklistCode:'checklist-surgery' },
  { key:'fee', label:'أتعاب (جراح/تخدير/مساعد)', kind:'line', keywords:['أتعاب','اتعاب','fee'], fee:true, requiresSurgery:true, surgeryCode:'link-fee-nosurgery' },
  { key:'assist-extra', label:'مساعد جراح', kind:'line', keywords:['مساعد'], assistFee:true, requiresSurgeonFee:true, surgeryClassOk:true, assistCode:'link-assistant' },
  { key:'anesthesia-tag', label:'تخدير', kind:'line', keywords:['تخدير','بنج'], requiresChecklist:true, checklistKey:'anesthesia', checklistCode:'checklist-anesthesia' },
  { key:'blood-tag', label:'نقل دم', kind:'line', keywords:['نقل دم','نقل الدم'], requiresChecklist:true, checklistKey:'blood', checklistCode:'checklist-blood' },
  { key:'implant', label:'مزروعات', kind:'line', keywords:['دعامة','دعامات','مسمار','مسامير','مفصل','مفاصل','شبكة','صمام','شريحة','شرائح','مثبت','طرف صناعي','implant','stent'], implant:true, requiresSurgery:true, surgeryCode:'link-implant-nosurgery' },
  { key:'consumable', label:'مستهلكات', kind:'line', keywords:['شاش','خيط','خيوط','محلول','محاليل','قسطرة','أنبوب','أنبوبة','قفاز','سرنجة','ضماد','مستهلك','مستهلكات','مستلزم','غيار','بلاستر','كانيولا','consumable'], consumable:true, maxShare:0.25, shareCode:'consumables-share' },
  { key:'doc-admission', label:'مبرر الدخول وقرار الحجز', kind:'doc', keywords:[], requiresChecklist:true, checklistKey:'admission', checklistCode:'checklist-admission' },
  { key:'doc-discharge', label:'ملخص الخروج وخطة العلاج', kind:'doc', keywords:[], requiresChecklist:true, checklistKey:'discharge', checklistCode:'checklist-discharge' },
];
function getLineTaxonomy(){
  const customs = (typeof appSettings !== 'undefined' && Array.isArray(appSettings.customLineTypes)) ? appSettings.customLineTypes : [];
  const byKey = new Map(DEFAULT_LINE_TAXONOMY.map(t => [t.key, { ...t }]));
  customs.forEach(c => { if(!c || !c.key) return; byKey.set(c.key, { ...(byKey.get(c.key) || { key:c.key, kind:'line', keywords:[] }), ...c }); });
  return Array.from(byKey.values());
}
function matchLineTypes(l){
  const txt = `${l.category||''} ${l.name||''} ${l.code||''}`.toLowerCase();
  return getLineTaxonomy().filter(t => t.kind === 'line' && Array.isArray(t.keywords) && t.keywords.some(k => k && txt.includes(String(k).toLowerCase())));
}
function registerTaxonomyReasons(){
  if(typeof VALIDATION_REASONS === 'undefined') return;
  getLineTaxonomy().forEach(t => {
    const tail = ' — القرار للمراجع';
    if(t.requiresChecklist){
      const code = t.checklistCode || ('checklist-' + (t.checklistKey || t.key));
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: (t.label || t.key) + ' بلا تعليم تدقيق' + tail, severity: 'attention', category: 'checklist' };
    }
    if(t.requiresSurgery){
      const code = t.surgeryCode || ('link-' + t.key);
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: (t.label || t.key) + ' بلا إجراء جراحي' + tail, severity: 'attention', category: 'linkage' };
    }
    if(t.requiresSurgeonFee){
      const code = t.assistCode || ('link-' + t.key);
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: (t.label || t.key) + ' بلا شروطه (جراح + تصنيف)' + tail, severity: 'attention', category: 'linkage' };
    }
    if(t.maxShare != null){
      const code = t.shareCode || ('share-' + t.key);
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: 'تجاوز حصة ' + (t.label || t.key) + tail, severity: 'attention', category: 'supplies' };
    }
    if(t.perStayMax != null){
      const code = t.perStayCode || ('perstay-' + t.key);
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: 'تجاوز ' + (t.label || t.key) + ' لأيام الإقامة' + tail, severity: 'attention', category: 'stay' };
    }
    if(t.countVsSurg){
      const code = t.countCode || ('count-' + t.key);
      if(!VALIDATION_REASONS[code]) VALIDATION_REASONS[code] = { label: (t.label || t.key) + ' أكثر من الإجراءات' + tail, severity: 'attention', category: 'linkage' };
    }
  });
  if(!VALIDATION_REASONS['stay-mismatch']) VALIDATION_REASONS['stay-mismatch'] = { label: 'فرق أيام الإقامة' + ' — القرار للمراجع', severity: 'attention', category: 'stay' };
  if(!VALIDATION_REASONS['stay-overlap']) VALIDATION_REASONS['stay-overlap'] = { label: 'ازدواج أيام (عناية + غرفة)' + ' — القرار للمراجع', severity: 'attention', category: 'stay' };
  if(!VALIDATION_REASONS['dup-xinvoice']) VALIDATION_REASONS['dup-xinvoice'] = { label: 'تكرار البند في أكثر من مذكرة' + ' — القرار للمراجع', severity: 'attention', category: 'duplication' };
}
try { registerTaxonomyReasons(); } catch(e){}
/* ---------- تكامل عبر الفواتير: نفس البند لنفس المريض في أكثر من مذكرة ---------- */
function validateCrossInvoiceDup(){
  if(typeof workingInvoices === 'undefined') return;
  const seen = new Map();
  (workingInvoices||[]).forEach((inv, ii) => (inv.patients||[]).forEach(p => {
    const pk = ((p.nationalId||'').trim() || (p.name||'').trim()).toLowerCase();
    (p.lines||[]).forEach(l => {
      const b = (Number(l.qty)||0)*(Number(l.billedUnit)||0); if(b <= 0 || !l.code) return;
      const k = pk + '‖' + String(l.code).toLowerCase();
      if(!seen.has(k)) seen.set(k, []);
      seen.get(k).push({ inv, ii, line: l });
    });
  }));
  seen.forEach(group => {
    const invs = new Set(group.map(g => g.ii));
    group.forEach(g => {
      if(invs.size > 1 && typeof flagLineAskReviewer === 'function') flagLineAskReviewer(g.line, 'dup-xinvoice');
      else if(typeof unflagLineAskReviewer === 'function') unflagLineAskReviewer(g.line, 'dup-xinvoice');
    });
  });
}
/* ---------- واجهة الإدارة في الإعدادات ---------- */
function renderLineTypeSettings(){
  const box = document.getElementById('lineTypesBox'); if(!box) return;
  const tax = getLineTaxonomy();
  const customs = (typeof appSettings !== 'undefined' && Array.isArray(appSettings.customLineTypes)) ? appSettings.customLineTypes : [];
  const isCustom = k => customs.some(c => c && c.key === k);
  box.innerHTML = tax.map(t => {
    const beh = [];
    if(t.requiresChecklist) beh.push('تدقيق:' + (t.checklistKey || t.key));
    if(t.requiresSurgery) beh.push('يستلزم جراحة');
    if(t.maxShare != null) beh.push('حصة ' + Math.round(t.maxShare * 100) + '%');
    if(t.perStayMax != null) beh.push('سقف يومي ×' + t.perStayMax);
    if(t.countVsSurg) beh.push('مقابل الإجراءات');
    return `<div class="info-row"><div style="flex:1"><div class="k">${escapeHtml(t.label || t.key)} <span style="color:var(--muted);font-weight:400">(${t.kind === 'doc' ? 'تدقيق' : 'بند'})${isCustom(t.key) ? ' · مخصص' : ''}</span></div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">كلمات: ${escapeHtml((t.keywords||[]).join('، ') || '—')}${beh.length ? ' · ' + escapeHtml(beh.join(' · ')) : ''}</div>
      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><input data-lt-kw="${escapeHtml(t.key)}" value="${escapeHtml((t.keywords||[]).join('، '))}" placeholder="كلمات دالة بفاصلة" style="flex:1;min-width:140px"><input data-lt-share="${escapeHtml(t.key)}" type="number" min="0" max="100" value="${t.maxShare != null ? Math.round(t.maxShare*100) : ''}" placeholder="حصة %" style="width:80px"></div></div>
      <div style="display:flex;gap:4px;flex:0 0 auto"><button class="btn-sm solid" data-lt-save="${escapeHtml(t.key)}">حفظ</button>${isCustom(t.key) ? `<button class="btn-sm danger" data-lt-del="${escapeHtml(t.key)}">حذف</button>` : ''}</div></div>`;
  }).join('') + `<div class="info-row"><div style="flex:1"><div class="k">نوع جديد</div>
    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><input id="ltNewKey" placeholder="مفتاح لاتيني" style="width:120px"><input id="ltNewLabel" placeholder="الاسم" style="flex:1;min-width:120px"><input id="ltNewKw" placeholder="كلمات دالة بفاصلة" style="flex:2;min-width:140px"></div>
    <div style="display:flex;gap:10px;margin-top:6px;font-size:12px;flex-wrap:wrap"><label><input type="checkbox" id="ltNewChk"> تدقيق إلزامي</label><label><input type="checkbox" id="ltNewSurg"> يستلزم جراحة</label></div></div>
    <button class="btn-sm solid" id="ltAddBtn" style="flex:0 0 auto">إضافة</button></div>`;
  box.querySelectorAll('[data-lt-save]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.ltSave;
    const kwInp = box.querySelector(`[data-lt-kw="${k}"]`);
    const shInp = box.querySelector(`[data-lt-share="${k}"]`);
    const kws = (kwInp ? kwInp.value : '').split(/[،,]/).map(s => s.trim()).filter(Boolean);
    const shRaw = shInp ? shInp.value.trim() : '';
    const patch = { key: k, keywords: kws };
    if(shRaw !== '') patch.maxShare = Math.min(100, Math.max(0, Number(shRaw))) / 100;
    _saveLineTypePatch(patch);
  }));
  box.querySelectorAll('[data-lt-del]').forEach(b => b.addEventListener('click', () => {
    if(typeof appSettings === 'undefined') return;
    appSettings.customLineTypes = (appSettings.customLineTypes || []).filter(c => c.key !== b.dataset.ltDel);
    if(typeof saveAppSettings === 'function') saveAppSettings();
    if(typeof registerTaxonomyReasons === 'function') registerTaxonomyReasons();
    renderLineTypeSettings();
  }));
  const add = document.getElementById('ltAddBtn');
  if(add) add.addEventListener('click', () => {
    const k = (document.getElementById('ltNewKey').value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const lb = (document.getElementById('ltNewLabel').value || '').trim();
    const kws = (document.getElementById('ltNewKw').value || '').split(/[،,]/).map(s => s.trim()).filter(Boolean);
    if(!k || !lb){ if(typeof showWarning === 'function') showWarning('تنبيه', 'أدخل المفتاح والاسم'); return; }
    const patch = { key: k, label: lb, kind: 'line', keywords: kws };
    if(document.getElementById('ltNewChk').checked){ patch.requiresChecklist = true; patch.checklistKey = k; }
    if(document.getElementById('ltNewSurg').checked) patch.requiresSurgery = true;
    _saveLineTypePatch(patch);
  });
}
function _saveLineTypePatch(patch){
  if(typeof appSettings === 'undefined') return;
  if(!Array.isArray(appSettings.customLineTypes)) appSettings.customLineTypes = [];
  const i = appSettings.customLineTypes.findIndex(c => c.key === patch.key);
  if(i >= 0) appSettings.customLineTypes[i] = { ...appSettings.customLineTypes[i], ...patch };
  else appSettings.customLineTypes.push(patch);
  if(typeof saveAppSettings === 'function') saveAppSettings();
  if(typeof registerTaxonomyReasons === 'function') registerTaxonomyReasons();
  if(typeof renderLineTypeSettings === 'function') renderLineTypeSettings();
  if(typeof showSuccess === 'function') showSuccess('تم', 'حُفظ النوع — يسري على كل المستشفيات فورًا');
}
