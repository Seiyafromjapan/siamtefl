# Essential TEFL LP draft

**State:** Local review only, branch `codex/essential-tefl-lp-draft`; not pushed or published. Route candidate: `/essential-tefl-review/`.

## Wireframe and page intent

1. Breadcrumb, clear independent-review label, concise decision headline.
2. Affiliate disclosure immediately before the first decision, including the pending attribution/payment terms and no active referral URL.
3. Quick verdict and disabled CTA placeholder.
4. Course comparison table with exact route, fee, course hours/qualification, and support scope.
5. Evidence-based benefit cards and a “Standard or Level 5?” chooser.
6. Prominent Thai work-eligibility caveat and links to S001/S002/S003/S004/S006 support articles.
7. Written-question checklist for eligibility, course certificate, fees/refunds, practice, placement, housing and visa support.
8. Independent assessment, limitations, primary sources, and cross-links to S001–S008.

The page uses existing responsive article/table/card styles. Content is stacked in a single reading column; comparison tables scroll horizontally on small screens. There is no floating CTA that obscures reading.

## Measurement plan

- GA4 page entry: report consented sessions by landing page `/essential-tefl-review/` (existing GA4 property/reporting path).
- Outbound intent: use existing `affiliate_click` event only after partner confirms that SEO-article → LP → provider clicks qualify. Existing `src/app.js` emits `provider`, `page_path`, `placement`, and `destination` after a click on an `a[data-affiliate]`; it honors the site's analytics consent choice.
- Proposed placements: `lp-hero`, `lp-comparison`, `lp-verdict`. Add referral destinations only after confirmation; verify event receipt in GA4 DebugView/Realtime before publishing.
- No analytics code, consent behavior, existing pages, home page, or data pipeline changed in this draft.

## Verification and open items

- Primary provider sources checked 10 October 2026: `/courses`, `/tefl-course-bangkok`, `/level-5-tefl-course-bangkok`, `/dates-and-fees`.
- Listed fees: Standard ฿45,000 (120 hours); TQUK Level 5 ฿50,000 (168 guided learning hours, qualification reference 601/5234/5); internship ฿90,000; All-In ฿130,000. These are provider-published and must be reconfirmed before launch.
- Partner confirmation pending: indirect SEO referral attribution, commission, cookie window and payout conditions.
- Confirm current government work-permission guidance and the awarding-body entry again immediately before publication.
- S001–S008 article routes were present in the repository; this draft links to all eight. This environment did not contain `sources/` originals (the directory was empty).
