// contracts-manage-tests.js — اختبار إدارة العقود (إنشاء/نسخ مالية/زيادة/بند خاص/تعليق/تجديد/حذف)
// التشغيل: runContractsManageTests() — يعيد {pass, fail, total, results}
function runContractsManageTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','contracts','batches','claims','trash','tariffs','editingContractId','selectedExcludedServices','workingContractIncreases','workingServiceOverrides'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__cmKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__cmKeep'); } catch(e){} });
    try { delete g['__cmKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', oninput:null, classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, click(){}, focus(){} });
  ['ctrProvider','ctrStart','ctrDuration','ctrEnd','ctrDiscount','ctrVersionEffective','ctrNotes','ctrIncreaseRate','ctrOvService','ctrOvSearch','ctrOvList','ctrIncreaseHistory','ctrRateHistory','ctrServicesSearch','contractModal','ctrModalTitle','ctrModalSub','ctrProviderSearch'].forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['renderAll','renderContractServicesOptions','renderServiceOverrides','renderContractIncreaseHistory','renderContracts','syncContractToProvider','appendContractAuditEvent','closeContractModal','_unlockBodyScroll','svcNameByCode','getAllServicesDistinct','updateContractEnd'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; } catch(e){} });
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete;
  let lastWarn = null, lastOk = null;
  const seedBase = () => {
    providers = [
      { id:'PRV-001', name:'مستشفى النيل', type:'مستشفى', code:1 },
      { id:'PRV-002', name:'معمل الشمس', type:'معمل تحاليل', code:2 }
    ];
    contracts = []; batches = []; claims = []; trash = [];
    tariffs = [{ id:'TG1', type:'general', status:'active', name:'عامة', effectiveDate:'2025-01-01', services:[{ code:'LAB-1', name:'تحليل دم', category:'مختبر', basePrice:100, currentPrice:100 }] }];
  };
  const setForm = (o) => {
    els['#ctrProvider'].value = o.providerId || '';
    els['#ctrProvider'].disabled = !!o.lockProvider;
    els['#ctrStart'].value = o.start || '';
    els['#ctrDuration'].value = o.duration !== undefined ? String(o.duration) : '1';
    els['#ctrEnd'].value = o.end || '';
    els['#ctrDiscount'].value = o.discount !== undefined ? String(o.discount) : '10';
    els['#ctrVersionEffective'].value = o.versionFrom || '';
    els['#ctrNotes'].value = o.notes || '';
    try { editingContractId = (o.editId !== undefined ? o.editId : null); } catch(e){}
    try { selectedExcludedServices = o.excluded ? [...o.excluded] : []; } catch(e){}
    try { workingContractIncreases = o.increases ? o.increases.map(h => ({...h})) : []; } catch(e){}
    try { workingServiceOverrides = o.overrides ? o.overrides.map(x => ({...x})) : []; } catch(e){}
  };
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    uiStubs.forEach(k => { try { g[k] = (...a) => { if(k === 'getAllServicesDistinct') return [{ code:'LAB-1', name:'تحليل دم' }]; if(k === 'svcNameByCode') return 'تحليل دم'; if(k === 'syncContractToProvider'){ const _p = (typeof getProviderById === 'function') ? getProviderById(a[0] && a[0].providerId) : null; if(_p){ _p.contractStart = a[0].startDate; _p.contractEnd = a[0].endDate; _p.discountRate = a[0].discountRate; } return; } return true; }; } catch(e){} });
    g.showWarning = (t, m, fn) => { lastWarn = String(t || '') + ': ' + String(m || ''); try { if(typeof fn === 'function') fn(); } catch(e){} };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };

    /* ---------- 1. إنشاء عقد ---------- */
    try {
      seedBase();
      setForm({ providerId:'PRV-001', start:'2025-01-01', duration:2, end:'2027-01-01', discount:10, versionFrom:'2025-01-01', notes:'عقد اختبار' });
      lastWarn = null; lastOk = null; saveContract();
      A('عقود-إدارة: عقد منشأ', contracts.length === 1 && contracts[0].providerId === 'PRV-001');
      A('عقود-إدارة: ترقيم CTR', /^CTR-2025-001$/.test(contracts[0].id), contracts[0].id);
      A('عقود-إدارة: مزامنة الجهة', providers[0].contractStart === '2025-01-01' && providers[0].discountRate === 10);
      A('عقود-إدارة: نجاح', !!lastOk && !lastWarn);
    } catch(e){ A('عقود-إدارة: الإنشاء', false, e.message); }

    /* ---------- 2. بوابات الإنشاء ---------- */
    try {
      seedBase();
      setForm({ providerId:'', start:'2025-01-01', duration:1, versionFrom:'2025-01-01' });
      lastWarn = null; saveContract();
      A('عقود-إدارة: بلا جهة مرفوض', !!lastWarn && contracts.length === 0);
      setForm({ providerId:'PRV-001', start:'', duration:1, versionFrom:'' });
      lastWarn = null; saveContract();
      A('عقود-إدارة: بلا بداية مرفوض', !!lastWarn && contracts.length === 0);
      setForm({ providerId:'PRV-001', start:'2025-01-01', duration:1, versionFrom:'2024-12-01' });
      lastWarn = null; saveContract();
      A('عقود-إدارة: سريان خارج المدة مرفوض', !!lastWarn && contracts.length === 0);
    } catch(e){ A('عقود-إدارة: البوابات', false, e.message); }

    /* ---------- 3. نسخة مالية عند التعديل ---------- */
    try {
      seedBase();
      contracts.push({ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', durationYears:2, discountRate:10, excludedServices:[], increaseHistory:[], serviceOverrides:{}, notes:'', rateVersions:[] });
      setForm({ providerId:'PRV-001', start:'2025-01-01', duration:2, end:'2027-01-01', discount:15, versionFrom:'2026-01-01', editId:'CTR-2025-001', lockProvider:true });
      lastWarn = null; saveContract();
      const c = contracts[0];
      A('عقود-إدارة: الخصم الجديد', c.discountRate === 15);
      A('عقود-إدارة: البداية الأصلية محفوظة', c.startDate === '2025-01-01');
      const _vs = (Array.isArray(c.rateVersions) ? c.rateVersions : []).slice().sort((x,y) => String(x.effectiveFrom).localeCompare(String(y.effectiveFrom)));
      A('عقود-إدارة: النسخة شقت التاريخ', _vs.length === 2 && _vs[0].effectiveTo === '2025-12-31' && _vs[0].discountRate === 10 && _vs[1].effectiveFrom === '2026-01-01' && _vs[1].discountRate === 15, JSON.stringify(c.rateVersions));
    } catch(e){ A('عقود-إدارة: النسخة', false, e.message); }

    /* ---------- 4. زيادة وبند خاص ---------- */
    try {
      seedBase();
      contracts.push({ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', durationYears:2, discountRate:10, excludedServices:[], increaseHistory:[], serviceOverrides:{}, notes:'', rateVersions:[] });
      try { workingContractIncreases = [{ date:'2026-01-01', rate:5 }]; } catch(e){}
      try { workingServiceOverrides = [{ code:'LAB-1', name:'تحليل دم', covered:true, discountRate:20, requiresPA:false }]; } catch(e){}
      setForm({ providerId:'PRV-001', start:'2025-01-01', duration:2, end:'2027-01-01', discount:10, versionFrom:'2026-06-01', editId:'CTR-2025-001', lockProvider:true,
        increases:[{ date:'2026-01-01', rate:5 }], overrides:[{ code:'LAB-1', name:'تحليل دم', covered:true, discountRate:20, requiresPA:false }] });
      saveContract();
      const c = contracts[0];
      A('عقود-إدارة: الزيادة محفوظة', c.increaseHistory.length === 1 && c.increaseHistory[0].rate === 5);
      A('عقود-إدارة: البند الخاص محفوظ', c.serviceOverrides['LAB-1'] && c.serviceOverrides['LAB-1'].discountRate === 20);
      const f = getContractIncreaseFactor(c, '2026-06-01');
      A('عقود-إدارة: معامل الزيادة 1.05', Math.abs(f - 1.05) < 1e-9, String(f));
      A('عقود-إدارة: قبل الزيادة = 1', getContractIncreaseFactor(c, '2025-06-01') === 1);
    } catch(e){ A('عقود-إدارة: الزيادة', false, e.message); }

    /* ---------- 5. تعليق واستئناف ---------- */
    try {
      seedBase();
      contracts.push({ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10 });
      lastWarn = null; suspendContractWithDialog('CTR-2025-001');
      A('عقود-إدارة: التعليق', contracts[0].suspended === true);
      A('عقود-إدارة: المراجعة تستمر', getContractContext({ providerCode:1, date:'2026-01-01' }).contract.id === 'CTR-2025-001');
      resumeContract('CTR-2025-001');
      A('عقود-إدارة: الاستئناف', contracts[0].suspended === false);
    } catch(e){ A('عقود-إدارة: التعليق', false, e.message); }

    /* ---------- 6. التجديد ---------- */
    try {
      seedBase();
      contracts.push({ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', durationYears:2, discountRate:10, rateVersions:[{ effectiveFrom:'2025-01-01', effectiveTo:'2027-01-01', discountRate:10 }] });
      lastWarn = null; renewContractWithDialog('CTR-2025-001');
      A('عقود-إدارة: التمديد سنتان', contracts[0].endDate === '2029-01-01', contracts[0].endDate);
      A('عقود-إدارة: النسخة تتبع التمديد', contracts[0].rateVersions[0].effectiveTo === '2029-01-01');
    } catch(e){ A('عقود-إدارة: التجديد', false, e.message); }

    /* ---------- 7. الحذف ---------- */
    try {
      seedBase();
      contracts.push({ id:'CTR-2025-001', providerId:'PRV-001', startDate:'2025-01-01', endDate:'2027-01-01', discountRate:10 });
      claims = [{ id:'CLM-1', provider:'مستشفى النيل', providerCode:1 }];
      lastWarn = null; deleteContractWithDialog('CTR-2025-001');
      A('عقود-إدارة: المرتبط بمطالبات لا يُحذف', !!lastWarn && contracts.length === 1);
      claims = [];
      batches = [{ id:'B1', providerId:'PRV-002' }];
      deleteContractWithDialog('CTR-2025-001');
      A('عقود-إدارة: النظيف يُحذف للسلة', contracts.length === 0 && trash.some(t => t.type === 'contract'));
      A('عقود-إدارة: الدفعات لا تُمس', batches.length === 1);
      batches = [];
    } catch(e){ A('عقود-إدارة: الحذف', false, e.message); }
  } finally {
    try { if(hadDocument){ try { if(origQS) document.querySelector = origQS; } catch(e){} try { if(origGID) document.getElementById = origGID; } catch(e){} } else { try { delete g.document; } catch(e){} } } catch(e){}
    uiStubs.forEach(k => { try { if(origUi[k] === undefined) delete g[k]; else g[k] = origUi[k]; } catch(e){} });
    try { if(origWarn === undefined) delete g.showWarning; else g.showWarning = origWarn; } catch(e){}
    try { if(origOk === undefined) delete g.showSuccess; else g.showSuccess = origOk; } catch(e){}
    try { if(origDel === undefined) delete g.showDelete; else g.showDelete = origDel; } catch(e){}
    restore();
  }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
