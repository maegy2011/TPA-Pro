// backup-tests.js — اختبار استيراد النسخ الاحتياطية
// parseBackupText: إزالة BOM + تفسير JSON + رفض التالف.
// التشغيل: runBackupTests() — يعيد {pass, fail, total, results}
function runBackupTests(){
  const R = [];
  const A = (n,c,x) => R.push({ name:n, ok:!!c, extra: x === undefined ? '' : String(x).slice(0,200) });
  try {
    A('موجودة', typeof parseBackupText === 'function');
    A('بدون BOM', JSON.stringify(parseBackupText('{"a":1}')) === '{"a":1}');
    A('مع BOM', parseBackupText('﻿{"a":1,"b":[2]}').a === 1);
    A('BOM وحده مرفوض', (() => { try { parseBackupText('﻿'); return false; } catch(e){ return true; } })());
    A('تالف مرفوض', (() => { try { parseBackupText('{nope'); return false; } catch(e){ return true; } })());
    A('فارغ مرفوض', (() => { try { parseBackupText(''); return false; } catch(e){ return true; } })());
    A('null مرفوض', (() => { try { parseBackupText(null); return false; } catch(e){ return true; } })());
    // نسخة حقيقية مصدرة من التطبيق (BOM + بنية full-backup)
    const _real = '﻿{"app":"TPA Pro","type":"full-backup","data":{"providers":[]}}';
    A('نسخة التطبيق تُقبل', parseBackupText(_real).type === 'full-backup');
  } catch(e){ A('backup: عطل', false, e.message); }
  const pass = R.filter(r => r.ok).length, fail = R.length - pass;
  try { console.table(R.map(r => ({ الحالة: r.ok ? '✅' : '❌', الاختبار: r.name, ملاحظة: r.extra }))); } catch(e){}
  return { pass, fail, total: R.length, results: R };
}
