// html-page-services.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
const PAGE_SERVICES = `
<section class="page" id="page-services">
  <div class="grid-kpi" id="servicesKpi"></div>
  <div class="toolbar">
    <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="servicesSearch" placeholder="بحث في الخدمات..." data-i18n-placeholder="common.search"></div>
    <select id="servicesTariffFilter" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="all">كل اللوائح</option>
    </select>
    <select id="servicesValidityFilter" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="all">كل الإصدارات</option><option value="current">سارية اليوم</option><option value="expired">منتهية</option><option value="future">لم يبدأ سريانها</option>
    </select>
    <select id="servicesSort" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="name">فرز: الاسم</option>
      <option value="code">فرز: الكود</option>
      <option value="base">فرز: السعر الأساسي</option>
      <option value="current">فرز: السعر الحالي</option>
      <option value="tariff">فرز: اللائحة</option>
      <option value="category">فرز: الفئة</option>
    </select>
    <select id="servicesSortDir" style="padding:8px 10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
      <option value="asc">تصاعدي</option>
      <option value="desc">تنازلي</option>
    </select>
    <button class="btn-xs" id="servicesAdvToggle">بحث متقدم</button>
    <button class="btn-xs" id="servicesAddBtn">+ إضافة خدمة</button>
    <label style="font-size:12px;color:var(--muted)">سريان التحديث <input type="date" id="servicesEffectiveDate" style="padding:7px;border:1px solid var(--line);border-radius:7px"></label>
    <button class="btn-xs" id="servicesImportBtn">استيراد Excel / CSV</button>
    <button class="btn-xs" id="servicesHistoryBtn">سجل التحديثات</button>
    <button class="btn-xs" id="servicesBulkToggle">تخصيص لجهات</button>
    <input type="file" id="servicesImportFile" accept=".xlsx,.csv,.txt" style="display:none">
  </div>
  <div id="servicesAdvPanel" style="display:none;margin-bottom:12px;padding:10px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
      <input id="advCode" placeholder="كود">
      <input id="advName" placeholder="اسم">
      <input id="advCategory" placeholder="فئة">
      <input id="advTariff" placeholder="لائحة">
      <input id="advMinPrice" type="number" placeholder="سعر أدنى">
      <input id="advMaxPrice" type="number" placeholder="سعر أقصى">
    </div>
    <div style="margin-top:8px"><button class="btn-xs" id="servicesAdvApply">تطبيق</button> <button class="btn-xs" id="servicesAdvReset">إعادة</button></div>
  </div>
  <div id="serviceFormPanel" style="display:none;margin-bottom:12px;padding:12px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">
      <select id="sfTariff"></select>
      <input id="sfCode" placeholder="الكود *">
      <select id="sfCategory"><option>استشارة</option><option>مختبر</option><option>أشعة</option><option>عمليات</option><option>أدوية</option><option>طوارئ</option><option>علاج طبيعي</option><option>أسنان</option><option>أخرى</option></select>
      <input id="sfName" placeholder="الاسم بالعربية *">
      <input id="sfNameEn" placeholder="English name (optional)">
      <input id="sfBasePrice" type="number" min="0" placeholder="الأساسي *">
      <input id="sfCurrentPrice" type="number" min="0" placeholder="الحالي">
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <label class="check-row"><input type="checkbox" id="sfCovered" checked> مغطاة</label>
      <label class="check-row" style="background:#FEF3C7;border-color:#FCD34D"><input type="checkbox" id="sfRequiresPriorApproval"><span style="color:#92400E">⚠ موافقة</span></label>
      <button class="btn-xs" id="sfSaveBtn">حفظ</button>
      <button class="btn-xs" id="sfCancelBtn">إلغاء</button>
      <div id="sfImpact" style="width:100%;font-size:12px;color:var(--muted)"></div>
    </div>
  </div>
  <div id="tariffChangeHistory" style="display:none;margin:10px 0"></div>
  <div id="bulkOvPanel" style="display:none;margin-bottom:12px;padding:12px;border:1px solid var(--line,#E2E8F0);border-radius:8px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">
      <div><label style="font-size:12px;color:var(--muted)">الخدمة *</label><select id="bulkOvService" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"></select><label style="font-size:12px"><input type="checkbox" id="bulkOvWholeTariff"> كل خدمات لائحة</label> <select id="bulkOvTariff" style="max-width:150px;padding:6px;border:1px solid var(--line);border-radius:7px"></select></div>
      <div><label style="font-size:12px;color:var(--muted)">بند جديد (كود + اسم + سعر)</label><div style="display:flex;gap:4px"><input id="bulkOvNewCode" placeholder="كود" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:7px"><input id="bulkOvNewName" placeholder="اسم" style="flex:1;padding:6px;border:1px solid var(--line);border-radius:7px"></div></div>
      <div><label style="font-size:12px;color:var(--muted)">التغطية</label><select id="bulkOvCovered" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"><option value="">بدون تغيير</option><option value="on">مفعّلة في الجهات</option><option value="off">معطّلة في الجهات</option></select></div>
      <div><label style="font-size:12px;color:var(--muted)">الموافقة المسبقة</label><select id="bulkOvPA" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"><option value="">بدون تغيير</option><option value="on">مشروطة في الجهات</option><option value="off">غير مشروطة في الجهات</option></select></div>
      <div><label style="font-size:12px;color:var(--muted)">سعر خاص (اختياري)</label><input id="bulkOvPrice" type="number" min="0" step="1" placeholder="بلا تغيير" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"></div>
      <div><label style="font-size:12px;color:var(--muted)">سريان من</label><input id="bulkOvFrom" type="date" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"></div>
      <div><label style="font-size:12px;color:var(--muted)">سريان إلى</label><input id="bulkOvTo" type="date" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px"></div>
    </div>
    <div style="margin-top:8px"><label style="font-size:12px;color:var(--muted)">الجهات * <button type="button" class="btn-xs" id="bulkOvAllProv">كل الجهات</button> <button type="button" class="btn-xs" id="bulkOvNoProv">إلغاء الكل</button></label><div id="bulkOvProviders" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px"></div></div>
    <div id="bulkOvPreview" style="margin-top:8px;font-size:12px;color:var(--muted)"></div>
    <div style="margin-top:8px;display:flex;gap:8px"><button class="btn-xs" id="bulkOvApply">تطبيق على الجهات</button><button class="btn-xs" id="bulkOvCancel">إلغاء</button></div>
  </div>
  <div class="chips" id="servicesFilterChips" style="margin-bottom:10px">
    <button class="chip active" data-sfilter="all">الكل</button>
    <button class="chip" data-sfilter="covered">مغطاة</button>
    <button class="chip" data-sfilter="uncovered">غير مغطاة</button>
  </div>
  <div class="panel"><div class="table-wrap"><table><thead><tr><th>الكود</th><th>الخدمة</th><th>الفئة</th><th>اللائحة</th><th>من تاريخ</th><th>إلى تاريخ</th><th>نسخ الأسعار</th><th>الأساسي</th><th>الحالي</th><th>التغطية</th><th></th></tr></thead><tbody id="servicesBody"></tbody></table></div></div>
</section>
`;