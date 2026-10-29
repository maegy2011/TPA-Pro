const EXPORT_BRAND = { name: appSettings.company.brand, sub: appSettings.company.tagline, version: appSettings.company.version };
const EXPORT_COLORS = { navy:'#0B2545', teal:'#0E7C7B', gold:'#C8A24A' };
function getExportDocStyles(){
  return `
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Tajawal','Segoe UI',Tahoma,Arial,sans-serif; direction: rtl; padding: 20px; margin: 0; color: ${EXPORT_COLORS.navy}; background: #fff; font-size: 11px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${EXPORT_COLORS.teal}; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 52px; height: 52px; background: linear-gradient(135deg, ${EXPORT_COLORS.navy}, #1E4E86); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-icon svg { width: 30px; height: 30px; }
    .brand-name { font-size: 22px; font-weight: 800; color: ${EXPORT_COLORS.navy}; letter-spacing: -.5px; }
    .brand-sub { font-size: 11px; color: #64748B; margin-top: 2px; }
    .doc-info { text-align: left; font-size: 10.5px; color: #64748B; line-height: 1.7; }
    .doc-info strong { color: ${EXPORT_COLORS.navy}; }
    .doc-title { font-size: 19px; font-weight: 800; color: ${EXPORT_COLORS.navy}; margin: 8px 0 4px; padding-right: 12px; border-right: 4px solid ${EXPORT_COLORS.teal}; }
    .doc-sub { font-size: 12px; color: #64748B; margin-bottom: 18px; padding-right: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .kpi-box { border: 1px solid #E2E8F0; padding: 12px 14px; border-radius: 8px; background: #FAFBFC; }
    .kpi-label { font-size: 10px; color: #64748B; margin-bottom: 5px; font-weight: 600; }
    .kpi-value { font-size: 16px; font-weight: 800; color: ${EXPORT_COLORS.navy}; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
    th { background: ${EXPORT_COLORS.navy}; color: #fff; padding: 10px 8px; text-align: right; font-weight: 700; font-size: 10.5px; white-space: nowrap; border: 1px solid ${EXPORT_COLORS.navy}; }
    td { padding: 8px; border: 1px solid #E2E8F0; color: #0F172A; vertical-align: top; }
    tr:nth-child(even) td { background: #FAFBFC; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 9.5px; color: #64748B; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  `;
}
function buildExportHTML(data){
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA');
  const timeStr = now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' });
  const generatedAt = `${dateStr} - ${timeStr}`;
  const esc = v => String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const kpiHTML = data.kpis && data.kpis.length ? `<div class="kpi-grid">${data.kpis.map(k=>`<div class="kpi-box"><div class="kpi-label">${esc(k.label)}</div><div class="kpi-value">${esc(k.value)}</div></div>`).join('')}</div>` : '';
  const tableHTML = data.columns && data.rows && data.rows.length ? `<table><thead><tr>${data.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p style="text-align:center;color:#64748B;padding:20px">لا بيانات</p>';
  return `
    <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${esc(data.title)}</title>
    <style>${getExportDocStyles()}</style></head><body>
    <div class="header"><div class="logo"><div class="logo-icon">
      <svg viewBox="0 0 48 48" fill="none"><path d="M24 4 L42 11 V24 C42 34.5 34 42.5 24 45.5 C14 42.5 6 34.5 6 24 V11 Z" fill="rgba(255,255,255,.1)" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 24 L21.5 29.5 L33 18" stroke="#C8A24A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div><div><div class="brand-name">${esc(EXPORT_BRAND.name)}</div><div class="brand-sub">${esc(EXPORT_BRAND.sub)} — ${esc(EXPORT_BRAND.version)}</div></div></div>
      <div class="doc-info"><div>الإنشاء: <strong>${generatedAt}</strong></div><div>المستخدم: <strong>${esc(appSettings.reviewer.name)}</strong></div><div>التقرير: <strong>${esc(data.title)}</strong></div></div></div>
    <div class="doc-title">${esc(data.title)}</div>
    <div class="doc-sub">${esc(data.subtitle||'')}${data.count !== undefined ? ` — السجلات: ${esc(data.count)}` : ''}</div>
    ${kpiHTML}${tableHTML}
    <div class="footer"><div>${esc(EXPORT_BRAND.name)} © ${now.getFullYear()}</div><div>${generatedAt}</div></div>
    </body></html>
  `;
}
function downloadExcel(htmlContent, filename){
  const matchBody = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = matchBody ? matchBody[1] : htmlContent;
  const styles = (htmlContent.match(/<style>([\s\S]*?)<\/style>/g) || []).join('\n');
  const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">${styles}</head><body>${body}</body></html>`;
  const blob = new Blob(['\ufeff', template], { type:'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = filename.replace(/[^\u0600-\u06FFa-zA-Z0-9\-_\s]/g,'').trim().replace(/\s+/g,'_');
  a.download = `${safe}_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openPrintWindow(html, mode){
  const win = window.open('', '_blank');
  if(!win){ showWarning('تعذّر','يرجى السماح للنوافذ المنبثقة.'); return; }
  win.document.write(html); win.document.close();
  setTimeout(() => { try { win.focus(); win.print(); } catch(e){} }, 600);
  if(mode === 'pdf') showInfo('PDF','اختر <b>"حفظ كـ PDF"</b>.');
}
const screenDataCollectors = {
  dashboard: () => { const s = stats(); return { title:'لوحة التحكم', subtitle:'ملخص', count:claims.length,
    kpis:[{label:'المطالبات', value:`${s.total}`},{label:'المطالب به', value:fmtC(s.billed)},{label:'الاستقطاع', value:fmtC(s.deduction)},{label:'المعتمد', value:fmtC(s.approved)}],
    columns:['#','رقم','وارد','المريض','الجهة','المطالب','المعتمد','الحالة'],
    rows: claims.slice(0,20).map((c,i)=>[i+1,c.id,c.receivedNumber||'—',c.patient,c.provider,fmt(c.billed),fmt(c.approved),(STATUS[c.status] || STATUS.pending).label]) }; },
  claims: () => { const s = statsFor(claims); return { title:'تقرير المطالبات', subtitle:'القائمة', count:claims.length,
    kpis:[{label:'المطالبات', value:`${s.total}`},{label:'المطالب', value:fmtC(s.billed)},{label:'الاستقطاع', value:fmtC(s.deduction)},{label:'المعتمد', value:fmtC(s.approved)}],
    columns:['#','رقم','وارد','المريض','الجهة','التاريخ','المطالب','المعتمد','الحالة'],
    rows: claims.map((c,i)=>[i+1,c.id,c.receivedNumber||'—',c.patient,c.provider,c.date,fmt(c.billed),fmt(c.approved),(STATUS[c.status] || STATUS.pending).label]) }; },
  intake: () => ({ title:'تقرير الوارد', subtitle:'الدفعات', count:batches.length, kpis:[], columns:['#','رقم','الجهة','الشهر','الاستلام','العدد','القيمة','الحالة'], rows: batches.map((b,i)=>{ const p=getProviderById(b.providerId); return [i+1,b.id,p?p.name:'—',formatMonth(b.month),b.receivedDate,b.claimsCount,fmt(b.totalBilled),BATCH_STATUS[b.status].label]; }) }),
  providers: () => ({ title:'تقرير الجهات', subtitle:'القائمة', count:providers.length, kpis:[], columns:['#','رقم','الجهة','النوع','المدينة','التواصل','الهاتف','الحالة','المطالبات'], rows: providers.map((p,i)=>{ const cs=CONTRACT_STATUS[getEffectiveProviderStatus(p)]; const st=getProviderStats(p.name); return [i+1,p.id,p.name,p.type,p.city,p.contact||'—',p.phone||'—',cs.label,st.claims]; }) }),
  contracts: () => ({ title:'تقرير العقود', subtitle:'القائمة', count:contracts.length, kpis:[], columns:['#','رقم','الجهة','البداية','النهاية','المتبقي','الخصم','الحد','الحالة'], rows: contracts.map((c,i)=>{ const p=getProviderById(c.providerId); const cs=CONTRACT_STATUS[effectiveContractStatus(c)]; return [i+1,c.id,p?p.name:'—',c.startDate,c.endDate,daysRemainingText(c.endDate),`${c.discountRate}%`,fmt(c.maxCoverage||0),cs.label]; }) }),
  tariffs: () => ({ title:'تقرير اللوائح', subtitle:'القائمة', count:tariffs.length, kpis:[], columns:['#','رقم','الاسم','النوع','السريان','الانتهاء','المستوى','الخدمات'], rows: tariffs.map((t,i)=>{ const adj=ADJUST_TYPES[t.adjustmentType]||ADJUST_TYPES.none; return [i+1,t.id,t.name,TARIFF_TYPES[t.type].label,t.effectiveDate,t.expiryDate||'—',`${t.basePriceLevel}%`,(t.services||[]).length]; }) }),
  reports: () => { let base=claims; if(reportsSearchTerm){ const q=reportsSearchTerm.toLowerCase(); base=claims.filter(c=>c.id.toLowerCase().includes(q)||c.patient.toLowerCase().includes(q)||c.provider.toLowerCase().includes(q)); } const s=statsFor(base); return { title:'تقرير مالي', subtitle: reportsSearchTerm?`فلترة: ${reportsSearchTerm}`:'شامل', count:base.length,
    kpis:[{label:'المطالبات', value:`${s.total}`},{label:'المطالب', value:fmtC(s.billed)},{label:'الاستقطاع', value:fmtC(s.deduction)},{label:'النسبة', value:`${s.rate.toFixed(1)}%`}],
    columns:['#','رقم','المريض','الجهة','المطالب','المعتمد','الاستقطاع','السبب','الحالة'],
    rows: base.map((c,i)=>[i+1,c.id,c.patient,c.provider,fmt(c.billed),fmt(c.approved),fmt(c.billed-c.approved),c.reason||'—',(STATUS[c.status] || STATUS.pending).label]) }; },
  search: () => { const results=getSearchResults(); return { title:'نتائج البحث', subtitle: srchTerm?`"${srchTerm}"`:'الكل', count:results.length, kpis:[], columns:['#','الكود','الخدمة','الفئة','الأساسي','الحالي','التغطية','اللائحة'], rows: results.map((r,i)=>[i+1,r.code,r.name,r.category,fmt(r.basePrice),fmt(r.currentPrice),r.covered?'مغطاة':'غير مغطاة',r.tariffName]) }; },
  trash: () => ({ title:'سلة المحذوفات', subtitle:'العناصر', count:trash.length, kpis:[], columns:['#','النوع','الاسم','التفاصيل','تاريخ الحذف'], rows: trash.map((item,i)=>[i+1,item.typeLabel,item.name,getTrashItemDetails(item),new Date(item.deletedAt).toISOString().slice(0,10)]) }),
  timeline: () => {
    const claim = getClaimById(currentTimelineClaimId);
    if(!claim) return null;
    const events = buildClaimTimeline(claim);
    return { title:`الخط الزمني — ${claim.id}`, subtitle:`${claim.patient}`, count:events.length, kpis:[], columns:['#','التاريخ','الحدث','التفاصيل','مرجع'], rows: events.map((e,i)=>[i+1,e.date,e.title,e.description||'—',e.refNumber||'—']) };
  },
  viewClaim: () => {
    const { type, id } = viewState;
    if(type !== 'claim') return null;
    const c = getClaimById(id); if(!c) return null;
    const rows = [];
    (c.invoices||[]).forEach((inv, ii) => {
      const t = INVOICE_TYPES[inv.type] || {label:inv.type};
      (inv.patients||[]).forEach(p => {
        (p.lines||[]).forEach(l => {
          rows.push([`${ii+1}`, t.label, p.name, l.code, l.name, l.category, l.qty, fmt(l.qty*l.billedUnit), fmt(Number(l.approved)||0), fmt((l.qty*l.billedUnit)-(Number(l.approved)||0))]);
        });
      });
    });
    return { title:`المطالبة — ${c.id}`, subtitle:`${c.patient}`, count:rows.length,
      kpis:[{label:'المطالب به', value:fmtC(c.billed)},{label:'المعتمد', value:fmtC(c.approved)},{label:'الاستقطاع', value:fmtC(c.billed-c.approved)},{label:'الحالة', value:(STATUS[c.status] || STATUS.pending).label}],
      columns:['فاتورة','نوع','مريض','كود','بند','فئة','كمية','مطالب','معتمد','استقطاع'], rows };
  }
};
function exportScreen(screen, format){
  const collector = screenDataCollectors[screen];
  if(!collector){ showWarning('خطأ','لا بيانات'); return; }
  const data = collector();
  if(!data){ showWarning('خطأ','لا بيانات'); return; }
  const html = buildExportHTML(data);
  if(format === 'excel'){ downloadExcel(html, data.title); showSuccess('تم', `${data.title} إلى Excel`); }
  else if(format === 'pdf'){ openPrintWindow(html, 'pdf'); }
  else if(format === 'print'){ openPrintWindow(html, 'print'); }
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-export]');
  if(!btn) return;
  exportScreen(btn.dataset.export, btn.dataset.format);
});
