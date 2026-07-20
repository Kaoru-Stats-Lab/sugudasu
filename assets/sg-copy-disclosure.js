/**
 * Copy-first 免責 · TSV/JSON 説明（statements.html#copy-first-tech と同期）
 * @param {HTMLElement | null} parent
 * @param {'fair-draw' | 'group-split' | 'generic'} [tool]
 */
export function mountCopyDisclosure(parent, tool = 'generic') {
  if (!parent || parent.querySelector('.sg-copy-disclosure-wrap')) return;
  const wrap = document.createElement('div');
  wrap.className = 'sg-copy-disclosure-wrap space-y-2 mt-2';
  wrap.innerHTML = buildCopyDisclosureHtml(tool);
  parent.appendChild(wrap);
}

function statementsTechHref() {
  const hash = '#copy-first-tech';
  const shell = typeof globalThis !== 'undefined' && globalThis.SUGUDASU_SHELL;
  if (shell && typeof shell.pageHref === 'function') {
    return shell.pageHref(`statements.html${hash}`);
  }
  const host = typeof location !== 'undefined' ? String(location.hostname || '') : '';
  if (host === 'sugudasu.com' || host.endsWith('.pages.dev')) {
    return `/statements${hash}`;
  }
  return `statements.html${hash}`;
}

function buildCopyDisclosureHtml(tool) {
  const toolNote =
    tool === 'fair-draw'
      ? '<p class="text-[10px] text-slate-600 leading-relaxed">当選者リストの TSV は Excel へ、抽選 JSON は監査・再現確認用です。シードと名簿指紋で同じ結果を説明できます。</p>'
      : tool === 'group-split'
        ? '<p class="text-[10px] text-slate-600 leading-relaxed">Excel TSV は班表の共有用、セッション JSON は PC→会場スマホの復元用です。シードと名簿指紋で再現できます。</p>'
        : '';

  return `
<p class="sg-copy-disclosure-inline text-[10px] text-slate-500 leading-relaxed">
  コピーした内容は Slack · Microsoft Teams · Google Chat · Chatwork · LINE WORKS 等へ<strong>手動で貼り付け</strong>できます。自動投稿・公式連携ではありません。
  <a href="${statementsTechHref()}" class="text-blue-600 hover:underline font-semibold">Copy-first の技術選定</a>
</p>
<details class="sg-copy-disclosure">
  <summary class="text-[10px] font-semibold text-slate-600 cursor-pointer select-none">TSV / JSON · 貼り付け先について</summary>
  <div class="mt-2 pt-2 border-t border-slate-200 space-y-2 text-[10px] text-slate-600 leading-relaxed">
    <p><strong>TSV（タブ区切り）</strong> — 住所や備考にカンマが含まれる名簿でも、Excel / スプレッドシートに列として貼りやすい形式です。</p>
    <p><strong>JSON</strong> — サーバーに保存しない代わり、手元に残す再現用ファイルです。設定 · シード · 名簿指紋を含みます。</p>
    ${toolNote}
    <p class="text-slate-500">列挙するサービス名は<strong>貼り付け例</strong>であり、提携 · 推奨 · 公式連携を意味しません。各名称は各社の商標です。</p>
  </div>
</details>`;
}
