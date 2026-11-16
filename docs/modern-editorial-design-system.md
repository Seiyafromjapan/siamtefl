# SIAM TEFL Modern Editorial design system (Phase 3)

## Scope

Phase 3 extracts a reusable visual language from the homepage (Phase 1.6) and Essential TEFL review (Phase 2), then prototypes it only on course comparison, first-time salary, and calculator routes. The shared layout, navigation, content, metadata, tracking and URLs remain intact. The new body classes only scope these three prototypes.

## Route inventory (51 routes)

| Page type | Count | Representative routes |
| --- | ---: | --- |
| Homepage | 1 | `/` |
| Provider review articles | 4 | `/essential-tefl-review/`, `/see-tefl-chiang-mai-review/`, `/world-tesol-academy-review/`, `/teflen-review/` |
| Course comparison and selection | 13 | `/tefl-course-comparison-thailand/`, `/standard-vs-all-in/`, `/120-hour-vs-level-5-tefl-thailand/` |
| Teaching jobs, eligibility and classroom practice | 20 | `/teach-english-thailand-no-experience/`, `/thailand-teacher-visa-work-permit/`, `/teaching-large-classes-thailand/` |
| Salary, living costs and relocation | 7 | `/first-time-english-teacher-salary-thailand/`, `/money-to-move-to-thailand-to-teach/`, `/can-you-live-in-bangkok-on-35000-baht-teaching-salary/` |
| Interactive tools | 1 | `/calculator/` |
| About, policy and contact | 5 | `/about/`, `/methodology/`, `/affiliate-disclosure/` |

Counts total 51. Classification is by primary reader task; some comparison and eligibility explainers also contain article-like guidance.

## Design rules

- **Color:** retain `--forest: #123d35` as the primary brand color, with `--forest2: #1d5547` for secondary emphasis; `--mint: #dcece4` and `--paper: #f7f7f2` for section fields; `--white`, `--ink`, `--muted`, and `--line` for surfaces and reading. Existing lime is a restrained highlight. Do not use color alone to identify states.
- **Type:** existing Manrope display face for headings, DM Sans/system sans for interface and body, Georgia for occasional editorial serif accents. Main copy 17px or above; supporting text 14px or above. Keep reading measure near 65–75 characters and body line-height 1.7–1.8.
- **Hierarchy:** one page H1; H2 for major sections; H3 for modules. Use short uppercase eyebrows as metadata, never as the only label. Favor line breaks through measure and font size rather than hardcoded `<br>` elements.
- **Grid and spacing:** centered reading column around 760px, feature content around 1,050–1,180px; responsive gutters 18px mobile / 24–32px desktop. Use generous section spacing for story transitions, tighter spacing for tools and data.
- **Buttons and links:** forest fill with high-contrast text for primary action; underlined/text links for secondary navigation; visible keyboard focus. Keep original link labels, destinations, affiliate attributes and placement tracking.
- **Editorial cards:** use cards only where they support a choice (pathways/tools). For article discovery use one lead story plus compact links; for comparisons use aligned rows or tables. Prefer rules, whitespace and subtle background changes over repeated shadows.
- **Breadcrumbs and TOCs:** semantic nav with accessible names; TOC links point to stable heading IDs and have 44px minimum touch targets. Keep sticky-header scroll offset.
- **Tables:** preserve native table semantics and headers. On narrow screens, either provide a labeled, focusable horizontal scroller or convert each row to explicitly labeled blocks when comparison context remains clear. State scroll instructions only when needed.
- **CTA and disclosure:** place next action beside the evidence that supports a decision; distinguish provider CTA from independent editorial links. Keep referral disclosure near relevant links and maintain `data-affiliate`, provider, placement, target and rel values.
- **Images:** use existing page assets first, fixed intrinsic width/height or aspect ratio, meaningful alt text and captions for illustrative or supplied imagery. Avoid cover crops that remove relevant content. No added remote fonts or image dependencies.
- **Motion and responsive behavior:** respect reduced-motion preferences. At 320px avoid horizontal overflow; keep touch targets usable and collapse grids according to content priority.
- **Navigation:** keep the existing shared header behavior and focusable menu. Route-specific CSS must start with a page body class; do not alter generic `.nav-links` rules for one prototype.

## Prototype-specific patterns

- **Comparison:** top-level intro and caveat, three format/location options as a quiet editorial row, then the comparison table as the primary decision artifact. Keep commission disclosure and source date visible.
- **Salary guide:** calm white headline field, trust notes, existing illustrative salary image and its qualification, then readable narrative and scenario comparison.
- **Calculator:** task-focused introduction; form as the main work surface and live estimate as a clearly contrasted result panel. Keep the in-browser data explanation and existing privacy/affiliate behavior.

## CSS maintenance findings and proposal

The current stylesheet has significant cascade repetition from earlier incremental prototypes: repeated home hero selectors, review hero selectors, footer groups, and navigation declarations appear in multiple later overrides. The current phase intentionally avoids a risky global rewrite. Before Phase 4 broad adoption:

1. Extract existing custom properties and global typography/reset into `tokens.css` and `base.css` without changing computed values.
2. Consolidate shared primitives (buttons, breadcrumbs, article measure, table scroller, disclosure, focus styles) into small component sections.
3. Move page-family patterns into explicit modules (home, review, comparison, guide, tool) and route-specific exceptions into small scoped blocks.
4. Remove duplicate declarations only after visual-regression screenshots at representative routes and widths.
5. Add route-family visual QA to the rollout gate before migrating each batch.

Avoid adding a CSS framework or runtime dependency. Current prototypes are body-class scoped and the legacy rules remain in place for unrelated routes.

## Phase 4 safe rollout

1. Obtain review approval for Phase 3 screenshots and content integrity.
2. Select one additional representative per family; establish screenshot baselines and route-specific invariants (metadata, links, calculator behavior).
3. Consolidate duplicate CSS with no visual change, validating homepage, review and all sampled page families.
4. Roll out one family at a time (comparison, practical guides, salary/life, tools, policy pages), with 1440/768/390/320 checks and `npm run verify` after each batch.
5. Keep route list, canonical, JSON-LD, affiliate attributes, GA consent and tool calculations in automated invariants; stop/rollback a batch if any differ.
6. Review all 51 routes before any separate production release decision. This phase itself does not merge or deploy.
