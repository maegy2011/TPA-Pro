(function(){
  const out = document.getElementById('out');
  const log = (msg) => { out.textContent += msg + '\n'; console.log(msg); };
  const assert = (cond, msg) => { if(!cond){ log('❌ FAIL: ' + msg); window.__testFail = (window.__testFail||0)+1; } else { log('✅ PASS: ' + msg); } };

  assert(typeof validateLine === 'function', 'validateLine exists');
  assert(typeof getContractContext === 'function', 'getContractContext exists');
  assert(typeof computePatient === 'function', 'computePatient exists');
  assert(typeof reasonLabel === 'function', 'reasonLabel exists');

  const claim = (typeof claims !== 'undefined' && claims.length) ? claims[0] : null;
  assert(!!claim, 'claims loaded');

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
    }
  }

  const fails = window.__testFail || 0;
  log(fails ? `Done with ${fails} failure(s).` : 'Done — all tests passed.');
})();
