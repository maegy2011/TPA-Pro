// html-modal-tariffModal.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const MODAL_TARIFF = `
<!-- نافذة اللائحة -->
    <div class="modal" id="tariffModal">
      <div class="modal-bg" data-close-tariff></div>
      <div class="modal-panel wide">
        <div class="modal-head"><div><h3 id="tfModalTitle">إضافة لائحة</h3><p id="tfModalSub">—</p></div><button class="close-btn" data-close-tariff><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div class="modal-body">
          <div class="tf-tabs">
            <button type="button" class="tf-tab active" data-tf-tab="basic">أساسية</button>
            <button type="button" class="tf-tab" data-tf-tab="services">خدمات</button>
            <button type="button" class="tf-tab" data-tf-tab="links">ربط</button>
          </div>
          <div class="tf-panel active" data-tf-panel="basic">
            <div class="form-grid">
              <div class="fg full"><label>اسم اللائحة <span style="color:var(--bad,#DC2626)">*</span></label><input id="tfName" placeholder="مثال: لائحة 2026"><div class="hint">الاسم كما يظهر في التقارير</div></div>
              <div class="fg"><label>النوع</label><select id="tfType"><option value="general">عامة</option><option value="private">خاصة</option><option value="supplementary">مكملة</option></select></div>
              <div class="fg"><label>الحالة</label><select id="tfStatus"><option value="active">نشطة</option><option value="disabled">معطلة</option></select></div>
              <div class="fg"><label>السريان *</label><input id="tfEffective" type="date"></div>
              <div class="fg"><label>الانتهاء</label><input id="tfExpiry" type="date"></div>
              <div class="fg"><label>الرقم</label><input id="tfNumber" readonly></div>
              <div class="fg full"><label>الوصف</label><textarea id="tfDescription"></textarea></div>
            </div>
          </div>
          <div class="tf-panel" data-tf-panel="services">
            <input type="text" id="tfServicesSearch" placeholder="بحث في الخدمات..." style="margin-bottom:8px;width:100%">
            <div id="tfServicesChecklist" style="max-height:260px;overflow:auto;border:1px solid var(--line,#E2E8F0);border-radius:8px;padding:6px"></div>
          </div>
          <div class="tf-panel" data-tf-panel="links">
            <div class="link-list" id="linkContractsList"></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn solid" id="saveTariff" data-i18n="common.save">حفظ</button><button class="btn danger" id="deleteTariff" style="display:none" data-i18n="common.delete">حذف</button><button class="btn out" data-close-tariff data-i18n="common.cancel">إلغاء</button></div>
      </div>
    </div>
`;

const MODAL_TARIFF_IMPORT = `
<div class="modal" id="tariffImportModal">
  <div class="modal-bg" data-close-tariff-import></div>
  <div class="modal-panel" style="max-width:560px">
    <div class="modal-head"><div><h3>استيراد لائحة من Excel</h3><p>إنشاء لائحة جديدة أو تحديث لائحة موجودة بتاريخ سريان</p></div><button class="close-btn" data-close-tariff-import>×</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="fg full"><label>طريقة الاستيراد</label><select id="tariffImportTarget"><option value="new">إنشاء لائحة جديدة من الملف</option></select></div>
        <div class="fg full" id="tariffImportNewFields"><label>اسم اللائحة *</label><input id="tariffImportName" placeholder="مثال: لائحة أسعار 2027"></div>
        <div class="fg"><label>نوع اللائحة</label><select id="tariffImportType"><option value="general">عامة</option><option value="private">خاصة</option><option value="supplementary">مكملة</option></select></div>
        <div class="fg"><label>تاريخ السريان *</label><input id="tariffImportEffective" type="date"></div>
        <div class="fg full"><label>ملف Excel *</label><input id="tariffImportFile" type="file" accept=".xlsx,.csv,.txt"></div>
      </div>
      <p class="hint">يدعم اكتشاف صف العناوين وربط أعمدة السعر واسم الخدمة بالعربية والإنجليزية والمجموعة والكود تلقائيًا. ستظهر معاينة قابلة للتعديل قبل الحفظ. يمكن توليد الأكواد تلقائيًا عند غيابها. تتم قراءة الورقة الأولى؛ يدعم XLSX وCSV ولا يدعم XLS القديم.</p>
      <div id="tariffImportMappingPanel" style="display:none"></div>
    </div>
    <div class="modal-foot"><button class="btn solid" id="confirmTariffImport">بدء الاستيراد</button><button class="btn out" data-close-tariff-import>إلغاء</button></div>
  </div>
</div>`;
