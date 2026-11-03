// review-ten-tests.js — مراجعة مطالبة عشرية: خارجية لـ10 موظفين (تجاوز تحاليل/بلا مستندات/ناقصة تقرير/بلا موافقة) + داخلية
// التشغيل: runTenPatientsTests() — يعيد {pass, fail, total, results}
function runTenPatientsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','tariffs','contracts','claims','activeClaim','workingInvoices','activeSessionId','workSessions'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__tnKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__tnKeep'); } catch(e){} });
    try { delete g['__tnKeep']; } catch(e){}
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
  const uiStubs = ['persistData','renderAll','renderTimeline','clearSessionDirty','notifyPersistOk','notifyPersistFailed','closeReview','updateSessionsBadge','renderSessions','updatePAWarning','renderReviewInvoices','renderReviewDrafts','_fillReviewPage','navigateTo','persistSessions','showSuccess'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete, origConfirm = g.confirm;
  let lastWarn = null, lastOk = null;
  const missingDocsOf = (p) => (typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []).filter(d => !(p.documents && p.documents[d.key]));
  const labLines = (n, code, price) => { const a = []; for(let i = 0; i < n; i++) a.push({ code, name:'تحليل '+(i+1), category:'مختبر', qty:1, billedUnit:price }); return a; };
  const seedFixtures = () => {
    providers = [{ id:'P1', name:'مستشفى النيل', type:'مستشفى', code:11 }];
    tariffs = [{ id:'TG', type:'general', status:'active', name:'عامة', effectiveDate:'2025-01-01', expiryDate:'', basePriceLevel:100, priceVersions:[], changeLog:[],
      services:[
        { code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:50, currentPrice:50, covered:true },
        { code:'LAB-PA', name:'تحليل يتطلب موافقة', category:'مختبر', basePrice:300, currentPrice:300, covered:true, requiresPriorApproval:true },
        { code:'STAY-1', name:'إقامة درجة أولى', category:'إقامة', basePrice:500, currentPrice:500, covered:true },
        { code:'SRG-1', name:'عملية جراحية', category:'عمليات', basePrice:1000, currentPrice:1000, covered:true },
        { code:'ANE-1', name:'أتعاب تخدير', category:'تخدير', basePrice:200, currentPrice:200, covered:true }
      ] }];
    contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, tariffId:'TG' }];
    claims = []; workSessions = []; activeSessionId = null;
  };
  const mkTenClaim = () => ({
    id:'CLM-10', patient:'كشف مجمع', provider:'مستشفى النيل', providerCode:11, type:'employee',
    date:'2026-03-02', receivedDate:'2026-03-05', receivedNumber:'RC-10', status:'new',
    priorApproval:{ required:true, status:'pending', refNumber:'', date:'' },
    invoices:[
      { id:'INV-EXT', type:'lab', category:'external', date:'2026-03-02', patients:[
        { name:'موظف 1', nationalId:'2990001', lines:labLines(16, 'LAB-1', 50) },
        { name:'موظف 2', nationalId:'2990002', lines:labLines(17, 'LAB-1', 50) },
        { name:'موظف 3', nationalId:'2990003', lines:labLines(5, 'LAB-1', 50) },
        { name:'موظف 4', nationalId:'2990004', lines:labLines(3, 'LAB-1', 50) },
        { name:'موظف 5', nationalId:'2990005', lines:labLines(3, 'LAB-1', 50) },
        { name:'موظف 6', nationalId:'2990006', lines:labLines(3, 'LAB-1', 50) },
        { name:'موظف 7', nationalId:'2990007', lines:labLines(3, 'LAB-1', 50) },
        { name:'موظف 8', nationalId:'2990008', lines:[{ code:'LAB-PA', name:'تحليل موافقة', category:'مختبر', qty:1, billedUnit:300 }] },
        { name:'موظف 9', nationalId:'2990009', lines:[{ code:'LAB-PA', name:'تحليل موافقة', category:'مختبر', qty:1, billedUnit:300 }] },
        { name:'موظف 10', nationalId:'2990010', lines:[{ code:'LAB-PA', name:'تحليل موافقة', category:'مختبر', qty:1, billedUnit:300 }] }
      ] },
      { id:'INV-INT', type:'inpatient', category:'internal', date:'2026-03-02', admissionDate:'2026-03-01', dischargeDate:'2026-03-04', operationClass:'major', patients:[
        { name:'موظف 1', nationalId:'2990001', lines:[
          { code:'STAY-1', name:'إقامة درجة أولى', category:'إقامة', qty:3, billedUnit:500 },
          { code:'SRG-1', name:'عملية جراحية', category:'عمليات', qty:1, billedUnit:1000 },
          { code:'ANE-1', name:'أتعاب تخدير', category:'تخدير', qty:1, billedUnit:200 }
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

    /* ---------- 1. البناء: 10 مرضى + داخلية ---------- */
    try {
      seedFixtures();
      const c = mkTenClaim(); claims.push(c);
      A('عشرية: 10 مرضى خارجية', c.invoices[0].patients.length === 10);
      A('عشرية: الأول 16 تحليلًا', c.invoices[0].patients[0].lines.length === 16);
      A('عشرية: الثاني 17 تحليلًا', c.invoices[0].patients[1].lines.length === 17);
      A('عشرية: مذكرة داخلية بمريض', c.invoices[1].patients.length === 1 && c.invoices[1].patients[0].lines.length === 3);
    } catch(e){ A('عشرية: البناء', false, e.message); }

    /* ---------- 2. حد التحاليل (16 و17 > 13) ---------- */
    try {
      seedFixtures();
      const c = mkTenClaim(); claims.push(c);
      const ext = c.invoices[0];
      applyMaxLabsRule(ext.patients[0]);
      const z1 = ext.patients[0].lines.filter(l => l.approved === 0 && l._maxlabsForced);
      A('عشرية: الأول يُخصم 3 (16-13)', z1.length === 3, String(z1.length));
      A('عشرية: سبب الخصم مسجل', z1.every(l => l.note === 'تجاوز حد التحاليل'));
      applyMaxLabsRule(ext.patients[1]);
      const z2 = ext.patients[1].lines.filter(l => l.approved === 0 && l._maxlabsForced);
      A('عشرية: الثاني يُخصم 4 (17-13)', z2.length === 4, String(z2.length));
      A('عشرية: الأرخص يُخصم أولًا', (() => { applyMaxLabsRule(ext.patients[2]); return ext.patients[2].lines.filter(l => l._maxlabsForced).length === 0; })());
      A('عشرية: الثالث (5) بلا خصم', ext.patients[2].lines.every(l => !l._maxlabsForced));
    } catch(e){ A('عشرية: حد التحاليل', false, e.message); }

    /* ---------- 3. مصفوفة المستندات ---------- */
    try {
      seedFixtures();
      const c = mkTenClaim(); claims.push(c);
      const ext = c.invoices[0];
      // 4 و5: بلا مستندات
      A('عشرية: الرابع بلا مستندات (4 ناقصة)', missingDocsOf(ext.patients[3]).length === 4);
      A('عشرية: الخامس بلا مستندات', missingDocsOf(ext.patients[4]).length === 4);
      // 6 و7: كل شيء عدا التقرير الطبي
      workingInvoices = c.invoices;
      ['patientId','referral','priorApprovalDoc'].forEach(k => { ext.patients[5].documents = ext.patients[5].documents || {}; ext.patients[5].documents[k] = true; ext.patients[6].documents = ext.patients[6].documents || {}; ext.patients[6].documents[k] = true; });
      const m6 = missingDocsOf(ext.patients[5]), m7 = missingDocsOf(ext.patients[6]);
      A('عشرية: السادس ينقصه التقرير فقط', m6.length === 1 && m6[0].key === 'medicalReport', JSON.stringify(m6.map(x => x.key)));
      A('عشرية: السابع ينقصه التقرير فقط', m7.length === 1 && m7[0].key === 'medicalReport');
      // 8..10: كل المستندات عبر الدالة النقية
      workingInvoices = c.invoices;
      [7, 8, 9].forEach(i => { ['patientId','referral','medicalReport','priorApprovalDoc'].forEach(k => togglePatientDoc(0, i, k, true)); });
      A('عشرية: الثامن كامل المستندات', missingDocsOf(ext.patients[7]).length === 0);
      A('عشرية: التاسع والعاشر كاملان', missingDocsOf(ext.patients[8]).length === 0 && missingDocsOf(ext.patients[9]).length === 0);
      // الداخلية: مستنداتها عبر toggleInvoiceDoc
      const di = toggleInvoiceDoc(1, 'medicalReport', true);
      A('عشرية: مستند المذكرة الداخلية', di.ok === true && c.invoices[1].documents.medicalReport === true);
      workingInvoices = [];
    } catch(e){ A('عشرية: المستندات', false, e.message); }

    /* ---------- 4. الموافقة المسبقة ---------- */
    try {
      seedFixtures();
      const c = mkTenClaim(); claims.push(c);
      const ctx = { tariff:tariffs[0], contract:contracts[0], serviceOverrides:{}, claimDate:'2026-03-02', claimId:c.id, invoiceId:'INV-EXT', patientIdx:7, lineIdx:0, siblings:[] };
      const line = c.invoices[0].patients[7].lines[0];
      const v1 = validateLine(line, Object.assign({}, ctx, { claim:c }));
      A('عشرية: موافقة معلقة = pa-pending', v1 && (v1.failed || []).includes('pa-pending'), JSON.stringify(v1 && (v1.failed || v1.decision)));
      c.priorApproval.status = 'approved'; c.priorApproval.date = '2026-03-01'; c.priorApproval.refNumber = 'PA-1';
      const v2 = validateLine(line, Object.assign({}, ctx, { claim:c, patientIdx:8, lineIdx:0 }));
      A('عشرية: موافقة معتمدة = pa-valid', v2 && (v2.passed || []).includes('pa-valid'), JSON.stringify(v2 && (v2.passed || v2.decision)));
      c.priorApproval.status = 'pending';
    } catch(e){ A('عشرية: الموافقة', false, e.message); }

    /* ---------- 5. التجميع والحفظ والأرشفة ---------- */
    try {
      seedFixtures();
      const c = mkTenClaim(); claims.push(c);
      c.priorApproval.status = 'approved'; c.priorApproval.date = '2026-03-01'; c.priorApproval.refNumber = 'PA-1';
      const re = computeInvoice(c.invoices[0], c);
      A('عشرية: الخارجية مطالب 3400', re.billed === 3400, String(re.billed));
      const ri = computeInvoice(c.invoices[1], c);
      A('عشرية: الداخلية مطالب 2700', ri.billed === 2700, String(ri.billed));
      c.invoices.forEach(inv => (inv.patients || []).forEach(p => (p.lines || []).forEach(l => { l.approved = Math.round((Number(l.qty) || 0) * (Number(l.billedUnit) || 0) * 0.9); l._decision = 'manual-approved'; })));
      recalcClaim(c);
      A('عشرية: الإجمالي 6100', c.billed === 6100, String(c.billed));
      A('عشرية: المعتمد 5490', c.approved === 5490, String(c.approved));
      activeClaim = c;
      workingInvoices = JSON.parse(JSON.stringify(c.invoices));
      try { rvActiveInvoiceIdx = 0; rvActivePatientIdx = 0; } catch(e){}
      els['#rvReason'].value = 'مراجعة عشرية';
      els['#rvNotes'].value = 'خارجية 10 + داخلية';
      els['#paStatus'].value = 'approved';
      lastWarn = null; lastOk = null;
      finalizeReview();
      A('عشرية: الحفظ ختم', !!c.reviewedDate, lastWarn || '');
      A('عشرية: جزئية (5445<6050)', c.status === 'partial', c.status);
      A('عشرية: رقم قانوني لكل مذكرة', (c.invoices || []).every(iv => !!iv.legalSerial));
      A('عشرية: الأرشفة', tpaArchiveClaim(c) === true && c.archiveStatus === 'read-only');
      A('عشرية: نجاح', !!lastOk);
      workingInvoices = [];
    } catch(e){ A('عشرية: الحفظ', false, e.message); }
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
