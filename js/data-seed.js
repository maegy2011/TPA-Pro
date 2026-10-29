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
let providers = [];
let contracts = [];
let tariffs = [];
let batches = [];
let trash = [];
let deductionRules = [];
let paProcedures = [];