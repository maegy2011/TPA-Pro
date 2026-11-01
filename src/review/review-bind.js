// review-bind.js (متوافق مع الكود الحالي) - نقطة الدخول الجديدة
// يعيد توجيه إلى النظم الجديدة مع الحفاظ على التوافق

(function() {
  'use strict';
  
  // تصدير الدوال الأساسية للتوافق
  window.ReviewModule = {
    version: '2.0.0',
    loaded: true
  };
  
  // محاولة تحميل الوحدات الجديدة بشكل كسول
  window.loadReviewV2 = async function(claim, workingInvoices, container, mode) {
    try {
      const { ReviewShell } = await import('./components/ReviewShell.js');
      const shell = new ReviewShell(container || '#reviewModal .modal-body, #page-review', { mode });
      shell.mount(claim, workingInvoices);
      return shell;
    } catch(e) {
      console.error('loadReviewV2 error', e);
      return null;
    }
  };
  
  // الاحتفاظ بالدوال القديمة للعمل
  console.log('[review-bind] Review V2 modules loaded');
})();
