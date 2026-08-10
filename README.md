# inphint — The Future of Moving

A cinematic, scroll-driven marketing site for **inphint Moving Solutions**, built with
**Next.js (App Router)**, **GSAP + ScrollTrigger**, and **Lenis** smooth scrolling.

The signature moment is the hero: six photographs of the same truck (all shot in the
same location) are cross-faded with perspective, scale and motion-blur so that scrolling
reads as a single camera orbiting the vehicle — front → side → rear → doors open to reveal
the load → sealed → driving to the horizon.

## Tech stack

- **Next.js 14** (App Router, static-rendered single page)
- **React 18**
- **GSAP 3** + **ScrollTrigger** — all scroll choreography
- **@studio-freight/lenis** — smooth scrolling (auto-disabled on touch / reduced-motion)
- Google Fonts (Unbounded / Manrope / JetBrains Mono) loaded via `<link>`
- No CSS framework — a single hand-written `app/globals.css`

## Project structure

```
app/
  layout.js      # <html>, metadata, font links, globals.css
  page.js        # renders the site
  globals.css    # all styling + design tokens
components/
  InphintSite.jsx# the whole page: markup + a single useEffect that wires every animation
public/
  images/        # all optimized photography (truck angles, services, crew, etc.)
```

All animation logic lives in one `useEffect` in `components/InphintSite.jsx`. It registers
ScrollTrigger, starts Lenis, and builds every scroll timeline; on unmount it kills all
ScrollTriggers, removes tickers/listeners and destroys Lenis, so it is safe with React's
lifecycle. `reactStrictMode` is disabled in `next.config.js` because the imperative
animations should initialize exactly once.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

This is a zero-config Next.js app — Vercel detects and builds it automatically.

### Option A — GitHub + Vercel dashboard (recommended)

```bash
# from the project root (a git repo is already initialized with an initial commit)
git remote add origin https://github.com/<you>/inphint.git
git branch -M main
git push -u origin main
```

Then go to **vercel.com → Add New → Project**, import the `inphint` repo, and click
**Deploy**. No environment variables or build settings are required.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel          # follow the prompts (accept the defaults)
vercel --prod   # promote to production
```

## Customizing

- **Contact details** — replace `hello@inphint.com` and `+1 (000) 000-0000` (and the
  `mailto:` / `tel:` links) in `components/InphintSite.jsx`.
- **Images** — swap files in `public/images/` (keep the same filenames, or update the
  `src` paths in the component).
- **Disabled nav** — Services / About / Why Us / Moving Process / Contact are intentionally
  non-clickable (`aria-disabled`) because only the Home experience is built. Remove the
  `aria-disabled` attribute and point the `href` at a route/section to enable one.
- **Motion** — the site respects `prefers-reduced-motion` and falls back to a static,
  fully-readable layout on small screens and touch devices.

© Inphint — Creative Agency | Pakistan
