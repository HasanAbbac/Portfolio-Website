import { defineConfig } from 'vite';
import { CONTENT } from './src/content.js';

// Set SITE_URL (for example https://your-domain.com) when you build, and the build adds the canonical URL,
// absolute social-preview links, sitemap.xml and a robots.txt that points to it. Without it, the build still
// produces a valid robots.txt and the social tags use relative paths.
// On Vercel the production address is provided automatically (VERCEL_PROJECT_PRODUCTION_URL), so SITE_URL is optional there.
const vercelHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
const SITE = (process.env.SITE_URL || (vercelHost && process.env.VERCEL_ENV === 'production' ? `https://${vercelHost}` : '')).trim().replace(/\/+$/, '');
if (!SITE && process.env.NODE_ENV === 'production') console.warn('[build] SITE_URL is not set: the canonical URL, sitemap.xml and social-preview links will be missing. Set it to your live address before the final build.');
const TITLE = 'Hasan Abbasi | 3D Artist';
const DESC = 'Portfolio of Hasan Abbasi, a 3D artist working in modelling, animation and game development with Blender, Unity and Unreal Engine.';

function seo() {
  return {
    name: 'seo-meta',
    transformIndexHtml(html) {
      const abs = (p) => (SITE ? `${SITE}${p}` : p);
      const tags = [
        SITE && `<link rel="canonical" href="${SITE}/">`,
        SITE && `<meta property="og:url" content="${SITE}/">`,
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Hasan Abbasi">',
        `<meta property="og:image" content="${abs('/og-image.jpg')}">`,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="Hasan Abbasi, 3D artist, next to his 3D avatar">',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${TITLE}">`,
        `<meta name="twitter:description" content="${DESC}">`,
        `<meta name="twitter:image" content="${abs('/og-image.jpg')}">`,
      ].filter(Boolean);
      const person = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Hasan Abbasi',
        jobTitle: '3D Artist',
        ...(SITE ? { url: `${SITE}/` } : {}),
        sameAs: [CONTENT.github, CONTENT.linkedin],
      };
      return html.replace('</head>', `${tags.join('\n')}\n<script type="application/ld+json">${JSON.stringify(person)}</script>\n</head>`);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : ''}` });
      if (SITE) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc></url>\n</urlset>\n` });
      }
    },
  };
}

export default defineConfig({
  plugins: [seo()],
  server: {
    port: 5173,
    // The contact form posts to /api/contact, which the Express server answers on 3001.
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    chunkSizeWarningLimit: 900,
    // keep Three.js in its own chunk so the first page load only downloads the small site script;
    // the 3D scene and the model viewer load it afterwards
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : undefined) } },
  },
});
