/**
 * POST /api/feedback — 定性フィードバック → GitHub Issues
 * SSOT: docs/notes/QUALITATIVE_FEEDBACK_INTAKE.md
 *
 * Env (Cloudflare Pages · sugudasu):
 *   GITHUB_FEEDBACK_TOKEN — fine-grained · Issues: Read and write
 *   GITHUB_FEEDBACK_OWNER — default Kaoru-Stats-Lab
 *   GITHUB_FEEDBACK_REPO  — default sugudasu
 */

const ALLOWED_ORIGINS = new Set([
  'https://sugudasu.com',
  'https://www.sugudasu.com',
]);

const KINDS = new Set(['bug', 'ux', 'feature', 'other']);
const SOURCES = new Set([
  'footer',
  'failure_inline',
  'updates',
  'contact',
  'roadmap',
  'paper-schedule-research',
]);
const MAX_MESSAGE = 500;
const RATE_LIMIT_PER_DAY = 10;

/**
 * @param {Request} request
 * @param {EventContext} context
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  const cors = corsHeaders(origin);

  if (origin && !isAllowedOrigin(origin, request)) {
    return json({ ok: false, error: 'origin_not_allowed' }, 403, cors);
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const token = env.GITHUB_FEEDBACK_TOKEN;
  if (!token) {
    return json({ ok: false, error: 'feedback_not_configured' }, 503, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400, cors);
  }

  const toolId = sanitizeId(body.tool_id, 64) || 'unknown';
  const source = SOURCES.has(String(body.source || '')) ? String(body.source) : 'footer';
  const kind = KINDS.has(String(body.kind || '')) ? String(body.kind) : 'other';
  const message = String(body.message || '')
    .trim()
    .slice(0, MAX_MESSAGE);
  if (message.length < 3) {
    return json({ ok: false, error: 'message_too_short' }, 400, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `fb-rate:${await sha8(ip)}`;
  const allowed = await checkRateLimit(rateKey, RATE_LIMIT_PER_DAY);
  if (!allowed) {
    return json({ ok: false, error: 'rate_limited' }, 429, cors);
  }

  const owner = env.GITHUB_FEEDBACK_OWNER || 'Kaoru-Stats-Lab';
  const repo = env.GITHUB_FEEDBACK_REPO || 'sugudasu';
  const appVersion = sanitizeId(body.app_version, 32);
  const errorCode = sanitizeId(body.error_code, 64);
  const uaShort = sanitizeText(body.ua_short, 80);
  const viewport = sanitizeText(body.viewport, 32);
  const pagePath = sanitizeText(body.page_path, 120);

  const title = `[feedback] ${toolId} · ${kind}`;
  const md = [
    '> ユーザー任意送信 · 返信しない · 業務データ禁止レーン',
    '',
    '| 項目 | 値 |',
    '|------|-----|',
    `| tool_id | \`${toolId}\` |`,
    `| source | \`${source}\` |`,
    `| kind | \`${kind}\` |`,
    appVersion ? `| app_version | \`${appVersion}\` |` : null,
    errorCode ? `| error_code | \`${errorCode}\` |` : null,
    uaShort ? `| ua_short | ${uaShort} |` : null,
    viewport ? `| viewport | \`${viewport}\` |` : null,
    pagePath ? `| page_path | \`${pagePath}\` |` : null,
    `| received_at | ${new Date().toISOString()} |`,
    '',
    '### message',
    '',
    '```',
    message,
    '```',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const labels = ['feedback-inbox', `feedback-kind-${kind}`];

  let ghRes = await createIssue(owner, repo, token, title, md, labels);
  if (!ghRes.ok && ghRes.status === 422) {
    // label 未作成時はラベル無しで再試行
    ghRes = await createIssue(owner, repo, token, title, md, []);
  }

  if (!ghRes.ok) {
    const errText = await ghRes.text().catch(() => '');
    console.error('github_issue_failed', ghRes.status, errText.slice(0, 300));
    return json({ ok: false, error: 'github_failed' }, 502, cors);
  }

  const issue = await ghRes.json();
  return json(
    {
      ok: true,
      issue_number: issue.number || null,
    },
    200,
    cors,
  );
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @param {string} title
 * @param {string} body
 * @param {string[]} labels
 */
async function createIssue(owner, repo, token, title, body, labels) {
  const payload = { title, body };
  if (labels && labels.length) payload.labels = labels;
  return fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sugudasu-feedback',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function isAllowedOrigin(origin, request) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(request.url).hostname;
    if (host.endsWith('.pages.dev') && origin.includes('.pages.dev')) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) || (origin && origin.includes('pages.dev')) || origin.includes('localhost');
  return {
    'Access-Control-Allow-Origin': allow ? origin || 'https://sugudasu.com' : 'https://sugudasu.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors,
    },
  });
}

function sanitizeId(v, max) {
  return String(v || '')
    .trim()
    .replace(/[^a-zA-Z0-9._\-:/]/g, '')
    .slice(0, max);
}

function sanitizeText(v, max) {
  return String(v || '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, max);
}

async function sha8(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Cache API による緩い日次レート制限（isolate 横断の近似） */
async function checkRateLimit(key, maxPerDay) {
  try {
    const cache = caches.default;
    const url = new URL(`https://feedback-rate.internal/${key}`);
    const req = new Request(url.toString());
    const hit = await cache.match(req);
    let count = 0;
    if (hit) {
      count = Number(await hit.text()) || 0;
    }
    if (count >= maxPerDay) return false;
    count += 1;
    const res = new Response(String(count), {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Content-Type': 'text/plain',
      },
    });
    await cache.put(req, res);
    return true;
  } catch {
    return true;
  }
}
