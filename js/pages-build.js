// pages-build.js — وحدة من تطبيق TPA Pro (مراجعة مالية للمطالبات الطبية)
function buildPages(){
  $('#pagesContainer').innerHTML = PAGE_DASHBOARD + PAGE_CLAIMS + PAGE_VIEW + PAGE_REVIEW + PAGE_TIMELINE + PAGE_SEARCH + PAGE_INBOX + PAGE_PROVIDERS + PAGE_CONTRACTS + PAGE_SERVICES + PAGE_TARIFFS + PAGE_DEDUCTION_RULES + PAGE_REPORTS + PAGE_TRASH + PAGE_SESSIONS + PAGE_SETTINGS + PAGE_HELP;
}
buildPages();
