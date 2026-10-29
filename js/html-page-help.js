const PAGE_HELP = `
<section class="page" id="page-help">
      <div class="panel" style="margin-bottom:18px">
        <div class="panel-head"><div><h2>مرحباً بك في TPA Pro v1.0</h2><p>نظام المراجعة المالية للمطالبات الطبية</p></div></div>
        <div class="panel-body">
          <p style="font-size:13px;line-height:1.9;color:var(--text);margin-bottom:14px">
            TPA Pro هو نظام مراجعة مالية متخصص في مطالبات التأمين الطبي. يتيح لك مراجعة، خصم، واعتماد المطالبات
            وفقاً للعقود واللوائح، مع دعم كامل للعمل بدون اتصال.
          </p>
          <div class="info-list">
            <div class="info-row"><span class="k">الإصدار</span><span class="v">v1.0</span></div>
            <div class="info-row"><span class="k">الوضع</span><span class="v" style="color:var(--ok)">بدون اتصال (offline)</span></div>
            <div class="info-row"><span class="k">التخزين</span><span class="v">محلي (localStorage)</span></div>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><div><h2>البدء السريع</h2></div></div>
          <div class="panel-body">
            <ol style="font-size:12.5px;line-height:2;padding-right:18px;color:var(--text)">
              <li>استلم دفعة وارد من صفحة <b>الوارد</b>.</li>
              <li>راجع المطالبات من صفحة <b>المطالبات</b> (أو جلسات المراجعة).</li>
              <li>استخدم <b>محرك البحث</b> للبحث في اللوائح.</li>
              <li>أنشئ <b>قواعد خصم</b> (سقف/تحمل) حسب العقود.</li>
              <li>صدّر <b>التقارير</b> (Excel/PDF/Print).</li>
              <li>أنشئ <b>نسخة احتياطية</b> من الإعدادات.</li>
            </ol>
          </div></div>
        <div class="panel"><div class="panel-head"><div><h2>اختصارات لوحة المفاتيح</h2></div></div>
          <div class="panel-body">
            <div class="info-list">
              <div class="info-row"><span class="k"><kbd>Ctrl+K</kbd></span><span class="v">بحث سريع</span></div>
              <div class="info-row"><span class="k"><kbd>Ctrl+N</kbd></span><span class="v">دفعة جديدة</span></div>
              <div class="info-row"><span class="k"><kbd>Ctrl+S</kbd></span><span class="v">حفظ (في المراجعة)</span></div>
              <div class="info-row"><span class="k"><kbd>Ctrl+Enter</kbd></span><span class="v">اعتماد (في المراجعة)</span></div>
              <div class="info-row"><span class="k"><kbd>Esc</kbd></span><span class="v">إغلاق نافذة</span></div>
              <div class="info-row"><span class="k"><kbd>Alt+↑/↓</kbd></span><span class="v">نقل شرط (في معالج القواعد)</span></div>
            </div>
          </div></div>
      </div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-head"><div><h2>الأسئلة الشائعة (FAQ)</h2></div></div>
        <div class="panel-body">
          <details style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer;color:var(--navy)">أين تُحفظ البيانات؟</summary><p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">البيانات تُحفظ محلياً في متصفحك (localStorage). لا تُرسل إلى أي خادم.</p></details>
          <details style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer;color:var(--navy)">كيف أنسخ البيانات احتياطياً؟</summary><p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">من الإعدادات → "نسخة كاملة" → تصدير. أو تُطلب تلقائياً عند تسجيل الخروج.</p></details>
          <details style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer;color:var(--navy)">هل يعمل بدون اتصال؟</summary><p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">نعم. جميع الموارد (خطوط، scripts، styles) محلية. لا حاجة للإنترنت.</p></details>
          <details style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer;color:var(--navy)">كيف أستعيد جلسة مراجعة؟</summary><p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">من صفحة "جلسات المراجعة" → اختر جلسة → "استئناف".</p></details>
          <details style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer;color:var(--navy)">كيف أنشئ قاعدة خصم؟</summary><p style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">من صفحة "قواعد الخصم" → "معالج إنشاء قاعدة" → اتبع 6 خطوات. يدعم Drag & Drop للشروط.</p></details>
        </div>
      </div>
    </section>
`;
