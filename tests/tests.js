(function(){
  const out = document.getElementById('out');
  const log = (msg) => { out.textContent += msg + '\n'; console.log(msg); };
  const assert = (cond, msg) => { if(!cond){ log('❌ FAIL: ' + msg); window.__testFail = (window.__testFail||0)+1; } else { log('✅ PASS: ' + msg); } };

  const authProbe = '__tpa_auth_scope_probe';
  sessionStorage.setItem(authProbe, '1');
  assert(sessionStorage.getItem(authProbe) === '1', 'tab-scoped session storage is available for authentication state');
  sessionStorage.removeItem(authProbe);
  assert(typeof getAuthenticationLockoutMs === 'function' && typeof recordAuthenticationFailure === 'function', 'authentication throttling helpers exist');
  if(typeof resetAuthenticationFailures === 'function'){
    resetAuthenticationFailures();
    for(let i=0;i<4;i++) recordAuthenticationFailure(1000+i);
    assert(getAuthenticationLockoutMs(2000) === 0, 'login throttling permits attempts before the configured failure limit');
    const lockMs = recordAuthenticationFailure(2000);
    assert(lockMs === 30000, 'fifth failed login starts a 30-second per-tab cooldown');
    assert(getAuthenticationLockoutMs(3000) === 29000, 'login cooldown reports remaining wait accurately');
    resetAuthenticationFailures();
    assert(getAuthenticationLockoutMs(3000) === 0, 'successful-login reset clears the in-memory cooldown');
  }
  assert(typeof isValidProviderEmail === 'function' && typeof isValidProviderPhone === 'function', 'provider contact validators exist');
  assert(isValidProviderEmail('example@exampl.com'), 'provider email validator accepts a standard address');
  assert(isValidProviderPhone('01078914325'), 'provider phone validator accepts an Egyptian mobile number');
  assert(typeof getTariffVersionForDate === 'function' && typeof archiveTariffVersion === 'function', 'effective-dated tariff history helpers exist');
  if(typeof getTariffVersionForDate === 'function' && typeof archiveTariffVersion === 'function'){
    const historicalTariff={id:'T-HIST',effectiveDate:'2025-01-01',expiryDate:'2030-12-31',services:[{code:'X1',currentPrice:100}]};
    archiveTariffVersion(historicalTariff,'2026-01-01','qa-price-change',[{code:'X1',action:'update'}]);
    historicalTariff.services=[{code:'X1',currentPrice:150}];
    assert(getTariffVersionForDate(historicalTariff,'2025-06-01').services[0].currentPrice===100, 'historical tariff lookup returns the old price before a new effective date');
    assert(getTariffVersionForDate(historicalTariff,'2026-06-01').services[0].currentPrice===150, 'historical tariff lookup returns the new price after its effective date');
    assert(historicalTariff.changeLog.length===1 && historicalTariff.priceVersions.length===1, 'tariff update records a version snapshot and an audit entry');
    assert(tariffDateMinusOne('2026-11-02')==='2026-11-01' && tariffDatePlusOne('2026-11-02')==='2026-11-03', 'tariff effective-date arithmetic is timezone independent');
    assert(isTariffApplicableForDate(historicalTariff,'2025-06-01') && isTariffApplicableForDate(historicalTariff,'2026-06-01'), 'effective-dated tariff is applicable in both historical and current periods');
  }
  assert(typeof validateLine === 'function', 'validateLine exists');
  assert(typeof getContractContext === 'function', 'getContractContext exists');
  if(typeof getContractContext === 'function'){
    const _oldProviders=providers, _oldContracts=contracts, _oldTariffs=tariffs;
    try {
      providers=[{id:'QA-PROV',name:'جهة اختبار الربط المباشر'}]; contracts=[];
      tariffs=[{id:'QA-TARIFF',name:'لائحة مرتبطة بالجهة',status:'active',effectiveDate:'2020-01-01',linkedProviderIds:['QA-PROV'],linkedContractIds:[],services:[{code:'QA-1',currentPrice:10}]}];
      const directCtx=getContractContext({provider:'جهة اختبار الربط المباشر',date:'2025-01-01'});
      assert(!!directCtx.tariff && directCtx.tariff.id==='QA-TARIFF', 'provider-linked tariff resolves even when no matching contract exists');
    } finally { providers=_oldProviders; contracts=_oldContracts; tariffs=_oldTariffs; }
  }
  assert(typeof isExternalInvoice === 'function' && isExternalInvoice({type:'outpatient',category:'internal'})===false && isExternalInvoice({type:'inpatient',category:'external'})===true, 'invoice category can explicitly override legacy clinical-type inference');
  assert(typeof computePatient === 'function', 'computePatient exists');
  assert(typeof reasonLabel === 'function', 'reasonLabel exists');
  assert(typeof validateClaim === 'function', 'validateClaim exists');
  assert(typeof appendClaimAuditEvent === 'function', 'claim audit helper exists');
  assert(typeof sanitizeDialogBody === 'function', 'dialog body sanitizer exists');
  assert(typeof safeCsvCell === 'function', 'CSV export cell sanitizer exists');
  assert(typeof getDataStorageHealth === 'function', 'persisted-data health status is exposed');
  assert(typeof inspectDataRelationships === 'function', 'read-only relationship integrity inspector exists');
  assert(typeof getSessionConflictState === 'function', 'session conflict detector exists');
  if(typeof getSessionConflictState === 'function'){
    const baselineClaim = {id:'C-REV-1', patient:'Test', status:'pending', invoices:[]};
    const unchangedClaim = JSON.parse(JSON.stringify(baselineClaim));
    const revisionSession = {claimId:'C-REV-1', baseClaimSnapshot:JSON.parse(JSON.stringify(baselineClaim))};
    assert(getSessionConflictState(revisionSession, unchangedClaim) === 'current', 'session baseline accepts an unchanged live claim');
    const newerClaim = {...baselineClaim, status:'approved'};
    assert(getSessionConflictState(revisionSession, newerClaim) === 'conflict', 'session baseline detects a claim changed after the session began');
    assert(getSessionConflictState({claimId:'C-REV-1'}, unchangedClaim) === 'unknown', 'legacy sessions without a baseline are marked unverifiable, not falsely current');
  }
  if(typeof inspectDataRelationships === 'function'){
    const cleanLinks = inspectDataRelationships({claims:[{id:'C-1'}]}, [{id:'S-1',claimId:'C-1',claimSnapshot:{id:'C-1'}}]);
    assert(cleanLinks.ok && cleanLinks.issues.length === 0, 'relationship inspector accepts matching claim and session references');
    const duplicateClaims = inspectDataRelationships({claims:[{id:'C-1'},{id:'C-1'}]}, []);
    assert(!duplicateClaims.ok && duplicateClaims.issues.some(x=>x.code==='duplicate-id'), 'relationship inspector detects duplicate claim identifiers');
    const mismatch = inspectDataRelationships({claims:[{id:'C-1'}]}, [{id:'S-1',claimId:'C-1',claimSnapshot:{id:'C-2'}}]);
    assert(!mismatch.ok && mismatch.issues.some(x=>x.code==='session-snapshot-id-mismatch'), 'relationship inspector detects session snapshot identity mismatch');
    const orphan = inspectDataRelationships({claims:[]}, [{id:'S-2',claimId:'C-9',claimSnapshot:{id:'C-9'}}]);
    assert(orphan.ok && orphan.issues.some(x=>x.code==='orphan-session'), 'orphan sessions with a matching recovery snapshot are reported without deletion');
  }
  assert(typeof isPersistedRecordArray === 'function', 'persisted collection validator exists');
  if(typeof isPersistedRecordArray === 'function'){
    assert(isPersistedRecordArray([{id:'ok'}]), 'persisted collection validator accepts arrays of records');
    assert(!isPersistedRecordArray('not-an-array') && !isPersistedRecordArray([null]) && !isPersistedRecordArray([[]]), 'persisted collection validator rejects malformed collections');
  }
  assert(typeof parseServicesCSV === 'function', 'service CSV parser exists');
  assert(typeof parseServicesXLSX === 'function' && typeof importServicesFile === 'function', 'Excel XLSX import path is available');
  assert(typeof detectTariffImportLayout === 'function' && typeof buildTariffImportRows === 'function', 'dynamic tariff column mapping is available');
  if(typeof detectTariffImportLayout === 'function' && typeof buildTariffImportRows === 'function'){
    const financialFixture=[['','','','','','','','','','','','','','','','','','المجمع','','','','',''],['','','','','','','','','','','','','','','','','','السعر','اسم التحليل','نوع التحليل','نوع التحليل ','','م'],['','','','','','','','','','','','','','','','','','Hematology','','','','',''],['','','','120','','','','','','','','','','','','','','150','Hematology','صورة دم كاملة','Complete Blood Picture','',1],['','','','56','','','','','','','','','','','','','','70','Hematology','سرعة الترسيب','ESR','',1],['','','','40','','','','','','','','','','','','','','50','Hematology','هيموجلوبين','Hemoglobin','',2]];
    const detected=detectTariffImportLayout(financialFixture), normalized=buildTariffImportRows(financialFixture,detected.mapping,detected.headerRow);
    assert(detected.headerRow===1 && detected.mapping.price===17 && detected.mapping.currentPrice===3, 'financial workbook header row and both price columns are detected');
    assert(normalized.length===4 && normalized[1][1]==='صورة دم كاملة' && normalized[1][7]==='Complete Blood Picture', 'Arabic and English service names are mapped separately');
    assert(normalized[1][2]==='Hematology' && normalized[1][3]==='150' && normalized[1][4]==='120', 'group and list/contract prices are preserved');
    assert(new Set(normalized.slice(1).map(r=>r[0].toLowerCase())).size===3, 'duplicate source ordinals are converted to unique service codes');
  }
  if(typeof parseServicesCSV === 'function'){
    const parsedServices = parseServicesCSV('code,name,base\r\nA1,\"Consultation, specialist\",125\r\nA2,\"Lab \"\"CBC\"\"\nComplete\",250');
    assert(parsedServices.length === 3 && parsedServices[1][1] === 'Consultation, specialist', 'CSV parser preserves quoted commas');
    assert(parsedServices[2][1] === 'Lab \"CBC\"\nComplete', 'CSV parser preserves escaped quotes and embedded newlines');
    let malformedCsvRejected=false; try { parseServicesCSV('code,name,base\nA1,\"broken,100'); } catch(e) { malformedCsvRejected=true; }
    assert(malformedCsvRejected, 'CSV parser rejects unclosed quoted fields');
    let oversizedCsvRejected=false; try { parseServicesCSV('a,b\n1,2', {maxChars:3}); } catch(e) { oversizedCsvRejected=true; }
    assert(oversizedCsvRejected, 'CSV parser enforces input size limits');
  }
  if(typeof safeCsvCell === 'function'){
    assert(safeCsvCell('=1+1').startsWith("\"'=1+1"), 'CSV formula prefix is neutralized');
    assert(safeCsvCell('  @SUM(A1:A2)').startsWith("\"'  @SUM"), 'CSV formula prefix after whitespace is neutralized');
    assert(safeCsvCell('Patient, Name').includes('Patient, Name'), 'CSV quoting preserves commas in ordinary text');
    assert(safeCsvCell('He said \"OK\"').includes('\"\"'), 'CSV quoting doubles embedded quotes');
  }
  if(typeof sanitizeDialogBody === 'function'){
    const safeDialog = sanitizeDialogBody('<div onclick="alert(1)"><b>safe</b><img src=x onerror="alert(2)"><script>alert(3)</script><label><input type="checkbox" checked>ok</label></div>');
    const probe = document.createElement('div'); probe.appendChild(safeDialog);
    assert(!probe.querySelector('script,img'), 'dialog sanitizer removes executable and external media elements');
    assert(!probe.querySelector('[onclick],[onerror]'), 'dialog sanitizer removes inline event handlers');
    assert(!!probe.querySelector('input[type=checkbox][checked]'), 'dialog sanitizer preserves supported confirmation controls');
  }

  const auditFixture = { id: 'qa-audit', _auditTrail: [] };
  const auditEntry = appendClaimAuditEvent(auditFixture, { action: 'review.signed-off', details: { decision: 'partial', approved: 75 } });
  assert(auditFixture._auditTrail.length === 1 && auditEntry.action === 'review.signed-off', 'audit event is appended to the claim');
  assert(!!auditEntry.at && !!auditEntry.actor && auditEntry.details.approved === 75, 'audit event records timestamp, configured actor and decision details');

  // Recalculation must remove its own prior deductions without deleting reviewer-entered reasons.
  const deductionReset = resetComputedDeductionReasons([
    { source: 'auto', reason: 'old automatic' },
    { source: 'rule', reason: 'old rule' },
    { source: 'manual', _generatedByCompute: true, reason: 'old computed override' },
    { source: 'manual', reason: 'reviewer note' }
  ]);
  assert(deductionReset.length === 1 && deductionReset[0].reason === 'reviewer note', 'recalculation removes generated deductions but preserves reviewer-entered reasons');

  assert(typeof checkRequires === 'function', 'checkRequires exists');
  // Dependency gates must fail closed for malformed/unsupported modes.
  const depSet = new Set(['base-rule']);
  assert(checkRequires({ requires: { ruleIds: ['base-rule'], mode: 'any' } }, depSet) === true, 'dependency mode any accepts an applied prerequisite');
  assert(checkRequires({ requires: { ruleIds: ['missing-rule'], mode: 'all' } }, depSet) === false, 'dependency mode all rejects a missing prerequisite');
  assert(checkRequires({ requires: { ruleIds: ['base-rule'], mode: 'none' } }, depSet) === false, 'dependency mode none rejects when prerequisite is applied');
  assert(checkRequires({ requires: { ruleIds: ['base-rule'], mode: 'unsupported-mode' } }, depSet) === false, 'unsupported dependency mode fails closed');

  // Financial actions must never produce a negative approved amount or exceed the base.
  const baseCtx = { line: { lineBase: 100 } };
  assert(evaluateRuleAction({ action: 'reduce_by_percent', rate: 150 }, baseCtx, 100).newApproved === 0, 'percentage reduction is clamped at 100 percent');
  assert(evaluateRuleAction({ action: 'reduce_by_fixed', rate: 150 }, baseCtx, 100).newApproved === 0, 'fixed reduction cannot produce a negative amount');
  assert(evaluateRuleAction({ action: 'cap_to_amount', rate: 150 }, baseCtx, 100).newApproved === 100, 'amount cap cannot exceed the base');
  assert(evaluateRuleAction({ action: 'set_to_percent', rate: 150 }, baseCtx, 100).newApproved === 100, 'set percentage is clamped to the base');

  // Submitted total must remain the reconciliation target even when recalculated billed differs.
  const reconciliationClaim = {
    submittedBilled: 500,
    billed: 470,
    invoices: [{ patients: [{ lines: [{ qty: 1, billedUnit: 470 }] }] }]
  };
  const reconciliation = validateClaim(reconciliationClaim);
  assert(reconciliation.target === 500, 'validateClaim uses submittedBilled as reconciliation target');
  assert(reconciliation.failed.includes('invoice-mismatch'), 'validateClaim detects submitted-vs-lines mismatch');
  assert(reconciliation.targetSource === 'submittedBilled', 'validateClaim reports submitted target source');
  assert(getClaimReconciliationTarget({ submittedBilled: 500, billed: 470 }).amount === 500, 'finalization reconciliation prefers immutable submitted amount');
  assert(getClaimReconciliationTarget({ submittedBilled: -1, billed: 470 }).amount === 470, 'invalid submitted amount falls back to legacy billed amount');

  const claim = (typeof claims !== 'undefined' && claims.length) ? claims[0] : null;
  assert(Array.isArray(claims), 'claims array exists');

  // Regression: user-controlled timeline/session values must be encoded before HTML insertion.
  const xssProbe = '<img src=x onerror=alert(1)>';
  const encodedProbe = escapeHtml(xssProbe);
  assert(!encodedProbe.includes('<') && !encodedProbe.includes('>'), 'HTML encoder neutralizes markup in claim/session text');
  assert(encodedProbe.includes('&lt;img') && encodedProbe.includes('&gt;'), 'HTML encoder preserves hostile input as inert text');

  if (claim) {
    const ctx = getContractContext(claim);
    assert(!!ctx, 'contract context built');

    // manual entry should reject
    const manualLine = { code: 'MANUAL-1', name: 'manual', qty: 1, billedUnit: 100, tariffUnit: null, _manualEntry: true };
    const r1 = validateLine(manualLine, { claim, patient: null, invoice: null, contract: ctx.contract, tariff: ctx.tariff, serviceOverrides: ctx.serviceOverrides });
    assert(r1.decision === 'auto-rejected', 'manual entry auto-rejected');

    // in-tariff line if available
    if (ctx.tariff && ctx.tariff.services && ctx.tariff.services.length) {
      const svc = ctx.tariff.services[0];
      const line = { code: svc.code, name: svc.name, qty: 1, billedUnit: svc.currentPrice, tariffUnit: svc.currentPrice, _manualEntry: false };
      const r2 = validateLine(line, { claim, patient: null, invoice: null, contract: ctx.contract, tariff: ctx.tariff, serviceOverrides: ctx.serviceOverrides });
      assert(typeof r2.decision === 'string', 'validateLine returns decision for tariff line');
      log('Tariff line decision: ' + r2.decision);

      // Regression: a prior-approval status change must invalidate the line cache.
      const paTariff = { ...ctx.tariff, services: [{ ...svc, code: 'PA-CACHE-TEST', currentPrice: 100, covered: true, requiresPriorApproval: true }] };
      const paClaim = { id: 'qa-pa-cache', date: '2025-01-01', priorApproval: { required: true, status: 'pending', date: '' } };
      const paLine = { code: 'PA-CACHE-TEST', name: 'PA test', qty: 1, billedUnit: 100, tariffUnit: 100, _manualEntry: false };
      const paCtx = { claim: paClaim, patient: null, invoice: { id: 'qa-pa-invoice', date: '2025-01-01' }, contract: ctx.contract || {}, tariff: paTariff, serviceOverrides: {} };
      clearValidationCache();
      const pendingPA = validateLine(paLine, paCtx);
      assert(pendingPA.failed.includes('pa-pending'), 'pending prior approval is flagged for attention');
      paClaim.priorApproval.status = 'approved';
      paClaim.priorApproval.date = '2024-12-31';
      const approvedPA = validateLine(paLine, paCtx);
      assert(approvedPA.passed.includes('pa-valid') && !approvedPA.failed.includes('pa-pending'), 'approval status change invalidates cached line result');
      paClaim.priorApproval.date = '2025-01-02';
      const expiredPA = validateLine(paLine, paCtx);
      assert(expiredPA.failed.includes('pa-expired'), 'approval issued after service date is rejected');

      // Regression: invoice document changes must not reuse a stale cached result.
      const docKeys = (typeof DOC_ITEMS !== 'undefined' ? DOC_ITEMS : []).map(d => d.key);
      const docInvoice = { id: 'qa-doc-cache', documents: {} };
      clearValidationCache();
      const missingDocs = validateInvoice(docInvoice, { contract: ctx.contract || {} });
      assert(missingDocs.failed.includes('missing-docs'), 'invoice with missing documents is flagged');
      docKeys.forEach(k => { docInvoice.documents[k] = true; });
      const completeDocs = validateInvoice(docInvoice, { contract: ctx.contract || {} });
      assert(completeDocs.passed.includes('docs-present'), 'document updates invalidate cached invoice validation');
    }
  }

  const fails = window.__testFail || 0;
  log(fails ? `Done with ${fails} failure(s).` : 'Done — all tests passed.');
})();

// Password-storage regression checks (asynchronous Web Crypto).
(async () => {
  const out = document.getElementById('out');
  const log = (msg) => { out.textContent += msg + '\n'; console.log(msg); };
  const assert = (cond, msg) => { if(!cond){ log('❌ FAIL: ' + msg); window.__testFail = (window.__testFail||0)+1; } else { log('✅ PASS: ' + msg); } };
  const key = 'tpa_pwd_hash';
  if(!window.isSecureContext || !window.crypto || !crypto.subtle){ log('⏭ SKIP: password KDF browser checks require HTTPS/localhost Web Crypto; Node Web Crypto is tested separately.'); return; }
  const previous = localStorage.getItem(key);
  try {
    const modern = await hashPassword('QaPass123');
    assert(modern.startsWith('pbkdf2_sha256$'), 'new password hashes use PBKDF2-SHA-256');
    assert(modern.split('$')[2].length === 32, 'PBKDF2 password hash uses a 16-byte random salt');
    localStorage.setItem(key, modern);
    assert(await verifyPassword('QaPass123'), 'PBKDF2 password verification accepts the correct password');
    assert(!(await verifyPassword('WrongPass123')), 'PBKDF2 password verification rejects an incorrect password');

    const legacy = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('Legacy123::tpa_salt_2025'));
    const legacyHex = Array.from(new Uint8Array(legacy)).map(b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem(key, 'sha256_' + legacyHex);
    assert(await verifyPassword('Legacy123'), 'legacy SHA-256 password remains verifiable for migration');
    assert(localStorage.getItem(key).startsWith('pbkdf2_sha256$'), 'successful legacy login upgrades the stored password hash');
  } catch (e) {
    assert(false, 'password KDF checks execute: ' + (e && e.message ? e.message : 'unknown error'));
  } finally {
    if(previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    const fails = window.__testFail || 0;
    log(fails ? `Done with ${fails} failure(s).` : 'Done — all tests passed.');
  }
})();
