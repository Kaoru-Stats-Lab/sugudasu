/**
 * SUGUDASU AIプロンプトビルダー — 閉じた handoff 用
 * SSOT: docs/notes/PROMPT_HANDOFF_SPEC.md
 */

export const PASTE_MAX = 20000;
export const PURPOSE_MAX = 200;

/** @typedef {'table_explain'|'diff_explain'} PromptHandoffPresetId */

/** ハルシネ対策（全preset共通 · 削除不可） */
export const ANTI_HALLUCINATION_LINES = [
  '入力に無い事実・数字・固有名を補わない',
  '分からないことは「不明」または「要確認」と書く',
  '推測する場合は推測だと明示する',
  '法務・税務・人事の結論を断定しない',
  '出力の根拠は、上記「入力」の範囲に限る',
];

/**
 * @type {Record<PromptHandoffPresetId, {
 *   label: string,
 *   hint: string,
 *   relatedTools: { id: string, label: string, href: string }[],
 *   role: string,
 *   extraConstraint: string,
 *   outputFormat: string,
 *   pastePlaceholder: string,
 * }>}
 */
export const PROMPT_PRESETS = {
  table_explain: {
    label: '表・CSVの意味説明',
    hint: 'normalize / 表変換の結果を貼り、人向けの説明依頼文にします',
    relatedTools: [
      { id: 'normalize', label: '正規化', href: 'normalize.html' },
      { id: 'table-conv', label: '表変換', href: 'table-conv.html' },
    ],
    role: 'あなたは表データを読み、業務担当者が理解できる説明を書くアシスタントです。判断や評価は行わず、入力の範囲だけで説明してください。',
    extraConstraint: '列や行に現れない値・カテゴリを捏造しない',
    outputFormat:
      '次の見出しで箇条書きにする:（1）各列の意味の推定（根拠はヘッダ名に限る）（2）読み取るときの注意点（3）入力から分からない点',
    pastePlaceholder: 'ヘッダ行＋数行をここに貼り付け（normalize / 表変換の出力でも可）',
  },
  diff_explain: {
    label: '差分・変更点の説明文',
    hint: '差分チェック / 変更確認の結果を貼り、レビュー依頼用の説明文にします',
    relatedTools: [
      { id: 'diff', label: '差分', href: 'diff.html' },
      { id: 'smart-diff', label: '変更確認', href: 'smart-diff.html' },
    ],
    role: 'あなたは文書の差分を読み、レビュー依頼用の説明文を書くアシスタントです。良し悪しの評価はせず、入力に書かれた変更だけを整理してください。',
    extraConstraint: '差分に現れない変更・意図・背景を捏造しない',
    outputFormat:
      '次の見出しで書く:（1）変更点の一覧（入力にあるものだけ）（2）確認してほしい点（推測なら明示）（3）入力から分からない点',
    pastePlaceholder: '差分テキストや変更箇所の抜粋をここに貼り付け',
  },
};

/**
 * @param {{
 *   presetId: PromptHandoffPresetId,
 *   paste?: string,
 *   purpose?: string,
 * }} input
 * @returns {{ ok: boolean, prompt: string, error: string }}
 */
export function buildHandoffPrompt(input) {
  const preset = PROMPT_PRESETS[input.presetId];
  if (!preset) {
    return { ok: false, prompt: '', error: '用途を選んでください' };
  }
  const paste = String(input.paste ?? '').trim().slice(0, PASTE_MAX);
  const purpose = String(input.purpose ?? '').trim().slice(0, PURPOSE_MAX);
  if (!paste) {
    return { ok: false, prompt: '', error: 'SUGUDASUの出力を貼り付けてください' };
  }

  const constraints = [...ANTI_HALLUCINATION_LINES, preset.extraConstraint]
    .map((line) => `- ${line}`)
    .join('\n');

  const purposeBlock = purpose
    ? `\n# 目的\n${purpose}\n`
    : '';

  const prompt = [
    '# 役割',
    preset.role,
    '',
    '# 入力（SUGUDASUの出力）',
    paste,
    purposeBlock.trimEnd(),
    '',
    '# 制約（必ず守る）',
    constraints,
    '',
    '# 出力形式',
    preset.outputFormat,
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  return { ok: true, prompt, error: '' };
}
