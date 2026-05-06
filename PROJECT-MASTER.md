# PROJECT MASTER — Website Portfolio
**Owner:** Vinod James Isaac (vinodjamesisaac@gmail.com)  
**Goal:** ₹2,00,000+/month via AdSense + affiliate commissions  
**Stack:** Pure HTML5 / CSS3 / Vanilla JS — no build tools, no frameworks, no npm  
**Hosting:** GitHub Pages (free, public repos)  
**Fonts:** Inter (Google Fonts — weights 400/500/600/700/800)  
**Last updated:** May 6, 2026

---

## GLOBAL CREDENTIALS

| Key | Value |
|-----|-------|
| AdSense Publisher ID | `ca-pub-2959862133855422` |
| AdSense login | vinodjamesisaac@gmail.com |
| ATS GA4 | `G-8HMGTGQ4B8` |
| Nifty GA4 | `G-KFPH5H8X5F` |
| Pregnancy GA4 | **NOT YET CREATED** — placeholder `G-XXXXXXXXXX` in file |
| Cloudflare Worker (Nifty CORS proxy) | `https://nifty-proxy.vinodjamesisaac.workers.dev` |
| Amazon Associates India | **NOT YET SIGNED UP** — `affiliate-program.amazon.in` |

---

## GIT STATUS — AS OF LAST SESSION

| Site | Last commit | Pushed | GitHub URL |
|------|-------------|--------|------------|
| ATS Checker | `d1d0555` — contact info FAQ + script v=9 | ✅ Pushed | https://github.com/ViruSyndrome/ats-checker |
| Nifty Tracker | `e553102` — mobile hamburger nav + touch fixes | ✅ Pushed | https://github.com/ViruSyndrome/nifty-tracker |
| Pregnancy Tracker | `589690a` — gender predict button fix | ✅ Pushed | https://github.com/ViruSyndrome/pregnancy-tracker |

All three sites are **fully in sync** — nothing is local-only.

---

## SITE 1 — ATS Checker

**Domain:** getatsready.com  
**GitHub:** https://github.com/ViruSyndrome/ats-checker  
**Live URL:** https://www.getatsready.com  
**Local folder:** `ATS-Checker/`  
**Status:** LIVE ✅  

### Color scheme
`--primary: #14b8a6`, `--bg-dark: #0f172a`, `--bg-card: #1e293b`

### What it does
Free ATS (Applicant Tracking System) checker — paste resume PDF/DOCX, get score against job description, keyword gap analysis, improvement tips.

### Monetisation
- AdSense: `ca-pub-2959862133855422` — `data-ad-slot="XXXXXXXXXX"` (real slot IDs NOT yet filled in index.html)
- Future: Amazon Associates India links for resume books

### What is fully built (as of last session)
- **Multiplicative scoring model**: Template Compliance × (Keyword 50% + Structure 25% + Impact 25%)
- **PDF line reconstruction** by Y coordinate (fixes scrambled text from multi-column resumes)
- **Bullet char detection** — extended regex for all Unicode bullet variants
- **Table-cells false positive fix** — threshold 50%, separator chars excluded
- **Noise word filter** — expanded: includes `ideas, deep, least, one, address, object, problem, solving, track, record, tooling, streamline`
- **Contact info validator** (`checkContactInfo()` function):
  - Email: detects missing, double @, `.con`/`.cmo`/`.gmal` typos, malformed format
  - Phone: detects missing (warning), incomplete digits (<10 digits = issue)
  - LinkedIn: detects missing (warning), URL without `/in/username` pattern (issue), empty username
  - Other URLs: detects spaces/line-breaks (PDF copy-paste artifact)
  - Issues appear at top of action plan before any other tips
- **Format warning banner** with proper `<ul>` list
- **File name display** with `text-align: center`
- **FAQ section** — includes new "Does this tool check my contact information?" entry
- **AdSense** slots present but `data-ad-slot="XXXXXXXXXX"` — real slot IDs needed
- **GA4** `G-8HMGTGQ4B8` — active on index.html
- **Canonical tags** — on all pages (about, contact, privacy, terms, index)

### What is PENDING
- [ ] AdSense real slot IDs — replace `XXXXXXXXXX` in index.html (need AdSense account → Ad units)
- [ ] Amazon Associates India links for resume books (once registered)
- [ ] No mobile audit done specifically for ATS — check on phone

### Known issues / wrong research
- Zerodha, Naukri, Groww, Angel One, LinkedIn affiliate programmes — all unverified or discontinued. **Amazon Associates India only.**

---

## SITE 2 — Nifty Tracker

**Domain:** getniftyready.com  
**GitHub:** https://github.com/ViruSyndrome/nifty-tracker  
**Live URL:** https://www.getniftyready.com  
**Local folder:** `Nifty-Tracker/`  
**Status:** LIVE ✅  

### Color scheme
`--primary: #14b8a6`, `--bg-dark: #0f172a`, `--bg-card: #1e293b`

### What it does
India stock market tracker: Nifty 50 / Sensex / Bank Nifty / Nifty IT / Midcap / VIX live prices, Gold (GOLDBEES ETF ×1000), Silver (SILVERBEES ETF ×10), USD/GBP/EUR vs INR, Top gainers/losers, popular Nifty 50 stocks, sparkline hover charts. SIP + SWP calculators. Global cues section when market is closed.

### API
- Yahoo Finance: `query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d`
- CORS proxied through Cloudflare Worker: `https://nifty-proxy.vinodjamesisaac.workers.dev`
- Worker is at `Nifty-Tracker/worker.js` — deployed on Cloudflare free tier (100k req/day)
- Worker currently only allows `query1/query2.finance.yahoo.com` — needs update for NSE FII API

### Pages
- `index.html` — main dashboard
- `sip-calculator.html` — SIP calculator
- `swp-calculator.html` — SWP calculator (corpus duration + withdrawal amount modes)
- `about.html`, `contact.html`, `privacy.html`, `terms.html`
- All pages have GA4 `G-KFPH5H8X5F` ✅
- All pages have AdSense `ca-pub-2959862133855422` ✅
- All pages have hamburger mobile nav ✅

### What is PENDING
- [ ] **FII/FPI widget** — NOT BUILT. NSE API `https://www.nseindia.com/api/fiidiiTradeReact` requires session cookies. Plan:
  1. Update `worker.js`: first GET `https://www.nseindia.com` to capture session cookies, then use cookies to call FII API
  2. Add allowed hosts `www.nseindia.com` to the worker
  3. Build widget: show FII net buy/sell in equity (cash market) with green/red indicator + last 5 trading days trend
  4. Add to index.html below the indices section
- [ ] Cloudflare Worker: deploy updated `worker.js` at dash.cloudflare.com after FII changes
- [ ] AdSense real slot IDs — `data-ad-slot="auto"` is currently used (auto-ads), may be OK

### Known issues
- GOLDBEES price = Yahoo Finance unit price × 1000 = price per 10g (correct)
- SILVERBEES price = Yahoo Finance unit price × 10 = price per 10g (correct)
- IST timezone fix done — market hours show correctly as 9:15 AM–3:30 PM IST

---

## SITE 3 — Pregnancy Tracker

**Domain:** DECISION PENDING (see Domain section below)  
**GitHub:** https://github.com/ViruSyndrome/pregnancy-tracker  
**Live URL:** https://virusyndrome.github.io/pregnancy-tracker/ (GitHub Pages, no custom domain yet)  
**Local folder:** `Pregnancy-Tracker/`  
**Status:** LIVE on GitHub Pages ✅ — custom domain NOT yet connected

### Color scheme
`--primary: #be185d`, `--primary-dark: #9d174d`, `--primary-light: #fce7f3`, `--accent: #f97316`, `--accent-light: #fff7ed`, `--bg: #fdf4f7`, `--bg-card: #ffffff`, `--text: #111827`, `--text-muted: #6b7280`, `--border: #f3d6e8`

### What it does
Pregnancy week-by-week tracker. Enter LMP or due date → get current week, trimester, baby development, size comparisons (food photos from Wikipedia), symptoms, tips, affiliate product cards, gender prediction quiz.

### What is fully built
- **Week calculator**: LMP or due date input → week number, trimester, days to go, progress bar
- **42 weeks of data**: `WEEKS` array with `{ week, size, size_mm, size_in (Indian equivalents), emoji, baby, mom, tip }`
- **Wikipedia real food photos**: `WEEK_WIKI` maps each week → Wikipedia article title. Single batch API call on load populates `WIKI_IMGS` cache. Falls back to OpenMoji SVG then native emoji.
- **Milestone banners**: weeks 4, 6, 8, 12, 13, 20, 27, 37–39, 40, 41+ get special milestone cards
- **Share button**: `navigator.share` on mobile, clipboard fallback on desktop
- **Result panel animation**: `fadeSlideUp` keyframe, `#resultPanel.reveal` class
- **Button text**: changes to "Update My Week →" after first calculate
- **Gender prediction quiz** (9 signals):
  - Heart rate (>140 bpm → girl, <140 → boy)
  - Bump shape (round/pointed/skip)
  - Morning sickness (none/mild/severe)
  - Cravings (sweet/salty)
  - Skin changes (glowing/dull/acne)
  - Chinese Gender Calendar (lunar age + conception month formula)
  - **Ramzi Theory** (NEW): placenta left=girl / right=boy at Week 6–10 ultrasound
  - **Ring Test** (NEW): circles=girl / back-and-forth=boy
  - **Dreams** (NEW): old wives' tale — dream of opposite
  - After result: WhatsApp share button + Copy & Share button
  - After result: 20-week scan countdown (uses `currentResult.weekNum` if user has calculated)
  - After result: Biology note explaining Week 3 (chromosomes), Week 9 (differentiation), hCG/morning sickness link
- **Week timeline**: chips by trimester, click for detailed card
- **Week detail card**: baby dev, mom symptoms, Indian size equivalent, tip
- **Product cards**: 4 per trimester (T1/T2/T3) — all `href=REPLACE-ME` placeholder
- **FAQ section**: 7 questions
- **PC-PNDT Act callout**: explains Indian law context for gender prediction section
- **AdSense**: placeholder `ca-pub-XXXXXXXXXXXXXXXX` — needs `ca-pub-2959862133855422`
- **GA4**: placeholder `G-XXXXXXXXXX` — needs real property ID (not yet created)

### What is PENDING
- [ ] **Domain** — see domain decision below
- [ ] **CNAME file** — add file containing domain after purchase
- [ ] **DNS CNAME** — set `www → virusyndrome.github.io` at domain registrar
- [ ] **GA4** — create new property at analytics.google.com → replace `G-XXXXXXXXXX` in index.html lines ~27-28
- [ ] **AdSense** — replace `ca-pub-XXXXXXXXXXXXXXXX` with `ca-pub-2959862133855422` in index.html line ~31
- [ ] **Amazon Associates India** — sign up → replace `REPLACE-ME` tag in all 12 product links in `PRODUCTS` object
- [ ] **Amazon Associates US** — for global visitors; add locale detection JS
- [ ] Indian food size equivalents (`size_in` field) — partially added in WEEKS array, verify completeness
- [ ] Region selector (India/UK/US/Other) for week checklist items — v2 feature
- [ ] Individual SEO pages: `week-8-pregnant.html` × 42 — v2 feature
- [ ] Hindi version — v2 feature

---

## DOMAIN DECISION — Pregnancy Tracker

**`getpregnancyready.com` is TAKEN.** GoDaddy broker service fee: ₹16,999. Not worth it.

### Available alternatives (checked May 6, 2026 on GoDaddy)

| Domain | Price | Recommendation |
|--------|-------|----------------|
| `getpregnancyready.in` | ₹1 first year (3yr term = ₹899 total) | ⭐ **BEST CHOICE** — `.in` is India's ccTLD, builds trust with Indian audience, extremely cheap |
| `getpregnancyready.site` | ₹89/yr (renews ~₹2,650/yr) | OK for testing, bad renewal price |
| `getpregnancyready.store` | ₹89/yr (renews ~₹3,600/yr) | No — wrong connotation for health content |
| `getpregnancyready.health` | ₹361/yr | Good extension for health content, but 95% of Indian users type .com or .in |
| `getpregnancyready.life` | ₹225/yr | Decent but generic |
| `getpregnancyready.xyz` | ₹90/yr | Cheap but low trust for health content |

**Recommendation: Buy `getpregnancyready.in` (₹1 first year on 3yr term)**
- Perfectly targets Indian audience (largest traffic source for this site)
- `.in` is credible and recognised in India (like `.co.uk` for UK)
- ₹1 is essentially free to test before committing
- GitHub Pages supports custom `.in` domains — CNAME + DNS works the same way

**After purchase steps:**
1. Buy at GoDaddy with 3-year term (₹899 total)
2. Create file `CNAME` in Pregnancy-Tracker/ containing exactly: `www.getpregnancyready.in`
3. In GoDaddy DNS settings: add CNAME record → `www` → `virusyndrome.github.io`
4. In GitHub repo settings → Pages → Custom domain → enter `www.getpregnancyready.in`
5. Enable "Enforce HTTPS" checkbox (GitHub auto-provisions SSL via Let's Encrypt)
6. Update `<link rel="canonical">` and `og:url` in index.html from placeholder to `https://www.getpregnancyready.in/`
7. Propagation takes 10–30 minutes

---

## SITE 4 — Dev Toolbox (PLANNED — NOT STARTED)

On hold until pregnancy tracker domain + monetisation is set up.

**Plan:** JSON formatter, JWT decoder, Regex tester, Base64 encoder — each with "Explain this to me" button.  
**Differentiator:** Tools that teach you while you work.  
**Monetisation:** AdSense + Amazon Associates tech books.

---

## FII/FPI WIDGET — PENDING (Nifty Tracker)

NSE API: `https://www.nseindia.com/api/fiidiiTradeReact`  
Problem: NSE blocks direct CORS requests and requires session cookies.

**Cloudflare Worker update plan (`worker.js`):**
```javascript
// Step 1: GET NSE homepage to get session cookies
const homeRes = await fetch('https://www.nseindia.com', {
  headers: { 'User-Agent': '...', 'Accept': 'text/html,...' }
});
const cookies = homeRes.headers.get('set-cookie');

// Step 2: Use cookies to call FII API
const fiiRes = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
  headers: { 'Cookie': cookies, 'Referer': 'https://www.nseindia.com/', ... }
});
```
Also add `www.nseindia.com` to the allowed hosts list in the worker.

**Widget design:**
- Section title: "FII / FPI Activity 🌍"
- Show: Net buy/sell in equity (cash market) — green if net buyers, red if net sellers
- Table: last 5 trading days with buy value, sell value, net value
- Data is publicly available, updated daily after market close

---

## AFFILIATE PROGRAMME STATUS

| Programme | Status | Notes |
|-----------|--------|-------|
| **Amazon Associates India** | ❌ NOT signed up | affiliate-program.amazon.in — sign up before replacing REPLACE-ME |
| **Amazon Associates US** | ❌ NOT signed up | associate-program.amazon.com — needed for global visitors |
| **Amazon Associates UK** | ❌ NOT signed up | Current placeholder links use `.co.uk` format |
| Google AdSense | ✅ ACTIVE | `ca-pub-2959862133855422` — on ATS + Nifty. Pregnancy needs `ca-pub-XXXXXXXXXXXXXXXX` replaced |
| Zerodha | ❌ DISCONTINUED | SEBI banned cash referral Aug 2024 |
| Naukri / Groww / Angel One | ❌ UNVERIFIED | Pages 404 or no public programme |

---

## PRIORITY — NEXT STEPS

```
IMMEDIATE (do before next coding session):
1. Buy getpregnancyready.in domain (₹1 first year, 3yr term on GoDaddy)
2. Create GA4 property → get Measurement ID → replace G-XXXXXXXXXX in Pregnancy-Tracker/index.html
3. Sign up Amazon Associates India → get tag → replace REPLACE-ME in 12 product links

NEXT CODING SESSION:
4. Add CNAME file + update canonical/og:url in Pregnancy-Tracker/index.html → push → connect domain
5. Replace ca-pub-XXXXXXXXXXXXXXXX with ca-pub-2959862133855422 in Pregnancy-Tracker/index.html → push
6. Build FII/FPI widget (update worker.js + add section to Nifty index.html)
7. ATS Checker mobile audit — test on phone, fix any issues

LATER:
8. Amazon Associates US sign-up + locale detection JS in pregnancy tracker
9. Dev Toolbox (after pregnancy is stable)
10. Individual SEO pages (week-8-pregnant.html × 42)
```

---

## COMPETITOR CHEAT SHEET

| Site | Strength | Weakness | Our edge |
|------|----------|----------|----------|
| BabyChakra (India) | 2.25M users, community | Commerce-first, weak tracker, India-only | Deeper content, global reach, gender prediction |
| WhatToExpect (US) | Massive content library | No gender prediction, US-centric, no India context | Indian food comparisons, PC-PNDT angle |
| TheBump (US) | 3D interactive visuals, high engagement | US-only, no Indian features | Indian equivalents, gender quiz, free no signup |
| BabyCenter (US/UK) | Multiple localised versions | Requires account, cluttered UX | No signup, instant results |

---

## RESEARCH LOG

### ✅ Confirmed correct
- GOLDBEES Yahoo Finance price × 1000 = price per 10g (verified vs MCX)
- SILVERBEES Yahoo Finance price × 10 = price per 10g (verified vs MCX)
- PC-PNDT Act 1994 — illegal for doctors to reveal gender in India
- Chinese Gender Calendar has large global (not just India) search volume
- Morning sickness → higher hCG → more common in girl pregnancies (partial science support)
- Baby's sex chromosomes set at fertilisation (Week 3); external genitalia identical until Week 9
- Nub Theory (Week 12) used by real sonographers — angle of genital tubercle
- 20-week anatomy scan = standard gender confirmation worldwide (where legally permitted)
- Indian babies average 2.7–2.9kg at birth vs Western 3.4–3.6kg (ICMR vs WHO — both normal)
- AdSense requires genuine page views before showing ads
- GSC canonical errors: fixed by adding `<link rel="canonical">` to all pages

### ❌ Wrong / debunked
- Zerodha affiliate: DISCONTINUED Aug 2024 per SEBI. Do NOT add.
- Heart rate > 140 = girl theory: **no scientific basis** — mentioned as fun only
- `getpregnancyready.com` thought to be available — it is TAKEN (broker ₹16,999)
- PROJECT-MASTER push status table was stale — all three sites are now fully pushed

---

## GLOBAL CREDENTIALS

| Key | Value |
|-----|-------|
| AdSense Publisher ID | `ca-pub-2959862133855422` |
| AdSense login | vinodjamesisaac@gmail.com |
| ATS GA4 | `G-8HMGTGQ4B8` |
| Nifty GA4 | `G-KFPH5H8X5F` |
| Pregnancy GA4 | **NOT YET CREATED** — placeholder `G-XXXXXXXXXX` in file |
| Cloudflare Worker (Nifty CORS proxy) | `https://nifty-proxy.vinodjamesisaac.workers.dev` |
| Amazon Associates India | **NOT YET SIGNED UP** — `affiliate-program.amazon.in` |

---

## SITE 1 — ATS Checker

**Domain:** getatsready.com  
**GitHub:** https://github.com/ViruSyndrome/ats-checker  
**Local folder:** `ATS-Checker/`  
**Status:** LIVE ✅  

### What it does
Free ATS (Applicant Tracking System) checker — paste resume text, get score against job description, keyword gap analysis, improvement tips.

### Monetisation
- AdSense display ads (in-page, top/bottom of results)
- Future: Amazon Associates affiliate links for resume books / LinkedIn Premium banners (NOT YET DONE)

### What was built
- `index.html` — main tool (resume paste + JD paste + score output)
- `about.html` — about page
- `contact.html` — contact form
- `privacy.html` — privacy policy
- `terms.html` — terms of service
- `style.css` — dark teal theme (`--primary: #14b8a6`, `--bg-dark: #0f172a`, `--bg-card: #1e293b`)
- `script.js` — scoring logic

### What was done this session
- Added `<link rel="canonical">` to `about.html`, `contact.html`, `privacy.html`, `terms.html`
- This fixed **5 GSC "Submitted URL is not canonical" errors** in Google Search Console
- Root cause: pages existed with and without trailing slash — Google was confused which was canonical

### What is PENDING
- [ ] Push canonical tag fix to GitHub (NOT DONE — changes are local only)
- [ ] After push, go to GSC → URL Inspection → Request Indexing for each of the 4 pages
- [ ] GSC resolution takes 3–7 days after reindex request
- [ ] Consider Amazon Associates India links for resume books (once registered)

### Known issues / wrong research
- Previously thought Naukri, Groww, LinkedIn, Zerodha had affiliate programmes — **WRONG**
  - Zerodha referral discontinued August 2024 per SEBI regulations (now only reward points, not cash)
  - Naukri, Groww, Angel One affiliate pages returned 404 — could not be verified
  - **Only Amazon Associates India is confirmed working**

---

## SITE 2 — Nifty Tracker

**Domain:** getniftyready.com  
**GitHub:** https://github.com/ViruSyndrome/nifty-tracker  
**Local folder:** `Nifty-Tracker/`  
**Status:** LIVE ✅  

### What it does
India stock market tracker: Nifty 50 live price, Gold (GOLDBEES ETF), Silver (SILVERBEES ETF), FD rates, SIP calculator, currency (GBP/EUR/USD vs INR).

### API
- Yahoo Finance: `query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d`
- CORS proxied through Cloudflare Worker: `https://nifty-proxy.vinodjamesisaac.workers.dev`
- Nifty symbol: `^NSEI`
- GOLDBEES symbol: `GOLDBEES.NS`
- SILVERBEES symbol: `SILVERBEES.NS`

### Monetisation
- AdSense display ads
- Future: Amazon Associates India links for finance books, gold investment guides

### Color scheme
`--primary: #14b8a6`, `--bg-dark: #0f172a`, `--bg-card: #1e293b`

### What was built
- `index.html` — main dashboard
- `sip-calculator.html` — SIP (Systematic Investment Plan) calculator page
- `script.js` — all data fetching and rendering logic
- Sitemap covering all pages

### What was done this session
- **Fixed GOLDBEES/SILVERBEES price display bug**
  - GOLDBEES ETF price on Yahoo Finance = price per 1/1000th of a gram
  - Fix: `priceMultiplier: 1000` → multiplies raw price × 1000 to show per-10g price
  - SILVERBEES: `priceMultiplier: 10` → multiplies raw price × 10 to show per-10g price
  - Code in `script.js` line ~628: `var displayPrice = data.price * (c.priceMultiplier || 1);`
- Added GBP and EUR currency pairs (previously only USD)
- Fixed FX number formatter

### What is PENDING
- [ ] Push GOLDBEES/SILVERBEES fix to GitHub (NOT DONE — changes are local only)
- [ ] After push, verify prices match real-world values

### Known issues / wrong research
- ETF pricing took multiple iterations — Yahoo Finance returns per-unit ETF price, not the gold gram price. Multipliers were determined by cross-referencing with MCX gold price.

---

## SITE 3 — Pregnancy Tracker

**Domain:** getpregnancyready.com (NOT YET PURCHASED/CONFIGURED)  
**GitHub:** NOT YET CREATED (suggested repo name: `ViruSyndrome/pregnancy-tracker`)  
**Local folder:** `Pregnancy-Tracker/`  
**Status:** IN DEVELOPMENT ❌ Not live  

### What it does
Pregnancy week-by-week tracker: enter LMP (last menstrual period) or due date, get current week, trimester, baby development info, size comparisons, symptoms, tips, affiliate product recommendations. Gender prediction quiz (fun/entertainment, not medical).

### Target audience — PRIMARY
**India** — largest English-speaking pregnancy audience with a unique insight:
- India's **PC-PNDT Act 1994** makes it **ILLEGAL for doctors to reveal baby gender via ultrasound**
- This creates massive demand for fun prediction methods (heart rate theory, Chinese calendar, bump shape, cravings, etc.)
- None of these are scientifically proven but Indian women obsess over them → huge engagement opportunity

### Target audience — GLOBAL (see section below for full global strategy)
- US, UK, Australia, Canada — largest English pregnancy search markets
- Gender prediction tools are popular globally too (done "for fun" before 20-week scan even when legal)
- Week-by-week content is universal

### Color scheme
`--primary: #be185d` (deep pink), `--primary-dark: #9d174d`, `--primary-light: #fce7f3`, `--accent: #f97316` (orange), `--accent-light: #fff7ed`, `--bg: #fdf4f7`, `--bg-card: #ffffff`, `--text: #111827`, `--text-muted: #6b7280`, `--border: #f3d6e8`

### Current file state (as of session)
- `Pregnancy-Tracker/index.html` — base version built this session
- `WEEKS` array: 42 objects (weeks 1–42), each with `{ week, size, size_mm, emoji, baby, mom, tip }`
- `PRODUCTS` object: t1/t2/t3 arrays with 4 products each — all `href` set to `REPLACE-ME` placeholder
- `FAQS` array: 7 questions
- GA4 and AdSense both commented out (placeholders in file)
- All affiliate links point to `https://www.amazon.co.uk/s?k=...&tag=REPLACE-ME` — needs changing to `.in` for Indian traffic

### Known bugs (NOT YET FIXED)
1. **Scroll bug**: After clicking Calculate, `resultPanel` is `display:none` → JS sets `display:block` → then `scrollIntoView()` is called — but scroll fires before DOM paint, so user sees no movement. Fix: use `requestAnimationFrame` or `setTimeout(fn, 50)` before scrolling.
2. **Week chip tap bug**: `showWeekDetail(w)` is called on week chip click, but the display check `style.display === 'none'` may not match after first render (CSS class vs inline style conflict). Chips appear to do nothing on tap. Fix: remove the display check entirely and scroll to a permanently-visible `#weekDetailSection` div.
3. **UK affiliate links**: All Amazon links go to `.co.uk` — zero conversion for Indian traffic. Need `.in` links once registered with Amazon Associates India.

### Full UX overhaul — PENDING (list of everything to build)
1. Fix scroll bug (requestAnimationFrame)
2. Fix week chip tap bug
3. Animated progress bar reveal on calculate
4. Better visual hierarchy — trimester milestone banners
5. Week chip hover/active animation (like Nifty tracker cards)
6. Fix food emoji accuracy (Rutabaga → Onion, Romaine lettuce → Head of lettuce, etc.)
7. Add Indian food size equivalents alongside Western ones (e.g. "About the size of an Alphonso mango" at week 19)
8. Gender Prediction Quiz section (see design spec below)
9. Indian healthcare context (ASHA workers, government hospital milestones)
10. "What to do this week" checklist per week
11. "Common symptoms at this week" on week detail card
12. Smooth resultPanel reveal animation (not just display:block)
13. Global mode: region selector (India / Global) that adjusts size comparisons + checklist items

### Gender Prediction Quiz — DESIGN SPEC
- Clearly labelled: "Fun Prediction — Not Medical Advice"
- Input fields:
  - Baby's heart rate at last scan (bpm) — shows "theory says: girl/boy" + "Scientific verdict: No proven link"
  - Bump shape (visual selector: round vs pointy)
  - Morning sickness (none / mild / severe)
  - Food cravings (sweet / salty / sour / both)
  - Skin changes (glowing / dull / acne)
  - Chinese Gender Calendar (mother's lunar age + conception month)
- Results: fun animated "lean toward boy / girl" meter with prominent disclaimer
- Add fact boxes: each method shows the study/source that tested it and the accuracy rate
- Include "what Indian law says" — one line about PC-PNDT Act, why this tool exists

### Affiliate product plan (Amazon Associates India — NOT YET REGISTERED)
- Change all links from `amazon.co.uk` to `amazon.in`
- Trimester 1 products: prenatal vitamins, morning sickness bands, pregnancy pillow, belly cream
- Trimester 2 products: maternity clothes, belly support belt, stretch mark oil, baby name books
- Trimester 3 products: hospital bag essentials, nursing bra, baby monitor, car seat
- Once registered: get actual tracking tag, replace `REPLACE-ME` in all 12 product href values

---

## GLOBAL STRATEGY — Pregnancy Tracker

### Why go global (not just India)

| Market | Monthly searches "pregnancy week by week" | English? | Notes |
|--------|------------------------------------------|----------|-------|
| USA | 2.2M+ | ✅ | Biggest market, high CPC |
| UK | 450K+ | ✅ | NHS users, high CPC |
| India | 900K+ | ✅ | Fastest growing, lower CPC but huge volume |
| Australia | 180K+ | ✅ | High CPC |
| Canada | 200K+ | ✅ | High CPC |

**BabyChakra is India-only. BabyCenter/WhatToExpect are US-only in practice. There is NO site that does both India + Global well.** This is the gap.

### How to make the site relevant globally

**1. Core tracker is already universal**
- Due date calculator, week number, baby development milestones — same worldwide
- No changes needed for global relevance on core tracker

**2. Food size comparisons — add both**
- Keep Western items (avocado, papaya, butternut squash)
- ADD Indian equivalents in a secondary badge: "or an Alphonso mango 🥭" / "or a tender coconut 🥥"
- Do NOT remove Western items — UK/US users expect them

**3. Gender prediction — globally relevant, not just India**
- In UK/US: 20-week anatomy scan reveals gender — but many women do prediction tools "for fun" at 8, 12, 16 weeks before the scan
- Chinese Gender Calendar has HUGE global search volume
- Heart rate theory is googled millions of times globally
- Frame the feature as: "Fun Prediction Methods — See What the Old Wives' Tales Say" (not India-specific framing)
- Add a small India callout box: "In India, the PC-PNDT Act means doctors can't reveal gender — that's why this tool matters even more for Indian mums"

**4. Checklist items — make region-aware**
- Add a region selector (India / UK / US / Australia / Other)
- Week 12 checklist:
  - India: "Book your first trimester scan at a government or private hospital", "Register with ASHA worker if in rural area"
  - UK: "Book NHS 12-week dating scan", "Complete MATB1 form for maternity pay"
  - US: "Check insurance pre-authorisation for OB visits", "Decide on OB or midwife"
  - Global (default): "Book your 12-week dating scan", "Tell your GP / doctor you are pregnant"

**5. Symptom and nutrition advice — localise Indian section**
- Add a "🇮🇳 Indian moms" expandable section per week with:
  - Safe and unsafe Indian foods (e.g. papaya is unsafe in early pregnancy — very relevant since papaya is common in India)
  - Ayurvedic perspectives (clearly labelled "traditional belief, not medical advice")
  - ICMR growth chart note: "Indian babies typically weigh 2.7–2.9kg at birth vs 3.4–3.6kg globally — this is normal, not a problem"

**6. SEO strategy for global traffic**
- Target low-competition long-tails first:
  - "pregnancy week 8 baby size" (global, very high volume)
  - "baby heart rate gender prediction" (global, very high volume, low competition)
  - "Chinese gender calendar 2025" (global, high volume)
  - "pregnancy symptoms week 6 India" (India-specific)
  - "is papaya safe during pregnancy India" (India-specific, safety concern)
- Build one page per week (later) — week-8-pregnant.html, week-12-pregnant.html etc. for SEO

**7. Currency and product localisation**
- Amazon Associates: sign up for BOTH `.in` (India) AND `.com` (US) programmes
- Show `.in` products to Indian visitors (detect timezone/locale)
- Show `.com` products to US/global visitors
- UK visitors: `.co.uk` products
- Simple JS: `if (navigator.language.startsWith('en-IN')) { showIndiaProducts(); } else { showGlobalProducts(); }`

**8. Language — keep English only for now**
- Hindi support would be a major traffic driver but is a v2 feature
- Current scope: English only
- Add a note "हिंदी में जल्द आ रहा है" (Coming soon in Hindi) to signal intent to Indian users

---

## SITE 4 — Dev Toolbox (PLANNED — NOT STARTED)

**Domain:** TBD  
**Status:** On hold until pregnancy tracker is live  

### What it does
Collection of developer tools that "explain themselves" — JSON formatter, JWT decoder, Regex tester, Base64 encoder, etc. Each tool has an "Explain this to me" button that links to ChatGPT with the decoded/processed output pre-filled.

### Differentiator
- jwt.io (Auth0-owned) — no explanation feature
- regex101.com — pure tool, no education
- Our angle: "The developer tools that teach you while you work"

### SERP research findings
- JSON formatter: highest volume, very competitive (jsonformatter.org, jsonlint.com dominate)
- JWT decoder: Auth0 owns jwt.io — hard to rank for "JWT decoder" but can rank for "JWT explained" + "what does my JWT token mean"
- Regex tester: regex101.com is the undisputed winner — don't compete head-on; angle: "Regex for beginners" + visual explanation

### Monetisation plan
- AdSense (primary)
- Amazon Associates: O'Reilly/tech books affiliate links per tool (e.g. "JavaScript: The Good Parts" on JWT decoder page)

### Build order for tools
1. JSON Formatter + Validator (highest volume)
2. JWT Decoder + Explainer (unique angle vs jwt.io)
3. Regex Tester + Visual Explainer
4. Base64 Encoder/Decoder
5. URL Encoder/Decoder
6. Unix Timestamp Converter

---

## RESEARCH LOG — What We Found, What Was Wrong

### ✅ Correct findings
- AdSense requires 100+ genuine page views before showing ads (not 0)
- GSC canonical errors: root cause was missing canonical tags, not sitemap errors
- GOLDBEES/SILVERBEES Yahoo Finance prices need multipliers (×1000 and ×10 respectively) — verified against MCX
- BabyChakra is commerce-first, not content-first — creates content gap opportunity
- PC-PNDT Act is real and enforced — gender prediction tools have massive demand in India
- Chinese Gender Calendar has large global search volume, not just India
- TheBump uses 3D interactive visuals — highest engagement of all rivals
- WhatToExpect is most text-heavy and medical — least visually engaging of big 3
- Indian babies average 2.7–2.9kg vs Western 3.4–3.6kg (ICMR vs WHO growth charts)

### ❌ Wrong / debunked research
- **Zerodha affiliate programme**: Previously noted as "10% brokerage commission" — THIS WAS WRONG. Zerodha discontinued cash referral programme in August 2024 per SEBI regulations. Now only 300 reward points (not cash, not convertible to money). Do NOT add Zerodha CTA anywhere.
- **Naukri affiliate programme**: Searched for public programme — page 404. Unverified. Do not add.
- **Groww affiliate programme**: Searched — page 404 or no public programme found. Do not add.
- **Angel One affiliate**: Could not verify as open public programme. Do not add.
- **LinkedIn affiliate**: No public affiliate programme found for India. Do not add.
- **Amazon Associates India commission rates**: Not publicly listed (only visible after login). We assumed they exist and are worthwhile — but actual % rates unknown. Risk: rates could be very low (e.g. 1–2% on electronics). Need to verify after sign-up.

### ⚠️ Uncertain / needs verification
- Whether `getpregnancyready.com` domain is available and at what price
- Amazon Associates India approval criteria (they may reject new sites with no traffic)
- Whether AdSense will auto-show on pregnancy site or require manual approval (since AdSense is already approved on getatsready.com, same account may get faster approval)

---

## AFFILIATE PROGRAMME STATUS

| Programme | Status | Notes |
|-----------|--------|-------|
| **Amazon Associates India** | NOT signed up | affiliate-program.amazon.in — DO THIS FIRST before replacing REPLACE-ME links |
| **Amazon Associates US** | NOT signed up | associate-program.amazon.com — needed for global visitors to pregnancy site |
| **Amazon Associates UK** | NOT signed up | affiliate-program.amazon.co.uk — current links point here but tag not set up |
| Google AdSense | ✅ ACTIVE | ca-pub-2959862133855422 — already on ATS + Nifty sites |
| Zerodha | ❌ DISCONTINUED | SEBI banned cash referral Aug 2024 |
| Naukri | ❌ UNVERIFIED | Page 404 |
| Groww | ❌ UNVERIFIED | No public programme found |
| Angel One | ❌ UNVERIFIED | No public programme found |

### Amazon Associates — Action plan
1. Go to affiliate-program.amazon.in → Sign up with vinodjamesisaac@gmail.com
2. Create a "tracking ID" (tag) — e.g. `getpregnancyready-21`
3. Search for each of the 12 products in PRODUCTS array in index.html
4. Generate affiliate links for each product
5. Replace ALL 12 `REPLACE-ME` href values in `Pregnancy-Tracker/index.html`
6. Also sign up for amazon.com Associates for global visitors (different account/tag)
7. Add locale-detection JS to show `.in` vs `.com` links based on `navigator.language`

---

## PUSH STATUS — WHAT HAS NOT BEEN PUSHED TO GITHUB

| Change | Local status | GitHub status | Action needed |
|--------|-------------|---------------|---------------|
| ATS canonical tags (4 files) | ✅ Done | ❌ Not pushed | git push ats-checker repo |
| Nifty GOLDBEES/SILVERBEES fix | ✅ Done | ❌ Not pushed | git push nifty-tracker repo |
| Pregnancy tracker (whole site) | ✅ In progress | ❌ No repo yet | Create repo + push |

### Git push commands (run from correct folder)

**For ATS Checker:**
```
cd "c:\Users\Vinod\Desktop\Website ideas\ATS-Checker"
git add about.html contact.html privacy.html terms.html
git commit -m "Add canonical tags to fix GSC errors"
git push origin main
```

**For Nifty Tracker:**
```
cd "c:\Users\Vinod\Desktop\Website ideas\Nifty-Tracker"
git add script.js
git commit -m "Fix GOLDBEES/SILVERBEES price multipliers"
git push origin main
```

**For Pregnancy Tracker (new repo):**
```
cd "c:\Users\Vinod\Desktop\Website ideas\Pregnancy-Tracker"
git init
git add .
git commit -m "Initial commit — pregnancy week tracker"
git branch -M main
git remote add origin https://github.com/ViruSyndrome/pregnancy-tracker.git
git push -u origin main
```
Then: GitHub repo Settings → Pages → Deploy from branch: main / root

**After ATS push — GSC reindex:**
1. Go to https://search.google.com/search-console
2. URL Inspection tool → enter each URL:
   - https://www.getatsready.com/about.html
   - https://www.getatsready.com/contact.html
   - https://www.getatsready.com/privacy.html
   - https://www.getatsready.com/terms.html
3. Click "Request Indexing" for each
4. Resolution: 3–7 days

---

## PRIORITY BUILD ORDER

```
RIGHT NOW:
1. Rebuild Pregnancy-Tracker/index.html (full UX overhaul — all bugs fixed, gender prediction, global mode)

SAME DAY (30 min):
2. Push ATS canonical fix → GSC reindex 4 URLs
3. Push Nifty gold/silver fix

NEXT SESSION:
4. Create pregnancy-tracker GitHub repo → push → connect to getpregnancyready.com
5. Create GA4 property for pregnancy site → replace G-XXXXXXXXXX placeholder
6. Sign up for Amazon Associates India → replace REPLACE-ME in all 12 affiliate links
7. Uncomment AdSense in pregnancy tracker index.html

LATER:
8. Dev Toolbox (on hold — 4–6 weeks after pregnancy site is live)
9. Hindi version of pregnancy tracker
10. Individual week pages for SEO (week-8-pregnant.html × 42 pages)
```

---

## COMPETITOR CHEAT SHEET

| Site | Strength | Weakness | Our edge |
|------|----------|----------|----------|
| BabyChakra (India) | 2.25M users, community, e-commerce | Generic content, weak week tracker, no myth-busting, not globally usable | Deeper content, gender prediction, global reach |
| BabyCenter (US) | Massive authority, engaged community | US-only in practice, no India context | India-specific content, regional checklists |
| WhatToExpect (US) | Medical credibility | Very text-heavy, boring visuals, no fun features | Visual engagement, quiz/gamification |
| TheBump (US) | Best visuals, quizzes, 3D baby views | US-only, no India, no myth-busting | India + global content, gender prediction science |
| NHS (UK) | Government authority | Extremely clinical, no visuals | Fun + trustworthy balance |
| Healthline Pregnancy | SEO authority | Article-based not tool-based | Interactive tracker = return visits |

---

## GENDER PREDICTION — RESEARCH SUMMARY

### All methods, popularity, and scientific verdict

| Method | India popularity | Global popularity | Scientific basis |
|--------|-----------------|-------------------|-----------------|
| Heart rate (>140 = girl) | Very High | High | ❌ Myth — multiple studies show no correlation |
| Bump shape (round/high = girl) | Very High | High | ❌ Myth — depends on mother's posture/core muscles |
| Morning sickness severity (worse = girl) | Very High | Medium | ⚠️ Weak — some studies show slight correlation via hCG levels |
| Chinese Gender Calendar | High | High | ❌ No scientific basis — ~50% accuracy (coin-flip) |
| Food cravings (sweet = girl, salty = boy) | Very High | Medium | ❌ No proven link |
| Skin changes (glow = boy, acne = girl) | High | Medium | ❌ Hormone-related but not gender-linked |
| Ring/needle test | High | Low | ❌ No scientific basis |
| Baking soda test | Medium | Medium | ❌ No scientific basis |
| Nub theory (ultrasound angle) | Growing | High | ❌ Zero scientific evidence |
| Weight gain pattern | Medium | Low | ❌ No proven link |
| Sleep position (left = boy) | Medium | Low | ❌ No basis — left is recommended for ALL pregnancies |

### Why morning sickness has "weak evidence"
- Some studies show mothers of girls have higher hCG and estrogen levels
- Higher hCG = more severe morning sickness
- BUT: many mothers of boys also have severe morning sickness
- Accuracy is ~55% at best — barely better than guessing

### Legal context
- **India**: PC-PNDT Act 1994 — illegal to reveal or seek gender via ultrasound. Penalty: 3 years imprisonment. This is why Indian women use prediction methods.
- **China**: Similar restrictions (historical — related to one-child policy era), now relaxed but cultural habit remains
- **US/UK/Australia**: No legal restriction — 20-week anatomy scan routinely reveals gender — but many women do prediction methods "for fun" at 12 weeks before the scan

---

## SITE STRUCTURE PLAN — Pregnancy Tracker (Final)

```
Pregnancy-Tracker/
├── index.html          ← Main page (calculator + results + gender prediction)
├── style.css           ← Optional: extract styles later
└── [future pages]
    ├── week-by-week.html        ← SEO landing pages for each week
    ├── gender-prediction.html   ← Dedicated gender prediction tool
    ├── indian-pregnancy.html    ← India-specific guide
    └── sitemap.xml
```

### index.html sections (in order)
1. Hero — headline, subtitle, due date calculator (LMP / known due date toggle)
2. Result panel — week number, trimester, days to go, progress bar, due date
3. Baby development card — size, emoji, what baby is doing this week
4. Trimester products (Amazon affiliate)
5. Week-by-week timeline grid (42 chips, grouped by trimester)
6. Week detail card (expands on chip tap)
7. Gender Prediction Quiz
8. FAQ accordion
9. Footer

---

## WEEKLY SIZE COMPARISON — INDIA FOOD EQUIVALENTS (Reference)

| Week | Western | Indian equivalent |
|------|---------|-------------------|
| 6 | Lentil | Masoor dal grain |
| 10 | Strawberry | Jamun (Indian blackberry) |
| 14 | Lemon | Nimbu (Indian lime) |
| 16 | Avocado | Raw mango (small) |
| 19 | Mango | Alphonso mango |
| 21 | Carrot | Gajar |
| 24 | Corn on the cob | Bhutta |
| 28 | Coconut | Tender coconut |
| 32 | Squash | Lauki (bottle gourd) |
| 36 | Honeydew melon | Muskmelon / Kharbuja |
| 40 | Watermelon | Tarbooz |

---

*End of master document. Update this file at the end of each session.*
