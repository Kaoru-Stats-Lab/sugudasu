#!/usr/bin/env node
/**
 * 3AIロールレビュー用 — 固定シードの Raw CSV とコピペ用プロンプトを書き出す
 * 実行: node scripts/export-test-data-review-fixtures.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDataset } from '../assets/test-data-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/fixtures/test-data-review');
const PROMPT_DIR = path.join(ROOT, 'docs/prompts');

const LITE_EMPLOYEES = 25;

const REF = { referenceYear: 2026, hireYearMin: 2000, hireYearMax: 2026 };
const base = {
  idPrefix: 'EMP-2026',
  emailDomain: 'example.com',
  quoteZipInCsv: true,
  roundSalaryTo1000: true,
  includeForeignNames: true,
  ...REF,
};

const employeeClean = generateDataset({ preset: 'employee', count: 100, seed: 42, mineRate: 0, ...base });
const employeeMine = generateDataset({ preset: 'employee', count: 100, seed: 42, mineRate: 0.05, ...base });
const payroll = generateDataset({ preset: 'payroll', count: 100, seed: 42, mineRate: 0, ...base });

function truncateCsv(csv, maxDataRows) {
  const lines = csv.trimEnd().split('\n');
  const header = lines[0];
  const data = lines.slice(1, 1 + maxDataRows);
  return [header, ...data].join('\n');
}

function payrollForEmployees(payrollCsv, employeeIds) {
  const idSet = new Set(employeeIds);
  const lines = payrollCsv.trimEnd().split('\n');
  const header = lines[0];
  const data = lines.slice(1).filter((line) => {
    const empId = line.split(',')[1];
    return idSet.has(empId);
  });
  return [header, ...data].join('\n');
}

const employeeLite = truncateCsv(employeeClean.csv, LITE_EMPLOYEES);
const liteIds = employeeLite
  .split('\n')
  .slice(1)
  .map((line) => line.split(',')[0]);
const payrollLite = payrollForEmployees(payroll.csv, liteIds);

fs.mkdirSync(OUT, { recursive: true });

const files = {
  'employee-seed42-n100-mine0.csv': employeeClean.csv,
  'employee-seed42-n100-mine5.csv': employeeMine.csv,
  'payroll-seed42-n100.csv': payroll.csv,
  'employee-seed42-n25-mine0.csv': employeeLite,
  'payroll-seed42-n25.csv': payrollLite,
};
for (const [name, csv] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), csv, 'utf8');
}

const empById = new Map(employeeClean.rows.map((r) => [String(r['社員番号']), r]));
let payrollMismatch = 0;
for (const row of payroll.rows) {
  const emp = empById.get(String(row['社員番号']));
  if (!emp || String(emp['基本給']) !== String(row['基本給'])) payrollMismatch += 1;
}

const PROMPT_BODY = `あなたは、日本の「労務・給与の小規模実務」に詳しいプロダクトレビュアーです。
役割: 小規模社労士事務所の実務担当（給与計算SaaSのインポート検証 · 月次テスト · Excel地獄経験あり）。
論調: 現場目線 · 辛口OK · 抽象的な褒めは不要 · 根拠はCSVの具体行を引用。

【目的】
新興Webツール「SUGUDASU テストデータ」が出力した **実際のRaw CSV** を読み、
テストデータとして現場で使えるか・楔（社労士・人事・受託SI）に刺さるかを評価する。
これは製品のマーケ文案ではなく、**データ品質と実務適合のレビュー**である。

【プロダクト事実（評価の前提）】
- ブラウザ内のみ生成 · 外部送信なし · シード固定で再現可能
- 楔: 労務・給与の小規模実務（社労士・会計事務所 · 派遣人事 · 受託SI）
- やらない: 本番マスキング · 100万件 · 実マイナンバー/実口座 · 和暦列 · 年度列
- 競合: Handy（50型・SQL）/ SnowFakery（CLI）— 本ツールは「5分で業務CSV · 地雷 · シード · 情シス説明」
- **v0.4.2 新機能（今回のCSVに反映済み · デフォルトON）**
  - 郵便番号をCSVでクォート（Excel先頭0落ち対策）
  - 基本給・通勤手当を千円単位に丸め
  - 多様な氏名を約4%混入（在留統計ベースの中国・ベトナム風 + **日本国籍ハイブリッド風** 例: 小久保玲央ブライアン · 望月 ヘンリー海輝）

【回答形式 — 必ずこの順で】

## 1. 総合採点
- 採用可否: 1〜5点（5=そのまま現場で使う · 1=使えない）
- 一言理由（20字以内）

## 2. インポートで最初に止まる箇所（最大5件）
表形式: | 優先度 | ファイル | 行番号 or 社員番号 | 列名 | 問題 | 想定エラー |

※ 実際のSaaS名を推測してよい（マネーフォワード / freee / ジョブカン等）。断定できなければ「一般的なCSV取込」でよい。

## 3. データ整合性チェック
- 社員↔給与: 社員番号 · 基本給 · 通勤手当 · 雇用形態は一致しているか（不一致があれば列挙）
- フリガナ・住所・郵便番号: インポート検証として信頼できるか
- **多様な氏名（約4%）**: 外国籍風・ハイブリッド風のフリガナ整合 · 氏名のスペース/カタカナ混在はインポートで問題になるか
- 再雇用・高齢層: テストとして意味があるか（生年・入社日の関係）
- 日付形式（生年月日 \`/\` · 入社 \`-\`）: 現場の「あるある」として妥当か

## 4. テストデータとして足りないもの（優先度付き · 最大7件）
| 優先 | 欲しい列/データ | 理由 | v0.3で必須か（Must/Should/Nice/不要） |

和暦 · 年度列は **わざと入れていない**。不要なら「不要」と明記してよい。

## 5. 地雷データ（mine5ファイル）の評価
- テストに役立つ地雷はあったか / ノイズか
- 5%の比率は適切か
- 追加すべき地雷タイプ（あれば）
※ mine5 を渡していない場合は「未評価」と書いてよい。

## 6. 競合・代替との比較（3行以内）
Excel手打ち · 外部DL · Handy · 本CSV — 現場担当としてどれを選ぶか

## 7. 情シス・所長への説明（2文）
非送信で試す理由を、事務所向けにどう言うか

## 8. 提督への1アクション
「次に1つだけ直すなら何か」— 具体的に1件

【禁止】
- CSVを見ずに一般論だけで答えること
- 「便利そう」だけの感想
- 実マイナンバー生成を推奨すること`;

const DATA_INTRO_FULL = `【渡すデータ（3ファイル · シード42 · 基準年2026）】
1. 社員マスタ100行（地雷なし）— 給与明細と **同一シードで整合**
2. 給与明細300行（社員100 × 3ヶ月）
3. 社員マスタ100行（地雷約5%）— **任意** · payroll とは整合しない`;

const DATA_INTRO_LITE = `【渡すデータ（ライト版 · 同一シード42の先頭${LITE_EMPLOYEES}人のみ）】
1. 社員マスタ${LITE_EMPLOYEES}行（地雷なし）
2. 給与明細${LITE_EMPLOYEES * 3}行（${LITE_EMPLOYEES}人 × 3ヶ月）
※ 全量は社員100 · 明細300。傾向評価はこのサンプルでよい。`;

const rawFull = [
  DATA_INTRO_FULL,
  '',
  '【RAW DATA 1/3: 社員マスタ（地雷なし · 給与明細と同一シード整合）】',
  'ファイル名: employee-seed42-n100-mine0.csv',
  '---',
  employeeClean.csv.trimEnd(),
  '',
  '【RAW DATA 2/3: 給与明細（社員100人 × 3ヶ月 = 300行）】',
  'ファイル名: payroll-seed42-n100.csv',
  '---',
  payroll.csv.trimEnd(),
  '',
  '【RAW DATA 3/3（任意評価）: 社員マスタ（地雷約5%）】',
  'ファイル名: employee-seed42-n100-mine5.csv',
  '※ mine0 と同一シードだが地雷分岐で行内容がずれる。payroll とは整合しない。',
  '---',
  employeeMine.csv.trimEnd(),
].join('\n');

const rawLite = [
  DATA_INTRO_LITE,
  '',
  '【RAW DATA 1/2: 社員マスタ（ライト）】',
  '---',
  employeeLite.trimEnd(),
  '',
  '【RAW DATA 2/2: 給与明細（ライト）】',
  '---',
  payrollLite.trimEnd(),
].join('\n');

const promptOnlyChatgpt = `${PROMPT_BODY}

${DATA_INTRO_FULL}

【ChatGPT向け — このメッセージにはCSVは含めていません】
次の3メッセージで Raw CSV を送ります。まず本プロンプトだけ読み、
「了解 · 回答形式に従います」とだけ返してください。CSVが揃ってから本評価を開始してください。

- メッセージ2: 社員マスタ（mine0）→ ファイル \`employee-seed42-n100-mine0.csv\` を貼付
- メッセージ3: 給与明細 → ファイル \`payroll-seed42-n100.csv\` を貼付
- メッセージ4（任意）: 地雷版社員 → \`employee-seed42-n100-mine5.csv\` を貼付
- メッセージ5: 「CSVは全部届きました。評価を開始してください。」`;

const followup2 = `【メッセージ2/4】社員マスタ CSV（地雷なし · 100行）
ファイル名: employee-seed42-n100-mine0.csv
---
${employeeClean.csv.trimEnd()}`;

const followup3 = `【メッセージ3/4】給与明細 CSV（300行）
ファイル名: payroll-seed42-n100.csv
---
${payroll.csv.trimEnd()}`;

const followup4 = `【メッセージ4/4 · 任意】社員マスタ CSV（地雷約5%）
ファイル名: employee-seed42-n100-mine5.csv
---
${employeeMine.csv.trimEnd()}`;

const followup5 = `CSVは全部届きました。上記プロンプトの回答形式（1〜8）に従い、本評価を開始してください。`;

fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-PROMPT-only.txt'), PROMPT_BODY, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-COPYPASTE.txt'), `${PROMPT_BODY}\n\n${rawFull}`, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-COPYPASTE-lite.txt'), `${PROMPT_BODY}\n\n${rawLite}`, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-chatgpt-1-prompt.txt'), promptOnlyChatgpt, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-chatgpt-2-employee.txt'), followup2, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-chatgpt-3-payroll.txt'), followup3, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-chatgpt-4-mine.txt'), followup4, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-chatgpt-5-start.txt'), followup5, 'utf8');

const v042RerunHeader = `あなたは前回（v0.3.1）と同じ役割です。
役割: 小規模社労士事務所の実務担当（給与SaaSインポート検証 · 月次テスト · Excel地獄経験あり）。
論調: 現場目線 · 辛口OK · 根拠はCSVの具体行を引用。

【これは v0.4.2 の再レビューです】
前回3AI（ChatGPT / Grok / Gemini）は **4/5** で一致。主な減点要因は次でした。
1. **基本給1円端数** — v0.4 で千円丸め済み（今回CSVで確認すること）
2. **郵便番号Excel 0落ち** — v0.4 でCSVクォート済み（\`"030-0801"\` 形式）
3. **列不足**（社保/変動手当/部署）— スコープ外のまま
4. **給与3ヶ月無風** — 未対応

【v0.4.2 で追加】
- **多様な氏名を約4%混入**（デフォルトON）
  - 在留統計ベース: 中国・ベトナム・韓国等
  - **日本国籍ハイブリッド風**: 小久保玲央ブライアン / 長田澪ハウスバック / 望月 ヘンリー海輝 等
- 地雷乱数分離（v0.3.1）は維持 · mine0/mine5 突合は引き続き有効

【再レビュー前に必ず答える — セクション0】
## 0. v0.4 修正の検証（最優先）
a) 基本給・通勤手当は **千円単位**か？ 端数行があれば社員番号を列挙
b) 郵便番号は **CSVでクォート**されているか？（先頭0の県 · 例 \`"030-0801"\`）
c) mine0 と mine5 で EMP-2026-0002 は **同一人物・同一基本給**か？（乱数分離の回帰確認）
d) **多様な氏名**は何行あるか？ 具体例3件と、フリガナ整合・インポート懸念を1行ずつ

【採点の更新ルール】
- 千円丸め・郵便番号クォートが確認できれば、前回の減点要因は解消
- 多様な氏名は「テスト価値」と「インポート事故リスク」の両面で評価
- 列不足・給与無風は引き続き減点要因になりうる（スコープ判断はあなたの役割のまま）

`;

const promptBodyV042 = PROMPT_BODY.replace(
  /^あなたは、日本の[\s\S]*?【プロダクト事実（評価の前提）】\n/m,
  '【プロダクト事実（評価の前提）】\n',
);

const v042Chatgpt1 = `${v042RerunHeader}
${promptBodyV042}

${DATA_INTRO_FULL}

【ChatGPT向け v0.4.2 — このメッセージにはCSVは含めていません】
次の4メッセージで Raw CSV を送ります。まず本プロンプトだけ読み、
「了解 · セクション0を含む回答形式に従います」とだけ返してください。CSVが揃ってから本評価を開始してください。

- メッセージ2: 社員マスタ（mine0）→ \`employee-seed42-n100-mine0.csv\`
- メッセージ3: 給与明細 → \`payroll-seed42-n100.csv\`
- メッセージ4（任意）: 地雷版社員 → \`employee-seed42-n100-mine5.csv\`
- メッセージ5: 「CSVは全部届きました。v0.4.2の評価を開始してください。」`;

const v042Chatgpt5 = `CSVは全部届きました。
セクション0（千円丸め · 郵便番号クォート · mine0/mine5突合 · 多様な氏名）を先に答えたうえで、回答形式（1〜8）に従い v0.4.2 の本評価を開始してください。`;

fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-1-prompt.txt'), v042Chatgpt1, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-2-employee.txt'), followup2, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-3-payroll.txt'), followup3, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-4-mine.txt'), followup4, 'utf8');
fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-5-start.txt'), v042Chatgpt5, 'utf8');
fs.writeFileSync(
  path.join(PROMPT_DIR, 'test-data-dataset-review-v042-rerun-COPYPASTE-lite.txt'),
  `${v042RerunHeader}\n${promptBodyV042}\n\n${rawLite}`,
  'utf8',
);

const geminiRerunHeader = `あなたは前回と同じ役割です。
役割: 小規模社労士事務所の実務担当（給与SaaSインポート検証 · 月次テスト · Excel地獄経験あり）。
論調: 現場目線 · 辛口OK · 根拠はCSVの具体行を引用。

【これは再レビューです】
前回あなたは **2/5** を付け、主因は次の2点でした。
1. **地雷ON（mine5）で同一シードなのに別人になる** — 再現性テストが崩壊（#8で乱数分離を指摘）
2. **基本給1円端数** · 社保/変動手当不足 · 日付混在

【v0.3.1 で修正済み】
- ベースデータ生成と地雷注入の乱数ストリームを **完全分離**（seed+900001）
- mine0 と mine5 は **同一シード42・同一100人** がベース。地雷は該当行の列だけ上書き
- 参考: ChatGPT（同じRaw CSV）は **4/5**。「mine0はクリーン · 阻害はmine5の意図的地雷」と評価

【再レビュー前に必ず答える — セクション0】
## 0. バグ修正の検証（最優先）
次を **mine0 と mine5 を行単位で突合**して答えてください。

a) EMP-2026-0002（2行目）は mine0 と mine5 で **同一人物・同一基本給**か？
b) mine5 で mine0 と異なる行は何行あるか？ 社員番号と **差分列名** を列挙
c) 前回指摘の EMP-2026-0065=19760717 / 0072=8600845 / 0087=クリストファー は **今回のmine5に存在するか**？ 無ければ「前回データは修正前」と明記
d) mine5 の地雷は「ベース行の差し替え」として再現テストに使えるか？（1行でも別人になっていたらバグ残り）

※ 開発側の期待値: 今回のmine5では主に EMP-2026-0020（不正メール）· 0021（不正メール）· 0080（郵便番号ハイフンなし）の3行のみ差分。あなたの突合結果で上書きしてよい。

【評価対象データ（修正後 · シード42）】
1. employee-seed42-n100-mine0.csv — 社員100 · 地雷なし
2. payroll-seed42-n100.csv — 明細300（整合確認用）
3. employee-seed42-n100-mine5.csv — 社員100 · 地雷約5%

【採点の更新ルール】
- セクション0で乱数ズレが **解消** と確認できたら、前回2点の主因は消える
- 残る減点要因: 1円端数 · 列不足 · 日付混在 · 給与3ヶ月無風 等（スコープ判断はあなたの役割のまま）
- 前回と同じ2点を **修正後データを見ずに** 繰り返すのは禁止

`;

const geminiRerun = geminiRerunHeader + '\n' + PROMPT_BODY
  .replace(
    /^あなたは、日本の[\s\S]*?【プロダクト事実（評価の前提）】\n/m,
    '【プロダクト事実（評価の前提）】\n',
  )
  .replace(
    '## 5. 地雷データ（mine5ファイル）の評価',
    '## 5. 地雷データ（mine5ファイル）の評価\n- セクション0の突合結果を前提に評価すること',
  ) + '\n\n' + rawFull;

fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-gemini-rerun-COPYPASTE.txt'), geminiRerun, 'utf8');

const v042Rerun = `${v042RerunHeader}\n${promptBodyV042}\n\n${rawFull}`;

fs.writeFileSync(path.join(PROMPT_DIR, 'test-data-dataset-review-v042-rerun-COPYPASTE.txt'), v042Rerun, 'utf8');

const diverseNameRe = /(・| |ブライアン|ヘンリー|ハウスバック|^(王|李|張|劉|金|朴|崔))/;
const diverseRows = employeeClean.rows.filter((r) => {
  const name = String(r['氏名']);
  const kana = String(r['フリガナ']);
  return diverseNameRe.test(name) || /^(グエン|チャン|ファム|マリア|ジョセ|ラジュ|スニタ|ブディ|スリ|ミャン)/.test(kana);
});

const manifest = {
  generatedAt: new Date().toISOString(),
  engine: 'assets/test-data-engine.js v0.4.2',
  primaryPair: ['employee-seed42-n100-mine0.csv', 'payroll-seed42-n100.csv'],
  litePair: ['employee-seed42-n25-mine0.csv', 'payroll-seed42-n25.csv'],
  optionalMine: 'employee-seed42-n100-mine5.csv',
  payrollEmployeeMismatchRows: payrollMismatch,
  prompts: {
    full: 'test-data-dataset-review-COPYPASTE.txt',
    lite: 'test-data-dataset-review-COPYPASTE-lite.txt',
    chatgptMulti: [
      'test-data-dataset-review-chatgpt-1-prompt.txt',
      'test-data-dataset-review-chatgpt-2-employee.txt',
      'test-data-dataset-review-chatgpt-3-payroll.txt',
      'test-data-dataset-review-chatgpt-4-mine.txt',
      'test-data-dataset-review-chatgpt-5-start.txt',
    ],
    geminiRerun: 'test-data-dataset-review-gemini-rerun-COPYPASTE.txt',
    v042Rerun: 'test-data-dataset-review-v042-rerun-COPYPASTE.txt',
    v042RerunLite: 'test-data-dataset-review-v042-rerun-COPYPASTE-lite.txt',
    v042ChatgptMulti: [
      'test-data-dataset-review-v042-chatgpt-1-prompt.txt',
      'test-data-dataset-review-v042-chatgpt-2-employee.txt',
      'test-data-dataset-review-v042-chatgpt-3-payroll.txt',
      'test-data-dataset-review-v042-chatgpt-4-mine.txt',
      'test-data-dataset-review-v042-chatgpt-5-start.txt',
    ],
  },
  stats: {
    diverseNameCount: diverseRows.length,
    diverseNameExamples: diverseRows.slice(0, 8).map((r) => ({
      id: r['社員番号'],
      name: r['氏名'],
      kana: r['フリガナ'],
    })),
    salaryRoundedTo1000: employeeClean.rows.every(
      (r) => Number(r['基本給']) % 1000 === 0 && Number(r['通勤手当']) % 1000 === 0,
    ),
    zipQuotedInCsv: /"0\d{2}-\d{4}"/.test(employeeClean.csv),
    rehireCount: employeeClean.rows.filter((r) => r['雇用形態'] === '再雇用').length,
    employmentMix: Object.fromEntries(
      [...employeeClean.rows.reduce((m, r) => {
        const k = String(r['雇用形態']);
        m.set(k, (m.get(k) || 0) + 1);
        return m;
      }, new Map())],
    ),
    payrollMonths: [...new Set(payroll.rows.map((r) => r['支給年月']))].sort(),
    employeeIdsInPayroll: new Set(payroll.rows.map((r) => r['社員番号'])).size,
  },
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

for (const [label, p] of [
  ['COPYPASTE full', path.join(PROMPT_DIR, 'test-data-dataset-review-COPYPASTE.txt')],
  ['COPYPASTE lite', path.join(PROMPT_DIR, 'test-data-dataset-review-COPYPASTE-lite.txt')],
  ['v042 COPYPASTE full', path.join(PROMPT_DIR, 'test-data-dataset-review-v042-rerun-COPYPASTE.txt')],
  ['v042 COPYPASTE lite', path.join(PROMPT_DIR, 'test-data-dataset-review-v042-rerun-COPYPASTE-lite.txt')],
  ['v042 ChatGPT 1', path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-1-prompt.txt')],
  ['v042 ChatGPT 2', path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-2-employee.txt')],
  ['v042 ChatGPT 3', path.join(PROMPT_DIR, 'test-data-dataset-review-v042-chatgpt-3-payroll.txt')],
]) {
  const bytes = fs.statSync(p).size;
  console.log(`${label}: ${(bytes / 1024).toFixed(1)} KiB`);
}

console.log('fixtures:', OUT);
console.log('payroll mismatch:', payrollMismatch);
console.log('diverse names:', diverseRows.length, 'examples:', diverseRows.slice(0, 5).map((r) => r['氏名']).join(' · '));
