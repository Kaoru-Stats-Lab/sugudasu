/**
 * One-shot: tools/guides/*.html → sg-guide-article layout
 * Run: node scripts/migrate-guide-article-layout.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GUIDES_DIR = path.join(ROOT, 'tools', 'guides');
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guides.json'), 'utf8'));

const PILLAR_LABEL = {
  event: 'イベント運営',
  production: '制作・進行管理',
  team: '事務・データ整備',
  docs: '書類・経理',
};

const TOOL_CARD_RE =
  /<p>\s*<a href="(\/[^"]+)">([^<]+)<\/a>\s*(?:—|–|-)\s*([^<]+)<\/p>/;

function wrapTables(html) {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    if (table.includes('sg-guide-table-scroll')) return table;
    return `<div class="sg-guide-table-scroll">\n${table}\n</div>`;
  });
}

function markStepLists(html) {
  return html.replace(
    /<h2>当日の進め方<\/h2>\s*<ol>/,
    '<h2>当日の進め方</h2>\n        <ol class="sg-guide-steps">'
  );
}

function parseFaqBlock(block) {
  const items = [];
  const re = /<h3>([\s\S]*?)<\/h3>\s*([\s\S]*?)(?=<h3>|<\/div>|$)/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const summary = m[1].trim();
    const body = m[2].trim();
    if (!summary || !body) continue;
    items.push({ summary, body });
  }
  return items;
}

function faqToHtml(items) {
  return items
    .map(
      ({ summary, body }) => `                    <details class="sg-faq">
                        <summary>${summary}</summary>
                        <div class="mt-3 text-sm leading-relaxed text-slate-600 pt-2 border-t border-slate-200/60">
                            ${body}
                        </div>
                    </details>`
    )
    .join('\n');
}

function buildToolCards(footerInner) {
  const cards = [];
  let rest = footerInner;
  const re = /<p>\s*<a href="(\/[^"]+)">([^<]+)<\/a>\s*(?:—|–|-)\s*([^<]*)<\/p>/g;
  let m;
  while ((m = re.exec(footerInner)) !== null) {
    cards.push({ href: m[1], name: m[2].trim(), desc: m[3].trim() });
    rest = rest.replace(m[0], '');
  }
  return { cards, rest: rest.trim() };
}

function buildAside(footerInner, isToolsTitle) {
  const titleMatch = footerInner.match(/<p class="font-semibold">([^<]+)<\/p>/);
  const title = titleMatch ? titleMatch[1] : isToolsTitle ? '関連ツール' : '関連リンク';
  let inner = footerInner.replace(/<p class="font-semibold">[^<]+<\/p>\s*/, '');
  inner = inner.replace(/<p class="sg-info-caption[^"]*">[\s\S]*?<\/p>\s*/g, '');
  inner = inner.replace(/<p class="mt-2 text-sm">[\s\S]*?<\/p>\s*/g, '');

  const { cards, rest } = buildToolCards(inner);

  if (cards.length > 0) {
    const cardHtml = cards
      .map(
        (c) => `            <a href="${c.href}" class="sg-guide-tool-card">
                <span class="sg-guide-tool-card__name">${c.name}</span>
                <span class="sg-guide-tool-card__desc">${c.desc}</span>
            </a>`
      )
      .join('\n');
    return `<aside class="sg-guide-tools">
            <h2 class="sg-guide-tools__title">${title}</h2>
${cardHtml}
        </aside>`;
  }

  const cleaned = inner.replace(/<p class="mt-2">/g, '<p>').trim();
  return `<aside class="sg-guide-related">
            <h2 class="sg-guide-related__title">${title}</h2>
            ${cleaned}
        </aside>`;
}

function extractBackLinks(footerInner) {
  const cap = footerInner.match(/<p class="sg-info-caption[^"]*">([\s\S]*?)<\/p>/);
  if (!cap) return '';
  const inner = cap[1].replace(/<a href="\/guides">← 実務ガイド一覧<\/a>/, '').trim();
  if (!inner.startsWith('·')) return '';
  return inner;
}

function migrateFile(file) {
  const slug = file.replace(/\.html$/, '');
  const meta = REGISTRY.articles.find((a) => a.slug === slug);
  if (!meta) {
    console.warn('skip (no registry):', file);
    return;
  }
  const pillar = meta.pillar;
  const pillarLabel = PILLAR_LABEL[pillar] || pillar;

  let html = fs.readFileSync(path.join(GUIDES_DIR, file), 'utf8');
  const headEnd = html.indexOf('<div id="sg-chrome-top"');
  const tailStart = html.indexOf('<div id="sg-chrome-bottom"');
  if (headEnd < 0 || tailStart < 0) {
    console.warn('skip (structure):', file);
    return;
  }
  const head = html.slice(0, headEnd);
  const tail = html.slice(tailStart);

  const articleMatch = html.match(
    /<main class="sg-info-page">\s*<article class="sg-card[^"]*">([\s\S]*?)<\/article>\s*<\/main>/
  );
  if (!articleMatch) {
    console.warn('skip (no article):', file);
    return;
  }
  const article = articleMatch[1];

  const headerMatch = article.match(
    /<header[^>]*>[\s\S]*?<p class="text-\[11px\][^"]*">([^<]*)<\/p>[\s\S]*?<h1 class="sg-info-page__title">([\s\S]*?)<\/h1>[\s\S]*?<p class="sg-info-page__lead">([\s\S]*?)<\/p>\s*<\/header>/
  );
  if (!headerMatch) {
    console.warn('skip (header):', file);
    return;
  }
  const eyebrowLine = headerMatch[1].trim();
  const title = headerMatch[2].trim();
  const lead = headerMatch[3].trim();
  const eyebrowParts = eyebrowLine.split('·').map((s) => s.trim());
  const eyebrow = eyebrowParts[0];
  const datePart = eyebrowParts.find((p) => p.startsWith('更新'));
  const updated = datePart ? datePart.replace('更新', '').trim() : meta.published;

  const takeawaysMatch = article.match(
    /<section class="sg-info-callout mb-6">[\s\S]*?<ul>([\s\S]*?)<\/ul>[\s\S]*?<\/section>/
  );
  const takeawaysList = takeawaysMatch ? takeawaysMatch[1].trim() : '';

  const faqStart = article.indexOf('<h2>よくある質問</h2>');
  const footerStart = article.indexOf('<section class="sg-info-callout mt-8">');
  if (faqStart < 0 || footerStart < 0) {
    console.warn('skip (faq/footer):', file);
    return;
  }

  const bodyStart = article.indexOf('</section>', article.indexOf('sg-info-callout mb-6')) + '</section>'.length;
  let body = article.slice(bodyStart, faqStart).trim();
  body = wrapTables(body);
  body = markStepLists(body);

  const faqBlock = article.slice(faqStart + '<h2>よくある質問</h2>'.length, footerStart).trim();
  const faqItems = parseFaqBlock(faqBlock);

  const footerMatch = article.match(/<section class="sg-info-callout mt-8">([\s\S]*?)<\/section>/);
  const footerInner = footerMatch ? footerMatch[1].trim() : '';
  const isTools = /関連ツール|いま試す/.test(footerInner);
  const aside = buildAside(footerInner, isTools);
  const extraBack = extractBackLinks(footerInner);

  const chromeTitle = html.match(/data-sg-title="([^"]*)"/)?.[1] || title;

  const out = `${head}<div id="sg-chrome-top" data-sg-title="${chromeTitle}"></div>

<main class="sg-guide-page">
    <article class="sg-guide-article sg-guide-article--${pillar}">
        <nav class="sg-guide-breadcrumb" aria-label="パンくず">
            <a href="/guides">実務ガイド</a>
            <span aria-hidden="true">›</span>
            <span>${pillarLabel}</span>
        </nav>

        <header class="sg-guide-header">
            <p class="sg-guide-eyebrow">${eyebrow}</p>
            <p class="sg-guide-meta">更新 ${updated}</p>
            <h1 class="sg-guide-title">${title}</h1>
            <p class="sg-guide-lead">${lead}</p>
        </header>

        <section class="sg-guide-takeaways" aria-labelledby="guide-takeaways-${slug}">
            <h2 id="guide-takeaways-${slug}" class="sg-guide-takeaways__title">この記事でわかること</h2>
            <ul>
${takeawaysList}
            </ul>
        </section>

        <div class="sg-guide-body sg-info-prose">
${body.split('\n').map((l) => '            ' + l).join('\n').trimEnd()}
        </div>

        <section class="sg-guide-faq sg-faq-section" aria-labelledby="guide-faq-${slug}">
            <div class="sg-faq-inner">
                <h2 id="guide-faq-${slug}" class="sg-faq-title">よくある質問</h2>
                <div class="sg-faq-list">
${faqToHtml(faqItems)}
                </div>
            </div>
        </section>

        ${aside}

        <p class="sg-guide-back"><a href="/guides">← 実務ガイド一覧</a>${extraBack}</p>
    </article>
</main>

${tail}`;

  fs.writeFileSync(path.join(GUIDES_DIR, file), out, 'utf8');
  console.log('migrated:', file);
}

const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.html'));
for (const file of files) migrateFile(file);
