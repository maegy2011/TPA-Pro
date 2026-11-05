// legal-issuance.js — التخريج القانوني لمذكرات الخصم (الخطوة 7)
function nextLegalSerial(inv, idx){
  if(inv.legalSerial) return inv.legalSerial;
  const d = new Date();
  return `DN-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(idx+1).padStart(4,'0')}`;
}
function buildLegalIssuanceHTML(claim){
  const esc = v => escapeHtml(String(v == null ? '' : v));
  const prov = (typeof getProviderById === 'function' && claim.providerId) ? getProviderById(claim.providerId) : null;
  const provName = claim.provider || (prov?.name) || '—';
  const reviewer = (typeof appSettings !== 'undefined' && appSettings.reviewer && appSettings.reviewer.name) || 'المراجع';
  const now = new Date().toLocaleString('ar-EG');
  let grandBilled = 0, grandDed = 0, serial = 0;
  const blocks = (claim.invoices || []).map((inv, ii) => {
    serial++;
    const ls = inv.legalSerial || nextLegalSerial(inv, ii);
    const rows = [];
    (inv.patients || []).forEach((p, pi) => {
      (p.deductionReasons || []).forEach(d => {
        const amt = Number(d.amount) || 0;
        if(amt <= 0) return;
        const _rv = d.ref && d.ref.ruleId ? String(d.ref.ruleId) + (typeof deductionRules!=='undefined' && deductionRules.find(r=>r.id===d.ref.ruleId) && deductionRules.find(r=>r.id===d.ref.ruleId).version ? ' v' + deductionRules.find(r=>r.id===d.ref.ruleId).version : '') : '';
      rows.push(`<tr><td>${esc(p.name)} (حالة ${pi+1})</td><td>${esc(d.reason||'—')}${_rv?`<div style="color:#6b655a;font-size:10px">القاعدة: ${esc(_rv)}</div>`:''}${d.note?`<div style="color:#6b655a;font-size:10px">${esc(d.note)}</div>`:''}</td><td>${esc(d.source==='manual'?'يدوي':d.source==='rule'?'قاعدة':'تلقائي')}</td><td style="text-align:left;font-weight:700">${fmtC(amt)}</td></tr>`);
      });
    });
    const b = (inv.patients || []).reduce((s,p) => s + (p.lines||[]).reduce((a,l) => a + (Number(l.qty)||0)*(Number(l.billedUnit)||0), 0), 0);
    const ap = (inv.patients || []).reduce((s,p) => s + (Number(p._final)||0), 0);
    grandBilled += b; grandDed += (b - ap);
    return `<div style="margin-bottom:18px">
      <div style="font-weight:800;margin-bottom:6px">مذكرة خصم رقم ${esc(ls)} — ${esc(inv.debitNoteNumber||inv.number||inv.id)} <span style="color:#6b655a;font-weight:400">(${esc(inv.claimType==='retiree'?'معاشات':'عاملين')})</span></div>
      ${rows.length ? `<table><thead><tr><th>المريض</th><th>سبب الخصم</th><th>المصدر</th><th>المبلغ</th></tr></thead><tbody>${rows.join('')}</tbody></table>` : '<p style="color:#6b655a">لا خصومات — معتمدة بالكامل.</p>'}
      <div style="font-size:12px">مطالب: <b>${fmtC(b)}</b> · معتمد: <b>${fmtC(ap)}</b> · مستقطع: <b style="color:#b33a2b">${fmtC(b-ap)}</b></div>
    </div>`;
  }).join('');
  const _manual = [];
  (claim.invoices||[]).forEach(inv => (inv.patients||[]).forEach(p => (p.lines||[]).forEach(l => {
    if(l._decidedBy==='reviewer' && l._decision && l._decision.startsWith('manual')){
      _manual.push(`<tr><td>${esc(l.code||'—')} — ${esc(l.name||'')}</td><td>${esc(l._decision)}</td><td>${esc(l._decisionReason||'—')}</td><td>${esc(l._decisionNote||'—')}</td><td>${esc(l._decidedAt||'')}</td></tr>`);
    }
  })));
  const _manualTable = _manual.length ? `<div style="border:1px solid #d9d3c7;border-radius:6px;padding:12px;margin-top:16px"><div style="font-weight:800;margin-bottom:8px">ملحق القرارات اليدوية (${_manual.length})</div><table><thead><tr><th>البند</th><th>القرار</th><th>السبب</th><th>الملاحظة</th><th>التاريخ</th></tr></thead><tbody>${_manual.join('')}</tbody></table></div>` : '';
  const _ruleVers = [];
  try {
    const _seen = new Set();
    (claim.invoices||[]).forEach(inv => (inv.patients||[]).forEach(p => (p.deductionReasons||[]).forEach(d => {
      if(d.ref && d.ref.ruleId && !_seen.has(d.ref.ruleId)){ _seen.add(d.ref.ruleId);
        const _r = (typeof deductionRules!=='undefined' ? deductionRules : []).find(r => r.id === d.ref.ruleId);
        _ruleVers.push(`<tr><td>${esc(d.ref.ruleId)}</td><td>${esc(_r ? (_r.name||'') : '—')}</td><td>${esc(_r?.version ? 'v'+_r.version : '—')}</td><td>${esc(_r ? (_r.rate+'%') : '—')}</td></tr>`); }
    })));
  } catch(e){}
  const _ruleVerTable = _ruleVers.length ? `<div style="border:1px solid #d9d3c7;border-radius:6px;padding:12px;margin-top:16px"><div style="font-weight:800;margin-bottom:8px">ملحق نسخ القواعد المستخدمة (${_ruleVers.length})</div><table><thead><tr><th>القاعدة</th><th>الاسم</th><th>النسخة</th><th>النسبة</th></tr></thead><tbody>${_ruleVers.join('')}</tbody></table></div>` : '';
  const kpis = [
    { label: 'المطالبة', value: esc(claim.id) },
    { label: 'مقدم الخدمة', value: esc(provName) },
    { label: 'إجمالي المطالب به', value: fmtC(grandBilled) },
    { label: 'إجمالي المستقطع', value: fmtC(grandDed) },
  ];
  return buildExportHTML({
    title: `التخريج القانوني — مذكرات الخصم (${esc(claim.id)})`,
    subtitle: `مقدم الخدمة: ${esc(provName)} · المراجع: ${esc(reviewer)} · التاريخ: ${esc(now)}`,
    kpis: kpis.map(k => ({ label: k.label, value: String(k.value).replace(/<[^>]+>/g,'') })),
    columns: [], rows: [],
  }).replace('</body>', `
    <div style="margin:0 20px 20px">${blocks}
    <div style="border:1px solid #d9d3c7;border-radius:6px;padding:12px;margin-top:16px">
      <div style="font-weight:800;margin-bottom:8px">الإقرار والتوقيعات</div>
      <div style="font-size:11px;line-height:1.9">أقرّ المراجع المالي بأن الخصومات أعلاه مطبقة وفق العقد واللوائح السارية بتاريخ إجراء كل بند، وأن كل بند معلَّق حُسم بقرار مسجل، وأن النسخة المحفوظة على القرص مطابقة لهذا التخريج.</div>
      <div style="display:flex;gap:24px;margin-top:16px">
        <div style="flex:1;border-top:1px solid #8a8378;padding-top:6px">المراجع المالي: ${esc(reviewer)} · التوقيع: ............ · التاريخ: ............</div>
        <div style="flex:1;border-top:1px solid #8a8378;padding-top:6px">المدير المالي: ............ · التوقيع: ............ · التاريخ: ............</div>
      </div>
      ${_manualTable}
    ${_ruleVerTable}
    <div style="font-size:10px;color:#6b655a;margin-top:8px">بصمة التحقق: ${(() => { try { const _fp = (typeof claimFingerprint==='function') ? claimFingerprint(claim) : null; return _fp ? `بنود ${_fp.lines} · تفاصيل #${_fp.detailHash}` : '—'; } catch(e){ return '—'; } })()}<br>إجمالي المطالب: ${fmtC(grandBilled)} · إجمالي المستقطع: ${fmtC(grandDed)} · الصافي المعتمد: ${fmtC(grandBilled-grandDed)}</div>
    </div></div></body>`);
}
function printLegalIssuance(claimId){
  const c = (typeof getClaimById === 'function' ? getClaimById(claimId) : null) || (typeof activeClaim !== 'undefined' ? activeClaim : null);
  if(!c){ if(typeof showWarning === 'function') showWarning('تنبيه','لا مطالبة مفتوحة'); return; }
  if(typeof openPrintWindow !== 'function'){ if(typeof showWarning === 'function') showWarning('تنبيه','الطباعة غير متاحة'); return; }
  if((c.invoices||[]).some(inv => (inv.patients||[]).some(p => (p.lines||[]).some(l => l._decision==='needs-attention'||l._decision==='pa-pending')))){
    if(typeof showWarning === 'function'){ showWarning('استثناءات معلّقة','لا تخريج قبل حسم كل البنود المعلّقة.'); return; }
  }
  openPrintWindow(buildLegalIssuanceHTML(c), 'print');
}
