# SiamTEFL

Lightweight, dependency-free static website for SiamTEFL. The generated site is in `dist/` and can be hosted on any static host.

## Build and preview

Requires Node.js 18 or newer; no install step is needed.

```sh
npm run build
npm run preview
```

Open `http://localhost:4173`. The production files in `dist/` include per-page metadata, canonical links, structured data, an XML sitemap, robots.txt, 404 page and `CNAME` for `siamtefl.com`.

## Publish with GitHub Pages

1. In repository settings, enable GitHub Pages using **GitHub Actions** as the source.
2. Add `siamtefl.com` as the custom domain in Pages settings.
3. Set the apex and `www` DNS records to GitHub Pages' current values at your registrar, then enable HTTPS after DNS resolves.
4. The included workflow builds and deploys `dist/` on pushes to `main`.
5. Verify the live site, sitemap and referral link. Add `https://siamtefl.com/sitemap.xml` in Google Search Console.

Repository: https://github.com/Seiyafromjapan/siamtefl
The source repository is public; the site only becomes live after Pages and DNS are configured.

## Analytics limitation

Affiliate CTA links use the referral URL and carry `rel="sponsored nofollow"`. The browser emits a `dataLayer` event and tries a same-origin beacon, but a plain static site cannot collect that beacon. To store click events, connect a real analytics provider or serverless endpoint and update the privacy policy. The affiliate network may separately count referrals according to its terms.

## Editorial notes

Course fee references checked against the provider's current course comparison on 1 October 2026: Standard ฿45,000, TQUK Level 5 ฿50,000, paid internship ฿90,000 and All-In ฿130,000. The All-In page describes first-month accommodation, visa document guidance, orientation and 12-month career support. Employment wording is deliberately conservative: eligibility applies and the school makes the hiring decision. Recheck primary sources before publishing and periodically after launch.

The contact address `hello@siamtefl.com` is a placeholder until the site owner configures a mailbox. Replace it or set it up before launch. The privacy policy describes current static behavior and must be updated if analytics or other tracking is added.
