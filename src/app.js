const basePath=location.hostname.endsWith('github.io')&&location.pathname.startsWith('/siamtefl/')?'/siamtefl':'';if(basePath){document.querySelectorAll('a[href^="/"]').forEach(a=>a.setAttribute('href',basePath+a.getAttribute('href')));const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=basePath+icon.getAttribute('href')}
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#nav');if(toggle&&nav){const setMenuOpen=open=>{nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')};toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';setMenuOpen(open);if(open)nav.querySelector('a')?.focus()});nav.addEventListener('click',e=>{if(e.target.closest('a'))setMenuOpen(false)});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){e.preventDefault();setMenuOpen(false);toggle.focus()}});document.addEventListener('click',e=>{if(toggle.getAttribute('aria-expanded')==='true'&&!nav.contains(e.target)&&!toggle.contains(e.target))setMenuOpen(false)})}
const analyticsId='G-90601G33WS';
const consentKey='siamtefl_analytics_consent';
const consentBanner=document.querySelector('#analytics-consent');
const consentStatus=document.querySelector('#analytics-consent-status');
function showConsentBanner(){if(consentBanner){const choice=localStorage.getItem(consentKey);if(consentStatus)consentStatus.textContent=choice==='granted'?'Current choice: Analytics allowed.':choice==='denied'?'Current choice: Analytics declined.':'No choice saved yet.';consentBanner.hidden=false}}
const hasAnalyticsConsent=()=>localStorage.getItem(consentKey)==='granted';
function loadAnalytics(){
  if(!hasAnalyticsConsent()||window.gtag)return;
  window['ga-disable-'+analyticsId]=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',analyticsId);
  const script=document.createElement('script');
  script.async=true;
  script.src=`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.append(script);
}
function chooseAnalytics(value){
  localStorage.setItem(consentKey,value);
  if(consentBanner)consentBanner.hidden=true;
  if(value==='granted')loadAnalytics();
  else{
    window['ga-disable-'+analyticsId]=true;
    if(window.gtag)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  }
}
if(consentBanner){
  if(!localStorage.getItem(consentKey))showConsentBanner();
  consentBanner.addEventListener('click',e=>{const button=e.target.closest('[data-analytics-consent]');if(button)chooseAnalytics(button.dataset.analyticsConsent)});
}
document.querySelector('#privacy-settings')?.addEventListener('click',showConsentBanner);

const clusterRoutes={
  start_here:['/teach-english-thailand-no-experience/','/teach-english-thailand-non-native-speaker/','/thailand-teacher-visa-work-permit/'],
  find_a_job:['/where-to-find-teaching-jobs-thailand/','/teaching-agency-vs-direct-hire-thailand/','/too-late-apply-teaching-jobs-thailand/','/thailand-teaching-job-application-documents/','/thailand-teaching-interview-demo-lesson/','/cv-resume-teaching-jobs-thailand/','/thailand-teaching-contract-checklist/','/how-long-after-tefl-to-get-teaching-job-thailand/'],
  choose_tefl:['/do-you-need-tefl-to-teach-in-thailand/','/how-to-choose-tefl-course-thailand/','/120-hour-tefl-certificate-thailand/','/online-vs-in-person-tefl-thailand/','/standard-vs-all-in/','/celta-vs-tefl-thailand/','/tefl-job-placement-guarantee-thailand/','/essential-tefl-review/','/120-hour-vs-level-5-tefl-thailand/'],
  pay_and_budget:['/first-time-english-teacher-salary-thailand/','/can-you-live-in-bangkok-on-35000-baht-teaching-salary/','/tefl-bangkok-cost/','/money-to-move-to-thailand-to-teach/','/calculator/','/thailand-teacher-school-holiday-pay/'],
  teach_and_settle:['/teach-english-thailand-without-speaking-thai/','/teaching-large-classes-thailand/']
};
function contentCluster(path){for(const [name,paths] of Object.entries(clusterRoutes)){if(paths.includes(path))return name}return 'site_information'}
document.addEventListener('click',e=>{
  const link=e.target.closest('a[href]');
  if(!link||link.hasAttribute('data-affiliate')||!hasAnalyticsConsent()||typeof window.gtag!=='function')return;
  const zone=link.closest('.next-steps, .article, .page-hero .hero-actions, .hero-actions');
  if(!zone)return;
  const destination=new URL(link.href,location.href);
  if(destination.origin!==location.origin||destination.pathname===location.pathname)return;
  const context=link.closest('.next-steps')?'next_steps':link.closest('.hero-actions')?'homepage_hero':link.closest('.page-hero')?'page_intro':'article_body';
  window.gtag('event','internal_navigation_click',{
    source_page:location.pathname,
    destination_page:destination.pathname,
    link_context:context,
    content_cluster:contentCluster(location.pathname)
  });
});

if(hasAnalyticsConsent())loadAnalytics();
document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-affiliate]');
  if(!a)return;
  const payload={event:'affiliate_click',provider:'essential_tefl',page_path:location.pathname,placement:a.dataset.placement||'unspecified',destination:'essentialtefl.com'};
  window.dispatchEvent(new CustomEvent('siamtefl:affiliate-click',{detail:payload}));
  if(hasAnalyticsConsent()&&typeof window.gtag==='function'){
    window.gtag('event','affiliate_click',{provider:payload.provider,page_path:payload.page_path,placement:payload.placement,destination:payload.destination,transport_type:'beacon'});
  }
});
const form=document.querySelector('#budget-calculator');if(form){const get=id=>document.getElementById(id);const money=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Math.max(0,Math.round(Number(n)||0)));const courseCta=form.querySelector('[data-calculator-course-link]');const referralHref='https://www.essentialtefl.com/?ref=suThaiJapan';const referralPlacement='calculator-result';const calculate=()=>{const course=get('course').value;if(courseCta){const eligible=['standard','level5'].includes(course);courseCta.href=eligible?referralHref:'https://www.essentialtefl.com/courses';courseCta.textContent=eligible?'Check eligible in-person course details ↗':'Explore provider course options ↗';courseCta.setAttribute('rel',eligible?'sponsored nofollow noopener':'noopener');if(eligible){courseCta.setAttribute('data-affiliate','');courseCta.dataset.placement=referralPlacement}else{courseCta.removeAttribute('data-affiliate');courseCta.removeAttribute('data-placement')}}const customField=get('custom-fee-field');if(customField)customField.hidden=course!=='custom';const listed={standard:45000,level5:50000,internship:90000,allin:130000,custom:0};const cost=course==='custom'?(Number(get('customFee')?.value)||0):listed[course];const monthCount=Number(get('months').value)||0;const stay=Number(get('accommodation').value)||0;const food=Number(get('food').value)||0;const transport=Number(get('transport').value)||0;const flight=Number(get('flight').value)||0;const emergency=Number(get('emergency').value)||0;const other=Number(get('other').value)||0;const included=course==='allin'&&get('allInHousing').checked;const total=cost+monthCount*(food+transport+(included?0:stay))+flight+emergency+other;const rows=[['Course fee',cost],['Accommodation',monthCount*(included?0:stay)],['Food',monthCount*food],['Transport',monthCount*transport],['Flight',flight],['Emergency buffer',emergency],['Other',other]];get('calc-total').textContent=`฿${money(total)}`;get('calc-breakdown').innerHTML=rows.map(([n,v])=>`<div class="breakdown-row"><span>${n}</span><strong>฿${money(v)}</strong></div>`).join('')+`<div class="breakdown-row total"><span>Estimated cash needed</span><strong>฿${money(total)}</strong></div>`;get('calc-disclaimer').textContent=`Your estimate covers the course and the ${monthCount} month(s) you entered before first pay. It is a planning scenario, not a quote. Confirm payment timing, housing and current fees directly.`};form.addEventListener('input',calculate);form.addEventListener('change',calculate);calculate()}
