/**
 * data/x_posts_calendar.json → TSV（Googleスプレッドシート貼付用）
 * 使い方: npm run export:x-posts-tsv
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'data', 'x_posts_calendar.json');
const POSTS_TSV = path.join(ROOT, 'data', 'x_posts_calendar.tsv');
const EGO_TSV = path.join(ROOT, 'data', 'x_posts_ego_search.tsv');

function tsvCell(value) {
  const text = String(value ?? '');
  if (/[\t\r\n"]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toTsv(rows) {
  return rows.map((row) => row.map(tsvCell).join('\t')).join('\n');
}

function toolFromTemplate(template) {
  const match = String(template).match(/sugudasu\.com\/([a-z]+)/);
  return match ? match[1] : '';
}

function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('missing:', JSON_PATH);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const posts = Array.isArray(data.posts) ? data.posts : [];

  const postHeader = [
    '投稿ID',
    '型',
    'ツール',
    'シーズン',
    '文字数',
    'メモ',
    '改訂メモ',
    'ステータス',
    '本文',
  ];
  const postRows = posts.map((p) => [
    p.date_index,
    p.type,
    p.tool,
    p.season,
    p.char_count ?? '',
    p.remarks ?? '',
    p.revision_note ?? '',
    p.status ?? '未投稿',
    p.body,
  ]);

  const egoHeader = ['No', 'ツール', 'リプテンプレ', 'メモ', 'ステータス'];
  const egoTemplates = Array.isArray(data.ego_search_templates) ? data.ego_search_templates : [];
  const egoRows = egoTemplates.map((template, index) => [
    index + 1,
    toolFromTemplate(template),
    template,
    '1日3件まで・検索ワードは当日のエゴサに合わせて',
    '未使用',
  ]);

  const bom = '\uFEFF';
  fs.writeFileSync(POSTS_TSV, bom + toTsv([postHeader, ...postRows]), 'utf8');
  fs.writeFileSync(EGO_TSV, bom + toTsv([egoHeader, ...egoRows]), 'utf8');

  console.log('export OK');
  console.log('  posts:', POSTS_TSV, `(${posts.length} rows)`);
  console.log('  ego:  ', EGO_TSV, `(${egoTemplates.length} rows)`);
  console.log('  Sheets: ファイルを開き全選択 → A1 に貼り付け（または ファイル→インポート）');
}

main();
