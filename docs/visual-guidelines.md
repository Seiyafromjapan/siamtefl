# SIAM TEFL image and diagram guide

## Typography and readability
- Use Apple's current web typography as a readability reference: clear hierarchy, generous line spacing, short supporting copy and responsive type that remains comfortable on phones. Treat this as a visual reference, not a requirement to copy Apple's fonts or exact sizes.
- Minimum body copy: **17 px** on desktop and mobile, with a line height of about **1.7–1.8** for article text. Keep paragraph spacing generous enough to distinguish ideas.
- Supporting text, navigation, labels, table contents, captions and controls: **14 px minimum**. Use at least 44 px for interactive touch targets where practical.
- Legal notices, privacy disclosures and similarly limited fine print may use **12 px**, with readable contrast and line height. Keep source notes and ordinary captions at 14 px.
- Preserve the established display hierarchy for headings; use responsive `clamp()` sizing and avoid reducing text to fit a narrow screen. Prefer wrapping or a labelled horizontal-scroll region for genuinely wide tables.
- Keep the existing font families, color palette and visual identity. Typography changes should preserve the page's spacing rhythm and avoid horizontal overflow at mobile widths.

Use the current site design as the source of truth. The shared stylesheet defines these existing colors: forest `#123d35`, forest2 `#1d5547`, mint `#dcece4`, paper `#f7f7f2`, ink `#19251f`, muted `#66746d`, line `#dfe4dc`, lime `#c4e879`, and amber `#e8a344`. Do not introduce replacement brand colors.

## Article hero images
- Default to realistic editorial photography with natural light, believable Thai daily-life or education settings, human expression and lived-in details. Keep the mood calm, credible and visually consistent with the site.
- Avoid exaggerated staging and telltale artificial details. AI-generated images may illustrate a general scenario, but must never be presented as documentary evidence or a record of a specific school, teacher, or job applicant.
- Standard social/hero canvas: **1200 × 630 px** (1.905:1), WebP for site delivery. Keep the important subject inside a generous safe area so the image also crops well in cards.
- Place one hero image near the article introduction. Set explicit `width` and `height`; use eager loading and high fetch priority only for the first visible hero.
- Configure the page's `socialImage`, `socialImageType`, dimensions and descriptive `socialImageAlt`; add the same absolute URL to Article `image`. The shared layout supplies Open Graph and Twitter image tags.
- Avoid text in hero photographs. If social copy is needed, produce a separate social asset.

## Diagrams and explanatory graphics
- Prefer semantic HTML/CSS or accessible SVG when labels, steps, branches, or numbers must be exact.
- Use the existing forest, mint, paper and ink tokens; keep contrast strong, shapes simple and labels short.
- Design for a narrow viewport first: one clear reading direction, legible type after scaling, generous spacing, and no meaning communicated by color alone.
- Give SVGs a `title` and `desc`. Set explicit dimensions and a viewBox. For an SVG embedded as an image, provide a useful HTML `alt` and a text equivalent nearby for important steps.
- Lazy-load figures below the fold. Keep the article's explanation available as ordinary text.

## Alt text
Describe the useful visual information in context, in one concise sentence. Do not repeat the caption, stuff keywords, or begin with “image of.” Use empty alt only for purely decorative visuals. For diagrams, summarize their purpose and direction, and provide all essential labels or instructions in nearby text.

## Pinterest adaptations
- Create a separate **1000 × 1500 px (2:3)** composition instead of stretching the 1200 × 630 hero.
- Use one short, accurate headline and a small number of scannable points; preserve the same palette, type hierarchy and photographic tone.
- Keep copy inside safe margins, verify legibility at phone size, and link the pin to the relevant article. Never imply a job or visa guarantee.
