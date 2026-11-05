// inbox-tests.js — اختبار شاشة الوارد (القالب + البحث + الفرز + الفلترة + الفحص)
// التشغيل: runInboxTests() — يعيد {pass, fail, total, results}
function runInboxTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  const g = (typeof globalThis !== 'undefined') ? globalThis : window;
  const keep = {};
  ['batches','providers','contracts','claims'].forEach(k => { try { keep[k] = JSON.parse(JSON.stringify((0,eval)(k))); } catch(e){ keep[k] = undefined; } });
  const restore = () => { Object.keys(keep).forEach(k => { if(keep[k] === undefined) return; try { g['__ibKeep'] = keep[k]; (0,eval)(k + ' = globalThis.__ibKeep'); } catch(e){} }); try { delete g['__ibKeep']; } catch(e){} };
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_INBOX === 'string') ? PAGE_INBOX : '';
      A('وارد: القالب موجود', S.length > 200);
      if(S){
        A('وارد: بحث + تسجيل', S.includes('id="intakeSearch"') && S.includes('id="addBatchBtn"'));
        A('وارد: مؤشرات + شهور + حالات', S.includes('id="intakeKpi"') && S.includes('id="monthChips"') && S.includes('id="intakeStatusChips"'));
        ['all','new','istifa'].forEach(f => A(`وارد: فلتر ${f}`, S.includes(`data-istatus="${f}"`)));
        ['رقم','الجهة','فترة المطالبة','الاستلام','العدد','الحالة'].forEach(h => A(`وارد: عمود ${h}`, S.includes(h)));
        A('وارد: الاستلام مخفي على الصغير', S.includes('hide-sm'));
      }
    } catch(e){ A('وارد: الهيكل', false, e.message); }

    /* ---------- 2. البحث ---------- */
    try {
      const F = (typeof filterBatchesList === 'function') ? filterBatchesList : null;
      A('وارد: دالة الترشيح موجودة', !!F);
      if(F){
        providers = [{ id:'P1', name:'مستشفى النيل' },{ id:'P2', name:'معمل الشمس' }];
        batches = [
          { id:'B1', providerId:'P1', month:'2026-09', status:'new', receivedNumber:'RC-101', receivedDate:'2026-09-05' },
          { id:'B2', providerId:'P2', month:'2026-09', status:'istifa', receivedNumber:'RC-102', receivedDate:'2026-09-06' }
        ];
        A('وارد: بحث برقم الاستلام', F(batches, 'all', 'all', 'rc-101', providers).length === 1);
        A('وارد: بحث باسم الجهة', F(batches, 'all', 'all', 'الشمس', providers).length === 1);
        A('وارد: بحث برقم الدفعة', F(batches, 'all', 'all', 'b2', providers).length === 1);
        A('وارد: بحث بلا نتيجة', F(batches, 'all', 'all', 'zzz', providers).length === 0);
        A('وارد: بحث فارغ = الكل', F(batches, 'all', 'all', '', providers).length === 2);
        A('وارد: مسافات تُشذب', F(batches, 'all', 'all', '  RC-101  ', providers).length === 1);
      }
    } catch(e){ A('وارد: البحث', false, e.message); }

    /* ---------- 3. الفرز ---------- */
    try {
      const Srt = (typeof sortBatchesByReceived === 'function') ? sortBatchesByReceived : null;
      A('وارد: دالة الفرز موجودة', !!Srt);
      if(Srt){
        const L = [
          { id:'B1', receivedDate:'2026-09-05' },
          { id:'B2', receivedDate:'2026-09-08' },
          { id:'B3', receivedDate:'2026-09-01' },
          { id:'B4', receivedDate:'' }
        ];
        const s = Srt(L);
        A('وارد: الأحدث أولًا', s[0].id === 'B2' && s[1].id === 'B1' && s[2].id === 'B3');
        A('وارد: بلا تاريخ آخرًا', s[3].id === 'B4');
        A('وارد: الأصل لا يُمس', L[0].id === 'B1');
      }
    } catch(e){ A('وارد: الفرز', false, e.message); }

    /* ---------- 4. الفلترة ---------- */
    try {
      const F = (typeof filterBatchesList === 'function') ? filterBatchesList : null;
      if(F){
        providers = [{ id:'P1', name:'مستشفى النيل' }];
        batches = [
          { id:'B1', providerId:'P1', month:'2026-09', status:'new', receivedDate:'2026-09-05' },
          { id:'B2', providerId:'P1', month:'2026-08', status:'istifa', receivedDate:'2026-08-05' },
          { id:'B3', providerId:'P1', month:'2026-09,2026-08', status:'new', receivedDate:'2026-09-01' }
        ];
        A('وارد: فلتر الشهر', F(batches, '2026-09', 'all', '', providers).length === 2);
        A('وارد: مركبة تُطابق جزئيًا', F(batches, '2026-08', 'all', '', providers).length === 2);
        A('وارد: فلتر الحالة', F(batches, 'all', 'istifa', '', providers).length === 1);
        A('وارد: شهر + حالة', F(batches, '2026-09', 'new', '', providers).length === 2 && F(batches, '2026-08', 'istifa', '', providers).length === 1);
        A('وارد: الكل', F(batches, 'all', 'all', '', providers).length === 3);
        const months = [...new Set(batches.map(b => b.month))].sort().reverse();
        A('وارد: الشهور فريدة مرتبة', months.length === 3 || months[0] >= months[months.length-1]);
      } else { A('وارد: الفلترة', false, 'missing'); }
    } catch(e){ A('وارد: الفلترة', false, e.message); }

    /* ---------- 5. فحص الحفظ ---------- */
    try {
      const V = (typeof validateBatchInput === 'function') ? validateBatchInput : null;
      A('وارد: دالة الفحص موجودة', !!V);
      if(V){
        const cl = [{ providerId:'P1' }];
        A('وارد: بلا جهة', V({ month:'2026-09', billed:1000, contractsList:cl }).msg === 'اختر الجهة');
        A('وارد: جهة بلا تعاقد', V({ providerId:'P9', month:'2026-09', billed:1000, contractsList:cl }).msg.includes('لا يوجد تعاقد'));
        A('وارد: بلا فترة', V({ providerId:'P1', billed:1000, contractsList:cl }).msg === 'أدخل فترة المطالبة');
        A('وارد: بلا قيمة', V({ providerId:'P1', month:'2026-09', contractsList:cl }).msg === 'أدخل القيمة الإجمالية');
        A('وارد: قيمة صفرية', V({ providerId:'P1', month:'2026-09', billed:0, contractsList:cl }).msg === 'أدخل القيمة الإجمالية');
        A('وارد: سالبة', V({ providerId:'P1', month:'2026-09', billed:-5, contractsList:cl }).ok === false);
        A('وارد: صالحة', V({ providerId:'P1', month:'2026-09', billed:1500, contractsList:cl }).ok === true);
      }
    } catch(e){ A('وارد: الفحص', false, e.message); }

    /* ---------- 6. حالات الدفعات ---------- */
    try {
      A('وارد: حالتان فقط', (typeof BATCH_STATUS !== 'undefined') && !!BATCH_STATUS.new && !!BATCH_STATUS.istifa && !BATCH_STATUS.approved);
      providers = [{ id:'P1', name:'مستشفى النيل' }];
      contracts = [{ id:'C1', providerId:'P1' }];
      const v = (typeof validateBatchInput === 'function') ? validateBatchInput({ providerId:'P1', month:'2026-09', billed:100, contractsList:contracts }) : null;
      A('وارد: شرط التعاقد فقط (الحالة لا تمنع)', v?.ok === true);
    } catch(e){ A('وارد: الحالات', false, e.message); }
    /* ---------- تبويب الأرشيف ---------- */
    try {
      const bs = [{ id:'B1', status:'new' }, { id:'B2', status:'new', archived:true }, { id:'B3', status:'istifa' }];
      const cs = [{ id:'C1', batchId:'B1', archiveStatus:'read-only' }, { id:'C2', batchId:'B3', status:'new' }];
      A('أرشيف: صريحة', isBatchArchived(bs[1], cs) === true);
      A('أرشيف: كل مطالباتها مؤرشفة', isBatchArchived(bs[0], cs) === true);
      A('أرشيف: مطالبتها نشطة', isBatchArchived(bs[2], cs) === false);
      A('أرشيف: بلا مطالبات = نشطة', isBatchArchived({ id:'B9', status:'new' }, cs) === false);
      const sp = splitBatchesByArchive(bs, cs);
      A('أرشيف: التقسيم 1/2', sp.active.length === 1 && sp.archived.length === 2, JSON.stringify({ a: sp.active.length, r: sp.archived.length }));
      const f = filterBatchesList(bs, 'all', 'archived', '', [], cs);
      A('أرشيف: الترشيح', f.length === 2 && f.every(b => b.id !== 'B3'));
      const f2 = filterBatchesList(bs, 'all', 'new', '', [], cs);
      A('أرشيف: الجديد لا يتأثر', f2.length === 2);
    } catch(e){ A('وارد: تبويب الأرشيف', false, e.message); }
  } finally { restore(); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
