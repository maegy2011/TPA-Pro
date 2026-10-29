let providers = [
  { id:'PRV-001', name:'مستشفى الملك فهد التخصصي', type:'مستشفى', city:'الرياض', contact:'د. فهد العمري', phone:'0112345678', email:'info@kfsh.med.sa', notes:'' },
  { id:'PRV-002', name:'مجمع الرياض الطبي', type:'مجمع طبي', city:'الرياض', contact:'أ. سارة الدوسري', phone:'0114567890', email:'contact@riyadh-med.sa', notes:'' },
  { id:'PRV-003', name:'مستشفى المواساة', type:'مستشفى', city:'الدمام', contact:'د. عبدالله الشمري', phone:'0138765432', email:'info@mouwasat.sa', notes:'' },
  { id:'PRV-004', name:'عيادات النخبة الطبية', type:'عيادة', city:'جدة', contact:'أ. محمد الغامدي', phone:'0126789012', email:'info@elite-clinics.sa', notes:'' },
  { id:'PRV-005', name:'مستشفى السلام الأهلي', type:'مستشفى', city:'الرياض', contact:'د. نورة القحطاني', phone:'0115678901', email:'info@salam-hosp.sa', notes:'' },
  { id:'PRV-006', name:'مركز الأمل التخصصي', type:'مركز تخصصي', city:'جدة', contact:'أ. هند العتيبي', phone:'0127654321', email:'info@amal-center.sa', notes:'' }
];
let contracts = [
  { id:'CTR-2025-001', providerId:'PRV-001', startDate:daysFromNow(-200), endDate:daysFromNow(400), discountRate:15, paymentTerms:'30 يوم', maxCoverage:500000, coveredServices:'جميع الخدمات', autoRenew:true, status:'active', notes:'' },
  { id:'CTR-2025-002', providerId:'PRV-002', startDate:daysFromNow(-100), endDate:daysFromNow(50), discountRate:10, paymentTerms:'45 يوم', maxCoverage:300000, coveredServices:'الخدمات الأساسية', autoRenew:true, status:'active', notes:'' },
  { id:'CTR-2025-003', providerId:'PRV-003', startDate:daysFromNow(-400), endDate:daysFromNow(-30), discountRate:18, paymentTerms:'60 يوم', maxCoverage:750000, coveredServices:'جميع الخدمات', autoRenew:false, status:'active', notes:'' },
  { id:'CTR-2025-004', providerId:'PRV-004', startDate:daysFromNow(30), endDate:daysFromNow(395), discountRate:5, paymentTerms:'30 يوم', maxCoverage:200000, coveredServices:'الطوارئ', autoRenew:true, status:'active', notes:'' },
  { id:'CTR-2025-005', providerId:'PRV-005', startDate:daysFromNow(-250), endDate:daysFromNow(115), discountRate:12, paymentTerms:'30 يوم', maxCoverage:400000, coveredServices:'جميع الخدمات', autoRenew:true, status:'active', notes:'' },
  { id:'CTR-2025-006', providerId:'PRV-006', startDate:daysFromNow(-150), endDate:daysFromNow(215), discountRate:8, paymentTerms:'45 يوم', maxCoverage:250000, coveredServices:'العلاج الطبيعي', autoRenew:true, status:'active', notes:'' }
];
function generateServices(level, adjType, adjRate){
  const templates = [
    { code:'CONS-001', name:'استشارة طبية عامة', category:'استشارة', base:150, pa:false },
    { code:'CONS-002', name:'استشارة تخصصية', category:'استشارة', base:250, pa:false },
    { code:'LAB-001', name:'تحليل دم شامل', category:'مختبر', base:200, pa:false },
    { code:'RAD-001', name:'أشعة صدر', category:'أشعة', base:220, pa:false },
    { code:'SUR-001', name:'عملية صغرى', category:'عمليات', base:4500, pa:true },
    { code:'SUR-002', name:'عملية كبرى', category:'عمليات', base:15000, pa:true },
    { code:'MED-001', name:'وصفة أدوية', category:'أدوية', base:120, pa:false },
    { code:'ER-001', name:'زيارة طوارئ', category:'طوارئ', base:400, pa:false }
  ];
  const mul = adjType==='discount' ? (1-adjRate/100) : adjType==='increase' ? (1+adjRate/100) : 1;
  return templates.map(t => {
    const bp = Math.round(t.base * level / 100);
    return { code:t.code, name:t.name, category:t.category, basePrice:bp, currentPrice:Math.round(bp*mul), covered:true, requiresPriorApproval:t.pa };
  });
}
let tariffs = [
  { id:'TAR-2025-001', name:'اللائحة العامة للأسعار الطبية 2025', type:'general', description:'اللائحة العامة المعتمدة.', effectiveDate:daysFromNow(-200), expiryDate:daysFromNow(165), status:'active', basePriceLevel:100, annualIncreaseEnabled:true, annualIncreaseRate:5, lastIncreaseDate:daysFromNow(-200), lastIncreaseApprovedBy:'مجلس الضمان الصحي', adjustmentType:'discount', adjustmentRate:15, linkedProviderIds:['PRV-001','PRV-002','PRV-003','PRV-005'], linkedContractIds:['CTR-2025-001','CTR-2025-002','CTR-2025-003','CTR-2025-005'], increaseHistory:[], services:generateServices(100,'discount',15) },
  { id:'TAR-2025-002', name:'اللائحة الخاصة — المستشفيات الكبرى', type:'private', description:'لائحة خاصة.', effectiveDate:daysFromNow(-100), expiryDate:daysFromNow(265), status:'active', basePriceLevel:110, annualIncreaseEnabled:true, annualIncreaseRate:7, lastIncreaseDate:daysFromNow(-100), lastIncreaseApprovedBy:'الإدارة المالية', adjustmentType:'increase', adjustmentRate:7, linkedProviderIds:['PRV-001'], linkedContractIds:['CTR-2025-001'], increaseHistory:[], services:generateServices(110,'increase',7) },
  { id:'TAR-2025-003', name:'اللائحة المكملة — الخدمات المتقدمة', type:'supplementary', description:'تغطية إضافية.', effectiveDate:daysFromNow(-60), expiryDate:daysFromNow(305), status:'active', basePriceLevel:120, annualIncreaseEnabled:true, annualIncreaseRate:6, lastIncreaseDate:daysFromNow(-60), lastIncreaseApprovedBy:'لجنة المراجعة', adjustmentType:'increase', adjustmentRate:6, linkedProviderIds:['PRV-006'], linkedContractIds:['CTR-2025-006'], increaseHistory:[], services:generateServices(120,'increase',6) }
];
let batches = [
  { id:'BTH-2025-01-001', month:'2025-01', providerId:'PRV-001', receivedDate:'2025-01-03', claimsCount:45, totalBilled:285000, status:'under-review', notes:'' },
  { id:'BTH-2025-01-002', month:'2025-01', providerId:'PRV-002', receivedDate:'2025-01-05', claimsCount:32, totalBilled:198000, status:'received', notes:'' },
  { id:'BTH-2024-12-001', month:'2024-12', providerId:'PRV-001', receivedDate:'2024-12-02', claimsCount:38, totalBilled:225000, status:'completed', notes:'' }
];
let trash = [];
let deductionRules = [
  { id:'DR-2025-001', name:'سقف تغطية العاملين — إجراءات بدون موافقة', type:'coverage_cap', action:'apply_cap', rate:30,
    scope:{ providerIds:[], contractIds:[], claimTypes:['employee'] },
    conditions:{ logic:'AND', rules:[
      { field:'patient.beneficiaryType', op:'eq', value:'employee' },
      { field:'claim.priorApproval.status', op:'ne', value:'approved' }
    ]},
    effectiveFrom:daysFromNow(-90), effectiveTo:daysFromNow(275), active:true, enabled:true, notes:'يُطبق على العاملين فقط بدون موافقة سارية' },
  { id:'DR-2025-002', name:'تحمل المتقاعد — نسبة دفع نقدي', type:'retiree_copay', action:'apply_copay', rate:20,
    scope:{ providerIds:[], contractIds:[], claimTypes:['retiree'] },
    conditions:{ logic:'AND', rules:[
      { field:'patient.beneficiaryType', op:'eq', value:'retiree' }
    ]},
    effectiveFrom:daysFromNow(-90), effectiveTo:daysFromNow(275), active:true, enabled:true, notes:'يُفعَّل تلقائياً لمطالبات المعاشات' }
];
let paProcedures = [
  { code:'SUR-001', name:'عملية صغرى', category:'عمليات', notes:'' },
  { code:'SUR-002', name:'عملية كبرى', category:'عمليات', notes:'' }
];
