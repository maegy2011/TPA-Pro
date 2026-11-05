// lifecycle-tests.js — اختبار دورة العمل الكاملة: جهة → لائحة/خدمة → عقد → وارد → مطالبة → مراجعة → حفظ → أرشفة
// التشغيل: runLifecycleTests() — يعيد {pass, fail, total, results}
function runLifecycleTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','tariffs','contracts','batches','claims','workSessions','activeClaim','workingInvoices','activeSessionId'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__lcKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__lcKeep'); } catch(e){} });
    try { delete g['__lcKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, click(){}, focus(){} });
  ['btProvider','btPeriodType','btMonth','btClaimReceivedDate','btStatus','btBilled','btNotes','btNumber','batchModal','rvReason','rvNotes','paStatus','paRefNumber','paDate','rvSub','rvId','rvDate','rvReceivedNumber','rvReceivedDate','rvPatient','rvProvider','priorApprovalBox','pvName','pvContact','pvPhone','pvEmail','pvNotes','pvType','pvProvinceSearch','providerModal'].forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['persistData','renderIntake','updateBackupStats','renderAll','renderTimeline','clearSessionDirty','notifyPersistOk','notifyPersistFailed','closeReview','updateSessionsBadge','renderSessions','updatePAWarning','renderReviewInvoices','renderReviewDrafts','_fillReviewPage','navigateTo'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => {}; } catch(e){} });
  const origPersist = g.persistData;
  const origWarn = g.showWarning, origOk = g.showSuccess, origInfo = g.showInfo, origToast = g.showToast, origDel = g.showDelete;
  let lastWarn = null, lastOk = null;
  const origConfirm = g.confirm;
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    g.persistData = () => true;
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showInfo = () => {}; g.showToast = () => {};
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };
    try { g.confirm = () => false; } catch(e){}

    let claimId = null;
    /* ---------- 1. تسجيل 5 جهات كاملة ---------- */
    const FIVE = [
      { name:'مستشفى النيل', type:'مستشفى', contact:'مدير الاستقبال', phone:'01001234567', email:'nile@hospital.com', notes:'جهة دورة 1' },
      { name:'معمل الشمس', type:'معمل تحاليل', contact:'مسؤول المعمل', phone:'01112345678', email:'sun@lab.com', notes:'جهة دورة 2' },
      { name:'مركز الأمل للأشعة', type:'مركز أشعة', contact:'منسق المركز', phone:'01223456789', email:'amal@rad.com', notes:'جهة دورة 3' },
      { name:'مستشفى السلام', type:'مستشفى', contact:'إدارة المطالبات', phone:'01534567890', email:'salam@hospital.com', notes:'جهة دورة 4' },
      { name:'عيادة الفجر', type:'عيادة', contact:'طبيب العيادة', phone:'01045678901', email:'fajr@clinic.com', notes:'جهة دورة 5' }
    ];
    const FIVE_IDS = [];
    try {
      providers = []; tariffs = []; contracts = []; batches = []; claims = []; workSessions = [];
      try { editingProviderId = null; } catch(e){}
      FIVE.forEach((f, i) => {
        els['#pvName'].value = f.name;
        els['#pvContact'].value = f.contact;
        els['#pvPhone'].value = f.phone;
        els['#pvEmail'].value = f.email;
        els['#pvNotes'].value = f.notes;
        els['#pvType'].value = f.type;
        lastWarn = null;
        saveProvider();
        const p = providers.find(x => x.name === f.name);
        A(`دورة: جهة ${i+1} مسجلة (${f.name})`, !!p && !lastWarn, lastWarn || '');
        if(p) FIVE_IDS.push(p.id);
      });
      A('دورة: 5 جهات كاملة', providers.length === 5, String(providers.length));
      const codes = providers.map(p => p.code);
      A('دورة: أكواد فريدة متسلسلة 1..5', JSON.stringify([...codes].sort((a,b) => a-b)) === JSON.stringify([1,2,3,4,5]));
      A('دورة: بيانات التواصل محفوظة', providers.every(p => p.phone && p.email && p.contact));
      ensureProviderCodes();
      A('دورة: الأكواد ثابتة بعد الترحيل', JSON.stringify(providers.map(p => p.code).sort((a,b) => a-b)) === JSON.stringify([1,2,3,4,5]));
      // بوابة: تكرار الاسم مرفوض
      els['#pvName'].value = FIVE[0].name; els['#pvPhone'].value = '01099999999'; els['#pvEmail'].value = 'x@x.com'; els['#pvContact'].value = 'س'; els['#pvNotes'].value = ''; els['#pvType'].value = 'مستشفى';
      lastWarn = null; saveProvider();
      A('دورة: تكرار اسم الجهة مرفوض', !!lastWarn && providers.length === 5);
    } catch(e){ A('دورة: الجهات', false, e.message); }

    /* ---------- 2. خمس لوائح وخدمات ---------- */
    try {
      FIVE_IDS.forEach((pid, i) => {
        tariffs.push({ id:'TG'+(i+1), type:(i % 2 ? 'private' : 'general'), status:'active', name:'لائحة جهة '+(i+1), effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[],
          services:[{ code:'LAB-'+(i+1), name:'تحليل دم '+(i+1), category:'مختبر', basePrice:100*(i+1), currentPrice:100*(i+1), covered:true }] });
      });
      A('دورة: 5 لوائح', tariffs.length === 5);
      const v = getTariffVersionForDate(tariffs[0], '2026-03-01');
      A('دورة: نسخة اللائحة سارية بتاريخ الإجراء', !!v);
      const svc = getTariffServicesForDate(tariffs[0], '2026-03-01').find(s => s.code === 'LAB-1');
      A('دورة: الخدمة بسعرها 100', svc?.currentPrice === 100);
    } catch(e){ A('دورة: اللوائح', false, e.message); }

    /* ---------- 3. خمسة عقود ---------- */
    try {
      FIVE_IDS.forEach((pid, i) => {
        contracts.push({ id:'C'+(i+1), providerId:pid, startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG'+(i+1) });
      });
      A('دورة: 5 عقود', contracts.length === 5);
      const ctx = getContractContext({ providerCode:1, date:'2026-03-01' });
      A('دورة: سياق العقد (جهة+تاريخ)', !!(ctx?.contract && ctx.tariff));
      A('دورة: العقد يخصم 10%', ctx.contract.discountRate === 10);
      const allCtx = providers.every(p => { const c = getContractContext({ providerCode:p.code, date:'2026-03-01' }); return !!(c?.contract && c.tariff); });
      A('دورة: كل جهة لها سياق عقد', allCtx);
    } catch(e){ A('دورة: العقود', false, e.message); }

    /* ---------- 4. الوارد → مطالبة ---------- */
    try {
      const pid0 = FIVE_IDS[0];
      const vchk = validateBatchInput({ providerId:pid0, month:'2026-03', billed:100, contractsList:contracts });
      A('دورة: الوارد صالح', vchk.ok, vchk.msg || '');
      els['#btProvider'].value = FIVE_IDS[0];
      els['#btPeriodType'].value = 'monthly';
      els['#btMonth'].value = '2026-03';
      els['#btClaimReceivedDate'].value = '2026-03-05';
      els['#btStatus'].value = 'new';
      els['#btBilled'].value = '100';
      els['#btNotes'].value = 'دفعة اختبار دورة';
      els['#btNumber'].value = 'RC-900';
      try { editingBatchId = null; } catch(e){}
      lastWarn = null; lastOk = null;
      saveBatch(false);
      A('دورة: الدفعة حُفظت', batches.length === 1 && batches[0].receivedNumber === 'RC-900');
      A('دورة: المطالبة تولدت مرتبطة', claims.length === 1 && claims[0].batchId === batches[0].id);
      claimId = claims[0].id;
      A('دورة: حالة جديدة ومبلغ 100', claims[0].status === 'new' && claims[0].billed === 100);
      A('دورة: رسالة نجاح الوارد', !!lastOk && !lastWarn, lastWarn || '');
    } catch(e){ A('دورة: الوارد', false, e.message); }

    /* ---------- 5. المراجعة: بند وقرار ---------- */
    try {
      const c = getClaimById(claimId);
      c.invoices = [{ id:'INV-1', date:'2026-03-01', type:'lab', patients:[{ name:'مريض الدورة', nationalId:'2990101', lines:[{ code:'LAB-1', name:'تحليل دم', qty:1, billedUnit:100 }] }] }];
      const am = computeLineAmounts({ code:'LAB-1', qty:1, billedUnit:100 }, { tariff:tariffs[0], contract:contracts[0], serviceOverrides:{} }, '2026-03-01');
      A('دورة: الحساب بعد خصم العقد = 90', am?.afterContract === 90, String(am?.afterContract));
      const line = c.invoices[0].patients[0].lines[0];
      const vr = validateLine(line, { tariff:tariffs[0], contract:contracts[0], serviceOverrides:{}, claimDate:'2026-03-01', claimId, invoiceId:'INV-1', patientIdx:0, lineIdx:0, siblings:[] });
      A('دورة: البند المغطى بلا رفض تلقائي', vr?.decision !== 'auto-rejected', String(vr?.decision));
      line.approved = 90; line._decision = 'manual-approved';
      recalcClaim(c);
      A('دورة: المطالب به 100 والمعتمد 90', c.billed === 100 && c.approved === 90, `${c.billed}/${c.approved}`);
    } catch(e){ A('دورة: المراجعة', false, e.message); }

    /* ---------- 6. الحفظ ---------- */
    try {
      const c = getClaimById(claimId);
      activeClaim = c;
      workingInvoices = JSON.parse(JSON.stringify(c.invoices));
      try { rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0; } catch(e){}
      els['#rvReason'].value = 'مراجعة دورة كاملة';
      els['#rvNotes'].value = 'ملاحظة الدورة';
      lastWarn = null; lastOk = null;
      finalizeReview();
      A('دورة: الحفظ ختم بتاريخ', !!c.reviewedDate);
      A('دورة: الحالة جزئية (90<100)', c.status === 'partial', c.status);
      A('دورة: رقم قانوني للمذكرة', (c.invoices || []).every(iv => !!iv.legalSerial));
      A('دورة: رسالة نجاح الحفظ', !!lastOk, lastWarn || '');
      // تجميد المحفوظ
      const before = c.approved;
      c.invoices[0].patients[0].lines[0].approved = 0;
      recalcClaim(c);
      A('دورة: المحفوظ مجمد بلا فتح', c.approved === before, `${c.approved}/${before}`);
    } catch(e){ A('دورة: الحفظ', false, e.message); }

    /* ---------- 7. الأرشفة ---------- */
    try {
      const c = getClaimById(claimId);
      A('دورة: الأرشفة ترفض غير المحسومة؟ (محسومة هنا)', c.status === 'partial');
      const ok = tpaArchiveClaim(c);
      A('دورة: الأرشفة تمت', ok === true && c.archived === true && c.archiveStatus === 'read-only');
      A('دورة: فلتر الكل يستبعدها', filterClaimsList(claims, 'all', '').length === 0);
      A('دورة: فلتر الأرشيف يجدها', filterClaimsList(claims, 'archived', '').length === 1);
      const pend = getClaimById('NOPE');
      A('دورة: أرشفة مطالبة جديدة مرفوضة', (() => { const nc = { id:'TMP', status:'new' }; lastWarn = null; const r = tpaArchiveClaim(nc); return r === false && !!lastWarn; })());
    } catch(e){ A('دورة: الأرشفة', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origQS) document.querySelector = origQS; } catch(e){} try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    try { if(origPersist === undefined) delete g.persistData; else g.persistData = origPersist; } catch(e){}
    try { if(origWarn === undefined) delete g.showWarning; else g.showWarning = origWarn; } catch(e){}
    try { if(origOk === undefined) delete g.showSuccess; else g.showSuccess = origOk; } catch(e){}
    try { if(origInfo === undefined) delete g.showInfo; else g.showInfo = origInfo; } catch(e){}
    try { if(origToast === undefined) delete g.showToast; else g.showToast = origToast; } catch(e){}
    try { if(origDel === undefined) delete g.showDelete; else g.showDelete = origDel; } catch(e){}
    try { if(origConfirm === undefined) delete g.confirm; else g.confirm = origConfirm; } catch(e){}
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
