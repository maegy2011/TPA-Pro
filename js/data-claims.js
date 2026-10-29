let claims = [
  {
    id:'CLM-2501-0147', patient:'محمد عبدالله السالم', provider:'مستشفى الملك فهد التخصصي', type:'retiree',
    date:'2025-01-12', receivedDate:'2025-01-03', receivedNumber:'IN-2025-00147', reviewedDate:'2025-01-10',
    status:'partial', reason:'خدمات غير مغطاة', notes:'',
    priorApproval:{ required:true, status:'approved', refNumber:'PA-2025-0147', date:'2025-01-05' },
    invoices:[
      mkInvoice('INV-0147-1','inpatient','2025-01-09',[
        mkPatient('INV-0147-1-P1','محمد عبدالله السالم','1234567890',[
          mkLine('SUR-002','عملية كبرى — استئصال','عمليات',1,15000,15000),
          mkLine('MED-001','أدوية ومستلزمات طبية','أدوية',10,120,120),
          mkLine('CONS-001','استشارة تخدير','استشارة',1,300,250),
          mkLine('LAB-001','تحليل دم شامل','مختبر',10,200,200),
          mkLine('MED-009','مستلزمات غير مغطاة تعاقدياً','أدوية',1,800,0,0,'خدمة غير مغطاة')
        ])
      ],{ admissionDate:'2025-01-06', dischargeDate:'2025-01-09', roomClass:'جناح خاص' })
    ]
  },
  {
    id:'CLM-2501-0148', patient:'نورة سعد القحطاني', provider:'مجمع الرياض الطبي', type:'employee',
    date:'2025-01-13', receivedDate:'2025-01-05', receivedNumber:'IN-2025-00148', reviewedDate:'2025-01-11',
    status:'approved', reason:'', notes:'',
    priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' },
    invoices:[
      mkInvoice('INV-0148-1','outpatient','2025-01-13',[
        mkPatient('INV-0148-1-P1','نورة سعد القحطاني','4567890123',[
          mkLine('CONS-002','استشارة تخصصية','استشارة',1,250,250),
          mkLine('LAB-001','تحليل دم شامل','مختبر',5,200,200),
          mkLine('RAD-001','أشعة صدر','أشعة',1,220,220)
        ])
      ])
    ]
  },
  {
    id:'CLM-2501-0149', patient:'خالد فهد العتيبي', provider:'مستشفى المواساة', type:'retiree',
    date:'2025-01-14', receivedDate:'2025-01-06', receivedNumber:'IN-2025-00149', reviewedDate:'2025-01-12',
    status:'partial', reason:'تجاوز الحد الأقصى', notes:'',
    priorApproval:{ required:true, status:'pending', refNumber:'PA-2025-0149', date:'2025-01-10' },
    invoices:[
      mkInvoice('INV-0149-1','lab','2025-01-10',[
        mkPatient('INV-0149-1-P1','خالد فهد العتيبي','2345678901', labLines(15,200)),
        mkPatient('INV-0149-1-P2','منى سالم الحربي','3456789012', labLines(4,180))
      ]),
      mkInvoice('INV-0149-2','inpatient','2025-01-13',[
        mkPatient('INV-0149-2-P1','خالد فهد العتيبي','2345678901',[
          mkLine('SUR-001','عملية صغرى','عمليات',1,4500,4500),
          mkLine('ROOM-01','إقامة غرفة خاصة','إقامة',2,2000,1500),
          mkLine('MED-001','أدوية ومستلزمات','أدوية',5,120,120)
        ])
      ],{ admissionDate:'2025-01-11', dischargeDate:'2025-01-13', roomClass:'غرفة خاصة' })
    ]
  },
  {
    id:'CLM-2501-0150', patient:'سارة أحمد الزهراني', provider:'عيادات النخبة الطبية', type:'employee',
    date:'2025-01-15', receivedDate:'2025-01-07', receivedNumber:'IN-2025-00150', reviewedDate:'2025-01-13',
    status:'rejected', reason:'إجراء تجميلي غير مؤهل', notes:'',
    priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' },
    invoices:[
      mkInvoice('INV-0150-1','outpatient','2025-01-15',[
        mkPatient('INV-0150-1-P1','سارة أحمد الزهراني','5678901234',[
          mkLine('CONS-002','استشارة تخصصية','استشارة',1,350,250,0,'مرفوضة'),
          mkLine('COS-001','إجراء تجميلي','عمليات',1,1500,0,0,'إجراء تجميلي غير مؤهل')
        ])
      ])
    ]
  },
  {
    id:'CLM-2501-0151', patient:'عبدالرحمن ناصر الدوسري', provider:'مستشفى السلام الأهلي', type:'retiree',
    date:'2025-01-16', receivedDate:'2025-01-08', receivedNumber:'IN-2025-00151', reviewedDate:'',
    status:'pending', reason:'', notes:'',
    priorApproval:{ required:true, status:'not-requested', refNumber:'', date:'' },
    invoices:[
      mkInvoice('INV-0151-1','outpatient','2025-01-16',[
        mkPatient('INV-0151-1-P1','عبدالرحمن ناصر الدوسري','6789012345',[
          mkLine('SUR-001','عملية صغرى','عمليات',1,4500,4500,0),
          mkLine('LAB-001','تحليل دم شامل','مختبر',5,200,200,0),
          mkLine('RAD-001','أشعة صدر','أشعة',1,220,220,0),
          mkLine('CONS-001','استشارة طبية عامة','استشارة',1,150,150,0)
        ])
      ])
    ]
  },
  {
    id:'CLM-2501-0152', patient:'هند ماجد الشهري', provider:'مركز الأمل التخصصي', type:'employee',
    date:'2025-01-16', receivedDate:'2025-01-09', receivedNumber:'IN-2025-00152', reviewedDate:'2025-01-14',
    status:'approved', reason:'', notes:'',
    priorApproval:{ required:false, status:'not-requested', refNumber:'', date:'' },
    invoices:[
      mkInvoice('INV-0152-1','outpatient','2025-01-16',[
        mkPatient('INV-0152-1-P1','هند ماجد الشهري','7890123456',[
          mkLine('PT-001','جلسات علاج طبيعي','علاج طبيعي',8,800,800)
        ])
      ])
    ]
  }
];
