# SIAM TEFL image and diagram guide

Use the current site design as the source of truth. The shared stylesheet defines these existing colors: forest `#123d35`, forest2 `#1d5547`, mint `#dcece4`, paper `#f7f7f2`, ink `#19251f`, muted `#66746d`, line `#dfe4dc`, lime `#c4e879`, and amber `#e8a344`. Do not introduce replacement brand colors.

## Article hero images
- Use restrained editorial illustration or candid, context-specific photography with a calm, credible education-media feel.
- Standard social/hero canvas: **1200 × 630 px** (1.905:1), WebP for site delivery. Keep the important subject inside a generous safe area so the image also crops well in cards.
- Place one hero image near the article introduction. Set explicit `width` and `height`; use eager loading and high fetch priority only for the first visible hero.
- Configure the page's `socialImage`, `socialImageType`, dimensions and descriptive `socialImageAlt`; add the same absolute URL to Article `image`. The shared layout supplies Open Graph and Twitter image tags.
- Avoid text in generated hero art. If social copy is needed, produce a separate social asset.

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
- Use one short, accurate headline and a small number of scannable points; preserve the same palette, type hierarchy and illustration tone.
- Keep copy inside safe margins, verify legibility at phone size, and link the pin to the relevant article. Never imply a job or visa guarantee.
