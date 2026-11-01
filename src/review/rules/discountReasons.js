// discountReasons.js - كتالوج أكواد أسباب الخصم
export const DISCOUNT_REASONS = {
  "R-03": { label: "غير مغطى", requiresNote: false },
  "R-07": { label: "سعر أعلى من اللائحة", requiresNote: false },
  "R-12": { label: "سقف اللائحة", requiresNote: false },
  "R-15": { label: "بند مكرر", requiresNote: true },
  "R-18": { label: "بدون موافقة مسبقة", requiresNote: false },
  "R-99": { label: "أخرى", requiresNote: true }
};

const _registry = { ...DISCOUNT_REASONS };

export function register(code, config) {
  if (!code) throw new Error('code is required');
  _registry[code] = { ...(_registry[code] || {}), ...config };
}

export function get(code) {
  if (!code) return null;
  return _registry[code] || null;
}

export function list() {
  return Object.entries(_registry).map(([code, cfg]) => ({ code, ...cfg }));
}

export function getLabel(code) {
  const r = get(code);
  return r ? r.label : code || '';
}

export function requiresNote(code) {
  const r = get(code);
  return r ? !!r.requiresNote : false;
}

export default { DISCOUNT_REASONS, register, get, list, getLabel, requiresNote };
