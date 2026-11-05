// claims-tests.js — اختبار شاشة المطالبات (القالب + البحث + الفرز + الفلترة + الصف)
// التشغيل: runClaimsTests() — يعيد {pass, fail, total, results}
function runClaimsTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra:x === undefined ? '' : String(x).slice(0,200) });
  try {
    /* ---------- 1. هيكل الصفحة ---------- */
    try {
      const S = (typeof PAGE_CLAIMS === 'string') ? PAGE_CLAIMS : '';
      A('مطالبات: القالب موجود', S.length > 200);
      if(S){
        A('مطالبات: بحث + فرز + تصدير', S.includes('id="searchInput"') && S.includes('id="claimsSort"') && S.includes('data-export="claims"'));
        ['all','pending','partial','approved','rejected','pa-required'].forEach(f => A(`مطالبات: فلتر ${f}`, S.includes(`data-filter="${f}"`)));
        A('مطالبات: فلتر archived', S.includes('id="claimsArchiveTabs"') && String((typeof renderClaims === 'function') ? renderClaims : '').includes('data-carchtab="archived"'));
        ['date-desc','date-asc','billed-desc','billed-asc'].forEach(m => A(`مطالبات: فرز ${m}`, S.includes(`value="${m}"`)));
        ['رقم / وارد','المريض','مقدم الخدمة','التواريخ','المطالب به','المعتمد','الحالة'].forEach(h => A(`مطالبات: عمود ${h}`, S.includes(h)));
        A('مطالبات: تحديد جماعي + شريط مجمع', S.includes('id="claimsSelectAll"') && S.includes('id="claimsBulkBar"'));
        A('مطالبات: 3 صيغ تصدير', (S.match(/data-export="claims"/g) || []).length === 3);
      }
    } catch(e){ A('مطالبات: الهيكل', false, e.message); }

    /* ---------- 2. البحث ---------- */
    try {
      const F = (typeof filterClaimsList === 'function') ? filterClaimsList : null;
      A('مطالبات: دالة الترشيح موجودة', !!F);
      if(F){
        const L = [
          { id:'CLM-1', patient:'أحمد محمد', provider:'مستشفى النيل', receivedNumber:'RC-101', status:'pending', invoices:[{ patients:[{ nationalId:'2990101', lines:[{ code:'LAB-1', name:'تحليل دم' }] }] }] },
          { id:'CLM-2', patient:'منى علي', provider:'معمل الشمس', receivedNumber:'RC-102', status:'approved', invoices:[] }
        ];
        A('مطالبات: بحث بالرقم', F(L, 'all', 'clm-1').length === 1);
        A('مطالبات: بحث بالمريض', F(L, 'all', 'منى').length === 1);
        A('مطالبات: بحث بالجهة', F(L, 'all', 'النيل').length === 1);
        A('مطالبات: بحث برقم الوارد', F(L, 'all', 'rc-102').length === 1);
        A('مطالبات: بحث بكود بند', F(L, 'all', 'lab-1').length === 1);
        A('مطالبات: بحث باسم بند', F(L, 'all', 'تحليل دم').length === 1);
        A('مطالبات: بحث برقم قومي', F(L, 'all', '2990101').length === 1);
        A('مطالبات: بلا نتيجة', F(L, 'all', 'zzz').length === 0);
      }
    } catch(e){ A('مطالبات: البحث', false, e.message); }

    /* ---------- 3. الفرز ---------- */
    try {
      const Srt = (typeof sortClaimsList === 'function') ? sortClaimsList : null;
      A('مطالبات: دالة الفرز موجودة', !!Srt);
      if(Srt){
        const L = [
          { id:'C1', receivedDate:'2026-09-05', billed:500 },
          { id:'C2', receivedDate:'2026-09-08', billed:100 },
          { id:'C3', receivedDate:'2026-09-01', billed:900 }
        ];
        A('مطالبات: الأحدث واردًا', sortClaimsList(L, 'date-desc').map(c => c.id).join(',') === 'C2,C1,C3');
        A('مطالبات: الأقدم واردًا', sortClaimsList(L, 'date-asc').map(c => c.id).join(',') === 'C3,C1,C2');
        A('مطالبات: الأعلى قيمة', sortClaimsList(L, 'billed-desc').map(c => c.id).join(',') === 'C3,C1,C2');
        A('مطالبات: الأقل قيمة', sortClaimsList(L, 'billed-asc').map(c => c.id).join(',') === 'C2,C1,C3');
        A('مطالبات: الافتراضي = الإدخال', sortClaimsList(L, 'default').map(c => c.id).join(',') === 'C1,C2,C3');
        A('مطالبات: الأصل لا يُمس', L[0].id === 'C1');
      }
    } catch(e){ A('مطالبات: الفرز', false, e.message); }

    /* ---------- 4. الفلترة ---------- */
    try {
      const F = (typeof filterClaimsList === 'function') ? filterClaimsList : null;
      if(F){
        const L = [
          { id:'C1', status:'pending', invoices:[] },
          { id:'C2', status:'approved', archived:true, invoices:[] },
          { id:'C3', status:'pending', archiveStatus:'read-only', invoices:[] },
          { id:'C4', status:'pending', priorApproval:{ required:true, status:'pending' }, invoices:[] },
          { id:'C5', status:'approved', priorApproval:{ required:true, status:'approved' }, invoices:[] }
        ];
        A('مطالبات: الكل يستبعد الأرشيف', F(L, 'all', '').length === 3);
        A('مطالبات: فلتر الحالة', F(L, 'pending', '').length === 2);
        A('مطالبات: الأرشيف وحده', F(L, 'archived', '').length === 2);
        A('مطالبات: تحتاج موافقة (معلق فقط)', F(L, 'pa-required', '').length === 1);
        A('مطالبات: بحث داخل فلتر', F(L, 'pending', 'C4').length === 1 && F(L, 'pending', 'C2').length === 0);
      } else { A('مطالبات: الفلترة', false, 'missing'); }
    } catch(e){ A('مطالبات: الفلترة', false, e.message); }

    /* ---------- 5. حالات الصف ---------- */
    try {
      A('مطالبات: 5 حالات معرفة', (typeof STATUS !== 'undefined') && ['new','pending','approved','partial','rejected'].every(k => !!STATUS[k]));
      const src = String((typeof renderClaims === 'function') ? renderClaims : '');
      A('مطالبات: المؤرشفة للعرض فقط (قفل + شارة)', src.includes('read-only') && src.includes('مقفلة'));
      A('مطالبات: زر المراجعة موجود', src.includes('data-review'));
    } catch(e){ A('مطالبات: الصف', false, e.message); }
    /* ---------- تبويب الأرشيف ---------- */
    try {
      const cs = [{ id:'A', status:'partial' }, { id:'B', status:'approved', archiveStatus:'read-only' }, { id:'C', status:'new', archived:true }];
      const sp = (typeof splitClaimsByArchive === 'function') ? splitClaimsByArchive(cs) : null;
      A('مطالبات: التقسيم 1/2', sp?.active === 1 && sp.archived === 2, JSON.stringify(sp));
      const f = filterClaimsList(cs, 'archived', '');
      A('مطالبات: ترشيح الأرشيف', f.length === 2);
      const f2 = filterClaimsList(cs, 'all', '');
      A('مطالبات: الكل يستبعد الأرشيف', f2.length === 1 && f2[0].id === 'A');
      const src2 = String((typeof renderClaims === 'function') ? renderClaims : '');
      A('مطالبات: تبويب النشطة/الأرشيف', src2.includes('claimsArchiveTabs') && src2.includes('data-carchtab'));
    } catch(e){ A('مطالبات: تبويب الأرشيف', false, e.message); }
  } catch(e){ A('مطالبات', false, e.message); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
