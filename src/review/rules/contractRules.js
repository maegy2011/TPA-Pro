// contractRules.js - تطبيق قواعد العقد على بند
const _rules = [];

export function register(rule) {
  if (!rule || !rule.id) throw new Error('rule.id is required');
  _rules.push(rule);
  // sort by priority if exists
  _rules.sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 1000;
    const pb = typeof b.priority === 'number' ? b.priority : 1000;
    return pa - pb;
  });
}

export function clear() {
  _rules.length = 0;
}

export function list() {
  return [..._rules];
}

// تطبيق القواعد على بند
export function apply(item, contract) {
  if (!item) return { allowedValue: 0, ruleApplied: null, exception: null };
  const entered = Number(item.enteredValue) || 0;
  
  for (let i = 0; i < _rules.length; i++) {
    const rule = _rules[i];
    try {
      const res = rule.applies ? rule.applies(item, contract) : null;
      if (res && res.applies) {
        const allowedValue = res.allowedValue !== undefined ? Number(res.allowedValue) : entered;
        const discounted = Math.max(0, entered - allowedValue);
        const ruleApplied = {
          ruleId: rule.id,
          ruleName: rule.name || rule.id,
          meta: res.meta || {}
        };
        const out = {
          allowedValue,
          ruleApplied,
          exception: null
        };
        if (res.reasonCode) {
          out.reasonCode = res.reasonCode;
          out.reasonText = res.reasonText || '';
        }
        if (res.exception) {
          out.exception = {
            ruleCode: res.ruleCode || rule.id,
            ruleMessage: res.exception.message || res.message || rule.message || 'مخالفة قاعدة العقد',
            severity: res.exception.severity || rule.severity || 'medium'
          };
        }
        if (res.requiresPreApproval) {
          if (!out.ruleApplied.meta) out.ruleApplied.meta = {};
          out.ruleApplied.meta.requiresPreApproval = true;
        }
        return out;
      }
    } catch (e) {
      // تجاهل خطأ القاعدة واستمر
      continue;
    }
  }
  
  // لم تنطبق أي قاعدة
  return {
    allowedValue: entered,
    ruleApplied: null,
    exception: null
  };
}

export default { register, clear, list, apply };
