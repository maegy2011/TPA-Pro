// providers-manage-tests.js — اختبار إدارة الجهات الطبية (تسجيل/تعديل/حذف/سلة/ترحيل الأكواد)
// التشغيل: runProvidersManageTests() — يعيد {pass, fail, total, results}
function runProvidersManageTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['providers','contracts','batches','claims','trash','workSessions','activeClaim','editingProviderId','selectedProvinces'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => {
    Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__pmKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__pmKeep'); } catch(e){} });
    try { delete g['__pmKeep']; } catch(e){}
  };
  // ---------- DOM مزيف ----------
  const els = {};
  const mkEl = (id) => ({ id, value:'', checked:false, disabled:false, style:{}, dataset:{}, innerHTML:'', textContent:'', classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, click(){}, focus(){} });
  ['pvName','pvContact','pvPhone','pvEmail','pvNotes','pvType','pvCode','pvProvinceSearch','providerModal','btProvider','rvProvider'].forEach(id => { els['#'+id] = mkEl(id); });
  const hadDocument = (typeof document !== 'undefined');
  const origQS = hadDocument ? document.querySelector : null;
  const origGID = hadDocument ? document.getElementById : null;
  const wrapQS = (sel) => (Object.prototype.hasOwnProperty.call(els, sel) ? els[sel] : (origQS ? origQS.call(document, sel) : null));
  const wrapGID = (id) => (Object.prototype.hasOwnProperty.call(els, '#'+id) ? els['#'+id] : (origGID ? origGID.call(document, id) : null));
  const uiStubs = ['renderAll','renderProviderOptions','renderProvinceOptions','persistSessions','persistData','closeProviderModal','_unlockBodyScroll'];
  const origUi = {};
  uiStubs.forEach(k => { try { origUi[k] = g[k]; g[k] = () => true; } catch(e){} });
  const origWarn = g.showWarning, origOk = g.showSuccess, origDel = g.showDelete;
  let lastWarn = null, lastOk = null;
  const setForm = (o) => {
    els['#pvName'].value = o.name !== undefined ? o.name : '';
    els['#pvContact'].value = o.contact || '';
    els['#pvPhone'].value = o.phone !== undefined ? o.phone : '';
    els['#pvEmail'].value = o.email !== undefined ? o.email : '';
    els['#pvNotes'].value = o.notes || '';
    els['#pvType'].value = o.type || 'مستشفى';
    try { editingProviderId = (o.editId !== undefined ? o.editId : null); } catch(e){}
    try { selectedProvinces = o.provinces || []; } catch(e){}
  };
  try {
    if(hadDocument){ try { document.querySelector = wrapQS; } catch(e){} try { document.getElementById = wrapGID; } catch(e){} }
    else { try { g.document = { querySelector:wrapQS, getElementById:wrapGID, addEventListener(){}, createElement:() => mkEl('tmp') }; } catch(e){} }
    g.showWarning = (t, m) => { lastWarn = String(t || '') + ': ' + String(m || ''); };
    g.showSuccess = (t, m) => { lastOk = String(t || '') + ': ' + String(m || ''); };
    g.showDelete = (t, m, fn) => { try { if(typeof fn === 'function') fn(); } catch(e){} };

    /* ---------- 1. تسجيل 3 جهات ---------- */
    try {
      providers = []; contracts = []; batches = []; claims = []; trash = []; workSessions = [];
      const T = [
        { name:'مستشفى النيل', contact:'أحمد', phone:'01001234567', email:'nile@h.com', type:'مستشفى', provinces:['القاهرة'] },
        { name:'معمل الشمس', contact:'منى', phone:'01112345678', email:'sun@lab.com', type:'معمل تحاليل', provinces:['الجيزة'] },
        { name:'عيادة الفجر', contact:'كريم', phone:'01223456789', email:'fajr@c.com', type:'عيادة', provinces:['القاهرة','الجيزة'] }
      ];
      T.forEach(f => { setForm(f); lastWarn = null; saveProvider(); });
      A('جهات-إدارة: 3 جهات', providers.length === 3, String(providers.length));
      A('جهات-إدارة: معرفات PRV متسلسلة', providers.every((p,i) => p.id === 'PRV-'+String(i+1).padStart(3,'0')));
      A('جهات-إدارة: أكواد 1..3', JSON.stringify(providers.map(p => p.code)) === '[1,2,3]');
      A('جهات-إدارة: المحافظات محفوظة', providers[2].province.length === 2 && providers[2].city.includes('القاهرة'));
      A('جهات-إدارة: نجاح بلا تحذير', !!lastOk && !lastWarn);
    } catch(e){ A('جهات-إدارة: التسجيل', false, e.message); }

    /* ---------- 2. بوابات التسجيل ---------- */
    try {
      setForm({ name:'', phone:'01099999999', email:'x@x.com' });
      lastWarn = null; saveProvider();
      A('جهات-إدارة: الاسم الفارغ مرفوض', !!lastWarn && providers.length === 3);
      setForm({ name:'مستشفى النيل', phone:'01099999999', email:'x@x.com' });
      lastWarn = null; saveProvider();
      A('جهات-إدارة: تكرار الاسم مرفوض', !!lastWarn && providers.length === 3);
      setForm({ name:'جديدة', phone:'01099999999', email:'بريد-خطأ' });
      lastWarn = null; saveProvider();
      A('جهات-إدارة: البريد الفاسد مرفوض', !!lastWarn && providers.length === 3);
    } catch(e){ A('جهات-إدارة: البوابات', false, e.message); }

    /* ---------- 3. التعديل وانتشار الاسم ---------- */
    try {
      claims = [{ id:'CLM-1', provider:'مستشفى النيل', providerCode:1 }];
      workSessions = [{ id:'S1', claimId:'CLM-1', claimSnapshot:{ provider:'مستشفى النيل' } }];
      const p = providers.find(x => x.name === 'مستشفى النيل');
      setForm({ name:'مستشفى النيل الجديد', contact:'أ', phone:'01001234567', email:'n@h.com', editId:p.id });
      lastWarn = null; saveProvider();
      A('جهات-إدارة: التعديل', providers.some(x => x.name === 'مستشفى النيل الجديد') && providers.length === 3);
      A('جهات-إدارة: الانتشار للمطالبات', claims[0].provider === 'مستشفى النيل الجديد');
      A('جهات-إدارة: الانتشار للجلسات', workSessions[0].claimSnapshot.provider === 'مستشفى النيل الجديد');
      // التعديل لنفس الاسم مسموح (استثناء الذات)
      setForm({ name:'معمل الشمس', contact:'م', phone:'01112345678', email:'sun@lab.com', editId:providers.find(x => x.name === 'معمل الشمس').id });
      lastWarn = null; saveProvider();
      A('جهات-إدارة: تعديل الذات مسموح', !lastWarn && providers.length === 3);
      claims = []; workSessions = [];
    } catch(e){ A('جهات-إدارة: التعديل', false, e.message); }

    /* ---------- 4. الحذف والسلة ---------- */
    try {
      trash = [];
      const target = providers.find(x => x.name === 'عيادة الفجر');
      lastOk = null; deleteProviderWithDialog(target.id);
      A('جهات-إدارة: حذف النظيفة', !providers.some(x => x.id === target.id));
      A('جهات-إدارة: في السلة', trash.some(t => t.type === 'provider' && t.name === 'عيادة الفجر'));
      // جهة بمطالبات: الحذف مرفوض
      claims = [{ id:'CLM-9', provider:'مستشفى النيل الجديد', providerCode:1 }];
      const p1 = providers.find(x => x.name === 'مستشفى النيل الجديد');
      lastWarn = null; deleteProviderWithDialog(p1.id);
      A('جهات-إدارة: المرتبطة بمطالبات لا تُحذف', !!lastWarn && providers.some(x => x.id === p1.id));
      A('جهات-إدارة: كشف الارتباط', providerHasClaims(p1.id) === true && providerHasClaims('PRV-999') === false);
      // جهة بعقد ودفعة بلا مطالبات: تُنقل معهما للسلة
      claims = [];
      contracts = [{ id:'C1', providerId:'PRV-002' }];
      batches = [{ id:'B1', providerId:'PRV-002' }];
      const p2 = providers.find(x => x.id === 'PRV-002');
      deleteProviderWithDialog('PRV-002');
      A('جهات-إدارة: حذف مع عقد ودفعة', !providers.some(x => x.id === 'PRV-002') && !contracts.length && !batches.length);
      A('جهات-إدارة: السلة 3 عناصر', trash.filter(t => ['provider','contract','batch'].includes(t.type)).length >= 3, String(trash.length));
      contracts = []; batches = []; claims = [];
    } catch(e){ A('جهات-إدارة: الحذف', false, e.message); }

    /* ---------- 5. ترحيل الأكواد ---------- */
    try {
      providers = [{ id:'PRV-001', name:'أ' }, { id:'PRV-002', name:'ب', code:5 }, { id:'PRV-003', name:'ج' }];
      ensureProviderCodes();
      const got = providers.map(p => p.code);
      A('جهات-إدارة: المفقود يُمنح', got[0] === 6 && got[2] === 7, JSON.stringify(got));
      A('جهات-إدارة: الموجود لا يُمس', got[1] === 5);
      A('جهات-إدارة: التالي 8', nextProviderCode() === 8);
    } catch(e){ A('جهات-إدارة: الترحيل', false, e.message); }
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
