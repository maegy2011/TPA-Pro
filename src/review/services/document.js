// document.js - معاينة/طباعة/PDF
export function preview(memoOrClaim) {
  try {
    alert('معاينة (قيد التطوير)');
    console.log('preview', memoOrClaim);
  } catch(e) {}
}

export function print(memoOrClaim) {
  try {
    window.print();
  } catch(e) {}
}

export function exportPDF(memoOrClaim) {
  try {
    alert('تصدير PDF (قيد التطوير)');
  } catch(e) {}
}

export default { preview, print, exportPDF };
