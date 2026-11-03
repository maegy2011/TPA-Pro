// review-mixed-tests.js — اختبار مراجعة مطالبة بفواتير داخلية وخارجية
// داخلية (إقامة: إقامة/جراحة/تخدير/فحص الإقامة) + خارجية (معمل: بلا تحقق إقامة) + تجميع وحفظ وأرشفة.
// التشغيل: runMixedInvoicesTests() — يعيد {pass, fail, total, results}
function runMixedInvoicesTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','tariffs','contracts','claims','activeClaim','workingInvoices','activeSessionId','workSessions'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__mxKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__mxKeep'); } catch(e){} });
    try { delete g['__mxKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, click(){}, focus(){} });
  ['rvReason','rvNotes','paStatus','paRefNumber','paDate','rvSub','rvId','rvDate','rvReceivedNumber','rvReceivedDate','rvPatient','rvProvider','priorApprovalBox'].forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['persistData','renderAll','renderTimeline','clearSessionDirty','notifyPersistOk','notifyPersistFailed','closeReview','updateSessionsBadge','renderSessions','updatePAWarning','renderReviewInvoices','renderReviewDrafts','_fillReviewPage','navigateTo','persistSessions'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete, origConfirm = g.confirm;
  let lastWarn = null, lastOk = null;
  const seedFixtures = () => {
    providers = [{ id:'P1', name:'مستشفى النيل', type:'مستشفى', code:11 }];
    tariffs = [{ id:'TG', type:'general', status:'active', name:'عامة', effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[],
      services:[
        { code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:100, covered:true },
        { code:'STAY-1', name:'إقامة درجة أولى', category:'إقامة', basePrice:500, currentPrice:500, covered:true },
        { code:'SRG-1', name:'عملية جراحية', category:'عمليات', basePrice:1000, currentPrice:1000, covered:true },
        { code:'ANE-1', name:'أتعاب تخدير', category:'تخدير', basePrice:200, currentPrice:200, covered:true }
      ] }];
    contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
    claims = []; workSessions = []; activeSessionId = null;
  };
  const mkClaim = () => ({
    id:'CLM-MX', patient:'مريض مختلط', provider:'مستشفى النيل', providerCode:11, type:'employee',
    date:'2026-03-02', receivedDate:'2026-03-05', receivedNumber:'RC-MX', status:'new',
    priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' },
    invoices:[
      { id:'INV-EXT', type:'lab', category:'external', date:'2026-03-02', patients:[
        { name:'مريض مختلط', nationalId:'2990101', lines:[
          { code:'LAB-1', name:'تحليل دم', qty:2, billedUnit:100 }
        ] }
      ] },
      { id:'INV-INT', type:'inpatient', category:'internal', date:'2026-03-02', admissionDate:'2026-03-01', dischargeDate:'2026-03-04', operationClass:'major', patients:[
        { name:'مريض مختلط', nationalId:'2990101', lines:[
          { code:'STAY-1', name:'إقامة درجة أولى', qty:3, billedUnit:500 },
          { code:'SRG-1', name:'عملية جراحية', qty:1, billedUnit:1000 },
          { code:'ANE-1', name:'أتعاب تخدير', qty:1, billedUnit:200 }
        ] }
      ] }
    ], billed:0
  });
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    g.persistData = () => true;
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };
    try { g.confirm = () => false; } catch(e){}

    /* ---------- 1. التصنيف داخلي/خارجي ---------- */
    try {
      seedFixtures();
      A('مختلط: المعمل خارجية', isExternalInvoice({ type:'lab' }) === true);
      A('مختلط: الداخلية صريحة', isExternalInvoice({ type:'inpatient', category:'internal' }) === false);
      A('مختلط: الإقامة ضمنيًا داخلية', isExternalInvoice({ type:'inpatient' }) === false);
      A('مختلط: تسمية الفئة', invoiceCategoryLabel({ type:'lab' }) === 'خارجية' && invoiceCategoryLabel({ type:'inpatient', category:'internal' }) === 'داخلية');
    } catch(e){ A('مختلط: التصنيف', false, e.message); }

    /* ---------- 2. الخارجية: حساب بلا تحقق إقامة ---------- */
    try {
      seedFixtures();
      const c = mkClaim(); claims.push(c);
      const ext = c.invoices[0];
      const r = computeInvoice(ext, c);
      A('مختلط: الخارجية مطالب 200', r.billed === 200, String(r.billed));
      const noStay = !(ext.patients[0].lines[0]._checksFailed || []).some(f => String(f).includes('stay') || String(f).includes('link-'));
      A('مختلط: الخارجية بلا أعلام إقامة', noStay, JSON.stringify(ext.patients[0].lines[0]._checksFailed || []));
    } catch(e){ A('مختلط: الخارجية', false, e.message); }

    /* ---------- 3. الداخلية: فحص الإقامة والتخدير ---------- */
    try {
      seedFixtures();
      const c = mkClaim(); claims.push(c);
      const inter = c.invoices[1];
      const r = computeInvoice(inter, c);
      A('مختلط: الداخلية مطالب 2700', r.billed === 2700, String(r.billed));
      const stay = inter.patients[0].lines[0];
      A('مختلط: إقامة مطابقة بلا stay-mismatch', !(stay._checksFailed || []).includes('stay-mismatch'));
      const ane = inter.patients[0].lines[2];
      A('مختلط: تخدير موجود بلا link-anesthesia', !(ane._checksFailed || []).some(f => String(f).includes('anesthesia')));
      // كسر الإقامة
      stay.qty = 2; computeInvoice(inter, c);
      A('مختلط: فرق الإقامة يُعلَّم', (stay._checksFailed || []).includes('stay-mismatch'));
      stay.qty = 3;
      // حذف التخدير
      const dropped = inter.patients[0].lines.splice(2, 1);
      computeInvoice(inter, c);
      const srg = inter.patients[0].lines[1];
      A('مختلط: جراحة بلا تخدير تُعلَّم', (srg._checksFailed || []).some(f => String(f).includes('anesthesia')), JSON.stringify(srg._checksFailed || []));
      inter.patients[0].lines.push(dropped[0]);
      computeInvoice(inter, c);
      A('مختلط: عودة التخدير تزيل العلم', !(srg._checksFailed || []).some(f => String(f).includes('anesthesia')));
    } catch(e){ A('مختلط: الداخلية', false, e.message); }

    /* ---------- 4. التجميع على مستوى المطالبة ---------- */
    try {
      seedFixtures();
      const c = mkClaim(); claims.push(c);
      c.invoices.forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => { l.approved = Math.round((Number(l.qty) || 0) * (Number(l.billedUnit) || 0) * 0.9); l._decision = 'manual-approved'; })));
      recalcClaim(c);
      A('مختلط: الإجمالي 2900', c.billed === 2900, String(c.billed));
      A('مختلط: المعتمد 2610', c.approved === 2610, String(c.approved));
      A('مختلط: مذكرتان', c.invoices.length === 2);
    } catch(e){ A('مختلط: التجميع', false, e.message); }

    /* ---------- 5. حفظ وأرشفة المطالبة المختلطة ---------- */
    try {
      seedFixtures();
      const c = mkClaim(); claims.push(c);
      c.invoices.forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => { l.approved = Math.round((Number(l.qty) || 0) * (Number(l.billedUnit) || 0) * 0.9); l._decision = 'manual-approved'; })));
      activeClaim = c;
      workingInvoices = JSON.parse(JSON.stringify(c.invoices));
      try { rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0; } catch(e){}
      els['#rvReason'].value = 'مراجعة مختلطة';
      els['#rvNotes'].value = 'داخلية + خارجية';
      lastWarn = null; lastOk = null;
      finalizeReview();
      A('مختلط: الحفظ ختم', !!c.reviewedDate, lastWarn || '');
      A('مختلط: الحالة جزئية', c.status === 'partial', c.status);
      A('مختلط: رقم قانوني لكل مذكرة', (c.invoices || []).every(iv => !!iv.legalSerial) && new Set(c.invoices.map(iv => iv.legalSerial)).size === 2);
      const okA = tpaArchiveClaim(c);
      A('مختلط: الأرشفة', okA === true && c.archiveStatus === 'read-only');
      A('مختلط: رسالة نجاح', !!lastOk);
    } catch(e){ A('مختلط: الحفظ', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origQS) document.querySelector = origQS; } catch(e){} try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    try { if(origWarn === undefined) delete g.showWarning; else g.showWarning = origWarn; } catch(e){}
    try { if(origOk === undefined) delete g.showSuccess; else g.showSuccess = origOk; } catch(e){}
    try { if(origDel === undefined) delete g.showDelete; else g.showDelete = origDel; } catch(e){}
    try { if(origConfirm === undefined) delete g.confirm; else g.confirm = origConfirm; } catch(e){}
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
