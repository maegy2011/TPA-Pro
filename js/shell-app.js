const SHELL_APP = `
<!-- ============================================================
     التطبيق الرئيسي
     ============================================================ -->
<div id="app" class="screen">
  <div class="app-shell">

    <!-- ==================== الشريط الجانبي ==================== -->
    <aside class="sidebar">
      <div class="brand">
        <div class="bm">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 4 L42 11 V24 C42 34.5 34 42.5 24 45.5 C14 42.5 6 34.5 6 24 V11 Z" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M16 24 L21.5 29.5 L33 18" stroke="#C8A24A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div><h3>TPA Pro</h3><span>v1.0 — مراجعة مالية</span></div>
      </div>

      <nav class="nav">
        <!-- الرئيسية -->
        <div class="nav-section">
          <div class="nav-section-title" data-i18n="nav.main">الرئيسية</div>
          <button class="nav-item active" data-page="dashboard">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.dashboard">لوحة التحكم</span><span class="nav-sub" data-i18n="nav.dashboard.sub">ملخص الأداء</span></span>
          </button>
          <button class="nav-item" data-page="intake">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.intake">الوارد</span><span class="nav-sub" data-i18n="nav.intake.sub">الدفعات الشهرية</span></span>
          </button>
          <button class="nav-item" data-page="claims">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.claims">المطالبات</span><span class="nav-sub" data-i18n="nav.claims.sub">إدارة ومراجعة</span></span>
          </button>
          <button class="nav-item" data-page="sessions">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M6.5 3v4M17.5 3v4M2.5 10h19"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.sessions">جلسات العمل</span><span class="nav-sub" data-i18n="nav.sessions.sub">متابعة المراجعات</span></span>
            <span class="nav-count info" id="sessionsCount" style="display:none">0</span>
          </button>
          <button class="nav-item" data-page="search">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.search">محرك البحث</span><span class="nav-sub" data-i18n="nav.search.sub">البحث في اللوائح</span></span>
          </button>
        </div>

        <!-- البيانات الأساسية -->
        <div class="nav-section">
          <div class="nav-section-title" data-i18n="nav.basic">البيانات الأساسية</div>
          <button class="nav-item" data-page="providers">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V10l8-6 8 6v11"/><path d="M9 21v-5h6v5"/><path d="M12 4v4M10 6h4"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.providers">الجهات الطبية</span><span class="nav-sub" data-i18n="nav.providers.sub">مقدمو الخدمات</span></span>
          </button>
          <button class="nav-item" data-page="contracts">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.contracts">العقود</span><span class="nav-sub" data-i18n="nav.contracts.sub">الاتفاقيات</span></span>
          </button>
          <button class="nav-item" data-page="tariffs">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z"/><path d="M12 8v4M12 16h.01"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.tariffs">اللوائح المالية</span><span class="nav-sub" data-i18n="nav.tariffs.sub">الأسعار والخدمات</span></span>
          </button>
          <button class="nav-item" data-page="deduction-rules">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 V12 C20 17 16 20.5 12 22 C8 20.5 4 17 4 12 V6 Z"/><path d="M9 12l2 2 4-4"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.deduction">قواعد الخصم</span><span class="nav-sub" data-i18n="nav.deduction.sub">سقف وتحمل</span></span>
          </button>
        </div>

        <!-- الأدوات -->
        <div class="nav-section">
          <div class="nav-section-title" data-i18n="nav.reports">التقارير</div>
          <button class="nav-item" data-page="reports">
            <span class="nav-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></span>
            <span class="nav-info"><span class="nav-label" data-i18n="nav.reports">التقارير</span><span class="nav-sub" data-i18n="nav.reports.sub">تحليل مالي</span></span>
          </button>
        </div>

      </nav>
      </nav>

      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="avatar" id="sidebarAvatar">أ</div>
          <div style="min-width:0;flex:1;overflow:hidden">
            <div class="u-name" id="sidebarUserName">المراجع</div>
            <div class="u-role" id="sidebarUserRole">مراجع مالي معتمد</div>
          </div>
          <button id="logoutBtn" title="خروج"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></button>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- ==================== المحتوى ==================== -->
    <div class="main">
      <header class="topbar">
        <button class="hamburger-btn" id="hamburgerBtn" title="القائمة" aria-label="القائمة"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
        <button class="back-btn" id="smartBackBtn" title="رجوع"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
        <div class="tb-title-wrap">
          <h1 id="pageTitle">لوحة التحكم</h1>
        </div>
        <div class="tb-right">
          <button class="tb-action-btn" id="tbTrashBtn" title="المحذوفات">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
            <span class="tb-badge" id="tbTrashCount" style="display:none">0</span>
          </button>
             <button class="tb-action-btn" id="tbBackupBtn" title="نسخة احتياطية">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
          </button>
          <div class="tb-divider"></div>
          <div class="tb-user-wrap" id="tbUserWrap">
            <button class="tb-user" id="tbUserBtn" title="الإعدادات">
              <div class="tb-avatar" id="tbAvatar">أ</div>
              <div class="tb-user-info">
                <div class="tb-user-name" id="tbUserName">المراجع</div>
                <div class="tb-user-role" id="tbUserRole">مراجع مالي معتمد</div>
              </div>
            </button>
            <div class="tb-user-menu" id="tbUserMenu" style="display:none">
              <button class="tb-menu-item" data-action="help">دليل المساعدة</button>
              <button class="tb-menu-item" data-action="settings">الإعدادات</button>
              <button class="tb-menu-item" data-action="lang">اللغة: EN/AR</button>
            </div>
          </div>
          <div class="pill">النظام متصل</div>
        </div>
      </header>

       <div class="page-desc" id="pageDesc">ملخص الأداء المالي</div>
       <div class="content">
         <div id="pagesContainer"></div>
      </div>
    </div>
  </div>
</div>
`;
