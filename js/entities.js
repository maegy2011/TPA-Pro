// entities.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function getProviderById(id){ return providers.find(p=>p.id===id); }
function getContractById(id){ return contracts.find(c=>c.id===id); }
function getTariffById(id){ return tariffs.find(t=>t.id===id); }

// Immutable, effective-dated tariff snapshots. Older claim dates resolve to the
// price list that was in force on that date instead of today's edited prices.
function shiftTariffIsoDate(date,days){ const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m)return ''; const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])+Number(days||0))); return d.toISOString().slice(0,10); }
function tariffDateMinusOne(date){ return shiftTariffIsoDate(date,-1); }
function tariffDatePlusOne(date){ return shiftTariffIsoDate(date,1); }
function getTariffVersionForDate(t, date){
  if(!t) return null;
  const target = String(date || new Date().toISOString().slice(0,10)).slice(0,10);
  const versions = [...(Array.isArray(t.priceVersions)?t.priceVersions:[])];
  versions.push({effectiveDate:t.effectiveDate||'', expiryDate:t.expiryDate||'', services:t.services||[], basePriceLevel:t.basePriceLevel, _current:true});
  const matches = versions.filter(v => v.effectiveDate && v.effectiveDate <= target && (!v.expiryDate || target <= v.expiryDate));
  matches.sort((a,b)=>String(b.effectiveDate).localeCompare(String(a.effectiveDate)));
  return matches[0] || null;
}
function getTariffServicesForDate(t, date){ const v=getTariffVersionForDate(t,date); return v ? (v.services||[]) : (t&&Array.isArray(t.services)?t.services:[]); }
function isTariffApplicableForDate(t,date){ return !!(t && t.status!=='disabled' && getTariffVersionForDate(t,date)); }
function archiveTariffVersion(t, newEffectiveDate, action, changes){
  if(!t) throw new Error('اللائحة غير موجودة');
  const next=String(newEffectiveDate||'').slice(0,10), current=String(t.effectiveDate||'').slice(0,10);
  if(!next) throw new Error('حدد تاريخ السريان');
  if(current && next < current) throw new Error('تاريخ السريان لا يمكن أن يسبق النسخة الحالية');
  if(current && next > current){
    const end=tariffDateMinusOne(next);
    if(t.expiryDate && t.expiryDate < next) throw new Error('تاريخ السريان الجديد يأتي بعد انتهاء اللائحة');
    if(!Array.isArray(t.priceVersions)) t.priceVersions=[];
    t.priceVersions.push({effectiveDate:current,expiryDate:end,services:JSON.parse(JSON.stringify(t.services||[])),basePriceLevel:Number(t.basePriceLevel)||100,archivedAt:new Date().toISOString()});
  }
  if(!Array.isArray(t.changeLog)) t.changeLog=[];
  t.changeLog.push({id:'TCH-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),at:new Date().toISOString(),effectiveDate:next,action:action||'update',actor:(typeof appSettings!=='undefined'&&appSettings.reviewer&&appSettings.reviewer.name)||'المستخدم',changes:JSON.parse(JSON.stringify(changes||[]))});
  t.effectiveDate=next;
  return true;
}

function getBatchById(id){ return batches.find(b=>b.id===id); }
function getClaimById(id){ return claims.find(c=>c.id===id); }
function getContractByProvider(pid){ return contracts.find(c=>c.providerId===pid); }
/** معامل الزيادة السنوية للعقد بتاريخ المطالبة — حاصل ضرب الزيادات المطبقة حتى ذلك التاريخ. */
function getContractIncreaseFactor(contract, date){
  if(!contract || !Array.isArray(contract.increaseHistory) || !contract.increaseHistory.length) return 1;
  const d = String(date||'').slice(0,10);
  let f = 1;
  contract.increaseHistory.forEach(h => { if(h && h.date && String(h.date).slice(0,10) <= d) f *= (1 + (Number(h.rate)||0)/100); });
  return Math.round(f*10000)/10000;
}
/** Contract-level audit trail — same pattern as appendClaimAuditEvent: operational traceability, not tamper-proof. */
function appendContractAuditEvent(contract, event){
  if(!contract || !event || typeof event !== 'object') return null;
  if(!Array.isArray(contract._auditTrail)) contract._auditTrail = [];
  const reviewer = (typeof appSettings !== 'undefined' && appSettings.reviewer) ? appSettings.reviewer : {};
  const entry = {
    id: 'AUD-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8),
    at: new Date().toISOString(),
    actor: String(reviewer.name || 'المراجع').slice(0,120),
    actorRole: String(reviewer.role || '').slice(0,120),
    action: String(event.action || 'contract.event').slice(0,80),
    details: event.details && typeof event.details === 'object' ? JSON.parse(JSON.stringify(event.details)) : {}
  };
  contract._auditTrail.push(entry);
  return entry;
}
function effectiveContractStatus(c){
  if(!c) return 'pending';
  if(c.suspended) return 'suspended';
  if(!c.startDate || !c.endDate) return 'upcoming';
  const now = new Date(), s = new Date(c.startDate), e = new Date(c.endDate);
  if(now < s) return 'upcoming';
  if(now > e) return 'expired';
  const d = Math.ceil((e-now)/(1000*60*60*24));
  if(d <= 60) return 'expiring';
  return 'active';
}
function effectiveTariffStatus(t){
  if(!t) return 'pending';
  if(t.status === 'disabled') return 'disabled';
  if(!t.effectiveDate) return 'pending';
  const now = new Date(), e = new Date(t.effectiveDate), x = t.expiryDate ? new Date(t.expiryDate) : null;
  if(now < e) return 'upcoming';
  if(x && now > x) return 'expired';
  return 'active';
}
/** تجديد تلقائي للوائح النشطة عند انتهائها — يستمر السريان لحين التعطيل. */
function autoRenewTariffs(){
  const today = new Date().toISOString().slice(0,10);
  (typeof tariffs !== 'undefined' ? tariffs : []).forEach(t => {
    if(!t || t.status === 'disabled') return;
    if(!t.expiryDate || String(t.expiryDate) > today) return;
    const eff = String(t.effectiveDate||'');
    let days = 365;
    if(eff && String(t.expiryDate) > eff) days = Math.max(1, Math.round((Date.parse(t.expiryDate) - Date.parse(eff))/86400000));
    const d = new Date(t.expiryDate+'T12:00:00'); d.setDate(d.getDate() + days);
    const newExp = d.toISOString().slice(0,10);
    t.expiryDate = newExp;
    if(!Array.isArray(t.changeLog)) t.changeLog = [];
    t.changeLog.push({at:new Date().toISOString(), effectiveDate:eff, action:'auto-renew', actor:(typeof appSettings!=='undefined'&&appSettings.reviewer&&appSettings.reviewer.name)||'النظام', changes:[{note:'تجديد تلقائي حتى '+newExp}]});
  });
}
function getEffectiveProviderStatus(p){
  const c = getContractByProvider(p.id);
  return c ? effectiveContractStatus(c) : 'upcoming';
}
function syncContractToProvider(c){
  const p = getProviderById(c.providerId);
  if(!p) return;
  p.contractStart = c.startDate;
  p.contractEnd = c.endDate;
  p.discountRate = c.discountRate;
}
function getProviderStats(name){
  const l = claims.filter(c => c.provider === name);
  const b = l.reduce((s,c)=>s+c.billed,0);
  const a = l.reduce((s,c)=>s+c.approved,0);
  const d = Math.max(0,b-a);
  const r = b ? (d/b*100) : 0;
  return { claims:l.length, billed:b, approved:a, deduction:d, rate:r };
}
function providerHasClaims(ref){
  const plist = (typeof providers !== 'undefined' ? providers : []);
  const p = (typeof getProviderById === 'function' ? getProviderById(ref) : null) || plist.find(x => x.name === ref || x.code === ref);
  const cl = (typeof claims !== 'undefined' ? claims : []);
  if(p && p.code != null && cl.some(c => c.providerCode === p.code)) return true;
  const nm = p ? p.name : ref;
  return cl.some(c => c.provider === nm);
}
function nextProviderCode(){
  const plist = (typeof providers !== 'undefined' ? providers : []);
  return plist.reduce((m,p)=>Math.max(m, Number(p.code)||0), 0) + 1;
}
/** ترحيل: كود رقمي فريد لكل جهة + ربط المطالبات الموجودة بالكود. */
function ensureProviderCodes(){
  const plist = (typeof providers !== 'undefined' ? providers : []);
  let max = plist.reduce((m,p)=>Math.max(m, Number(p.code)||0), 0);
  plist.forEach(p => { if(!(Number(p.code)>0)){ max += 1; p.code = max; } });
  const cl = (typeof claims !== 'undefined' ? claims : []);
  cl.forEach(c => {
    if(c.providerCode != null) return;
    const p = plist.find(x => x.name === c.provider || x.id === c.provider || (c.providerId && x.id === c.providerId));
    if(p) c.providerCode = p.code;
  });
}
function contractHasClaims(id){
  const c = getContractById(id); if(!c) return false;
  if((typeof batches !== 'undefined' ? batches : []).some(b => b.providerId === c.providerId)) return true;
  const p = getProviderById(c.providerId);
  const cl = (typeof claims !== 'undefined' ? claims : []);
  if(p && cl.some(x => (p.code != null && x.providerCode === p.code) || x.provider === p.name)) return true;
  return false;
}
function renameProviderClaims(oldName, newName){
  claims.forEach(c => { if(c.provider === oldName) c.provider = newName; });
  workSessions.forEach(s => { if(s.claimSnapshot && s.claimSnapshot.provider === oldName) s.claimSnapshot.provider = newName; });
  if(typeof activeClaim !== 'undefined' && activeClaim && activeClaim.provider === oldName){
    activeClaim.provider = newName;
    if($('#rvProvider')) $('#rvProvider').value = newName;
  }
  persistSessions(); persistData();
}
function contractEndFrom(startISO, years){
  const m = String(startISO||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return '';
  const d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
  d.setFullYear(d.getFullYear() + (Number(years)||0));
  d.setDate(d.getDate() - 1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function contractDurationYears(s, e){
  const ms = Date.parse(e) - Date.parse(s);
  if(isNaN(ms)) return 1;
  return Math.max(1, Math.round((ms/86400000 + 1)/365));
}
function yearsLabel(n){
  n = Number(n)||0;
  if(n === 1) return 'سنة';
  if(n === 2) return 'سنتين';
  if(n <= 10) return n + ' سنوات';
  return n + ' سنة';
}
function extendDateByYears(iso, years){
  const m = String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return '';
  const d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
  d.setFullYear(d.getFullYear() + (Number(years)||0));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function nextContractNumber(sd){  const y = sd ? new Date(sd).getFullYear() : new Date().getFullYear();
  const pre = 'CTR-'+y+'-';
  let m = 0;
  contracts.forEach(c=>{ if(c.id.startsWith(pre)){ const n = parseInt(c.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
  return pre + String(m+1).padStart(3,'0');
}
function nextTariffNumber(ed){
  const y = ed ? new Date(ed).getFullYear() : new Date().getFullYear();
  const pre = 'TAR-'+y+'-';
  let m = 0;
  tariffs.forEach(t=>{ if(t.id.startsWith(pre)){ const n = parseInt(t.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
  return pre + String(m+1).padStart(3,'0');
}
function nextBatchNumber(month){
  const pre = 'BTH-'+month+'-';
  let m = 0;
  batches.forEach(b=>{ if(b.id.startsWith(pre)){ const n = parseInt(b.id.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
  return pre + String(m+1).padStart(3,'0');
}
function nextReceivedNumber(){
  const y = new Date().getFullYear();
  let m = 0;
  claims.forEach(c => {
    const rd = c.receivedDate || c.date;
    if(!rd || new Date(rd).getFullYear() !== y) return;
    const n = parseInt(String(c.receivedNumber), 10);
    if(!isNaN(n)) m = Math.max(m, n);
  });
  return String(m + 1);
}
function generateClaimId(){
  const maxNum = claims.reduce((m,c)=>{ const n = parseInt(c.id.split('-').pop(), 10); return Math.max(m, isNaN(n)?0:n); }, 0);
  return 'CLM-2501-' + String(maxNum+1).padStart(4,'0');
}
function stats(){ return statsFor(claims); }
function statsFor(customClaims){
  const t = customClaims.length;
  const b = customClaims.reduce((s,c)=>s+c.billed,0);
  const a = customClaims.reduce((s,c)=>s+c.approved,0);
  const d = b-a;
  const reviewed = customClaims.filter(c => c.status !== 'pending');
  const rb = reviewed.reduce((s,c)=>s+c.billed,0);
  const ra = reviewed.reduce((s,c)=>s+c.approved,0);
  const r = rb ? ((rb-ra)/rb*100) : 0;
  return {
    total:t, billed:b, approved:a, deduction:d, rate:r,
    pending: customClaims.filter(c=>c.status==='pending').length,
    approvedN: customClaims.filter(c=>c.status==='approved').length,
    partialN: customClaims.filter(c=>c.status==='partial').length,
    rejectedN: customClaims.filter(c=>c.status==='rejected').length
  };
}
function reasonsBreakdown(){ return reasonsBreakdownFor(claims); }
/* ترشيح التقارير — منطق خالص (يُختبر آليًا): نص + فترة + جهة + حالة. */
function filterReportsClaims(list, f){
  f = f || {};
  let base = Array.isArray(list) ? list.slice() : [];
  const q = String(f.q || '').trim().toLowerCase();
  if(q) base = base.filter(c => String(c.id||'').toLowerCase().includes(q) || String(c.patient||'').toLowerCase().includes(q) || String(c.provider||'').toLowerCase().includes(q) || String(c.receivedNumber||'').toLowerCase().includes(q));
  if(f.from){ const d0 = String(f.from).slice(0,10); base = base.filter(c => String(c.date||c.receivedDate||'').slice(0,10) >= d0); }
  if(f.to){ const d1 = String(f.to).slice(0,10); base = base.filter(c => String(c.date||c.receivedDate||'').slice(0,10) <= d1); }
  if(f.provider) base = base.filter(c => String(c.provider||'') === String(f.provider));
  if(f.status) base = base.filter(c => String(c.status||'pending') === String(f.status));
  return base;
}
/* أعلى الجهات استقطاعًا — منطق خالص. */
function reportsTopProviders(list, n){
  const m = {};
  (Array.isArray(list) ? list : []).forEach(c => {
    const d = (Number(c.billed)||0) - (Number(c.approved)||0);
    if(d <= 0) return;
    const k = c.provider || '—';
    m[k] = m[k] || { provider:k, deduction:0, billed:0, claims:0 };
    m[k].deduction += d; m[k].billed += (Number(c.billed)||0); m[k].claims++;
  });
  return Object.values(m).sort((a,b) => b.deduction - a.deduction).slice(0, Math.max(1, Number(n)||5));
}
/* الاتجاه الشهري (مطالب/معتمد/استقطاع) — منطق خالص، آخر 6 شهور بها بيانات. */
function reportsMonthlyTrend(list){
  const m = {};
  (Array.isArray(list) ? list : []).forEach(c => {
    const k = String(c.date||c.receivedDate||'').slice(0,7);
    if(!/^\d{4}-\d{2}$/.test(k)) return;
    m[k] = m[k] || { month:k, billed:0, approved:0, claims:0 };
    m[k].billed += (Number(c.billed)||0); m[k].approved += (Number(c.approved)||0); m[k].claims++;
  });
  return Object.values(m).sort((a,b) => a.month < b.month ? -1 : 1).slice(-6).map(r => ({ ...r, deduction: r.billed - r.approved }));
}
function reasonsBreakdownFor(list){
  const m = {};
  list.forEach(c=>{
    if(!c.reason) return;
    const d = c.billed - c.approved;
    if(d <= 0) return;
    m[c.reason] = (m[c.reason]||0) + d;
  });
  return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
function addToTrash(type, typeLabel, name, data){
  trash.push({ id:'TRS-'+Date.now()+'-'+Math.floor(Math.random()*10000), type, typeLabel, name, data, deletedAt:new Date().toISOString() });
}
