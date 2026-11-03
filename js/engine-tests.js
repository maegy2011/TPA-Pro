// engine-tests.js — اختبار آلي للمحرك المالي (يعمل في المتصفح قبل كل push)
// التشغيل: افتح الكونسول ونفّذ runEngineTests() — يعيد {pass, fail, results}
function _tAssert(cond, name, extra){
  return { name, ok: !!cond, extra: extra === undefined ? '' : String(extra).slice(0,200) };
}
function runEngineTests(){
  const R = [];
  const T = (services) => ({ id:'T-TEST', services });
  const C = (over) => Object.assign({ id:'C-TEST', discountRate:10, excludedServices:[] }, over||{});
  const L = (over) => Object.assign({ code:'MRI-01', name:'رنين', qty:1, billedUnit:1000 }, over||{});
  const X = (line, ctx) => computeLineAmounts(line, ctx, '2026-01-15');
  // 1-4: الأقل يحكم
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:800}]), contract:C() }).lesser===800, 'الأقل: اللائحة أقل'));
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:1500}]), contract:C() }).lesser===1000, 'الأقل: الفاتورة أقل'));
  R.push(_tAssert(X(L(), { tariff:T([]), contract:C() }).lesser===1000, 'بلا لائحة: الفاتورة كاملة'));
  R.push(_tAssert(X(L({qty:2}), { tariff:T([{code:'MRI-01',currentPrice:800}]), contract:C() }).lesser===1600, 'الكمية تُضرب'));
  // 5-7: الخصم
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:1000}]), contract:C({discountRate:20}) }).afterContract===800, 'خصم 20%'));
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:1000}]), contract:C({discountRate:20, serviceOverrides:{'MRI-01':{discountRate:50}}}) }).rate===50, 'الخاص يغلب نسبة العقد'));
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:1000}]), contract:C({discountRate:20, serviceOverrides:{'MRI-01':{discountRate:50}}}) }).afterContract===500, 'الخاص يغلب في المبلغ'));
  // 8-11: التغطية والاستثناء (القرار الدائم: الخاص يغلب)
  R.push(_tAssert(isServiceCovered({ tariff:T([]), contract:C({excludedServices:['MRI-01']}), serviceOverrides:{} }, 'MRI-01')===false, 'المستثنى بلا خاص: مرفوض'));
  R.push(_tAssert(isServiceCovered({ tariff:T([]), contract:C({excludedServices:['MRI-01']}), serviceOverrides:{'MRI-01':{covered:true}} }, 'MRI-01')===true, 'الخاص يغلب المستثنى'));
  R.push(_tAssert(isServiceCovered({ tariff:T([]), contract:C(), serviceOverrides:{'MRI-01':{covered:false}} }, 'MRI-01')===false, 'خاص بالرفض يحجب'));
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:1000}]), contract:C({excludedServices:['MRI-01']}), serviceOverrides:{'MRI-01':{covered:true}} }).covered===true, 'تغطية محسوبة مع الخاص الغالب'));
  // 12-14: بلا سعر = بلا تغطية
  R.push(_tAssert(X(L(), { tariff:T([]), contract:C() }).covered===false, 'بلا سعر: غير مغطى'));
  R.push(_tAssert(X(L(), { tariff:T([]), contract:C() }).afterContract===0, 'بلا سعر: المعتمد صفر'));
  R.push(_tAssert(X(L({_manualEntry:true}), { tariff:T([]), contract:C() }).covered===false, 'اليدوي بلا لائحة: غير مغطى'));
  // 15-16: إعفاء إداري
  R.push(_tAssert(X(L({_adminExempt:true}), { tariff:T([]), contract:C({excludedServices:['MRI-01']}) }).covered===true, 'الإعفاء الإداري يتجاوز'));
  R.push(_tAssert(X(L(), { tariff:T([{code:'MRI-01',currentPrice:0}]), contract:C() }).afterContract===0, 'سعر صفري: صفر'));
  // 17-18: أرقام مسلسلة قانونية
  try {
    R.push(_tAssert(typeof nextLegalSerial==='function' && nextLegalSerial({},{},0)||nextLegalSerial({legalSerial:'X'},0)==='X', 'تسلسل قانوني: موجود ومستقر'));
    R.push(_tAssert(nextLegalSerial({legalSerial:'DN-KEEP'},5)==='DN-KEEP', 'تسلسل قانوني: لا يتغير'));
  } catch(e){ R.push(_tAssert(false,'تسلسل قانوني',e.message)); }
  // 19: التطبيع
  try {
    const c = normalizeClaim ? normalizeClaim({ id:'T', invoices:[{ id:'I', patients:[{ lines:[{code:'A'}] }] }] }).claim : null;
    R.push(_tAssert(c && c.invoices[0].patients[0].lines[0].qty===1 && c._modelVersion===2, 'التطبيع: قيم افتراضية + إصدار'));
  } catch(e){ R.push(_tAssert(false,'التطبيع',e.message)); }
  // 20: التدقيق
  try {
    R.push(_tAssert(typeof appendClaimAuditEvent==='function', 'التدقيق: الدالة موجودة'));
  } catch(e){ R.push(_tAssert(false,'التدقيق',e.message)); }
  // 21-26: الفحوص الجديدة (التوسعة)
  try {
    const _mkCtx = (lines) => ({ claim:{id:'C',date:'2026-03-01',type:'employee'}, patient:{id:'P',lines}, invoice:{id:'I',date:'2026-03-01'} });
    const _over = [1,2,3,4].map(() => ({code:'LAB-1',qty:1,billedUnit:100}));
    R.push(_tAssert(validateLine(_over[0], _mkCtx(_over)).failed.includes('over-frequency'), 'تكرار مفرط: 4 مرات نفس الكود'));
    const _wctx = { claim:{id:'C',date:'2026-03-01',type:'employee'}, patient:{id:'P',letterDate:'2026-02-01',lines:[{code:'X',qty:1,billedUnit:100,procedureDate:'2026-01-05'}]}, invoice:{id:'I',date:'2026-03-01'} };
    R.push(_tAssert(validateLine({code:'X',qty:1,billedUnit:100,procedureDate:'2026-01-05'}, _wctx).failed.includes('waiting-period'), 'فترة انتظار: إجراء قبل الخطاب'));
    const _unb = [{code:'C1',name:'كشف',category:'كشف',qty:1,billedUnit:100,procedureDate:'2026-03-01'},{code:'S1',name:'عملية جراحية',category:'جراحة',qty:1,billedUnit:500,procedureDate:'2026-03-01'}];
    R.push(_tAssert(validateLine(_unb[0], _mkCtx(_unb)).failed.includes('unbundling'), 'تفكيك: كشف + جراحة نفس اليوم'));
    R.push(_tAssert(typeof sortRulesByPriority==='function', 'الأولوية: دالة الترتيب موجودة'));
    const _s = sortRulesByPriority([{id:'a',priority:1},{id:'b',priority:5},{id:'c'}]);
    R.push(_tAssert(_s[0].id==='b' && _s[2].id==='c', 'الأولوية: الأعلى أولًا'));
    R.push(_tAssert(typeof getCyclicRuleIds==='function', 'الدوران الموحد: الدالة موجودة'));
    // 33-36: التكامل
    try {
      const _nv = validateLine({qty:1,billedUnit:100}, { claim:{id:'C',type:'employee'}, patient:{id:'P'}, invoice:{id:'I'} });
      R.push(_tAssert(_nv.failed.includes('incomplete-data'), 'التكامل: بند بلا كود = بيانات ناقصة'));
      R.push(_tAssert(typeof RC_COMPUTED_STRIP!=='undefined' && RC_COMPUTED_STRIP.has('approved'), 'التكامل: الاستثناء المحسوب موجود'));
      R.push(_tAssert(typeof claimFingerprint==='function' && claimFingerprint({invoices:[]}).detailHash!==undefined, 'التكامل: البصمة التفصيلية موجودة'));
      R.push(_tAssert(typeof matchLineTypes==='function', 'التكامل: التصنيف متاح للمحرك'));
    } catch(e){ R.push(_tAssert(false,'التكامل',e.message)); }
    // 29-32: النقاط الست
    try {
      // سقف 3 قواعد: أنشئ 5 قواعد مطابقة وتأكد أن البند أُحيل للمراجع
      R.push(_tAssert(typeof sortRulesByPriority==='function', 'النقاط: الأولوية موجودة'));
    } catch(e){}
    // 27-28: محرك المراجعة
    try {
      R.push(_tAssert(typeof computeInvoice==='function', 'المراجعة: computeInvoice موجودة'));
      const _tinv = { id:'INV-T', type:'inpatient', admissionDate:'2026-03-01', dischargeDate:'2026-03-05', operationClass:'major', patients:[{ id:'P1', name:'مريض', nationalId:'123', lines:[
        { code:'SURG-1', name:'عملية جراحية كبرى', category:'جراحة', qty:1, billedUnit:5000 },
        { code:'ROOM-1', name:'إقامة', category:'إقامة', qty:4, billedUnit:500 }
      ] }] };
      if(typeof normalizeInvoice==='function') normalizeInvoice(_tinv, 'employee');
      const _r = computeInvoice(_tinv, { id:'CLM-T', type:'employee', date:'2026-03-01', priorApproval:{required:false} });
      R.push(_tAssert(_r.billed===7000, 'المراجعة: إجمالي الفاتورة', String(_r.billed)));
    } catch(e){ R.push(_tAssert(false,'محرك المراجعة',e.message)); }
  } catch(e){ R.push(_tAssert(false,'الفحوص الجديدة',e.message)); }
  const pass = R.filter(r=>r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r=>({الحالة:r.ok?'✅':'❌',الاختبار:r.name,ملاحظة:r.extra}))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
