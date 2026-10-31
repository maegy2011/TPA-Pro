let navHistory = [];
let currentPage = 'dashboard';
let viewState = { type:null, id:null };
const PAGE_META = {
  dashboard:['لوحة التحكم','نظرة عامة على الأداء المالي'],
  claims:['إدارة المطالبات','عرض، مراجعة، وتصدير جميع المطالبات'],
  timeline:['الخط الزمني','تتبع جميع أحداث مراجعة المطالبة'],
  view:['تفاصيل المطالبة','عرض تفاصيل المطالبة وفواتيرها'],
  search:['بحث اللوائح','بحث متقدم في لوائح الأسعار والخدمات'],
  intake:['استلام الدفعات','استلام وإدارة الدفعات الشهرية من الجهات'],
  providers:['مقدمو الخدمات','إدارة جهات تقديم الخدمات الطبية وعقودها'],
  contracts:['العقود','متابعة وإدارة عقود الجهات الطبية'],
  tariffs:['اللوائح','إدارة لوائح الأسعار والخدمات الطبية'],
  'deduction-rules':['قواعد الخصم','إنشاء وإدارة قواعد الخصم (سقف، تحمل، مخصص، سوبر)'],
  reports:['التقارير والتحليلات','تحليل مالي شامل للمطالبات'],
  trash:['سلة المحذوفات','استعادة أو حذف نهائي للعناصر المحذوفة'],
  sessions:['جلسات المراجعة','متابعة وإدارة مراجعات المطالبات المفتوحة'],
  settings:['الإعدادات والحساب','إدارة الحساب، الهوية، والأمان'],
  help:['المساعدة والتوثيق','دليل المستخدم، الاختصارات، FAQ']
};
function go(screenId){
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if(el) el.classList.add('active');
  window.scrollTo(0,0);
}
function navigateTo(page, opts){
  opts = opts || {};
  if(page === currentPage && !opts.force) return;
  if(!opts.noPush && currentPage !== 'splash' && currentPage !== 'lock' && currentPage){
    navHistory.push({ page: currentPage, viewType: viewState.type, viewId: viewState.id });
  }
  applyPage(page);
}
function applyPage(page){
  currentPage = page;
  const activeNav = ['timeline','view'].includes(page) ? (navHistory.length ? navHistory[navHistory.length-1].page : 'claims') : page;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === activeNav));
  $$('.page').forEach(x => x.classList.remove('active'));
  const el = document.getElementById('page-'+page); if(el) el.classList.add('active');
  const meta = PAGE_META[page] || ['',''];
  const tTitle = (typeof t === 'function') ? t('page.'+page) : null;
  const tSub = (typeof t === 'function') ? t('page.'+page+'.sub') : null;
  $('#pageTitle').textContent = (tTitle && tTitle !== 'page.'+page) ? tTitle : meta[0];
  const pd = document.getElementById('pageDesc'); if(pd) pd.textContent = (tSub && tSub !== 'page.'+page+'.sub') ? tSub : meta[1];
  const backBtn = $('#smartBackBtn');
  if(page === 'dashboard') backBtn.classList.remove('show');
  else backBtn.classList.add('show');
  window.scrollTo({top:0, behavior:'smooth'});
  setTimeout(() => { if(typeof translateDOM === 'function') translateDOM(document.body); }, 0);
  if(page === 'search') renderSearch();
  if(page === 'trash') renderTrash();
  if(page === 'deduction-rules') renderDeductionRules();
  if(page === 'reports') renderReports();
  if(page === 'sessions') renderSessions();
  if(page === 'settings') { if(typeof bindSettingsPassword === 'function') bindSettingsPassword(); }
}
function goBack(){
  if(navHistory.length === 0){ navigateTo('dashboard', {noPush:true}); return; }
  const prev = navHistory.pop();
  if(prev.viewType && prev.viewId && prev.page === 'view'){ viewState.type = prev.viewType; viewState.id = prev.viewId; applyPage('view'); renderView(); return; }
  if(prev.page === 'view'){ return goBack(); }
  applyPage(prev.page);
}
function bindNav(){
  $$('.nav-item').forEach(b => b.addEventListener('click', () => { navHistory = []; navigateTo(b.dataset.page, {noPush:true}); }));
}
