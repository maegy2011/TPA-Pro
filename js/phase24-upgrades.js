/* Phase 24 — effective-dated review workflow, Egyptian retirement age, and archival controls */
const TPA_RETIREMENT_SETTINGS_KEY = 'tpa_retirement_age_schedule_v1';
function tpaLoadRetirementSchedule(){
  try { const v=JSON.parse(localStorage.getItem(TPA_RETIREMENT_SETTINGS_KEY)||'null'); if(Array.isArray(v)&&v.length) return v; } catch(e){}
  return [{year:2026,age:60},{year:2027,age:61}];
}
let tpaRetirementSchedule = tpaLoadRetirementSchedule();
function tpaSaveRetirementSchedule(){
  tpaRetirementSchedule = (tpaRetirementSchedule||[]).map(x=>({year:Number(x.year),age:Number(x.age)}))
    .filter(x=>Number.isInteger(x.year)&&x.year>=1900&&x.year<=2200&&Number.isFinite(x.age)&&x.age>=40&&x.age<=80)
    .sort((a,b)=>a.year-b.year);
  for(let i=1;i<tpaRetirementSchedule.length;i++){ if(tpaRetirementSchedule[i].year===tpaRetirementSchedule[i-1].year) throw new Error('لا يمكن تكرار السنة في جدول سن المعاش'); }
  localStorage.setItem(TPA_RETIREMENT_SETTINGS_KEY,JSON.stringify(tpaRetirementSchedule));
  return true;
}
function tpaRetirementAgeOn(date){
  const d=new Date(String(date||'')+'T12:00:00'); if(Number.isNaN(d.getTime())) return null;
  const y=d.getFullYear();
  const rows=tpaRetirementSchedule.filter(x=>x.year<=y).sort((a,b)=>b.year-a.year);
  return rows.length?rows[0].age:null;
}
function tpaEgyptianNationalIdDob(id){
  const s=String(id||'').replace(/\D/g,'');
  if(!/^[23]\d{13}$/.test(s)) return null;
  const century=s[0]==='2'?1900:2000, yy=Number(s.slice(1,3)), mm=Number(s.slice(3,5)), dd=Number(s.slice(5,7));
  const y=century+yy, d=new Date(y,mm-1,dd);
  if(d.getFullYear()!==y||d.getMonth()!==mm-1||d.getDate()!==dd) return null;
  return `${y}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
}
function tpaAgeOn(dob, onDate){
  if(!dob||!onDate) return null;
  const b=new Date(dob+'T12:00:00'), d=new Date(onDate+'T12:00:00');
  if(Number.isNaN(b.getTime())||Number.isNaN(d.getTime())||d<b) return null;
  let age=d.getFullYear()-b.getFullYear();
  if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate())) age--;
  return age;
}
function tpaBeneficiaryTypeForPatient(pat, onDate){
  const dob=tpaEgyptianNationalIdDob(pat&&pat.nationalId);
  if(!dob) return {type:pat&&pat.beneficiaryType==='retiree'?'retiree':'employee',dob:null,age:null,retirementAge:tpaRetirementAgeOn(onDate),valid:false};
  const age=tpaAgeOn(dob,onDate), retirementAge=tpaRetirementAgeOn(onDate);
  return {type:age!==null&&retirementAge!==null&&age>=retirementAge?'retiree':'employee',dob,age,retirementAge,valid:true};
}
function tpaAddRetirementSettings(){
  const host=document.querySelector('#page-settings .panel-body');
  if(!host||document.getElementById('tpaRetirementPanel')) return;
  const panel=document.createElement('div'); panel.className='panel'; panel.id='tpaRetirementPanel'; panel.style.marginTop='18px';
  panel.innerHTML=`<div class="panel-head"><div><h2>جدول سن المعاش السنوي</h2><p>يُحدد سن المعاش حسب سنة تاريخ الإجراء، وليس تاريخ المراجعة</p></div></div>
  <div class="panel-body"><div id="tpaRetirementRows"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn out" id="tpaAddRetirementYear">إضافة سنة</button><button type="button" class="btn solid" id="tpaSaveRetirement">حفظ الجدول</button></div><small class="fg-hint">يُستخدم آخر سن مُسجل لسنة الإجراء أو السنوات السابقة. أضف السنوات المستقبلية قبل بدء سريانها.</small></div>`;
  host.parentElement.parentElement.appendChild(panel);
  const draw=()=>{const box=document.getElementById('tpaRetirementRows'); if(!box)return; box.innerHTML=tpaRetirementSchedule.map((r,i)=>`<div class="form-grid" style="align-items:end;margin:8px 0"><div class="fg"><label>السنة</label><input type="number" data-tpa-ret-year="${i}" value="${r.year}" min="1900" max="2200"></div><div class="fg"><label>سن المعاش</label><input type="number" data-tpa-ret-age="${i}" value="${r.age}" min="40" max="80"></div><button type="button" class="btn-xs danger" data-tpa-ret-del="${i}">حذف</button></div>`).join('');};
  draw();
  panel.addEventListener('click',e=>{
    if(e.target.id==='tpaAddRetirementYear'){const last=tpaRetirementSchedule[tpaRetirementSchedule.length-1];tpaRetirementSchedule.push({year:(last?.year||new Date().getFullYear())+1,age:(last?.age||60)+1});draw();}
    const del=e.target.closest('[data-tpa-ret-del]');if(del){tpaRetirementSchedule.splice(Number(del.dataset.tpaRetDel),1);draw();}
    if(e.target.id==='tpaSaveRetirement'){try{panel.querySelectorAll('[data-tpa-ret-year]').forEach(el=>tpaRetirementSchedule[Number(el.dataset.tpaRetYear)].year=Number(el.value));panel.querySelectorAll('[data-tpa-ret-age]').forEach(el=>tpaRetirementSchedule[Number(el.dataset.tpaRetAge)].age=Number(el.value));tpaSaveRetirementSchedule();if(typeof showSuccess==='function')showSuccess('تم الحفظ','تم تحديث جدول سن المعاش');}catch(err){if(typeof showWarning==='function')showWarning('تعذر الحفظ',err.message);}}
  });
}
function tpaArchiveClaim(claim){
  if(!claim||claim.archived) return false;
  if(!['approved','partial','rejected'].includes(claim.status)){showWarning('لا يمكن الأرشفة','يجب حفظ قرار المراجعة أولاً قبل أرشفة المطالبة.');return false;}
  claim.archived=true; claim.archivedAt=new Date().toISOString(); claim.archiveStatus='read-only';
  if(typeof appendClaimAuditEvent==='function')appendClaimAuditEvent(claim,{action:'claim.archived',details:{archivedAt:claim.archivedAt}});
  if(typeof persistData==='function')persistData(true);
  showSuccess('تمت الأرشفة','نُقلت المطالبة إلى الأرشيف وأصبحت للعرض فقط.');
  if(typeof renderAll==='function')renderAll();
  return true;
}
function tpaIsArchivedClaim(c){return !!(c&&(c.archived===true||c.archiveStatus==='read-only'));}
function tpaInstallReviewArchiveButton(){
  ['reviewModal','.page#page-review'].forEach(sel=>{
    const root=document.querySelector(sel);if(!root||root.querySelector('[data-tpa-archive]'))return;
    const foot=root.querySelector('.modal-foot')||root.querySelector('.rv-page-actions')||root;
    if(!foot)return;
    const b=document.createElement('button');b.type='button';b.className='btn out';b.dataset.tpaArchive='1';b.textContent='إغلاق المطالبة وأرشفتها';
    b.addEventListener('click',()=>{if(!activeClaim)return;if(typeof _hasUnsavedChanges==='function'&&_hasUnsavedChanges()){showWarning('تعديلات غير محفوظة','احفظ المراجعة أولاً ثم أعد الأرشفة.');return;}openDialog({type:'warning',title:'أرشفة نهائية',message:'بعد الأرشفة تصبح المطالبة للعرض فقط ولا يمكن تعديلها. هل تريد المتابعة؟',confirmText:'أرشفة نهائية',cancelText:'رجوع',onConfirm:()=>{if(tpaArchiveClaim(activeClaim)){try{closeReview({discard:true});}catch(e){}}}});});
    foot.appendChild(b);
  });
}
function tpaRefreshArchiveButton(){tpaInstallReviewArchiveButton();const b=document.querySelector('[data-tpa-archive]');if(b)b.disabled=!activeClaim||!['approved','partial','rejected'].includes(activeClaim.status);}
function tpaInitPhase24(){
  tpaAddRetirementSettings();tpaInstallReviewArchiveButton();
  const obs=new MutationObserver(()=>{tpaAddRetirementSettings();tpaInstallReviewArchiveButton();});
  const root=document.getElementById('root');if(root)obs.observe(root,{childList:true,subtree:true});
}
document.addEventListener('DOMContentLoaded',tpaInitPhase24);
