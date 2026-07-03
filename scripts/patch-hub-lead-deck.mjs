import fs from 'node:fs';

const path = 'tools/hub.html';
let s = fs.readFileSync(path, 'utf8');

const neu = `    <section class="sg-hub-hero space-y-3 sg-info-prose">
        <h2 class="text-xl font-semibold text-slate-900">ブラウザだけで完結。登録不要。</h2>
        <div class="sg-tool-lead-deck">
            <p class="sg-tool-lead">
                入力データは<strong>外部に送信しません</strong>。フリーランス · 店舗 · オフィス · イベント幹事が抱える「すぐ終わらせたい」実務を、<strong>このブラウザだけ</strong>で。
            </p>
            <p class="sg-tool-lead">
                SUGUDASU（すぐだす）は、請求書 · 進行表 · 班分けなど<strong>その場で完結する業務</strong>に特化した無料ツール集。登録不要 · 完全ローカル処理です。
            </p>
        </div>
        <p class="sg-tool-lead sg-tool-lead--meta">
            各ツールページに用途別の説明と FAQ があります。手順は<a href="guides.html">実務ガイド</a>、データの扱いは<a href="statements.html">SUGUDASUの約束</a>をご覧ください。
        </p>
        <p class="sg-hub-trust">完全ローカル処理</p>
    </section>`;

const re = /    <section class="sg-hub-hero space-y-3 max-w-3xl sg-info-prose">[\s\S]*?    <\/section>/;
if (!re.test(s)) {
  console.error('hub hero block not found');
  process.exit(1);
}

s = s.replace(re, neu);
fs.writeFileSync(path, s, 'utf8');
console.log('hub lead deck patched');
