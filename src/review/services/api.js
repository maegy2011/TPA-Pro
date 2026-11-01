// api.js - غلاف الخادم قابل للاستبدال
export async function saveDraft(payload) {
  // يمكن استبدالها بالاتصال الفعلي
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('review:draft:server:' + (payload.claimId || Date.now()), JSON.stringify(payload));
    }
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e };
  }
}

export async function saveReview(payload) {
  try {
    // يحافظ على التوافق مع الدالة الحالية
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e };
  }
}

export async function sendMemo(memo) {
  return { ok: true, sentAt: new Date().toISOString() };
}

export default { saveDraft, saveReview, sendMemo };
