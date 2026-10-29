const STATUS = { new:{label:'جديدة',cls:'info'}, pending:{label:'قيد المراجعة',cls:'warn'}, approved:{label:'معتمدة',cls:'ok'}, partial:{label:'معتمدة جزئياً',cls:'info'}, rejected:{label:'مرفوضة',cls:'bad'} };
const CONTRACT_STATUS = { active:{label:'نشط',cls:'ok'}, expiring:{label:'قريب الانتهاء',cls:'warn'}, upcoming:{label:'لم يبدأ',cls:'info'}, expired:{label:'منتهي',cls:'bad'}, cancelled:{label:'ملغى',cls:'bad'} };
const TARIFF_TYPES = { general:{label:'لائحة عامة',cls:'t-general'}, private:{label:'لائحة خاصة',cls:'t-private'}, supplementary:{label:'لائحة مكملة',cls:'t-supplementary'} };
const TARIFF_STATUS = { active:{label:'نشطة',cls:'ok'}, pending:{label:'قيد الاعتماد',cls:'warn'}, expired:{label:'منتهية',cls:'bad'}, cancelled:{label:'ملغاة',cls:'bad'} };
const ADJUST_TYPES = { none:{label:'بدون',cls:''}, discount:{label:'خصم',cls:'t-private'}, increase:{label:'زيادة',cls:'t-supplementary'} };
const TYPE_CLASS = { 'مستشفى':'type-hospital','مجمع طبي':'type-center','عيادة':'type-clinic','مركز تخصصي':'type-special','صيدلية':'type-pharmacy','معمل':'type-lab' };
const BATCH_STATUS = { received:{label:'وارد جديد',cls:'info'}, 'under-review':{label:'قيد المعالجة',cls:'warn'}, completed:{label:'مكتمل',cls:'ok'}, rejected:{label:'مرفوض',cls:'bad'} };
const PA_STATUS = { 'not-requested':{label:'لم تُطلب',cls:'bad'}, 'pending':{label:'قيد الطلب',cls:'warn'}, 'approved':{label:'موافق عليها',cls:'ok'}, 'rejected':{label:'مرفوضة',cls:'bad'} };
const INVOICE_TYPES = {
  outpatient:{label:'عيادة خارجية / كشف'}, lab:{label:'تحاليل مخبرية'},
  rad:{label:'أشعة'}, dental:{label:'أسنان'}, optics:{label:'عيون'}, inpatient:{label:'إقامة داخلية'}
};
const DOC_ITEMS = [
  {key:'patientId', label:'صورة هوية المريض'},
  {key:'referral', label:'خطاب التحويل'},
  {key:'medicalReport', label:'التقرير الطبي'},
  {key:'priorApprovalDoc', label:'الموافقة المسبقة'}
];
const REVIEW_RULES = { maxLabsPerVisit: 13, labCategories: ['مختبر','تحاليل'] };
