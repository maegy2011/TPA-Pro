(function(){
  const out = document.getElementById('out');
  const log = (msg) => { out.textContent += msg + '\n'; console.log(msg); };
  const assert = (cond, msg) => { if(!cond){ log('❌ FAIL: ' + msg); } else { log('✅ PASS: ' + msg); } };

  // basic globals
  assert(typeof validateLine === 'function', 'validateLine exists');
  assert(typeof getContractContext === 'function', 'getContractContext exists');
  assert(typeof computePatient === 'function', 'computePatient exists');

  const claim = (typeof claims !== 'undefined' && claims.length) ? claims[0] : null;
  assert(!!claim, 'claims loaded');

  if (claim) {
    const ctx = getContractContext(claim);
    assert(!!ctx, 'contract context');
    // validate a sample line
    const line = { code: (ctx.tariff && ctx.tariff.services && ctx.tariff.services[0]) ? ctx.tariff.services[0].code : 'X', name: 'test', qty: 1, billedUnit: 100, tariffUnit: 90, _manualEntry: false };
    const res = validateLine(line, { claim, patient: null, invoice: null, contract: ctx.contract, tariff: ctx.tariff, serviceOverrides: ctx.serviceOverrides });
    assert(res && typeof res.decision === 'string', 'validateLine returns decision');
    log('Decision: ' + res.decision);
  }

  log('Done.');
})();
