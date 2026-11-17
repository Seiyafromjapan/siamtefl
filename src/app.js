const basePath=location.hostname.endsWith('github.io')&&location.pathname.startsWith('/siamtefl/')?'/siamtefl':'';if(basePath){document.querySelectorAll('a[href^="/"]').forEach(a=>a.setAttribute('href',basePath+a.getAttribute('href')));const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=basePath+icon.getAttribute('href')}
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#nav');if(toggle&&nav){const setMenuOpen=open=>{nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')};toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';setMenuOpen(open);if(open)nav.querySelector('a')?.focus()});nav.addEventListener('click',e=>{const link=e.target.closest('a');if(!link)return;setMenuOpen(false);const destination=new URL(link.href,location.href);if(destination.pathname===location.pathname&&destination.hash){const target=document.getElementById(decodeURIComponent(destination.hash.slice(1)));if(target){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}}});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){e.preventDefault();setMenuOpen(false);toggle.focus()}});document.addEventListener('click',e=>{if(toggle.getAttribute('aria-expanded')==='true'&&!nav.contains(e.target)&&!toggle.contains(e.target))setMenuOpen(false)})}
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
  choose_tefl:['/do-you-need-tefl-to-teach-in-thailand/','/how-to-choose-tefl-course-thailand/','/120-hour-tefl-certificate-thailand/','/online-vs-in-person-tefl-thailand/','/standard-vs-all-in/','/celta-vs-tefl-thailand/','/tefl-job-placement-guarantee-thailand/','/tefl-course-deposit-refund-thailand/','/essential-tefl-review/','/120-hour-vs-level-5-tefl-thailand/','/tefl-course-comparison-thailand/','/see-tefl-chiang-mai-review/','/world-tesol-academy-review/','/is-chiang-mai-a-good-place-to-get-tefl-certified/'],
  pay_and_budget:['/first-time-english-teacher-salary-thailand/','/can-you-live-in-bangkok-on-35000-baht-teaching-salary/','/tefl-bangkok-cost/','/money-to-move-to-thailand-to-teach/','/calculator/','/thailand-teacher-school-holiday-pay/'],
  teach_and_settle:['/teach-english-thailand-without-speaking-thai/','/teaching-large-classes-thailand/']
};
function contentCluster(path){for(const [name,paths] of Object.entries(clusterRoutes)){if(paths.includes(path))return name}return 'site_information'}
document.addEventListener('click',e=>{
  const link=e.target.closest('a[href]');
  if(!link||link.hasAttribute('data-affiliate')||!hasAnalyticsConsent()||typeof window.gtag!=='function')return;
  const zone=link.closest('#nav, .next-steps, .article, .page-hero .hero-actions, .hero-actions, .home-path-grid, .course-path');
  if(!zone)return;
  const destination=new URL(link.href,location.href);
  if(destination.origin!==location.origin||destination.pathname===location.pathname)return;
  const context=link.closest('#nav')?'header_nav':link.closest('.home-path-grid')?'homepage_path':link.closest('.next-steps')?'next_steps':link.closest('.hero-actions')?'homepage_hero':link.closest('.page-hero')?'page_intro':link.closest('.course-path')?'course_path':'article_body';
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
  const providers={essential_tefl:'essentialtefl.com',see_tefl:'seetefl.com',world_tesol_academy:'www.worldtesolacademy.com',teflen:'teflen.com'};
  const provider=a.dataset.provider||'essential_tefl';
  const destination=providers[provider];
  if(!destination)return;
  const payload={event:'affiliate_click',provider,page_path:location.pathname,placement:a.dataset.placement||'unspecified',destination};
  window.dispatchEvent(new CustomEvent('siamtefl:affiliate-click',{detail:payload}));
  if(hasAnalyticsConsent()&&typeof window.gtag==='function'){
    window.gtag('event','affiliate_click',{provider:payload.provider,page_path:payload.page_path,placement:payload.placement,destination:payload.destination,transport_type:'beacon'});
  }
});
const providerOutboundEventFlag=Symbol.for('siamtefl.providerOutboundClickTracked');
const providerOutboundHosts=new Map([
  ['seetefl.com','see_tefl'],
  ['teflen.com','teflen'],
  ['www.seetefl.com','see_tefl'],
  ['worldtesolacademy.com','world_tesol_academy'],
  ['www.worldtesolacademy.com','world_tesol_academy']
]);
const providerReviewPaths=new Set(['/see-tefl-chiang-mai-review','/world-tesol-academy-review']);
document.addEventListener('click',e=>{
  const link=e.target.closest('a[href]');
  if(!link||link.hasAttribute('data-affiliate')||e[providerOutboundEventFlag]||!hasAnalyticsConsent()||typeof window.gtag!=='function')return;
  let destination;
  try{destination=new URL(link.href,location.href)}catch{return}
  const provider=providerOutboundHosts.get(destination.hostname.toLowerCase());
  if(!provider)return;
  const path=location.pathname.replace(/\/+$/,'')||'/';
  const placement=path==='/tefl-course-comparison-thailand'?'comparison_hub':providerReviewPaths.has(path)?'provider_review':'site_content';
  e[providerOutboundEventFlag]=true;
  window.gtag('event','provider_outbound_click',{
    provider,
    placement,
    destination:destination.hostname.toLowerCase()
  });
});
const form=document.querySelector('#budget-calculator');
if(form){
  const get=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Math.max(0,Math.round(Number(n)||0)));
  const courseCta=form.closest('.calculator')?.querySelector('[data-calculator-course-link]');
  const referralHref='https://www.essentialtefl.com/?ref=suThaiJapan';
  const referralPlacement='calculator-result';
  const coursePrices=JSON.parse(form.dataset.coursePrices||'{}');
  const numberValue=id=>{
    const input=get(id);
    const raw=input?.value?.trim()||'';
    if(!raw)return 0;
    const value=Number(raw);
    if(!Number.isFinite(value)){input.value='0';return 0}
    const minimum=input?.min?Number(input.min):NaN;
    const maximum=input?.max?Number(input.max):NaN;
    if(Number.isFinite(minimum)&&value<minimum){input.value=String(minimum);return minimum}
    if(Number.isFinite(maximum)&&value>maximum){input.value=String(maximum);return maximum}
    return value;
  };
  const courseLabel=value=>value?.currency==='THB'?`฿${money(value.amount)}`:'Course price unavailable';
  const updatePaymentNote=course=>{
    const note=get('calc-course-payment');
    if(!note)return;
    if(course==='custom'){note.textContent='Your custom course fee is a user-entered amount in THB. Add any costs that apply to your own situation.';return}
    const item=coursePrices[course];
    if(!item){note.textContent='A confirmed course fee is unavailable; this estimate cannot include course tuition.';return}
    const tuition={amount:item.amount,currency:item.currency};
    const parts=[`Provider-listed tuition: ${courseLabel(tuition)}.`];
    if(item.deposit&&typeof item.deposit.amount==='number'){
      parts.push(`Provider-listed deposit: ${courseLabel(item.deposit)}.`);
      if(item.balanceDue&&typeof item.balanceDue.amount==='number')parts.push(`${item.balanceDue.calculation==='tuition_minus_deposit'?'Calculated remainder after the provider-listed deposit':'Provider-listed balance'}: ${courseLabel(item.balanceDue)}${item.balanceDue.due?` (${item.balanceDue.due})`:''}.`);
      else if(item.balanceDue&&typeof item.balanceDue==='string')parts.push(item.balanceDue);
      else if(item.deposit.currency===item.currency&&item.deposit.amount<=item.amount)parts.push(`Arithmetic remainder after the deposit: ${courseLabel({amount:item.amount-item.deposit.amount,currency:item.currency})}; the due date was not established.`);
    }else{
      parts.push('Deposit or payment split was not confirmed in the checked source; do not treat it as zero.');
    }
    parts.push('The course fee in the estimate is the full listed tuition. A deposit and balance are parts of that total and are not added again.');
    parts.push('Unconfirmed required extras are not included in the numeric result. Add any confirmed amounts to Other one-off costs.');
    note.textContent=parts.join(' ');
  };
  const calculate=()=>{
    const course=get('course').value;
    if(courseCta){
      const eligible=['standard','level5'].includes(course);
      courseCta.href=eligible?referralHref:'https://www.essentialtefl.com/courses';
      courseCta.textContent=eligible?'View in-person course details ↗':'Explore provider course options ↗';
      courseCta.setAttribute('rel',eligible?'sponsored nofollow noopener':'noopener');
      if(eligible){courseCta.setAttribute('data-affiliate','');courseCta.dataset.placement=referralPlacement}else{courseCta.removeAttribute('data-affiliate');courseCta.removeAttribute('data-placement')}
    }
    const customField=get('custom-fee-field');if(customField)customField.hidden=course!=='custom';
    const courseRecord=coursePrices[course];
    const cost=course==='custom'?numberValue('customFee'):courseRecord?.currency==='THB'?Number(courseRecord.amount):null;
    const monthCount=numberValue('months');
    const stay=numberValue('accommodation');
    const food=numberValue('food');
    const transport=numberValue('transport');
    const flight=numberValue('flight');
    const emergency=numberValue('emergency');
    const other=numberValue('other');
    const deposit=numberValue('rentDeposit');
    const advanceRent=numberValue('advanceRent');
    const documents=numberValue('documents');
    const delay=numberValue('delayMonths');
    const included=course==='allin'&&get('allInHousing').checked;
    const monthsBeforePay=monthCount+delay;
    const accommodationRunway=monthsBeforePay*stay;
    const includedHousingCredit=included?Math.min(stay,accommodationRunway):0;
    const rentAfterIncludedHousing=accommodationRunway-includedHousingCredit;
    const prepaidRentCredit=Math.min(advanceRent,rentAfterIncludedHousing);
    const netAccommodationRunway=rentAfterIncludedHousing-prepaidRentCredit;
    if(cost===null){get('calc-total').textContent='Incomplete';get('calc-breakdown').replaceChildren();get('calc-disclaimer').textContent='A confirmed course price is missing, so a complete estimate cannot be calculated.';updatePaymentNote(course);return}
    const total=cost+netAccommodationRunway+monthsBeforePay*(food+transport)+deposit+advanceRent+documents+flight+emergency+other;
    const rows=[['Full course tuition (deposit is included)',cost],['Accommodation runway (after included housing and prepaid rent)',netAccommodationRunway],['Food',monthsBeforePay*food],['Transport',monthsBeforePay*transport],['Refundable housing deposit (cash tied up)',deposit],['Advance rent paid at move-in',advanceRent],['Visa and document costs (your input)',documents],['Flight and arrival costs (your input)',flight],['Emergency buffer (your input)',emergency],['Other one-off costs (your input)',other]];
    get('calc-total').textContent=`฿${money(total)}`;
    get('calc-breakdown').innerHTML=rows.map(([name,value])=>`<div class="breakdown-row"><span>${name}</span><strong>฿${money(value)}</strong></div>`).join('')+`<div class="breakdown-row total"><span>Known-cost estimate</span><strong>฿${money(total)}</strong></div>`;
    get('calc-disclaimer').textContent=`Known-cost estimate for listed tuition and your entered costs through ${monthsBeforePay} month(s) before first pay. It is a planning scenario, not a quote. Unknown required fees are excluded, not treated as zero. Advance rent is credited against matching rent; All-In housing offsets one month only.`;
    updatePaymentNote(course);
  };
  form.addEventListener('input',calculate);
  form.addEventListener('change',calculate);
  calculate();
}

const careerChecklist=document.querySelector('[data-career-checklist]');if(careerChecklist){const boxes=[...careerChecklist.querySelectorAll('input[type="checkbox"]')];const count=careerChecklist.querySelector('[data-checklist-count]');const progress=careerChecklist.querySelector('[data-checklist-progress]');const percent=careerChecklist.querySelector('[data-checklist-percent]');const reset=careerChecklist.querySelector('[data-checklist-reset]');const update=()=>{const complete=boxes.filter(box=>box.checked).length;const ratio=boxes.length?Math.round(complete/boxes.length*100):0;if(count)count.textContent=`${complete} of ${boxes.length} complete`;if(progress)progress.value=complete;if(percent)percent.textContent=`${ratio}% complete`};boxes.forEach(box=>box.addEventListener('change',update));reset?.addEventListener('click',()=>{boxes.forEach(box=>{box.checked=false});update();boxes[0]?.focus()});update()}

const teflenSticky=document.querySelector('#teflen-sticky-cta');
if(teflenSticky&&document.body.classList.contains('phase4b-teflen-review')){
  const article=document.querySelector('.article-content');
  const overview=[...(article?.querySelectorAll('.callout')||[])].find(block=>block.textContent.includes('Quick assessment'));
  const disclosure=document.querySelector('#teflen-affiliate-disclosure');
  const close=teflenSticky.querySelector('.teflen-sticky-close');
  let overviewPassed=false;
  let disclosurePassed=false;
  let dismissed=false;
  let scheduled=false;
  const consent=document.querySelector('#analytics-consent');
  const markPassed=()=>{
    if(overview&&overview.getBoundingClientRect().bottom<=0)overviewPassed=true;
    if(disclosure&&disclosure.getBoundingClientRect().bottom<=0)disclosurePassed=true;
  };
  const update=()=>{
    scheduled=false;
    markPassed();
    const mobile=window.matchMedia('(max-width: 760px)').matches;
    const consentOpen=consent&&!consent.hidden&&getComputedStyle(consent).display!=='none';
    const inlineCtaVisible=[...(article?.querySelectorAll('a[data-affiliate]:not(.teflen-sticky-link)')||[])].some(link=>{
      const rect=link.getBoundingClientRect();
      return rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight;
    });
    const visible=mobile&&overviewPassed&&disclosurePassed&&!inlineCtaVisible&&!consentOpen&&!dismissed;
    teflenSticky.hidden=!visible;
    document.body.classList.toggle('teflen-sticky-visible',visible);
  };
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update)};
  if(overview&&disclosure&&'IntersectionObserver'in window){
    const introObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting||entry.boundingClientRect.bottom>0)continue;
        if(entry.target===overview)overviewPassed=true;
        if(entry.target===disclosure)disclosurePassed=true;
      }
      schedule();
    },{threshold:0});
    introObserver.observe(overview);
    introObserver.observe(disclosure);
  }else{
    window.addEventListener('scroll',markPassed,{passive:true});
    markPassed();
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  consent&&new MutationObserver(schedule).observe(consent,{attributes:true,attributeFilter:['hidden','style','class']});
  close?.addEventListener('click',()=>{dismissed=true;teflenSticky.hidden=true;document.body.classList.remove('teflen-sticky-visible')});
  schedule();
}
if(document.body.classList.contains('phase4b-batch3')||document.body.classList.contains('phase4b-batch4')||document.body.classList.contains('phase4b-batch5')){
  document.querySelectorAll('.table-scroll[tabindex="0"],.table-wrap[tabindex="0"],.job-table-scroll[tabindex="0"]').forEach(region=>{
    region.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      if(region.scrollWidth<=region.clientWidth)return;
      event.preventDefault();
      region.scrollLeft+=event.key==='ArrowRight'?80:-80;
    });
  });
}
