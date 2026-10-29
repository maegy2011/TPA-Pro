const WIZ_RATE_PRESETS = [5,10,15,20,25,30,40,50];
const WIZ_PERIOD_PRESETS = [
  { label:'هذا الشهر', from:()=>{ const d=new Date(); return d.toISOString().slice(0,8)+'01'; }, to:()=>{ const d=new Date(); d.setMonth(d.getMonth()+1,0); return d.toISOString().slice(0,10); } },
  { label:'هذا الربع', from:()=>{ const d=new Date(); const q=Math.floor(d.getMonth()/3); d.setMonth(q*3,1); return d.toISOString().slice(0,10); }, to:()=>{ const d=new Date(); const q=Math.floor(d.getMonth()/3); d.setMonth(q*3+3,0); return d.toISOString().slice(0,10); } },
  { label:'هذا العام', from:()=>new Date().getFullYear()+'-01-01', to:()=>new Date().getFullYear()+'-12-31' },
  { label:'12 شهر', from:()=>daysFromNow(0), to:()=>daysFromNow(365) },
  { label:'مفتوح', from:()=>daysFromNow(0), to:()=>'' }
];
const WIZ_FIELDS = [
  { path:'claim.type', label:'نوع المطالبة' },
  { path:'claim.priorApproval.status', label:'حالة الموافقة' },
  { path:'claim.billed', label:'إجمالي' },
  { path:'invoice.type', label:'نوع الفاتورة' },
  { path:'invoice.date', label:'تاريخ الفاتورة' },
  { path:'patient.beneficiaryType', label:'نوع المستفيد' },
  { path:'patient._subtotal', label:'إجمالي المريض' },
  { path:'line.code', label:'كود' },
  { path:'line.name', label:'اسم' },
  { path:'line.category', label:'فئة' },
  { path:'line.qty', label:'كمية' },
  { path:'line.billedUnit', label:'سعر' },
  { path:'line.billedTotal', label:'إجمالي البند' }
];
const WIZ_OPS = {
  eq:{label:'يساوي'}, ne:{label:'لا يساوي'}, in:{label:'ضمن'}, not_in:{label:'ليس ضمن'},
  contains:{label:'يحتوي'}, not_contains:{label:'لا يحتوي'}, starts_with:{label:'يبدأ بـ'}, regex_match:{label:' regex '},
  gt:{label:'أكبر من'}, gte:{label:'≥'}, lt:{label:'أصغر من'}, lte:{label:'≤'},
  num_between:{label:'بين (أرقام)'}, approx_eq:{label:'≈ تقريبي'},
  len_eq:{label:'طول ='}, len_gt:{label:'طول >'}, len_lt:{label:'طول <'},
  normalize_eq:{label:'يساوي (مُطبّع)'}, normalize_contains:{label:'يحتوي (مُطبّع)'},
  similar_to:{label:'مشابه (تشابه)'},
  exists:{label:'موجود'}, is_empty:{label:'فارغ',noValue:true}, is_not_empty:{label:'غير فارغ',noValue:true},
  is_true:{label:'true',noValue:true}, is_false:{label:'false',noValue:true},
  // تاريخية
  before:{label:'قبل'}, after:{label:'بعد'}, on_or_before:{label:'≤ تاريخ'}, on_or_after:{label:'≥ تاريخ'},
  between_dates:{label:'بين تاريخين'}, not_between_dates:{label:'ليس بين'},
  same_day:{label:'نفس اليوم'}, same_month:{label:'نفس الشهر'}, same_year:{label:'نفس السنة'},
  same_quarter:{label:'نفس الربع'}, same_week_as:{label:'نفس الأسبوع'},
  is_today:{label:'اليوم',noValue:true}, is_weekend:{label:'عطلة',noValue:true}, is_weekday:{label:'يوم عمل',noValue:true},
  is_business_day:{label:'يوم عمل (تجاري)',noValue:true}, is_not_business_day:{label:'ليس يوم عمل',noValue:true},
  in_last_n_days:{label:'خلال N يوم'}, in_next_n_days:{label:'خلال N يوم (قادم)'},
  is_this_month:{label:'هذا الشهر',noValue:true}, is_this_quarter:{label:'هذا الربع',noValue:true}, is_this_year:{label:'هذا العام',noValue:true},
  is_last_month:{label:'الشهر الماضي',noValue:true}, is_last_quarter:{label:'الربع الماضي',noValue:true}, is_last_year:{label:'العام الماضي',noValue:true},
  is_first_day_of_month:{label:'أول يوم',noValue:true}, is_last_day_of_month:{label:'آخر يوم',noValue:true},
  before_field:{label:'قبل حقل'}, after_field:{label:'بعد حقل'}, on_same_day_as:{label:'نفس يوم حقل'},
  between_fields:{label:'بين حقلين'}, within_days:{label:'خلال N يوم من'}, within_days_of:{label:'خلال N يوم من حقل'},
  working_days_since:{label:'أيام عمل منذ'}, before_field_days:{label:'قبل N يوم من حقل'}, after_field_days:{label:'بعد N يوم من حقل'}
};
const WIZ_OP_GROUPS = [
  { label:'أساسية', ops:['eq','ne','in','not_in','contains','not_contains','starts_with','regex_match'] },
  { label:'عددية', ops:['gt','gte','lt','lte','num_between','approx_eq','len_eq','len_gt','len_lt'] },
  { label:'نصية', ops:['normalize_eq','normalize_contains','similar_to','exists','is_empty','is_not_empty','is_true','is_false'] },
  { label:'تاريخية', ops:['before','after','on_or_before','on_or_after','between_dates','not_between_dates','same_day','same_month','same_year','same_quarter','same_week_as','is_today','is_weekend','is_weekday','is_business_day','is_not_business_day','in_last_n_days','in_next_n_days','is_this_month','is_this_quarter','is_this_year','is_last_month','is_last_quarter','is_last_year','is_first_day_of_month','is_last_day_of_month','before_field','after_field','on_same_day_as','between_fields','within_days','within_days_of','working_days_since','before_field_days','after_field_days'] },
];
const WIZ_MODES = { expr:{label:'شرط'}, any:{label:'يوجد'}, all:{label:'كل'}, count:{label:'عدد'}, sum:{label:'مجموع'}, avg:{label:'متوسط'}, max:{label:'أقصى'}, min:{label:'أدنى'}, duplicate:{label:'مكرر'}, unique:{label:'فريد'} };

const WIZ_SCOPES = { self:{label:'البند'}, patient:{label:'المريض'}, invoice:{label:'الفاتورة'}, claim:{label:'المطالبة'} };
