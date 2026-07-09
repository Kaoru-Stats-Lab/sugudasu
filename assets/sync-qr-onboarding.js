/**
 * Sync 端末追加導線（共通）
 * /timeline と /schedule の両方で同じUIを使う
 */
export function mountSyncQrOnboarding(root, options = {}) {
  if (!root) return;
  const products = Array.isArray(options.products) && options.products.length
    ? options.products
    : ['timeline', 'schedule'];
  const labels = products.map((p) => `/${p}`).join(' と ');
  // DECISION: Syncの受け口をドメイントップ配下の複数プロダクトに開いておくため、特定path固定文言を避ける。
  root.innerHTML = `
    <div class="border border-violet-200 rounded-lg p-3 space-y-2 bg-violet-50/60">
      <p class="text-xs font-bold text-violet-800">端末追加（画面QR読取）</p>
      <p class="text-[11px] text-slate-600 leading-relaxed">
        別端末に表示したSync用QRは、SUGUDASU QR読取で読み取りできます。ここでは導線のみ提供し、鍵取り込み実行はSync画面側（${labels}）で行います。
      </p>
      <a href="https://sugudasu.com/qr-reader?sync=1" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center text-xs font-semibold text-blue-700 hover:underline">
        画面からQRを読み取る（別タブで開く）↗
      </a>
    </div>
  `;
}
