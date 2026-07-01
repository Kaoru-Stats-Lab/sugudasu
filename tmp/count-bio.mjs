import fs from 'node:fs';

const original = fs.readFileSync('tmp/count-bio.txt', 'utf8').trimEnd();
const target = [...original].length - 73;

function len(s) {
  return [...s].length;
}

let t = `開発者のカオルです。営業・マーケの現場で「事務が重い」と感じ、登録不要の実務ツール SUGUDASU（すぐだす）を個人開発しています。

見積・請求書、割り勘、シフトなど。入力はブラウザ内で処理し、外部サーバーへ送りません。非エンジニア×AI・静的配信。
https://sugudasu.com`;

console.log('try1', len(t), 'target', target, 'off', len(t) - target);

t = `開発者のカオルです。営業・マーケの現場で「事務が重い」と感じ、登録不要の実務ツール SUGUDASU（すぐだす）を個人開発しています。

見積・請求書、割り勘、シフトなど。入力はブラウザ内処理・非送信。非エンジニアがAIで開発。要望はサイトFormへ。
https://sugudasu.com`;

console.log('try2', len(t), 'off', len(t) - target);
if (len(t) === target) console.log('\n---\n' + t);
