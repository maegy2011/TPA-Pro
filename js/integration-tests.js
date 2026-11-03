// integration-tests.js — اختبارات تكامل المحركين مع النماذج والشاشات
// التشغيل في المتصفح: runIntegrationTests() — يعيد {pass, fail, total, results}
// التغطية: الوارد ← العقود ← اللوائح ← القواعد ← المراجعة ← التخريج ← القرص.
function _itAssert(name, cond, extra){
  return { name, ok: !!cond, extra: extra === undefined ? '' : String(extra).slice(0,200) };
}
function _itSnap(){ // حفظ واستعادة العموميات — عبر eval غير مباشر (روابط let لا تُستعاد عبر globalThis)
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','contracts','tariffs','claims','batches','deductionRules','workingInvoices'].forEach(k => {
    try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; }
  });
  return () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__itKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__itKeep'); } catch(e){} }); try { delete g['__itKeep']; } catch(e){} };
}
function runIntegrationTests(){
  const R = [];
  const A = (n,c,x) => R.push(_itAssert(n,c,x));
  const restore = _itSnap();
  try {
    /* ---------- 1. النماذج: تطبيع + شكل + مصنع ---------- */
    try {
      const c = mkClaim({ provider:'مستشفى', providerCode:7 });
      A('نموذج: mkClaim يولد معرفًا ويطبّع', c.id && c.invoices && c._modelVersion === 2);
      c.invoices.push({ id:'I1', patients:[{ lines:[{}] }] });
      const n = normalizeClaim(c);
      A('نموذج: بند فارغ يُملأ افتراضيًا', n.claim.invoices[0].patients[0].lines[0].qty === 1 && n.fixed > 0);
      const iss = validateClaimShape({ id:'X', invoices:[{ id:'I', patients:[{ lines:[{ qty:0 }] }] }] });
      A('نموذج: شكل فاسد يُكتشف (كود/كمية)', iss.length >= 2, iss.slice(0,2).join('|'));
      const p = { number:'DN-1' }; normalizeInvoice(p, 'employee');
      A('نموذج: توحيد number/debitNoteNumber', p.debitNoteNumber === 'DN-1');
    } catch(e){ A('نموذج', false, e.message); }

    /* ---------- 2. الوارد: شكل المطالبة الواردة + شرط التعاقد ---------- */
    try {
      providers = [{ id:'P1', name:'مستشفى النيل', code:11 }];
      contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10, excludedServices:[] }];
      tariffs = [{ id:'T1', status:'active', effectiveDate:'2025-01-01', services:[{ code:'LAB-1', currentPrice:100 }] }];
      const ctxOk = getContractContext({ providerCode:11, date:'2026-01-15' });
      A('وارد: جهة متعاقدة تُحل لعقد', !!(ctxOk.contract && ctxOk.contract.id === 'C1'));
      const ctxNo = getContractContext({ provider:'جهة غريبة', date:'2026-01-15' });
      A('وارد: جهة بلا عقد = بلا عقد (تُرفض في الوارد)', !ctxNo.contract);
      const shape = normalizeClaim({ id:'CLM-W', providerCode:11, date:'2026-01-15', invoices:[] });
      A('وارد: مطالبة واردة صالحة الشكل', validateClaimShape(shape.claim).length === 0);
    } catch(e){ A('وارد', false, e.message); }

    /* ---------- 3. العقود: أفضلية فعال>أحدث + نسخة الخصم بالتاريخ ---------- */
    try {
      providers = [{ id:'P1', name:'مستشفى النيل', code:11 }];
      contracts = [
        { id:'C-OLD', providerId:'P1', startDate:'2024-01-01', endDate:'2024-12-31', discountRate:5 },
        { id:'C-NEW', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10,
          rateVersions:[{ effectiveFrom:'2025-01-01', effectiveTo:'2025-12-31', discountRate:10 },{ effectiveFrom:'2026-01-01', effectiveTo:'', discountRate:15 }] }
      ];
      tariffs = [];
      const c25 = getContractContext({ providerCode:11, date:'2025-06-01' });
      const c26 = getContractContext({ providerCode:11, date:'2026-06-01' });
      A('عقود: نسخة الخصم حسب تاريخ البند (10 ثم 15)', c25.contract.discountRate === 10 && c26.contract.discountRate === 15, `${c25.contract.discountRate}/${c26.contract.discountRate}`);
      const cOld = getContractContext({ providerCode:11, date:'2024-06-01' });
      A('عقود: التاريخ القديم يحل للعقد القديم', cOld.contract && cOld.contract.id === 'C-OLD');
    } catch(e){ A('عقود', false, e.message); }

    /* ---------- 4. اللوائح: نسخة بالتاريخ + زيادة مركبة + دمج بالأولوية ---------- */
    try {
      const t = { id:'T1', status:'active', effectiveDate:'2025-01-01',
        priceVersions:[{ effectiveDate:'2025-01-01', expiryDate:'2025-12-31', services:[{code:'X',currentPrice:100}] }],
        services:[{ code:'X', currentPrice:120 }] };
      const v25 = getTariffVersionForDate(t, '2025-06-01');
      const v26 = getTariffVersionForDate(t, '2026-06-01');
      A('لوائح: نسخة السعر حسب التاريخ', v25.services[0].currentPrice === 100 && v26.services[0].currentPrice === 120);
      const f = getContractIncreaseFactor({ increaseHistory:[{date:'2025-01-01',rate:10},{date:'2026-01-01',rate:10}] }, '2026-06-01');
      A('لوائح: الزيادة مركبة (1.21)', Math.abs(f - 1.21) < 0.0001, String(f));
      const f1 = getContractIncreaseFactor({ increaseHistory:[{date:'2025-01-01',rate:10}] }, '2024-01-01');
      A('لوائح: الزيادة لا تسبق تاريخها', f1 === 1);
      providers = [{ id:'P1', name:'م', code:11 }];
      contracts = [{ id:'C1', providerId:'P1', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:0, tariffId:'TG' }];
      tariffs = [
        { id:'TG', type:'general', status:'active', effectiveDate:'2025-01-01', services:[{code:'X',currentPrice:50}] },
        { id:'TP', type:'private', status:'active', effectiveDate:'2025-01-01', linkedContractIds:['C1'], services:[{code:'X',currentPrice:80}] }
      ];
      const ctx = getContractContext({ providerCode:11, date:'2026-01-01' });
      const svc = (ctx.tariff.services||[]).find(s => s.code === 'X');
      A('لوائح: الخاصة تغلب العامة عند الدمج', svc && svc.currentPrice === 80, String(svc && svc.currentPrice));
    } catch(e){ A('لوائح', false, e.message); }

    /* ---------- 5. التغطية: خاص يغلب مستثنى + استثناء يوقف ---------- */
    try {
      const T = s => ({ services: s });
      A('تغطية: مستثنى بلا خاص = مرفوض', isServiceCovered({ tariff:T([]), contract:{ excludedServices:['MRI-01'] }, serviceOverrides:{} }, 'MRI-01') === false);
      A('تغطية: خاص يغلب المستثنى', isServiceCovered({ tariff:T([]), contract:{ excludedServices:['MRI-01'] }, serviceOverrides:{ 'MRI-01':{ covered:true } } }, 'MRI-01') === true);
      const am = computeLineAmounts({ code:'MRI-01', qty:1, billedUnit:1000 }, { tariff:T([{code:'MRI-01',currentPrice:1000}]), contract:{ discountRate:10, excludedServices:['MRI-01'] }, serviceOverrides:{ 'MRI-01':{ covered:true } } }, '2026-01-01');
      A('تغطية: المبلغ يعكس الغلبة (900)', am.covered === true && am.afterContract === 900, String(am.afterContract));
    } catch(e){ A('تغطية', false, e.message); }

    /* ---------- 6. القواعد: سقف 3 + أولوية + رجعية + ميتة ---------- */
    try {
      deductionRules = [
        { id:'R1', name:'ق1', action:'reduce_by_percent', rate:10, priority:1, enabled:true, active:true },
        { id:'R2', name:'ق2', action:'reduce_by_percent', rate:20, priority:5, enabled:true, active:true },
        { id:'R3', name:'ق3', action:'reduce_by_percent', rate:30, priority:3, enabled:true, active:true },
        { id:'R4', name:'ق4', action:'reduce_by_percent', rate:40, priority:2, enabled:true, active:true },
        { id:'R5', name:'ق5', action:'reduce_by_percent', rate:50, priority:4, enabled:true, active:true }
      ];
      const s = sortRulesByPriority(deductionRules);
      A('قواعد: الأولوية تنازليًا', s[0].id === 'R2' && s[4].id === 'R1');
      const pat = { id:'P', lines:[{ code:'X', name:'بند', qty:1, billedUnit:1000 }] };
      computePatient(pat, { id:'C', type:'employee', date:'2026-01-01', providerCode:11, priorApproval:{ required:false } }, '2026-01-01', { id:'I', date:'2026-01-01' });
      const ln = pat.lines[0];
      A('قواعد: سقف 3 + إحالة للمراجع', (ln._appliedRuleIds||[]).length <= 3 && ln._ruleCapHit === true, `applied=${(ln._appliedRuleIds||[]).length}`);
      const g = { claim:{ id:'C' }, patient:{ id:'P' }, invoice:{ id:'I' } };
      A('قواعد: غير الرجعية لا تطال ما قبل التفعيل', ruleMatchesContext({ enabled:true, active:true, retroactive:false, _simAt:'2026-06-01T00:00:00' }, g, '2026-01-01') === false);
      A('قواعد: الرجعية تطال الماضي', ruleMatchesContext({ enabled:true, active:true, retroactive:true, _simAt:'2026-06-01T00:00:00' }, g, '2026-01-01') === true);
      claims = [];
      const dead = (typeof detectDeadRules === 'function') ? detectDeadRules() : [];
      A('قواعد: بلا مطالبات = الكل ميت', dead.length === deductionRules.length);
    } catch(e){ A('قواعد', false, e.message); }

    /* ---------- 7. المراجعة: فحوص + سياق + شاشة ---------- */
    try {
      const mkCtx = lines => ({ claim:{ id:'C', date:'2026-03-01', type:'employee' }, patient:{ id:'P', lines }, invoice:{ id:'I', date:'2026-03-01' } });
      const over = [1,2,3,4].map(() => ({ code:'LAB-1', qty:1, billedUnit:100 }));
      A('مراجعة: تكرار مفرط', validateLine(over[0], mkCtx(over)).failed.includes('over-frequency'));
      const wctx = { claim:{ id:'C', date:'2026-03-01', type:'employee' }, patient:{ id:'P', letterDate:'2026-02-01', lines:[{ code:'X', qty:1, billedUnit:100, procedureDate:'2026-01-05' }] }, invoice:{ id:'I', date:'2026-03-01' } };
      A('مراجعة: فترة انتظار', validateLine({ code:'X', qty:1, billedUnit:100, procedureDate:'2026-01-05' }, wctx).failed.includes('waiting-period'));
      A('مراجعة: بيانات ناقصة', validateLine({ qty:1, billedUnit:100 }, mkCtx([{ qty:1, billedUnit:100 }])).failed.includes('incomplete-data'));
      const live = { id:'C', approved:100, _final:100 };
      const base = JSON.parse(JSON.stringify(live));
      A('مراجعة: الاستئناف يتجاهل المحسوب', getSessionConflictState({ baseClaimSnapshot:base }, { id:'C', approved:999, _final:999 }) === 'current');
      A('مراجعة: التغيير الأصيل تعارض', getSessionConflictState({ baseClaimSnapshot:base }, { id:'C', approved:999, _final:999, patient:'س' }) === 'conflict');
      workingInvoices = [{ id:'I', patients:[{ name:'م', lines:[{ code:'A', _decision:'needs-attention' },{ code:'B', _decision:'manual-approved' },{ code:'C', _decision:'pa-pending' }] }] }];
      const ce = collectExceptions();
      A('مراجعة: تصنيف الاستثناءات (1/1/1)', ce.pending.length === 1 && ce.processed.length === 1 && ce.pa.length === 1);
      workingInvoices = [];
    } catch(e){ A('مراجعة', false, e.message); }

    /* ---------- 8. القرص + تخريج ---------- */
    try {
      const cl = { id:'C', approved:500, invoices:[{ id:'I', patients:[{ lines:[{ code:'A', qty:1, billedUnit:500 }], deductionReasons:[{ reasonCode:'price-exceeds', reason:'تجاوز', amount:50 }] }] }] };
      const fp1 = claimFingerprint(cl);
      const cl2 = JSON.parse(JSON.stringify(cl));
      cl2.invoices[0].patients[0].deductionReasons[0].reasonCode = 'contract-discount';
      const fp2 = claimFingerprint(cl2);
      A('قرص: التفاصيل تغيّر البصمة التفصيلية', fp1.detailHash !== fp2.detailHash && fp1.billed === fp2.billed);
      const v = fsVerifyEnvelope({ claim:cl2, fingerprint:fp1 });
      A('قرص: تنبيه تغير خارجي مع ثبات الإجمالي', v.ok === true && !!v.warn);
      const ls1 = nextLegalSerial({ legalSerial:'DN-KEEP' }, 3);
      const ls2 = nextLegalSerial({}, 0);
      A('تخريج: تسلسل مستقر + مولّد', ls1 === 'DN-KEEP' && /^DN-/.test(ls2));
    } catch(e){ A('قرص/تخريج', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
