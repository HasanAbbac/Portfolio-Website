// Step 1 of the pipeline: collect the documents the assistant is allowed to answer from.
// Sources: the markdown files in /knowledge (CV, site notes) plus the portfolio's own content file
// (projects, skills, timeline) and its English About text, so the answers always match what the site shows.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';
import { CONTENT } from '../../src/content.js';
import { t } from '../../src/i18n.js';

const TYPE_LABEL = { model: '3D model made in Blender, with an interactive 3D viewer', web: 'browser game that can be played on the site', unity: 'game built in Unity', unreal: 'game built in Unreal Engine' };
const SKILL_GROUP = { '3D': '3D', Engines: 'Game engines', Code: 'Programming and tools' };

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A markdown file starts with  <!-- href: ... | label: ... -->  and then "# Title" and "## Section" parts.
function docsFromMarkdown(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const meta = (raw.match(/<!--\s*href:\s*(.+?)\s*\|\s*label:\s*(.+?)\s*-->/) || []).slice(1);
  const [href = '#home', label = path.basename(file, '.md')] = meta;
  const title = ((raw.match(/^#\s+(.+)$/m) || [])[1] || label).trim();
  const parts = raw.split(/^##\s+/m).slice(1);
  return parts.map((p) => {
    const [head, ...body] = p.split('\n');
    return { id: `${path.basename(file, '.md')}-${slug(head)}`, title: `${title}: ${head.trim()}`, href, label, text: body.join('\n').trim() };
  });
}

export function buildDocs() {
  const docs = [];
  const dir = path.join(ROOT, 'knowledge');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) docs.push(...docsFromMarkdown(path.join(dir, f)));

  // About text exactly as written on the site (English)
  docs.push({ id: 'about', title: 'About Hasan', href: '#about', label: 'About', text: [t('hero.lead'), t('about.p1'), t('about.p2'), t('about.p3')].join(' ') });

  // Skills grouped as on the site
  const groups = [...new Set(CONTENT.skills.map((s) => s.group))];
  docs.push({ id: 'skills', title: 'Skills and technologies', href: '#skills', label: 'Skills', text: 'The skills shown in the Skills section of the portfolio are: ' + groups.map((g) => `${SKILL_GROUP[g] || g}: ${CONTENT.skills.filter((s) => s.group === g).map((s) => s.name).join(', ')}`).join('. ') + '.' });

  // Projects: one overview plus one passage per project
  const byType = (ty) => CONTENT.projects.filter((p) => p.type === ty).map((p) => p.title);
  docs.push({ id: 'projects-overview', title: 'Projects overview', href: '#projects', label: 'Projects', text: `The portfolio shows ${CONTENT.projects.length} projects. 3D models made in Blender: ${byType('model').join(', ')}. Browser games built with Three.js and JavaScript: ${byType('web').join(', ')}.${byType('unity').length ? ` Unity games: ${byType('unity').join(', ')}.` : ''}${byType('unreal').length ? ` Unreal Engine games: ${byType('unreal').join(', ')}.` : ''} Visitors can search the projects, filter them by category and by technique, open each in a popup, rotate the 3D models and play the games.` });
  CONTENT.projects.forEach((p, i) => {
    const bits = [`Project: ${p.title}. It is a ${TYPE_LABEL[p.type] || 'project'}${p.type !== 'model' && p.play ? ', playable on the site' : p.video ? ', shown as a gameplay video on the site' : ''}.`, p.text, p.tags && p.tags.length ? `Tools and techniques: ${p.tags.join(', ')}.` : '', p.year ? `Year: ${p.year}.` : '', p.role ? `Hasan's role: ${p.role}.` : '', p.links && p.links.length ? `Links: ${p.links.map((l) => `${l.label} ${l.href}`).join(', ')}.` : ''];
    docs.push({ id: `project-${slug(p.title)}`, title: `Project: ${p.title}`, href: '#projects', label: p.title, projectIndex: i, text: bits.filter(Boolean).join(' ') });
  });

  // Education, experience and achievements (the timeline)
  for (const k of CONTENT.timeline) {
    const certs = k.certs ? ` Certificates included: ${k.certs.map((c) => c.label).join(', ')}.` : '';
    docs.push({ id: `timeline-${k.id}`, title: `${k.channel}: ${k.title}`, href: '#experience', label: 'Education and experience', text: `${k.channel}: ${k.title}, ${k.place}. ${k.text}${certs}` });
  }

  // Public contact details only (no phone number or street address)
  docs.push({ id: 'contact', title: 'Contact Hasan', href: '#contact', label: 'Contact', text: `To get in touch with Hasan, use the contact form in the Contact section, or email ${CONTENT.email}. His GitHub is ${CONTENT.github} and his LinkedIn is ${CONTENT.linkedin}.` });
  return docs;
}
