/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imperative GSAP/Lenis animations run once on mount; StrictMode's dev
  // double-invoke would re-run them, so we disable it (production is unaffected).
  reactStrictMode: false,

  // Google Fonts are loaded via <link> in app/layout.js and fetched by the
  // browser at runtime. Disabling Next's build-time font inlining keeps builds
  // deterministic and avoids a network fetch during `next build`.
  optimizeFonts: false,
};
module.exports = nextConfig;
