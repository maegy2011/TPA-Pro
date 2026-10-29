function getProviderById(id){ return providers.find(p=>p.id===id); }
function getContractById(id){ return contracts.find(c=>c.id===id); }
function getTariffById(id){ return tariffs.find(t=>t.id===id); }
function getBatchById(id){ return batches.find(b=>b.id===id); }
function getClaimById(id){ return claims.find(c=>c.id===id); }
function getContractByProvider(pid){ return contracts.find(c=>c.providerId===pid); }
function effectiveContractStatus(c){
  if(!c) return 'pending';
  if(c.status === 'cancelled') return 'cancelled';
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
  if(t.status === 'cancelled') return 'cancelled';
  if(t.status === 'pending') return 'pending';
  if(!t.effectiveDate) return 'pending';
  const now = new Date(), e = new Date(t.effectiveDate), x = t.expiryDate ? new Date(t.expiryDate) : null;
  if(now < e) return 'pending';
  if(x && now > x) return 'expired';
  return 'active';
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
function providerHasClaims(name){ return claims.some(c => c.provider === name); }
function renameProviderClaims(oldName, newName){
  claims.forEach(c => { if(c.provider === oldName) c.provider = newName; });
  workSessions.forEach(s => { if(s.claimSnapshot && s.claimSnapshot.provider === oldName) s.claimSnapshot.provider = newName; });
  if(typeof activeClaim !== 'undefined' && activeClaim && activeClaim.provider === oldName){
    activeClaim.provider = newName;
    if($('#rvProvider')) $('#rvProvider').value = newName;
  }
  persistSessions(); persistData();
}
function nextContractNumber(sd){
  const y = sd ? new Date(sd).getFullYear() : new Date().getFullYear();
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
  const pre = 'IN-2025-';
  let m = 0;
  claims.forEach(c=>{ if(c.receivedNumber && c.receivedNumber.startsWith(pre)){ const n = parseInt(c.receivedNumber.split('-').pop(), 10); if(!isNaN(n)) m = Math.max(m,n); } });
  return pre + String(m+1).padStart(5,'0');
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
