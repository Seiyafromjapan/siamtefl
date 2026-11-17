# Course data pilot conventions

`course-database.json` is a build-time data source. It is imported only by the static page renderer and validation script; it is not a browser API. `affiliate-programs.json` is read by the validator only and must not be imported by page/client code. The build check ensures the source JSON files are not copied into `dist/`.

## Evidence record

```json
{
  "value": {"amount": 45000, "currency": "THB", "priceType": "published tuition"},
  "verificationStatus": "primary_verified",
  "sourceUrl": "https://provider.example/course-fees",
  "lastCheckedDate": "2026-11-17",
  "lastVerifiedDate": "2026-11-17",
  "verificationNotes": "Optional clarification"
}
```

`lastCheckedDate` means the cited/available public information was inspected on that date. `lastVerifiedDate` is populated only when the recorded value or attributed claim was confirmed for that status. For `unverified` and `not_applicable`, it must be `null`; do not turn missing tuition into zero or a missing condition into “none”.

## Multiple official price displays

Use an optional `publishedPriceVariants` array when one course has more than one concurrently published amount, currency, access term, or location price. Each entry keeps its own amount, currency, description, source URL, status and checked/verified dates. Do not convert currencies or choose one display as the final checkout total. Keep the single `tuition` record as the comparison-page reference amount and show variants as distinct provider listings. This currently preserves World TESOL Academy's USD/GBP displays and SEE TEFL's location-specific internship price.

`balanceDue` records a separately published payment balance and, when established, its due condition. Keep a missing balance as an unverified `null`, not as zero or as “no balance”. The SEE TEFL four-week course currently records its published USD 900 balance and due date separately from its USD 495 deposit and USD 1,395 tuition.

## Course schedules

`course-schedules.json` stores dated intakes separately from course-level facts. Schedule rows reference the existing course IDs where possible; a small schedule-only catalog covers CMU, ITTT and Education House, which already appeared in the dates article but are not part of the review-comparison database. A published start date has `availabilityStatus: "scheduled"`; seat availability is a separate field and remains `unverified` unless a specific current registration source is checked. Dates with no published intake are omitted rather than invented. `tuitionOverride` and `deposit` are `null` when a particular run does not publish a different amount. The static renderer omits start dates that have passed at build time and retains source links and the last source-check date.

`monthlyCalendar` distinguishes the primary four-provider calendar from alternative course formats listed separately below it. This avoids duplicating combined, internship, and less-comparable offerings in both sections.

## Calculator source and arithmetic

The calculator course options read THB tuition, source URL and payment facts from `course-database.json` at build time. Course tuition is added once as the course total; deposit and balance are explanatory payment splits and are not added again. Monthly costs, travel, documents, rent deposit and other costs remain user-entered assumptions. Unverified fees are called out and excluded from the numeric estimate; they are not treated as confirmed zero-cost items. The All-In first-month housing credit can offset one month's entered accommodation cost only.

## Review-page integration

Course review facts are rendered into static HTML from this data source. Textual amounts repeated elsewhere in review copy use `{{COURSE_FACT:<courseId>:<field>}}` tokens, resolved during the Astro build. Review opinions, suitability notes, article-specific FAQs and conclusions stay in `pages.json`. Provider fact panels expose a concise summary, while payment terms and source links remain available in native disclosure sections. If changing a data field, inspect the generated review and comparison pages together.

## Status meanings

- `primary_verified`: the cited official source explicitly publishes the recorded item. This does not mean the underlying provider claim was independently audited.
- `provider_claim`: the official source makes a claim that SiamTEFL has not independently established.
- `conflicting_official_sources`: official provider sources use materially different descriptions; notes preserve the discrepancy.
- `unverified`: the item could not be established from the reviewed evidence. Keep `value: null` where no fact is known.
- `not_applicable`: the item does not apply to that course; use `value: null`.

Affiliate destinations and disclosure flags are tracked separately in `affiliate-programs.json`. Never add commission rates, agreements, credentials, or personal information there. Public page CTA URLs continue to be authored in their existing page markup, so data migration cannot silently change tracking links.
