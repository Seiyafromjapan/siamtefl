const basePath=location.hostname.endsWith('github.io')&&location.pathname.startsWith('/siamtefl/')?'/siamtefl':'';if(basePath){document.querySelectorAll('a[href^="/"]').forEach(a=>a.setAttribute('href',basePath+a.getAttribute('href')));const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=basePath+icon.getAttribute('href')}
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})}
const analyticsId='G-90601G33WS';
const consentKey='siamtefl_analytics_consent';
const consentBanner=document.querySelector('#analytics-consent');
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
  if(!localStorage.getItem(consentKey))consentBanner.hidden=false;
  consentBanner.addEventListener('click',e=>{const button=e.target.closest('[data-analytics-consent]');if(button)chooseAnalytics(button.dataset.analyticsConsent)});
}
document.querySelector('#privacy-settings')?.addEventListener('click',()=>{if(consentBanner)consentBanner.hidden=false});
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
const form=document.querySelector('#budget-calculator');if(form){const get=id=>document.getElementById(id);const money=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Math.max(0,Math.round(Number(n)||0)));const calculate=()=>{const course=get('course').value;const customField=get('custom-fee-field');if(customField)customField.hidden=course!=='custom';const listed={standard:45000,level5:50000,internship:90000,allin:130000,custom:0};const cost=course==='custom'?(Number(get('customFee')?.value)||0):listed[course];const monthCount=Number(get('months').value)||0;const stay=Number(get('accommodation').value)||0;const food=Number(get('food').value)||0;const transport=Number(get('transport').value)||0;const flight=Number(get('flight').value)||0;const emergency=Number(get('emergency').value)||0;const other=Number(get('other').value)||0;const included=course==='allin'&&get('allInHousing').checked;const total=cost+monthCount*(food+transport+(included?0:stay))+flight+emergency+other;const rows=[['Course fee',cost],['Accommodation',monthCount*(included?0:stay)],['Food',monthCount*food],['Transport',monthCount*transport],['Flight',flight],['Emergency buffer',emergency],['Other',other]];get('calc-total').textContent=`฿${money(total)}`;get('calc-breakdown').innerHTML=rows.map(([n,v])=>`<div class="breakdown-row"><span>${n}</span><strong>฿${money(v)}</strong></div>`).join('')+`<div class="breakdown-row total"><span>Estimated cash needed</span><strong>฿${money(total)}</strong></div>`;get('calc-disclaimer').textContent=`Your estimate covers the course and the ${monthCount} month(s) you entered before first pay. It is a planning scenario, not a quote. Confirm payment timing, housing and current fees directly.`};form.addEventListener('input',calculate);form.addEventListener('change',calculate);calculate()}
