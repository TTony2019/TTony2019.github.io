import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(root, file), 'utf8');
const [profile, publications, projects, contributions, template] = await Promise.all([
  read('data/profile.json').then(JSON.parse),
  read('data/publications.json').then(JSON.parse),
  read('data/projects.json').then(JSON.parse),
  read('data/contributions.json').then(JSON.parse),
  read('src/index.html'),
]);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const bilingual = (text) => `<span data-lang="en">${escape(text.en)}</span><span data-lang="zh">${escape(text.zh)}</span>`;
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const publicationCategories = [
  { id: 'preprint', label: { en: 'Preprints', zh: '预印本' }, kinds: ['preprint'] },
  { id: 'conference', label: { en: 'Conference papers', zh: '会议论文' }, kinds: ['conference', 'workshop'] },
  { id: 'journal', label: { en: 'Journal papers', zh: '期刊论文' }, kinds: ['journal'] },
];
const publicationKinds = new Set(publicationCategories.flatMap((category) => category.kinds));
const citations = {};
const ids = new Set();

function external(url) {
  if (!/^https?:\/\//.test(url)) throw new Error(`Expected an HTTP(S) link: ${url}`);
  return `href="${escape(url)}" target="_blank" rel="noopener noreferrer"`;
}

function bibtex(paper) {
  const family = paper.authors[0].split(' ').at(-1).toLowerCase();
  const key = `${family}${paper.year}${paper.id.replace(/-/g, '')}`;
  const type = paper.kind === 'journal' ? 'article' : ['conference', 'workshop'].includes(paper.kind) ? 'inproceedings' : 'misc';
  const fields = {
    title: `{${paper.title}}`,
    author: paper.authors.map((name) => { const parts = name.split(' '); return `${parts.pop()}, ${parts.join(' ')}`; }).join(' and '),
    year: paper.year,
  };
  if (paper.kind === 'journal') fields.journal = paper.venue;
  if (paper.kind === 'conference') fields.booktitle = 'Proceedings of the 43rd International Conference on Machine Learning';
  if (paper.kind === 'workshop') fields.booktitle = 'ICML 2026 Workshop on AI for Mathematics';
  if (paper.pages) fields.pages = paper.pages;
  if (paper.doi) fields.doi = paper.doi;
  if (paper.arxiv) { fields.eprint = paper.arxiv; fields.archivePrefix = 'arXiv'; }
  fields.url = paper.url;
  return `@${type}{${key},\n${Object.entries(fields).map(([name, value]) => `  ${name} = {${value}}`).join(',\n')}\n}`;
}

const sortedPublications = [...publications].sort((a, b) => b.date.localeCompare(a.date));
const renderedPublications = new Map(sortedPublications.map((paper) => {
  if (ids.has(paper.id)) throw new Error(`Duplicate publication ID: ${paper.id}`);
  if (!publicationKinds.has(paper.kind)) throw new Error(`Unknown publication kind in ${paper.id}: ${paper.kind}`);
  ids.add(paper.id);
  citations[paper.id] = { title: paper.title, bibtex: bibtex(paper) };
  const authors = paper.authors.map((author) => author === profile.name ? `<strong>${escape(author)}</strong>` : escape(author)).join(', ');
  const links = [
    `<a class="paper-link" ${external(paper.pdf || paper.url)}>${bilingual({ en: 'Paper', zh: '论文' })}${icon('arrow')}</a>`,
    paper.code ? `<a class="paper-link" ${external(paper.code)}>${icon('github')}${bilingual({ en: 'Code', zh: '代码' })}</a>` : '',
    `<button class="cite-button" type="button" data-citation="${escape(paper.id)}" aria-label="BibTeX: ${escape(paper.title)}">${icon('copy')}BibTeX</button>`,
  ].join('');
  return [paper.id, `<article class="publication" id="paper-${escape(paper.id)}" data-kind="${escape(paper.kind)}">
        <div class="publication-year"><time datetime="${escape(paper.date)}">${paper.year}</time></div>
        <div class="publication-body">
          <div class="publication-meta"><span class="venue-badge ${escape(paper.kind)}">${escape(paper.venue)}</span></div>
          <h4 class="publication-title"><a ${external(paper.url)}>${escape(paper.title)}</a></h4>
          <p class="publication-authors">${authors}</p>
          <div class="publication-links">${links}</div>
        </div>
      </article>`];
}));
const publicationHTML = publicationCategories.map((category) => {
  const categoryPapers = sortedPublications.filter((paper) => category.kinds.includes(paper.kind));
  if (!categoryPapers.length) return '';
  return `<section class="publication-group" data-category="${category.id}" aria-labelledby="publication-group-${category.id}">
        <div class="publication-group-heading"><h3 id="publication-group-${category.id}">${bilingual(category.label)}</h3></div>
        <div class="publication-group-list">${categoryPapers.map((paper) => renderedPublications.get(paper.id)).join('\n')}</div>
      </section>`;
}).join('\n');

const projectHTML = projects.map((project) => `<a class="project-card" ${external(project.url)}>
        <div class="project-card-top">${icon('github')}<span class="project-type">${bilingual(project.type)}</span></div>
        <h3>${escape(project.name)}</h3>
        <p>${bilingual(project.description)}</p>
        <div class="project-card-bottom"><span class="project-language"><span class="language-dot ${project.language.startsWith('Lean') ? 'lean' : ''}"></span>${escape(project.language)}</span>${icon('arrow')}</div>
      </a>`).join('\n');

const contributionHTML = [...contributions].sort((a, b) => b.mergedAt.localeCompare(a.mergedAt)).map((contribution) => `<li>
        <a class="contribution-row" ${external(contribution.url)}>
          <span class="contribution-number">#${escape(contribution.number)}</span>
          <h3 class="contribution-title">${bilingual(contribution.title)}</h3>
          <span class="contribution-status">${icon('check')}${bilingual({ en: 'Merged', zh: '已合并' })}</span>
          ${icon('arrow')}
        </a>
      </li>`).join('\n');

const contacts = [
  { email: profile.email, affiliation: profile.affiliation },
  { email: profile.visiting.email, affiliation: profile.visiting.affiliation },
];
const visitingRole = profile.visiting.role.charAt(0).toLowerCase() + profile.visiting.role.slice(1);
const description = `${profile.name}, ${profile.role} at the ${profile.department}, ${profile.affiliation}, and currently a ${visitingRole} at the ${profile.visiting.department}, ${profile.visiting.affiliation}. Research in dimension reduction methods for large-scale optimization problems and AI4MATH (Lean-based autoformalization).`;

const updated = new Date(`${profile.updated}T12:00:00Z`);
if (Number.isNaN(updated.getTime())) throw new Error('Invalid profile.updated date');
const schema = {
  '@context': 'https://schema.org', '@type': 'Person', name: profile.name,
  jobTitle: [profile.role, profile.visiting.role],
  affiliation: [
    { '@type': 'CollegeOrUniversity', name: profile.affiliation },
    { '@type': 'CollegeOrUniversity', name: profile.visiting.affiliation, url: profile.visiting.affiliationUrl },
  ],
  email: contacts.map((contact) => contact.email), sameAs: [profile.scholar, profile.github],
  knowsAbout: ['Dimension reduction', 'Large-scale optimization', 'AI4MATH', 'Lean-based autoformalization'],
};
let urlMeta = '';
if (profile.siteUrl) {
  const siteUrl = new URL(profile.siteUrl.endsWith('/') ? profile.siteUrl : `${profile.siteUrl}/`);
  if (!['http:', 'https:'].includes(siteUrl.protocol)) throw new Error('siteUrl must be HTTP(S)');
  schema.url = siteUrl.href;
  schema.image = new URL('assets/images/portrait.jpg', siteUrl).href;
  urlMeta = `<link rel="canonical" href="${escape(siteUrl.href)}">\n  <meta property="og:url" content="${escape(siteUrl.href)}">\n  <meta property="og:image" content="${escape(schema.image)}">`;
}
const replacements = {
  NAME: escape(profile.name), ROLE: escape(profile.role), AFFILIATION: escape(profile.affiliation),
  DEPARTMENT: escape(profile.department), DEPARTMENT_URL: escape(profile.departmentUrl),
  ADVISOR: escape(profile.advisor), EMAIL: escape(profile.email), GITHUB: escape(profile.github),
  VISITING_AFFILIATION: escape(profile.visiting.affiliation), VISITING_AFFILIATION_URL: escape(profile.visiting.affiliationUrl),
  VISITING_DEPARTMENT: escape(profile.visiting.department), VISITING_DEPARTMENT_URL: escape(profile.visiting.departmentUrl),
  VISITING_ADVISOR: escape(profile.visiting.advisor), VISITING_ADVISOR_URL: escape(profile.visiting.advisorUrl),
  VISITING_EMAIL: escape(profile.visiting.email), DESCRIPTION: escape(description),
  LOCATION_EN: escape(profile.location.en), LOCATION_ZH: escape(profile.location.zh),
  SCHOLAR: escape(profile.scholar), URL_META: urlMeta,
  PUBLICATIONS: publicationHTML, PROJECTS: projectHTML, CONTRIBUTIONS: contributionHTML,
  CITATION_DATA: json(citations), SCHEMA: json(schema), CURRENT_YEAR: updated.getUTCFullYear(),
  UPDATED_EN: updated.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
  UPDATED_ZH: updated.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', timeZone: 'UTC' }),
};
const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (match, name) => {
  if (!(name in replacements)) throw new Error(`Unresolved template variable: ${match}`);
  return replacements[name];
});

const outputIndex = process.argv.indexOf('--out-dir');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) throw new Error('--out-dir needs a directory');
const outputDir = outputIndex >= 0 ? path.resolve(root, process.argv[outputIndex + 1]) : root;
await mkdir(outputDir, { recursive: true });
if (outputDir !== root) {
  await cp(path.join(root, 'assets'), path.join(outputDir, 'assets'), { recursive: true });
  await cp(path.join(root, '.nojekyll'), path.join(outputDir, '.nojekyll'));
}
await writeFile(path.join(outputDir, 'index.html'), html);
await writeFile(path.join(outputDir, 'publications.bib'), Object.values(citations).map((citation) => citation.bibtex).join('\n\n') + '\n');
console.log(`Built ${publications.length} publications, ${projects.length} projects, and ${contributions.length} mathlib contributions → ${path.relative(root, outputDir) || '.'}`);
