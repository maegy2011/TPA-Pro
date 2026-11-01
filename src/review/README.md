# وحدة مراجعة المطالبات - الإصدار 2.0

## نظرة عامة
تنفيذ شاشة مراجعة مطالبات مالية بنسختين (نافذة منبثقة `#reviewModal` وصفحة كاملة `#page-review`) مع دعم إنشاء مذكرات خصم مستقلة لكل مريض/فاتورة.

## البنية
```
src/review/
├── controller/     # منطق التحكم والحالة
├── rules/          # قواعد العقد وأسباب الخصم والتحقق
├── models/         # نماذج البيانات
├── components/     # مكونات مشتركة
├── views/          # عروض النافذة والصفحة
├── services/       # خدمات مساعدة
└── styles/         # أنماط
```

## الاستخدام
```js
// تحميل الإصدار الجديد
const shell = await window.loadReviewV2(claim, workingInvoices, '#container', 'auto');
```

## التوافق
- يحافظ على `saveReview()`, `markSessionDirty()`, `activeClaim`, `workingInvoices`
- `review-bind.js` القديم يبقى كما هو للتوافق
- نقاط الربط الموجودة لا تتغير
